-- Adds the "Invoice to pay" status (value 6) to board action items.
--
-- Appended as 6 rather than renumbering, so existing rows keep their meaning:
-- 5 is still Resolved. Display order lives in lib/tasks.ts.
-- Safe to re-run.

alter table public.board_tasks
  drop constraint if exists board_tasks_status_range;

alter table public.board_tasks
  add constraint board_tasks_status_range check (status between 1 and 6);
