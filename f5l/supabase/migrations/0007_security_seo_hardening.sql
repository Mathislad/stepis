-- ============================================================================
-- F5L — Migration 0007 : Durcissement sécurité public
-- ----------------------------------------------------------------------------
-- Feedback privé :
--   - rattache chaque retour à sa demande d'avis ;
--   - limite un feedback par demande publique ;
--   - borne la taille du message soumis en anon.
-- ============================================================================

alter table public.private_feedback
  add column if not exists request_id uuid references public.review_requests(id) on delete set null;

create unique index if not exists private_feedback_request_id_uidx
  on public.private_feedback(request_id)
  where request_id is not null;

create index if not exists private_feedback_request_id_idx
  on public.private_feedback(request_id);

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
  v_message text;
  v_feedback_id uuid;
begin
  if p_rating is null or p_rating < 1 or p_rating > 5 then
    raise exception 'INVALID_RATING' using errcode = '22023';
  end if;

  v_message := nullif(btrim(coalesce(p_message, '')), '');
  if v_message is not null and char_length(v_message) > 1200 then
    raise exception 'MESSAGE_TOO_LONG' using errcode = '22023';
  end if;

  select * into v_request
  from public.review_requests
  where id = p_request_id;

  if v_request.id is null then
    raise exception 'REQUEST_NOT_FOUND' using errcode = 'no_data_found';
  end if;

  insert into public.private_feedback (org_id, contact_id, request_id, rating, message)
  values (v_request.org_id, v_request.contact_id, v_request.id, p_rating, v_message)
  on conflict (request_id) where request_id is not null
  do update set
    rating = excluded.rating,
    message = excluded.message,
    handled = false
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
-- Fin migration 0007.
-- ============================================================================
