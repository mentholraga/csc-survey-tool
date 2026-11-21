-- ===========================================================================
-- 16_fixes.sql  —  first round of fixes from the November 2026 review
-- ===========================================================================
-- Run AFTER 15_modules.sql. Runs as one transaction: if the check at the end
-- fails, nothing in this file is applied.
--
-- What this changes:
--   1. (removed: export_flat was already protected by its own export token)
--   2. Seed rows that answered the pay questions are marked as having completed
--      section 2, so the seed cohort counts in pay comparisons again.
--   3. submit_core reads the caller's IP from the request headers, so the rate
--      limit actually runs. The limit is read from the definition. Because that
--      means IP hashes are now actually stored, the 24-hour purge the consent
--      text depends on is scheduled here too (needs the pg_cron extension).
--   4. submit_core replaces econ_tier / seniority_band answers on a return visit
--      instead of keeping the stale ones.
--   5. submit_stage refuses a pay submission with no currency instead of
--      treating every amount as dollars.
--   6. Results are built in ONE place (_stage_result). submit_stage writes then
--      calls it; the new get_results calls it without writing anything. Viewing
--      results can no longer change stored data.
--   7. The vintage line moves from function code into the definition.
--   8. Fixes the "can''t" apostrophe in the currency error.
--   9. Unlinks email from answers. Report requests now go through a HubSpot form
--      on the host page, so the survey database never receives an email. The two
--      functions that stored one are retired, and anything already stored is
--      unlinked. Marketing consent now lives in HubSpot, next to the form.
--
-- DO NOT re-run 15_modules.sql after this file. Its anon allow-list does not
-- know about get_results.
-- ===========================================================================

begin;

-- ---------------------------------------------------------------------------
-- 2. Stage backfill for every cohort, not just live
-- ---------------------------------------------------------------------------
-- benchmark_payload counts only respondents who completed the section shown.
-- Seed rows that have a salary answered the core and the pay questions.
update responses r
   set stages_completed = (select array_agg(distinct x order by x)
                             from unnest(coalesce(r.stages_completed, '{}'::int[]) || array[1,2]) x)
 where not (2 = any(coalesce(r.stages_completed, '{}'::int[])))
   and exists (select 1 from answers a
                where a.response_id = r.id and a.question_key = 'base_salary_usd');


-- ---------------------------------------------------------------------------
-- 7. Vintage line lives in the definition now
-- ---------------------------------------------------------------------------
update surveys
   set definition = definition || jsonb_build_object(
         'vintage', 'Includes 250 CS professionals surveyed February–August 2026')
 where slug = 'csc-compensation-2026' and not (definition ? 'vintage');


-- ---------------------------------------------------------------------------
-- Helpers (not callable by anon)
-- ---------------------------------------------------------------------------

-- The client's IP, from the headers PostgREST passes through. Null when the
-- function is called from the SQL editor or the headers are missing.
create or replace function _client_ip() returns text
language plpgsql set search_path = public as $$
declare h json;
begin
  begin
    h := nullif(current_setting('request.headers', true), '')::json;
  exception when others then
    return null;
  end;
  if h is null then return null; end if;
  return nullif(trim(coalesce(
    h->>'cf-connecting-ip',
    h->>'x-real-ip',
    split_part(coalesce(h->>'x-forwarded-for', ''), ',', 1))), '');
end $$;

-- Every answer on a response, in the same shape the widget submits them:
-- multi-select as an array, numbers as numbers, everything else as a string.
create or replace function _response_answers(p_resp uuid, p_defn jsonb) returns jsonb
language sql set search_path = public as $$
  with multi as (
    select qq->>'key' as mk
      from jsonb_array_elements(p_defn->'stages') s,
           jsonb_array_elements(s->'questions') qq
     where qq->>'type' = 'multi')
  select coalesce(jsonb_object_agg(k, v), '{}'::jsonb) from (
    select a.question_key as k,
           case when count(*) > 1 or a.question_key in (select mk from multi)
                  then jsonb_agg(a.choice_key order by a.choice_key)
                when max(a.numeric_value) is not null then to_jsonb(max(a.numeric_value))
                when max(a.text_value)    is not null then to_jsonb(max(a.text_value))
                else to_jsonb(max(a.choice_key)) end as v
      from answers a
     where a.response_id = p_resp
     group by a.question_key) z
