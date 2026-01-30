import { createServerClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import PopupForm from '@/components/admin/PopupForm';
import type { PopupRow } from '@/types/admin';

export default async function EditPopupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerClient();

  const { data: popup } = await supabase
    .from('popups')
    .select('*')
    .eq('id', id)
    .single();

  if (!popup) {
    redirect('/admin/popups');
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-[#6d4e42] mb-6">팝업 수정</h2>
      <PopupForm popup={popup as PopupRow} />
    </div>
  );
}
