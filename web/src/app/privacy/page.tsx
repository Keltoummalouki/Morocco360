import type { Metadata } from 'next';
import InfoPage from '@/components/InfoPage';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How EventHub handles your personal data.',
};

export default function PrivacyPage() {
  return (
    <InfoPage
      title="Privacy Policy"
      intro="How we handle your personal data."
    >
      <p>
        We collect only what a booking needs: your account details, your orders, and the tickets
        issued to you. Payment card data is handled by our payment provider and never stored on our
        servers.
      </p>
      <p>
        <strong className="text-foreground">This page is a placeholder.</strong> The full policy is
        being prepared with counsel and will be published here before launch. Questions in the
        meantime:{' '}
        <a
          href="mailto:privacy@eventhub.com"
          className="text-primary underline underline-offset-2"
        >
          privacy@eventhub.com
        </a>
        .
      </p>
    </InfoPage>
  );
}