$$;

-- The one place a section's results are built. Reads everything from stored
-- data, so it returns the same thing straight after a submit and on a return
-- visit weeks later.
create or replace function _stage_result(p_sid int, p_defn jsonb, p_resp uuid, p_stage int)
returns jsonb
language plpgsql set search_path = public, extensions as $$
declare
  v_stages int[]; v_band text; v_tier text; v_mode text; v_sdef jsonb;
  v_all jsonb; v_stage_ans jsonb;
  v_base numeric; v_total numeric; v_years numeric; v_benefits text[];
  v_cur text; v_rate numeric;
begin
  select stages_completed, seniority_band, econ_tier
    into v_stages, v_band, v_tier
    from responses where id = p_resp;

  v_sdef := _stage_def(p_sid, p_stage);
  v_mode := v_sdef->'results'->>'mode';
  v_all  := _response_answers(p_resp, p_defn);

  if v_mode = 'full' then
    select numeric_value into v_base  from answers where response_id = p_resp and question_key = 'base_salary_usd';
    select numeric_value into v_total from answers where response_id = p_resp and question_key = 'total_comp_usd';
    select numeric_value into v_years from answers where response_id = p_resp and question_key = 'years_experience';
    select coalesce(array_agg(choice_key), array[]::text[]) into v_benefits
      from answers where response_id = p_resp and question_key = 'benefits';
    select currency, rate_per_usd into v_cur, v_rate
      from responses_fx where response_id = p_resp;

    return jsonb_build_object(
      'ok', true, 'stage', p_stage, 'stages_completed', v_stages, 'duplicate', false,
      'threshold', (p_defn->>'suppression_threshold')::int,
      'vintage', p_defn->>'vintage',
      'response_id', p_resp,
      'you', jsonb_build_object(
        'base_salary_usd', v_base, 'total_comp_usd', v_total,
        'years_experience', v_years, 'seniority_band', v_band, 'econ_tier', v_tier,
        'entered_currency', v_cur, 'fx_rate', v_rate),
      'cuts', jsonb_build_object(
        'by_level',   benchmark_payload(p_sid, 'by_level',   v_band, v_base, v_total, v_years, v_benefits, p_stage),
        'by_economy', benchmark_payload(p_sid, 'by_economy', v_tier, v_base, v_total, v_years, v_benefits, p_stage)));
  end if;

  -- Other sections: just this section's answers, as stage_benchmark expects.
  select coalesce(jsonb_object_agg(key, value), '{}'::jsonb) into v_stage_ans
    from jsonb_each(v_all)
   where key in (select qq->>'key' from jsonb_array_elements(v_sdef->'questions') qq);

  return jsonb_build_object(
    'ok', true, 'stage', p_stage, 'stages_completed', v_stages,
    'threshold', (p_defn->>'suppression_threshold')::int,
    'results', jsonb_build_object(
      'by_level',   stage_benchmark(p_sid, p_stage, 'by_level',   v_band, v_stage_ans),
      'by_economy', stage_benchmark(p_sid, p_stage, 'by_economy', v_tier, v_stage_ans)),
    -- by_level only, no toggle: see final_screen.cut_toggle_removed_because.
    'final', case when p_stage = 7
                  then final_benchmark(p_sid, 'by_level', v_band, v_all, v_stages) end);
end $$;


