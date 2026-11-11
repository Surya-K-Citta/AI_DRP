import React, { useState } from 'react';
import { ChevronRight, Landmark, Search, Sparkles, Target } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useClusterFormText } from '@/lib/clusterDprFormText';
import { SCHEME_OPTIONS } from '@/lib/individualDpr/schemeFormConfig';

/** The schemes people ask about most come first when nothing has been typed. */
const POPULAR = ['PMEGP', 'MUDRA', 'STANDUP', 'CGTMSE', 'PMFME', 'SVANIDHI'];
const SCHEMES = SCHEME_OPTIONS.filter((option) => option.code);
const POPULAR_FIRST = [...SCHEMES].sort((a, b) => {
  const ia = POPULAR.indexOf(a.code);
  const ib = POPULAR.indexOf(b.code);
  return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
});

interface SchemeFinderCardProps {
  /** Opens the scheme list with the words already typed into its search box. */
  onSearch: (words: string) => void;
  /** Starts a DPR for this scheme. */
  onPick: (code: string) => void;
  /** Opens the Scheme Finder questions. */
  onQuiz: () => void;
  onViewAll: () => void;
}

export const SchemeFinderCard: React.FC<SchemeFinderCardProps> = ({ onSearch, onPick, onQuiz, onViewAll }) => {
  const tf = useClusterFormText();
  const [words, setWords] = useState('');
  const needle = words.trim().toLowerCase();
  const shown = (needle ? SCHEMES.filter((s) => `${s.label} ${s.code}`.toLowerCase().includes(needle)) : POPULAR_FIRST).slice(0, 8);
  const sectors = [tf('Food Processing'), tf('Manufacturing'), tf('Services')];
  return (
    <section aria-labelledby="finder-title" className="flex min-h-0 flex-col rounded-2xl lg:absolute lg:inset-0 border border-border bg-card p-4 sm:p-5">
      <header className="flex items-center gap-3">
        <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-destructive/10 text-destructive-text" aria-hidden="true"><Target className="h-5 w-5" /></span>
        <div className="min-w-0">
          <h2 id="finder-title" className="text-base font-semibold text-foreground">{tf('Search Scheme')}</h2>
          <p className="text-sm text-muted-foreground">{tf('Find government schemes for your business')}</p>
        </div>
      </header>
      <form
        className="mt-3 flex gap-2"
        role="search"
        onSubmit={(event) => { event.preventDefault(); onSearch(words.trim()); }}
      >
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            type="search"
            value={words}
            maxLength={80}
            onChange={(event) => setWords(event.target.value)}
            aria-label={tf('Search schemes by sector, keyword...')}
            placeholder={tf('Search schemes by sector, keyword...')}
            className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
          />
        </div>
        <Button type="submit" variant="primary" size="sm" className="h-10 flex-none px-4">{tf('Search')}</Button>
      </form>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">{tf('Popular sectors:')}</span>
        {sectors.map((sector) => (
          <button
            key={sector}
            type="button"
            onClick={() => onSearch(sector)}
            className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
          >
            {sector}
          </button>
        ))}
        <button type="button" onClick={onViewAll} className="ml-auto inline-flex items-center gap-1 rounded text-xs font-medium text-primary underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring">
          {tf('View all')} <Sparkles className="h-3 w-3" aria-hidden="true" />
        </button>
      </div>
      <div className="mt-4 flex min-h-0 flex-1 flex-col">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground" id="finder-list-title">
          {needle ? `${shown.length} ${tf('schemes')}` : tf('Popular schemes')}
        </p>
        {shown.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">{tf('No schemes match this search.')}</p>
        ) : (
          <ul aria-labelledby="finder-list-title" className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
            {shown.map((scheme) => (
              <li key={scheme.code}>
                <button
                  type="button"
                  onClick={() => onPick(scheme.code)}
                  className="group flex w-full items-center gap-3 rounded-lg border border-transparent px-2.5 py-2 text-left text-sm text-foreground transition-all duration-200 hover:border-primary/20 hover:bg-primary/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
                >
                  <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-primary/10 text-primary" aria-hidden="true"><Landmark className="h-4 w-4" /></span>
                  <span className="min-w-0 flex-1 leading-snug">{tf(scheme.label)}</span>
                  <ChevronRight className="h-4 w-4 flex-none text-muted-foreground transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <Button variant="outline" onClick={onQuiz} className="mt-4 h-auto min-h-10 w-full gap-2 whitespace-normal border-2 py-2 text-center">
        <Sparkles className="h-4 w-4 flex-none" aria-hidden="true" />
        {tf('Not sure? Answer a few questions')}
      </Button>
    </section>
  );
};
