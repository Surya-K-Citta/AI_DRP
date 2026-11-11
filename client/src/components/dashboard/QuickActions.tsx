import React from 'react';
import { BookOpen, ChevronRight, FilePlus2, FolderKanban, Network, Zap } from 'lucide-react';
import { useClusterFormText } from '@/lib/clusterDprFormText';

interface QuickActionsProps {
  onCreate: () => void;
  onGuide: () => void;
  onSchemes: () => void;
  onProjects: () => void;
}

/** One compact row of four shortcuts. */
export const QuickActions: React.FC<QuickActionsProps> = ({ onCreate, onGuide, onSchemes, onProjects }) => {
  const tf = useClusterFormText();
  const tiles = [
    { icon: FilePlus2, title: tf('Create DPR'), text: tf('Individual / scheme-aware'), tint: 'bg-primary/10 text-primary', go: onCreate },
    { icon: BookOpen, title: tf('Start with a guide'), text: tf('Learn how to fill a DPR'), tint: 'bg-violet-500/10 text-violet-700 dark:text-violet-300', go: onGuide },
    { icon: Network, title: tf('Scheme Finder'), text: tf('Find eligible schemes'), tint: 'bg-blue-500/10 text-blue-700 dark:text-blue-300', go: onSchemes },
    { icon: FolderKanban, title: tf('My Projects'), text: tf('View all your projects'), tint: 'bg-warning/10 text-warning-text', go: onProjects },
  ];
  return (
    <section aria-labelledby="quick-actions-title" className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <header className="flex items-center gap-3">
        <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-warning/10 text-warning-text" aria-hidden="true"><Zap className="h-5 w-5" /></span>
        <div>
          <h2 id="quick-actions-title" className="text-base font-semibold text-foreground">{tf('Quick Actions')}</h2>
          <p className="text-sm text-muted-foreground">{tf('Common tasks to get you started')}</p>
        </div>
      </header>
      <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((tile) => {
          const Icon = tile.icon;
          return (
            <li key={tile.title}>
              <button
                type="button"
                onClick={tile.go}
                className="group flex h-full w-full items-center gap-3 rounded-xl border border-border bg-background p-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transform-none motion-reduce:transition-none"
              >
                <span className={`flex h-11 w-11 flex-none items-center justify-center rounded-xl ${tile.tint}`} aria-hidden="true"><Icon className="h-5 w-5" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-foreground">{tile.title}</span>
                  <span className="block text-xs text-muted-foreground">{tile.text}</span>
                </span>
                <ChevronRight className="h-4 w-4 flex-none text-muted-foreground transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none" aria-hidden="true" />
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
};
