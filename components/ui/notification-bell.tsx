'use client';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { useAuth } from '@msflib/react-auth';
import { useQuery } from '@tanstack/react-query';
import { listNotifications } from '@/lib/api/notifications';

export function useAccountNotifications() {
  const auth = useAuth();
  return useQuery({ queryKey: ['procureguard', 'notifications', auth.me?.id], queryFn: listNotifications, enabled: auth.status === 'authenticated', staleTime: 30000, refetchOnWindowFocus: true });
}
export function NotificationBell({ role }: { role: 'buyer' | 'vendor' }) {
  const query = useAccountNotifications();
  const unread = query.data?.filter((row) => !row.read).length || 0;
  return <Link href={role === 'buyer' ? '/notifications' : '/vendor/notifications'} className="relative rounded-lg p-2 focus-visible:outline-2 focus-visible:outline-brand" aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}>
    <Bell size={19} />
    {unread > 0 && <span aria-hidden="true" className="absolute -right-1 -top-1 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">{unread > 99 ? '99+' : unread}</span>}
  </Link>;
}
