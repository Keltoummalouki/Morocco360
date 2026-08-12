'use client';

import PeopleAdminPage from '@/components/admin/PeopleAdminPage';

export default function AdminUsersPage() {
  return (
    <PeopleAdminPage
      resource="users"
      eyebrow="Administration"
      title="Utilisateurs"
      subtitle="Gérez les comptes des utilisateurs et leurs réservations."
      createLabel="Nouvel utilisateur"
    />
  );
}
