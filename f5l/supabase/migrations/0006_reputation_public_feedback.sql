-- ============================================================================
-- F5L — Migration 0006 : Feedback privé public
-- ----------------------------------------------------------------------------
-- Permet à un client final non authentifié de laisser un retour privé depuis
-- une demande d'avis, sans ouvrir de policy anon large sur private_feedback.
-- ============================================================================

create or replace function public.create_private_feedback_for_request(
  p_request_id uuid,
  p_rating int,
  p_message text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.review_requests;
  v_feedback_id uuid;
begin
  if p_rating is null or p_rating < 1 or p_rating > 5 then
    raise exception 'INVALID_RATING' using errcode = '22023';
  end if;

  select * into v_request
  from public.review_requests
  where id = p_request_id;

  if v_request.id is null then
    raise exception 'REQUEST_NOT_FOUND' using errcode = 'no_data_found';
  end if;

  insert into public.private_feedback (org_id, contact_id, rating, message)
  values (v_request.org_id, v_request.contact_id, p_rating, nullif(btrim(p_message), ''))
  returning id into v_feedback_id;

  update public.review_requests
  set status = 'clicked'
  where id = p_request_id
    and status in ('queued','sent','opened');

  return v_feedback_id;
end;
$$;

revoke all on function public.create_private_feedback_for_request(uuid, int, text) from public;
grant execute on function public.create_private_feedback_for_request(uuid, int, text) to anon, authenticated;

-- ============================================================================
-- Fin migration 0006.
-- ============================================================================
