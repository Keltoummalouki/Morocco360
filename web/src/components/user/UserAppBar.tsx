import Link from 'next/link';
import Logo from '@/components/Logo';
import LocaleSwitcher from '@/components/LocaleSwitcher';
import ThemeToggle from '@/components/ThemeToggle';
import UserNavTabs from './UserNavTabs';
import UserMenu from './UserMenu';

/** Top app-bar for the user "app": logo · tabs (desktop) · locale/theme/menu. */
export default function UserAppBar({ email }: { email: string }) {
  return (
    <header className="ev-nav">
      <nav className="ev-container ev-nav-inner">
        <Link href="/user/events" aria-label="Morocco360">
          <Logo />
        </Link>
        <UserNavTabs />
        <div className="ev-nav-right">
          <LocaleSwitcher />
          <ThemeToggle />
          <UserMenu email={email} />
        </div>
      </nav>
    </header>
  );
}
