import type { Metadata } from 'next';
import InfoPage from '@/components/InfoPage';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'The terms that govern the use of EventHub.',
};

export default function TermsPage() {
  return (
    <InfoPage
      title="Terms of Service"
      intro="The terms that govern your use of EventHub."
    >
      <p>
        Tickets bought through EventHub are issued as signed QR codes and are valid for a single
        entry to the event they were issued for. Refunds and changes follow the policy set by each
        event organizer.
      </p>
      <p>
        <strong className="text-foreground">This page is a placeholder.</strong> The full terms are
        being prepared with counsel and will be published here before launch.
      </p>
    </InfoPage>
  );
}
