import React from 'react';
import { useTranslation } from 'react-i18next';
import { useClusterFormText } from '@/lib/clusterDprFormText';
import { Languages } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LanguageToggleProps {
  className?: string;
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({ className }) => {
  const { i18n } = useTranslation();
  const tf = useClusterFormText();
  const isTe = i18n.language.startsWith('te');

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-lg border border-border bg-background p-0.5',
        className
      )}
      role="group"
      aria-label={tf('Language')}
    >
      <Languages className="h-4 w-4 text-muted-foreground ml-2 hidden sm:block" />
      <button
        type="button"
        onClick={() => i18n.changeLanguage('en')}
        className={cn(
          'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
          !isTe ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
        )}
      >
        English
      </button>
      <button
        type="button"
        onClick={() => i18n.changeLanguage('te')}
        className={cn(
          'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
          isTe ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
        )}
      >
        తెలుగు
      </button>
    </div>
  );
};
