'use client';

import PeopleAdminPage from '@/components/admin/PeopleAdminPage';

export default function AdminStaffPage() {
  return (
    <PeopleAdminPage
      resource="staff"
      eyebrow="Administration"
      title="Staff"
      subtitle="Gérez les membres du staff et leurs événements assignés."
      createLabel="Nouveau staff"
    />
  );
}
