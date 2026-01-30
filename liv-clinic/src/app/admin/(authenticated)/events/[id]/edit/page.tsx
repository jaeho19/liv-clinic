import { createServerClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import EventForm from '@/components/admin/EventForm';
import type { EventRow } from '@/types/admin';

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerClient();

  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single();

  if (!event) {
    redirect('/admin/events');
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-[#6d4e42] mb-6">이벤트 수정</h2>
      <EventForm event={event as EventRow} />
    </div>
  );
}
