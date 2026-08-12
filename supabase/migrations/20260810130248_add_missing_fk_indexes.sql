create index idx_event_reviews_approved_by
  on public.event_reviews ("approvedById");

create index idx_event_staff_assigned_by
  on public.event_staff ("assignedById");
