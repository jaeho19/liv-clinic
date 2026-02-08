import { useEffect, useRef } from 'react';
import type { ConsultationRow } from '@/types/admin';

export function useCallbackChecker(
  consultations: ConsultationRow[],
  onCallbackDue: (consultation: ConsultationRow) => void
) {
  const notifiedRef = useRef<Set<string>>(new Set());
  const onCallbackDueRef = useRef(onCallbackDue);
  onCallbackDueRef.current = onCallbackDue;

  useEffect(() => {
    const check = () => {
      const now = new Date();
      consultations
        .filter(
          (c) =>
            c.status === 'callback_scheduled' &&
            c.next_followup_at &&
            new Date(c.next_followup_at) <= now &&
            !notifiedRef.current.has(c.id)
        )
        .forEach((c) => {
          notifiedRef.current.add(c.id);
          onCallbackDueRef.current(c);
        });
    };

    check(); // Immediate check
    const interval = setInterval(check, 60_000); // Every 1 minute
    return () => clearInterval(interval);
  }, [consultations]);
}
