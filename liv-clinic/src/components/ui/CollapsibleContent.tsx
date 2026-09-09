import type { ReactNode } from 'react';

/** Keep answers in server HTML and remove collapsed controls from keyboard navigation. */
export default function CollapsibleContent({ open, id, children }: {
  open: boolean;
  id: string;
  children: ReactNode;
}) {
  return (
    <div id={id} aria-hidden={!open} inert={!open}
      className={`grid transition-[grid-template-rows,visibility] duration-300 motion-reduce:transition-none ${open ? 'visible' : 'invisible'}`}
      style={{ gridTemplateRows: open ? '1fr' : '0fr' }}>
      <div className="min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}
