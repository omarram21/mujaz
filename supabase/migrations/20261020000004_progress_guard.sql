-- A session record can only be approved once the session has started.
create or replace function public.on_session_progress() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  b public.bookings;
begin
  if tg_op = 'UPDATE' and old.status = 'approved' and not public.is_admin()
     and current_setting('mujaz.trusted', true) is distinct from 'on' then
    raise exception 'session_progress_locked' using errcode = '42501';
  end if;
  select * into b from public.bookings where id = new.booking_id;
  if b.status = 'cancelled' then raise exception 'booking_cancelled' using errcode = '22023'; end if;
  new.teacher_id := b.teacher_id;
  new.student_id := b.student_id;
  new.program_id := b.program_id;
  if new.status = 'approved' and (tg_op = 'INSERT' or old.status = 'draft') then
    if b.starts_at > now() and current_setting('mujaz.trusted', true) is distinct from 'on' then
      raise exception 'session_not_started' using errcode = '22023';
    end if;
    new.approved_at := now();
    update public.bookings set status = 'completed' where id = b.id and status = 'scheduled';
  end if;
  return new;
end;
$$;
