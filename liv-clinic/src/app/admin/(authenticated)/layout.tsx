import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase-server';
import AdminLayoutClient from '@/components/admin/AdminLayoutClient';

export default async function AuthenticatedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/admin/login');
  }

  return (
    <AdminLayoutClient>
      {children}
    </AdminLayoutClient>
  );
}
