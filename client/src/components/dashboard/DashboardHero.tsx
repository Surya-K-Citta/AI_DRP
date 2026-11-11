import React from 'react';
import { ArrowRight, BarChart3, Compass, FileText, PencilLine, PlayCircle, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useClusterFormText } from '@/lib/clusterDprFormText';

interface DashboardHeroProps {
  onGuide: () => void;
  onTour: () => void;
}

/** The four stages of a DPR, shown as a path (an explanation, not buttons). */
export const DashboardHero: React.FC<DashboardHeroProps> = ({ onGuide, onTour }) => {
  const tf = useClusterFormText();
  const steps = [
    { n: 1, icon: FileText, title: tf('Create'), text: tf('Start a new DPR'), extra: tf('(Individual / Scheme)'), tint: 'bg-primary/10 text-primary' },
    { n: 2, icon: PencilLine, title: tf('Fill Details'), text: tf('Enter business and project details'), extra: '', tint: 'bg-violet-500/10 text-violet-700 dark:text-violet-300' },
    { n: 3, icon: Settings2, title: tf('Analyze'), text: tf('AI checks quality and completeness'), extra: '', tint: 'bg-blue-500/10 text-blue-700 dark:text-blue-300' },
    { n: 4, icon: BarChart3, title: tf('Generate'), text: tf('Get your DPR ready to use'), extra: '', tint: 'bg-warning/10 text-warning-text' },
  ];

  return (
    <section data-tour="journey" aria-labelledby="dash-hero-title" className="relative overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-5 sm:p-6 lg:p-8">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] lg:items-center">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{tf('Turn your idea into a detailed project report')}</p>
          <h2 id="dash-hero-title" className="mt-2 text-2xl font-bold leading-tight text-foreground sm:text-[28px]">{tf('Create a DPR in simple steps')}</h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
            {tf('Get scheme recommendations, fill details, and generate a professional DPR with AI support.')}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button variant="outline" onClick={onGuide} className="gap-2 border-2 bg-background/80">
              <PlayCircle className="h-4 w-4" aria-hidden="true" />
              {tf('Take Quick Guide')}
            </Button>
            <Button variant="outline" onClick={onTour} className="gap-2 border-2 bg-background/80">
              <Compass className="h-4 w-4" aria-hidden="true" />
              {tf('Take a Tour')}
            </Button>
          </div>
        </div>

        <ol className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label={tf('How a DPR is made')}>
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <li key={step.n} className="relative min-w-0">
                <div className="flex h-full w-full flex-col items-start gap-2 rounded-xl bg-background/70 p-3">
                  <span className={`flex h-11 w-11 items-center justify-center rounded-full ${step.tint}`} aria-hidden="true">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    <span className="mr-1 text-muted-foreground">{step.n}.</span>
                    {step.title}
                  </span>
                  <span className="text-xs leading-snug text-muted-foreground">
                    {step.text}
                    {step.extra && <span className="block">{step.extra}</span>}
                  </span>
                </div>
                {step.n < 4 && (
                  <ArrowRight className="absolute -right-3 top-8 z-10 hidden h-4 w-4 text-muted-foreground/60 xl:block" aria-hidden="true" />
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
};
