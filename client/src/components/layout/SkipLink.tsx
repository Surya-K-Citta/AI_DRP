import { useClusterFormText } from '@/lib/clusterDprFormText';

/** First stop for keyboard users on every page: jumps past the navigation bar to the page's own content. Hidden until it has focus. */
export function SkipLink() {
  const tf = useClusterFormText();
  return (
    <a
      href="#main-content"
      onClick={(event) => {
        const main = document.getElementById('main-content');
        if (!main) return;
        event.preventDefault();
        main.focus({ preventScroll: true });
        main.scrollIntoView({ block: 'start' });
      }}
      className="no-print fixed left-3 top-3 z-[400] -translate-y-24 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg transition-transform focus:translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      {tf('Skip to main content')}
    </a>
  );
}
