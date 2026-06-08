-- ============================================================================
-- F5L — Migration 0011 : Approbation des réponses aux avis
-- ----------------------------------------------------------------------------
-- Sépare le brouillon IA d'une réponse réellement publiée. Tant que l'API
-- Google Business n'est pas branchée, le Manager peut approuver un brouillon
-- sans renseigner responded_at.
-- ============================================================================

alter table public.reviews
  add column if not exists response_draft_generated_at timestamptz,
  add column if not exists response_approved_at timestamptz,
  add column if not exists response_approved_by uuid references auth.users(id) on delete set null;

create index if not exists reviews_response_approved_at_idx
  on public.reviews(org_id, response_approved_at)
  where response_draft is not null;

-- ============================================================================
-- Fin migration 0011.
-- ============================================================================
