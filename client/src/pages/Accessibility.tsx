import React from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { useClusterFormText } from '@/lib/clusterDprFormText';

/**
 * Accessibility statement. It says what the service aims for, what has been done and checked, what is known to be missing, and how to
 * ask for help. Keep it true: update the lists below whenever something is fixed or found.
 */
export const Accessibility: React.FC = () => {
  const tf = useClusterFormText();
  const features = [
    'Every page can be used with the keyboard alone, with a visible focus mark and a "Skip to main content" link.',
    'Form fields, buttons and icons have names that a screen reader can read.',
    'Text size and high-contrast settings are in the bar at the top of the home page, and the page can be zoomed to 200% without losing content.',
    'English and Telugu are both available.',
    'Animations switch off when the device asks for reduced motion.',
    'Pop-ups keep the keyboard inside them and return to where you were when they close.',
  ];
  const limits = [
    'Sections of the report can be reordered by dragging, or with the up and down buttons and arrow keys; some older screens still need a mouse for other drag actions.',
    'The exported PDF of a DPR has not yet been checked with accessibility tools.',
    'Dark mode has not been checked for colour contrast.',
    'Testing so far used automated tools and keyboard checks; it has not yet been repeated with screen readers such as NVDA or TalkBack, and has not been independently audited.',
  ];
  return (
    <Layout>
      <article className="mx-auto max-w-3xl space-y-6">
        <div className="flex justify-end">
          <LanguageToggle />
        </div>
        <header>
          <h1 className="text-3xl font-bold">{tf('Accessibility statement')}</h1>
          <p className="mt-2 text-muted-foreground">
            {tf('This service aims to meet WCAG 2.2 Level AA and the Guidelines for Indian Government Websites (GIGW 3.0), so that everyone, including people with disabilities and older people, can use it on their own.')}
          </p>
        </header>
        <section aria-labelledby="a11y-done">
          <h2 id="a11y-done" className="text-xl font-semibold">{tf('What we have done')}</h2>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            {features.map((text) => (
              <li key={text}>{tf(text)}</li>
            ))}
          </ul>
        </section>
        <section aria-labelledby="a11y-limits">
          <h2 id="a11y-limits" className="text-xl font-semibold">{tf('What is not finished')}</h2>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            {limits.map((text) => (
              <li key={text}>{tf(text)}</li>
            ))}
          </ul>
        </section>
        <section aria-labelledby="a11y-help">
          <h2 id="a11y-help" className="text-xl font-semibold">{tf('Need help or found a problem?')}</h2>
          <p className="mt-2">
            {tf('Tell the APMSMEDC office which page and what went wrong, and ask for another way to get the same information. The contact details are in the')}{' '}
            <Link to="/privacy" className="font-medium text-primary underline underline-offset-2">
              {tf('Privacy notice')}
            </Link>
            .
          </p>
        </section>
      </article>
    </Layout>
  );
};
