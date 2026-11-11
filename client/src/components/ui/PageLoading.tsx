import { useEffect, useState } from 'react';

/** Shown while a screen's code loads. It waits a moment first, so quick loads never flash a spinner. */
export function PageLoading() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setShow(true), 200);
    return () => window.clearTimeout(timer);
  }, []);
  return (
    <div className="flex min-h-screen items-center justify-center" role="status" aria-busy="true">
      {show ? <span className="motion-fade-in h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" /> : null}
    </div>
  );
}
