'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut, User as UserIcon } from 'lucide-react';
import { apiLogout } from '@/lib/auth';
import { useLocale } from '@/components/LocaleProvider';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function UserMenu({ email }: { email: string }) {
  const router = useRouter();
  const { t } = useLocale();
  const initial = (email?.[0] ?? 'U').toUpperCase();

  async function logout() {
    await apiLogout();
    router.push('/');
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={t.app.account}
      >
        <Avatar className="size-9">
          <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
            {initial}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {email && <DropdownMenuLabel className="truncate font-normal text-muted-foreground">{email}</DropdownMenuLabel>}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/user/profile">
            <UserIcon className="size-4" /> {t.app.tabProfile}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            void logout();
          }}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="size-4" /> {t.app.logout}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
