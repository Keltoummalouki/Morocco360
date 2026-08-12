import type { Metadata } from 'next';
import InfoPage from '@/components/InfoPage';

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Morocco360 is the ticketing platform for events across Morocco.',
};

export default function AboutPage() {
  return (
    <InfoPage
      navActive="about"
      title="About Morocco360"
      intro="One place to discover and book every event across the Kingdom — from music festivals in Marrakesh to surf competitions in Taghazout."
    >
      <p>
        Morocco360 connects locals and travellers with concerts, festivals, sport, food and
        culture across Morocco, and handles the whole journey: discovery, secure checkout, and a
        signed QR ticket you scan at the gate.
      </p>
      <p>
        Organizers get the other half — publish an event, sell tickets online, scan entries at the
        door, and follow sales in real time.
      </p>
    </InfoPage>
  );
}
