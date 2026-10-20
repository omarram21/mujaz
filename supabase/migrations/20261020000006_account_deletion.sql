-- Phase 9: account deletion. Deleting the auth user cascades to the profile and all
-- personal data. Issued ijazahs stay verifiable (they hold name/sanad snapshots), so
-- their links to the deleted program/people are cleared instead of blocking deletion.

alter table public.ijazahs alter column program_id drop not null;
alter table public.ijazahs drop constraint ijazahs_program_id_fkey;
alter table public.ijazahs
  add constraint ijazahs_program_id_fkey foreign key (program_id)
  references public.ijazah_programs (id) on delete set null;

create or replace function public.guard_ijazah() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  link_cols constant text[] := array['program_id', 'student_id', 'teacher_id'];
  revoke_cols constant text[] := array['revoked_at', 'revoked_by', 'revoke_reason'];
  only_unlinking boolean;
begin
  if tg_op = 'DELETE' then
    raise exception 'ijazahs_are_immutable' using errcode = '42501';
  end if;
  -- Foreign-key "set null" when an account is deleted: only link columns go to null.
  only_unlinking := (to_jsonb(new) - link_cols) = (to_jsonb(old) - link_cols)
    and (new.program_id is null or new.program_id = old.program_id)
    and (new.student_id is null or new.student_id = old.student_id)
    and (new.teacher_id is null or new.teacher_id = old.teacher_id);
  if only_unlinking then
    return new;
  end if;
  if not public.is_admin() and current_setting('mujaz.trusted', true) is distinct from 'on' then
    raise exception 'ijazahs_are_immutable' using errcode = '42501';
  end if;
  if (to_jsonb(new) - (revoke_cols || link_cols)) is distinct from (to_jsonb(old) - (revoke_cols || link_cols)) then
    raise exception 'ijazahs_are_immutable' using errcode = '42501';
  end if;
  if old.revoked_at is not null then
    raise exception 'ijazah_already_revoked' using errcode = '22023';
  end if;
  return new;
end;
$$;
