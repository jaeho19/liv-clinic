import { createServerClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import BeforeAfterForm from '@/components/admin/BeforeAfterForm';
import type { BeforeAfterRow } from '@/types/admin';

export default async function EditBeforeAfterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerClient();

  const { data: record } = await supabase
    .from('before_after')
    .select('*')
    .eq('id', id)
    .single();

  if (!record) {
    redirect('/admin/before-after');
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-[#6d4e42] mb-6">전후사진 수정</h2>
      <BeforeAfterForm record={record as BeforeAfterRow} />
    </div>
  );
}
