import type { Metadata } from 'next';
import InfoPage from '@/components/InfoPage';

export const metadata: Metadata = {
  title: 'Support',
  description: 'Get help with your Morocco360 bookings, tickets and account.',
};

export default function SupportPage() {
  return (
    <InfoPage
      title="Support"
      intro="Need a hand with a booking, a ticket or your account? We're here."
    >
      <p>
        For help with an order, have your order reference ready — it&apos;s on the receipt emailed to
        you at checkout.
      </p>
      <p>
        A full help centre is on the way. In the meantime, reach us at{' '}
        <a
          href="mailto:support@morocco360.com"
          className="text-primary underline underline-offset-2"
        >
          support@morocco360.com
        </a>
        .
      </p>
    </InfoPage>
  );
}