-- ---------------------------------------------------------------------------
-- submit_core — IP from headers, configurable limit, no stale cut answers
-- ---------------------------------------------------------------------------
create or replace function submit_core(
  p_survey_slug text,
  p_anon_token  text,
  p_answers     jsonb,
  p_source      text,
  p_module      text default 'full',
  p_referrer    text default null,
  p_duration_ms int  default null,
  p_honeypot    text default null,
  p_ip          text default null
) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_sid int; v_defn jsonb; v_consent text;
  v_pepper  text := app_secret('pepper');
  v_ip_salt text := app_secret('ip_salt') || current_date::text;
  v_ip text; v_limit int;
  v_tok text; v_ip_h text; v_rid uuid; v_resp uuid;
  v_country text; v_title text; v_band text; v_region text; v_tier text;
  v_profile jsonb; v_key text; v_val jsonb; q jsonb;
begin
  if v_pepper is null or v_ip_salt is null then
    raise exception 'app_secrets is not populated — run 05_secrets.sql';
  end if;

  if coalesce(p_honeypot, '') <> '' then
    return jsonb_build_object('ok', false, 'error', 'rejected');
  end if;
  if p_duration_ms is not null and p_duration_ms < 8000 then
    return jsonb_build_object('ok', false, 'error', 'too_fast',
      'message', 'Please take a moment over the questions.');
  end if;

  select id, definition, definition->>'consent_version'
    into v_sid, v_defn, v_consent
    from surveys where slug = p_survey_slug and status = 'open';
  if v_sid is null then
    return jsonb_build_object('ok', false, 'error', 'survey_not_open');
  end if;

  v_tok   := encode(digest(p_anon_token || v_pepper, 'sha256'), 'hex');
  v_ip    := coalesce(nullif(p_ip, ''), _client_ip());
  v_ip_h  := case when v_ip is null then null
                  else encode(digest(v_ip || v_ip_salt, 'sha256'), 'hex') end;
  -- Per survey. Defaults to 20 an hour: high enough for a room on shared wifi,
  -- low enough to stop a script.
  v_limit := coalesce((v_defn->>'ip_rate_limit_per_hour')::int, 20);

  -- Only NEW respondents count against the limit. A returning respondent
  -- re-submitting the core is not a new row and should never be blocked.
  if v_ip_h is not null
     and not exists (select 1 from respondents where anon_token_hash = v_tok)
     and (select count(*) from responses
           where ip_hash = v_ip_h and submitted_at > now() - interval '1 hour') >= v_limit then
    return jsonb_build_object('ok', false, 'error', 'rate_limited');
  end if;

  v_country := p_answers->>'country';
  v_title   := p_answers->>'job_title';
  if v_country is null or v_title is null then
    return jsonb_build_object('ok', false, 'error', 'incomplete',
      'message', 'We need your job title and country to compare you to anyone.');
  end if;

  v_band   := derive_band(v_sid, v_title);
  v_tier   := derive_econ_tier(v_sid, v_country);
  v_region := case v_country when 'United States' then 'US'
                             when 'United Kingdom' then 'UK' else 'ROW' end;

  v_profile := jsonb_strip_nulls(jsonb_build_object(
    'country', v_country, 'region', v_region, 'econ_tier', v_tier,
    'job_title', v_title, 'job_title_other', p_answers->>'job_title_other',
    'seniority_band', v_band,
    'years_experience', nullif(p_answers->>'years_experience', '')::numeric,
    'company_size', p_answers->>'company_size',
    'industry', p_answers->>'industry'));

  insert into respondents (anon_token_hash, profile)
  values (v_tok, v_profile)
  on conflict (anon_token_hash) do update
    set profile = respondents.profile || excluded.profile
  returning id into v_rid;

  insert into consents (respondent_id, kind, version)
  values (v_rid, 'research', v_consent)
  on conflict (respondent_id, kind, version) do nothing;

  select id into v_resp
    from responses where survey_id = v_sid and respondent_id = v_rid;

  if v_resp is null then
    insert into responses (survey_id, respondent_id, cohort_id, source, referrer_url,
                           duration_ms, consent_version, region, econ_tier,
                           seniority_band, ip_hash, ip_salt_date, profile_snapshot,
                           status, stages_completed)
    values (v_sid, v_rid, 'live', coalesce(p_source, 'unknown'), p_referrer,
            p_duration_ms, v_consent, v_region, v_tier, v_band, v_ip_h,
            current_date, v_profile, 'valid', array[1])
    returning id into v_resp;
  else
    update responses
       set region = v_region, econ_tier = v_tier, seniority_band = v_band,
           profile_snapshot = profile_snapshot || v_profile,
           stages_completed = (select array_agg(distinct x order by x)
                                 from unnest(stages_completed || 1) x),
           last_stage_at = now()
     where id = v_resp;
  end if;

  for v_key, v_val in select * from jsonb_each(p_answers) loop
    q := _qdef(v_sid, v_key);
    continue when q is null;
    delete from answers where response_id = v_resp and question_key = v_key;
    if jsonb_typeof(v_val) = 'array' then
      insert into answers (response_id, question_key, choice_key)
      select v_resp, v_key, e from jsonb_array_elements_text(v_val) e
      on conflict do nothing;
    elsif jsonb_typeof(v_val) = 'number' then
      insert into answers (response_id, question_key, numeric_value)
      values (v_resp, v_key, (v_val #>> '{}')::numeric) on conflict do nothing;
    elsif coalesce(q->>'store_as', '') = 'text' or q->>'type' = 'text' then
      insert into answers (response_id, question_key, text_value)
      values (v_resp, v_key, v_val #>> '{}') on conflict do nothing;
    else
      insert into answers (response_id, question_key, choice_key)
      values (v_resp, v_key, v_val #>> '{}') on conflict do nothing;
    end if;
  end loop;

  -- Replace, don't keep: someone who corrects their country on a return visit
  -- must not keep their old tier in answers while responses has the new one.
  delete from answers where response_id = v_resp
     and question_key in ('econ_tier', 'seniority_band');
  insert into answers (response_id, question_key, choice_key)
  values (v_resp, 'econ_tier', v_tier);
  if v_band is not null then
    insert into answers (response_id, question_key, choice_key)
    values (v_resp, 'seniority_band', v_band);
  end if;

  return jsonb_build_object(
    'ok', true, 'response_id', v_resp, 'module', p_module,
    'seniority_band', v_band, 'econ_tier', v_tier,
    'stages_completed', (select stages_completed from responses where id = v_resp));
end $$;


-- ---------------------------------------------------------------------------
-- submit_stage — writes, then hands off to _stage_result
-- ---------------------------------------------------------------------------
create or replace function submit_stage(
  p_survey_slug text,
  p_anon_token  text,
  p_stage       int,
  p_answers     jsonb,
  p_duration_ms int default null
) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_sid int; v_defn jsonb; v_pepper text := app_secret('pepper');
  v_tok text; v_rid uuid; v_resp uuid;
  v_key text; v_val jsonb; q jsonb;
  v_mode text;
  v_fx jsonb; v_base numeric; v_bonus numeric; v_stock numeric; v_total numeric;
begin
  if v_pepper is null then raise exception 'app_secrets is not populated'; end if;
  if p_stage < 2 then
    return jsonb_build_object('ok', false, 'error', 'bad_stage',
      'message', 'The core section goes through submit_core.');
  end if;

  select id, definition into v_sid, v_defn
    from surveys where slug = p_survey_slug and status = 'open';
  if v_sid is null then
    return jsonb_build_object('ok', false, 'error', 'survey_not_open');
  end if;
  if _stage_def(v_sid, p_stage) is null then
    return jsonb_build_object('ok', false, 'error', 'bad_stage',
      'message', 'That section does not exist.');
  end if;

  v_tok := encode(digest(p_anon_token || v_pepper, 'sha256'), 'hex');
  select id into v_rid from respondents where anon_token_hash = v_tok;
  select id into v_resp
    from responses where survey_id = v_sid and respondent_id = v_rid;
  if v_resp is null then
    return jsonb_build_object('ok', false, 'error', 'no_response',
      'message', 'Start with the first section.');
  end if;

  v_mode := _stage_def(v_sid, p_stage)->'results'->>'mode';

  if v_mode = 'full' then
    -- No silent default to dollars. A pay submission without a currency is a
    -- client bug, and storing it as USD would corrupt the benchmark.
    if coalesce(p_answers->>'base_salary_currency', '') = '' then
      return jsonb_build_object('ok', false, 'error', 'missing_currency',
        'message', 'Please choose the currency you are paid in.');
    end if;
    v_fx := submit_response_amounts(v_sid, p_answers);
    if v_fx ? 'error' then
      return jsonb_build_object('ok', false, 'error', 'unsupported_currency',
        'currency', v_fx->>'currency',
        'message', format('We can''t convert %s yet. Please enter the US dollar equivalent.',
                          v_fx->>'currency'));
    end if;
    v_base  := (v_fx->>'base')::numeric;
    v_bonus := coalesce((v_fx->>'bonus')::numeric, 0);
    v_stock := coalesce((v_fx->>'stock')::numeric, 0);
    v_total := v_base + v_bonus + v_stock;
    if v_base is null or v_base < 1000 or v_base > 2000000 then
      return jsonb_build_object('ok', false, 'error', 'invalid_salary');
    end if;
  end if;

  for v_key, v_val in select * from jsonb_each(p_answers) loop
    q := _qdef(v_sid, v_key);
    continue when q is null;
    delete from answers where response_id = v_resp and question_key = v_key;
    if jsonb_typeof(v_val) = 'array' then
      insert into answers (response_id, question_key, choice_key)
      select v_resp, v_key, e from jsonb_array_elements_text(v_val) e
      on conflict do nothing;
    elsif jsonb_typeof(v_val) = 'number' then
      insert into answers (response_id, question_key, numeric_value)
      values (v_resp, v_key, (v_val #>> '{}')::numeric) on conflict do nothing;
    elsif q->>'store_as' = 'text' or q->>'type' = 'text' then
      insert into answers (response_id, question_key, text_value)
      values (v_resp, v_key, v_val #>> '{}') on conflict do nothing;
    else
      insert into answers (response_id, question_key, choice_key)
      values (v_resp, v_key, v_val #>> '{}') on conflict do nothing;
    end if;
  end loop;

  if v_mode = 'full' then
    insert into responses_fx (response_id, currency, rate_per_usd, rate_as_of)
    values (v_resp, v_fx->>'currency', (v_fx->>'rate')::numeric,
            (v_fx->>'rate_as_of')::date)
    on conflict (response_id) do update
      set currency = excluded.currency, rate_per_usd = excluded.rate_per_usd,
          rate_as_of = excluded.rate_as_of;

    delete from answers where response_id = v_resp
      and question_key in ('base_salary_usd','bonus_annual_usd','stock_annual_usd','total_comp_usd');
    insert into answers (response_id, question_key, numeric_value) values
      (v_resp, 'base_salary_usd',  v_base),
      (v_resp, 'bonus_annual_usd', v_bonus),
      (v_resp, 'stock_annual_usd', v_stock),
      (v_resp, 'total_comp_usd',   v_total);
  end if;

  update responses
     set stages_completed = (select array_agg(distinct x order by x)
                               from unnest(stages_completed || p_stage) x),
         last_stage_at = now()
   where id = v_resp;

  return _stage_result(v_sid, v_defn, v_resp, p_stage);
end $$;


-- ---------------------------------------------------------------------------
-- get_results — read-only. What "Show me my results" calls on a return visit.
-- ---------------------------------------------------------------------------
create or replace function get_results(
  p_survey_slug text,
  p_anon_token  text,
  p_stage       int
) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_sid int; v_defn jsonb; v_pepper text := app_secret('pepper');
  v_resp uuid; v_stages int[];
begin
  if v_pepper is null then raise exception 'app_secrets is not populated'; end if;

  select id, definition into v_sid, v_defn from surveys where slug = p_survey_slug;
  if v_sid is null then
    return jsonb_build_object('ok', false, 'error', 'survey_not_found');
  end if;

  select r.id, r.stages_completed into v_resp, v_stages
    from responses r
    join respondents p on p.id = r.respondent_id
   where r.survey_id = v_sid
     and p.anon_token_hash = encode(digest(p_anon_token || v_pepper, 'sha256'), 'hex');

  if v_resp is null then
    return jsonb_build_object('ok', false, 'error', 'no_response');
  end if;
  if p_stage < 2 or not (p_stage = any(v_stages)) then
    return jsonb_build_object('ok', false, 'error', 'not_completed',
      'message', 'That section has not been completed yet.');
  end if;

  return _stage_result(v_sid, v_defn, v_resp, p_stage);
end $$;


-- ---------------------------------------------------------------------------
-- 9. Unlink email from answers
-- ---------------------------------------------------------------------------
revoke execute on function record_report_request(text, text, text, boolean, text)
  from public, anon, authenticated;
revoke execute on function mark_report_request_delivered(text, text, boolean)
  from public, anon, authenticated;

update report_requests set respondent_id = null where respondent_id is not null;
update respondents
   set email = null, email_hash = null, contactable = false,
       panel_opt_in = false, hubspot_id = null
 where email is not null or email_hash is not null or hubspot_id is not null
    or contactable or panel_opt_in;
delete from consents where kind = 'marketing';


-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
revoke all on function _client_ip()                        from public, anon, authenticated;
revoke all on function _response_answers(uuid, jsonb)      from public, anon, authenticated;
revoke all on function _stage_result(int, jsonb, uuid, int) from public, anon, authenticated;

grant execute on function submit_core(text,text,jsonb,text,text,text,int,text,text) to anon;
grant execute on function submit_stage(text,text,int,jsonb,int) to anon;
grant execute on function get_results(text,text,int) to anon;


-- ---------------------------------------------------------------------------
-- Check: the anon surface is exactly what the widget needs, and nothing else
-- ---------------------------------------------------------------------------
do $$
declare bad text;
begin
  select string_agg(p.proname, ', ') into bad
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public'
     and has_function_privilege('anon', p.oid, 'execute')
     and p.proname <> all (array[
       'submit_core','submit_stage','get_results','get_progress','get_survey',
       'log_event','submit_response',
       -- both check their own secret token before returning anything
       'export_flat','export_report_requests']);
  if bad is not null then
    raise exception 'anon can call something it should not: %', bad;
  end if;

  select string_agg(x, ', ' order by x) into bad from (
    select unnest(array['submit_core','submit_stage','get_results',
                        'get_progress','get_survey','log_event']) x
    except
    select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and has_function_privilege('anon', p.oid, 'execute')) z;
  if bad is not null then
    raise exception 'the widget cannot call: %', bad;
  end if;

  if exists (select 1 from respondents where email is not null or email_hash is not null)
     or exists (select 1 from report_requests where respondent_id is not null) then
    raise exception 'an email address is still linked to a respondent';
  end if;

  raise notice '16_fixes OK: results read-only, currency required, IP limit live, email unlinked.';
end $$;

commit;

-- ---------------------------------------------------------------------------
-- Scheduled purges (outside the transaction: cron.schedule cannot be undone by
-- a rollback, and should not block the fixes above if pg_cron is missing)
-- ---------------------------------------------------------------------------
-- The consent text says IP hashes are purged after 24 hours. Until this file,
-- no IP was ever stored, so it did not matter that nothing ran the purge. It
-- matters now. survey_events has a 90-day retention promise in the definition.
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule('purge-ip-hashes',     '15 * * * *', 'select purge_ip_hashes()');
    perform cron.schedule('purge-survey-events', '30 3 * * *', 'select purge_survey_events()');
    raise notice 'Purge jobs scheduled.';
  else
    raise warning 'pg_cron is NOT enabled. Enable it, then re-run this block, or IP hashes will be kept longer than the consent text says.';
  end if;
end $$;

notify pgrst, 'reload schema';
