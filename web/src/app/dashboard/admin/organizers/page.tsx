'use client';

import PeopleAdminPage from '@/components/admin/PeopleAdminPage';

export default function AdminOrganizersPage() {
  return (
    <PeopleAdminPage
      resource="organizers"
      eyebrow="Administration"
      title="Organisateurs"
      subtitle="Gérez les organisateurs et leurs événements."
      createLabel="Nouvel organisateur"
    />
  );
}
