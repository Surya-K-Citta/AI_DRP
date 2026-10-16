import React, { useEffect } from 'react';
import { flushSync } from 'react-dom';
import { Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useThemeStore, type ThemeMode } from '@/store/themeStore';
import { rippleThemeChange } from '@/lib/themeTransition';

/**
 * Puts the `dark` class on <html> everywhere (home, login, register and the signed-in app). The DPR document,
 * its preview and the export are always light (see index.css).
 */
export const ThemeApplier: React.FC = () => {
  const mode = useThemeStore((s) => s.mode);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', mode === 'dark');
  }, [mode]);

  return null;
};

const OPTIONS: Array<{ mode: ThemeMode; icon: React.ElementType; label: string }> = [
  { mode: 'light', icon: Sun, label: 'Light' },
  { mode: 'dark', icon: Moon, label: 'Dark' },
];

/** Light / Dark switch for the top bar. */
export const ThemeToggle: React.FC = () => {
  const { t } = useTranslation();
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);

  return (
    <div
      role="radiogroup"
      aria-label={t('theme.label', { defaultValue: 'Colour theme' })}
      className="flex items-center rounded-lg border border-border p-0.5"
    >
      {OPTIONS.map(({ mode: value, icon: Icon, label }) => {
        const text = t(`theme.${value}`, { defaultValue: label });
        const active = mode === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={text}
            title={text}
            onClick={(event) => {
              if (value === mode) return;
              const box = event.currentTarget.getBoundingClientRect();
              rippleThemeChange({ x: box.left + box.width / 2, y: box.top + box.height / 2 }, () => {
                // Change the page inside the transition so the browser can capture before and after.
                document.documentElement.classList.toggle('dark', value === 'dark');
                flushSync(() => setMode(value));
              });
            }}
            className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
              active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
};
