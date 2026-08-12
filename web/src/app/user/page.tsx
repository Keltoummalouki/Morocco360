import { redirect } from 'next/navigation';

/** The user app's home is the events browser. */
export default function UserIndex() {
  redirect('/user/events');
}
