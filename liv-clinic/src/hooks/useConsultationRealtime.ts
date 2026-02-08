import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase-browser';
import type { ConsultationRow } from '@/types/admin';

interface RealtimeCallbacks {
  onInsert: (row: ConsultationRow) => void;
  onUpdate: (row: ConsultationRow) => void;
  onDelete: (id: string) => void;
}

export function useConsultationRealtime(callbacks: RealtimeCallbacks) {
  const supabase = createClient();
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  useEffect(() => {
    const channel = supabase
      .channel('consultation_changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'consultation_requests' },
        (payload) => callbacksRef.current.onInsert(payload.new as ConsultationRow)
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'consultation_requests' },
        (payload) => callbacksRef.current.onUpdate(payload.new as ConsultationRow)
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'consultation_requests' },
        (payload) => callbacksRef.current.onDelete((payload.old as { id: string }).id)
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [supabase]);
}
