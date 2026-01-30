import EventForm from '@/components/admin/EventForm';

export default function NewEventPage() {
  return (
    <div>
      <h2 className="text-xl font-bold text-[#6d4e42] mb-6">새 이벤트 등록</h2>
      <EventForm />
    </div>
  );
}
