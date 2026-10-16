// @ts-nocheck
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import React, { Suspense, lazy, useEffect, useState } from 'react';
import { useLinkHandler } from '@/lib/linkUtils';
import { buttonVariants } from '@/components/ui/Button';
import { HeroCarousel } from '@/components/landing/HeroCarousel';
import { AccessibilityBar } from '@/components/layout/AccessibilityBar';
const HowItWorksShowcase = lazy(() => import('@/components/landing/HowItWorksShowcase').then((m) => ({ default: m.HowItWorksShowcase })));
const BenefitsAccordion = lazy(() => import('@/components/landing/BenefitsAccordion').then((m) => ({ default: m.BenefitsAccordion })));
const FeaturesScroller = lazy(() => import('@/components/landing/FeaturesScroller').then((m) => ({ default: m.FeaturesScroller })));
import { useClusterFormText } from '@/lib/clusterDprFormText';
import { useLandingCopy } from '@/i18n/landingCopy';
import {
  Sparkles,
  FileText,
  TrendingUp,
  Globe,
  Shield,
  LogIn,
  ArrowRight,
  UserPlus,
  Zap,
  BarChart3,
  MessageSquare,
  FileCheck,
  Award,
  Clock,
  Users,
  Target,
} from 'lucide-react';

/* Section heading block shared by the homepage sections. */
const SectionHead: React.FC<{ id: string; title: string; description: string; align?: 'center' | 'split' }> = ({
  id,
  title,
  description,
  align = 'center',
}) =>
  align === 'split' ? (
    <div className="mb-10 flex flex-col gap-4 text-center md:mb-12 lg:flex-row lg:items-end lg:justify-between lg:gap-12 lg:text-left">
      <div>
        <span className="section-rule mx-auto mb-4 lg:mx-0" aria-hidden="true" />
        <h2 id={id} className="type-h2 text-ink">
          {title}
        </h2>
      </div>
      <p className="mx-auto max-w-xl text-base leading-relaxed text-ink-muted md:text-lg lg:mx-0 lg:max-w-md">
        {description}
      </p>
    </div>
  ) : (
    <div className="section-head mb-10 md:mb-14">
      <span className="section-rule" aria-hidden="true" />
      <h2 id={id} className="type-h2 text-ink mb-3">
        {title}
      </h2>
      <p className="text-base md:text-lg leading-relaxed text-ink-muted">{description}</p>
    </div>
  );

type Tone = 'brand' | 'saffron' | 'soft' | 'feature';

/* Square icon tile used for benefits and features. */
const IconTile: React.FC<{ icon: React.ElementType; tone?: Tone; className?: string }> = ({
  icon: Icon,
  tone = 'soft',
  className = '',
}) => {
  const tones: Record<Tone, string> = {
    feature:
      'bg-brand-tint text-brand ring-1 ring-inset ring-brand-soft transition-colors group-hover:bg-brand group-hover:text-white group-hover:ring-brand',
    brand: 'bg-brand text-white',
    saffron: 'bg-saffron-tint text-saffron-text ring-1 ring-inset ring-saffron/40',
    soft: 'bg-brand-tint text-brand ring-1 ring-inset ring-brand-soft',
  };
  return (
    <span
      className={`inline-flex h-12 w-12 flex-none items-center justify-center rounded-xl ${tones[tone]} ${className}`}
      aria-hidden="true"
    >
      <Icon className="h-6 w-6" strokeWidth={1.9} aria-hidden="true" />
    </span>
  );
};

export const Landing: React.FC = () => {
  const handleLinkClick = useLinkHandler();
  const { c } = useLandingCopy();
  const tf = useClusterFormText();
  // soft shadow under the sticky header only once the page is scrolled (no divider line at rest)
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const featureIcons = [Sparkles, Globe, FileCheck, MessageSquare, TrendingUp, Shield, BarChart3, Zap];
  const features = c.features.items.map(([title, description], i) => ({ icon: featureIcons[i], title, description }));

  const benefitMeta = [
    { icon: Clock, image: '/benefits/benefit-01.webp', imagePosition: '40% center' },
    { icon: Award, image: '/benefits/benefit-02.webp', imagePosition: '50% center' },
    { icon: Target, image: '/benefits/benefit-03.webp', imagePosition: '50% center' },
    { icon: Users, image: '/benefits/benefit-04.webp', imagePosition: '50% center' },
  ];
  const benefits = c.benefits.items.map(([title, description], i) => ({ ...benefitMeta[i], title, description }));

  const steps = c.how.items.map(([title, description]) => ({ title, description }));

  const toTop = (e) => {
    e.preventDefault();
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    history.replaceState(null, '', '#hero');
    const h = document.getElementById('hero-title');
    if (h) {
      h.setAttribute('tabindex', '-1');
      h.focus({ preventScroll: true });
    }
  };

  return (
    <div className="landing-page min-h-screen bg-white text-ink">
      <AccessibilityBar />
      {/* Navigation Bar */}
      <header
        className={`sticky top-0 z-50 bg-white transition-shadow duration-200 max-[349px]:static ${
          scrolled ? 'shadow-[0_6px_20px_-12px_rgba(16,40,40,0.35)]' : ''
        }`}
      >
        <nav aria-label={tf('Primary navigation')} className="page-container">
          <div className="flex min-h-[64px] flex-wrap items-center justify-between gap-x-2 gap-y-2 py-2 sm:gap-x-3 md:min-h-[72px]">
            <a
              href="#hero"
              onClick={toTop}
              aria-label={c.nav.home}
              className="flex min-w-0 items-center gap-2 rounded-lg sm:gap-3"
            >
              <img
                src="/apmsme_logo_192.png"
                alt=""
                className="h-8 w-auto flex-none object-contain min-[375px]:h-9 sm:h-10 md:h-12"
              />
              <span className="hidden h-8 w-px bg-line sm:block" aria-hidden="true" />
              <span className="min-w-0 text-sm font-bold leading-tight text-ink min-[350px]:whitespace-nowrap min-[400px]:text-[15px] sm:text-lg">
                {c.nav.home.split(' – ')[0]}
              </span>
            </a>
            <div className="flex items-center gap-1.5 max-[349px]:w-full min-[400px]:gap-2 sm:gap-3">
              <ThemeToggle />
              <a
                href="/login"
                onClick={(e) => handleLinkClick(e, '/login')}
                className={buttonVariants({
                  variant: 'brandOutline',
                  className: 'h-11 whitespace-nowrap px-2.5 text-sm max-[349px]:flex-1 max-[374px]:px-2 min-[400px]:px-3.5 sm:px-5 sm:text-[15px]',
                })}
              >
                {c.nav.signIn}
              </a>
              <a
                href="/register"
                onClick={(e) => handleLinkClick(e, '/register')}
                className={buttonVariants({
                  variant: 'cta',
                  className: 'h-11 whitespace-nowrap px-2.5 text-sm max-[349px]:flex-1 max-[374px]:px-2 min-[400px]:px-3.5 sm:px-5 sm:text-[15px]',
                })}
              >
                {c.nav.getStarted}
              </a>
            </div>
          </div>
        </nav>
      </header>

      <main id="main">
        {/* Hero Section */}
        <section id="hero" aria-labelledby="hero-title" className="relative scroll-mt-24 overflow-hidden bg-white">
          <div className="page-container pt-12 sm:pt-14 lg:pt-16 lg:[@media(max-height:820px)]:pt-10">
            <div className="relative z-10 mx-auto max-w-[60rem] text-center">
              <img
                src="/apmsme_logo_192.png"
                width="78"
                height="64"
                alt={tf('APMSME Logo')}
                className="mx-auto mb-4 h-14 w-auto object-contain md:h-16 lg:[@media(max-height:820px)]:mb-3 lg:[@media(max-height:820px)]:h-12"
              />
              <h1 id="hero-title" className="type-display mx-auto text-ink">
                {c.hero.pre}
                <span className="whitespace-nowrap">{c.hero.nowrap}</span>
                <span className="mt-1 block text-brand">{c.hero.accent}</span>
              </h1>
              <p className="type-lead mx-auto mt-4 max-w-[44rem] text-[#7d888e] md:mt-5">
                {c.hero.sub}
              </p>
              <div className="mt-7 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center md:mt-8">
                <a
                  href="/register"
                  onClick={(e) => handleLinkClick(e, '/register')}
                  className={buttonVariants({
                    variant: 'cta',
                    size: 'xl',
                    className: 'rounded-full shadow-[0_8px_20px_-10px_rgba(201,80,12,0.75)] sm:min-w-[13rem]',
                  })}
                >
                  <UserPlus className="h-5 w-5" aria-hidden="true" />
                  {c.nav.getStartedFree}
                </a>
                <a
                  href="/login"
                  onClick={(e) => handleLinkClick(e, '/login')}
                  className={buttonVariants({ variant: 'brandOutline', size: 'xl', className: 'rounded-full sm:min-w-[10rem]' })}
                >
                  <LogIn className="h-5 w-5" aria-hidden="true" />
                  {c.nav.signIn}
                </a>
              </div>
            </div>
          </div>

          {/* Curved image carousel (full-bleed) */}
          <div className="mt-4 pb-6 md:pb-8">
            <div className="theme-light">
              <HeroCarousel />
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section aria-labelledby="benefits-title" className="bg-[#f2f6f5] py-16 md:py-24">
          <div className="page-container">
            <div className="mb-8 flex flex-col gap-4 md:mb-10 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
              <h2 id="benefits-title" className="type-section max-w-xl text-ink">
                {c.benefits.title}
              </h2>
              <p className="type-sub max-w-md text-[#7d888e] lg:text-right">
                <span>{c.benefits.sub[0]}</span>
                <span className="sm:block">{c.benefits.sub[1]}</span>
              </p>
            </div>
            <Suspense fallback={<div className="min-h-[420px]" aria-hidden="true" />}>
              <BenefitsAccordion items={benefits} />
            </Suspense>
          </div>
        </section>

        {/* Features Section */}
        <Suspense fallback={<div className="min-h-[640px]" aria-hidden="true" />}>
        <FeaturesScroller
          features={features}
          heading={
            <>
              <h2 id="features-title" className="type-section mx-auto max-w-3xl text-ink">
                {c.features.title}
                <span className="text-brand">{c.features.accent}</span>
              </h2>
              <p className="type-sub mx-auto mt-4 max-w-xl text-[#7d888e]">
                {c.features.sub}
              </p>
            </>
          }
        />
        </Suspense>

        {/* How It Works Section */}
        <section aria-labelledby="how-title" className="bg-[#f2f6f5] py-16 md:py-24">
          <div className="page-container">
            <div className="mb-8 flex flex-col gap-4 md:mb-12 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
              <h2 id="how-title" className="type-section max-w-xl text-ink">
                {c.how.title}
              </h2>
              <p className="type-sub max-w-md text-[#7d888e] lg:text-right">
                <span>{c.how.sub[0]}</span>
                <span className="sm:block">{c.how.sub[1]}</span>
              </p>
            </div>
            <div className="theme-light">
              <Suspense fallback={<div className="min-h-[420px]" aria-hidden="true" />}>
                <HowItWorksShowcase steps={steps} />
              </Suspense>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section aria-labelledby="cta-title" className="on-dark bg-[#1e4341] py-10 md:py-14">
          <div className="page-container">
            <div className="cta-card relative lg:min-h-[500px]">
              {/* L-shaped photo (desktop): the photo fills the right side and the
                  bottom; a rounded "notch" in the card colour carves out its
                  top-left corner, with inverse fillets so both outer corners stay
                  curved. On smaller screens the photo sits below the text. */}
              <div className="relative h-64 overflow-hidden rounded-[22px] max-lg:order-2 sm:h-80 lg:absolute lg:bottom-0 lg:left-[40%] lg:right-0 lg:top-0 lg:h-auto">
                <img
                  src="/cta/cta.webp"
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.03] motion-reduce:transition-none"
                  style={{ objectPosition: '68% 22%' }}
                />
              </div>
              <span className="cta-notch hidden lg:block" aria-hidden="true" />
              <span className="cta-fillet cta-fillet-a hidden lg:block" aria-hidden="true" />
              <span className="cta-fillet cta-fillet-b hidden lg:block" aria-hidden="true" />

              <div className="relative z-10 flex flex-col py-6 max-lg:pb-8 lg:min-h-[500px] lg:w-[60%] lg:py-4 lg:pr-12">
                <div className="max-w-[34rem]">
                  <h2 id="cta-title" className="type-section text-white">
                    {c.cta.title}
                  </h2>
                  <p className="type-sub mt-4 text-[#b8c4c4]">
                    {c.cta.sub}
                  </p>
                </div>
                <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 lg:mt-auto">
                  <a
                    href="/register"
                    onClick={(e) => handleLinkClick(e, '/register')}
                    className="group inline-flex min-h-12 items-center gap-3 rounded-full bg-[#c14e0b] py-1.5 pl-5 pr-1.5 text-base font-semibold text-white transition-colors hover:bg-[#a8440b]"
                  >
                    {c.nav.getStartedFree}
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#c14e0b] transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none">
                      <ArrowRight className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
                    </span>
                  </a>
                  <a
                    href="/login"
                    onClick={(e) => handleLinkClick(e, '/login')}
                    className="group inline-flex min-h-12 items-center gap-2.5 rounded-full px-1 text-base font-semibold text-white transition-colors hover:text-[#d4e6e4]"
                  >
                    {c.nav.signIn}
                    <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-current transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none">
                      <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden="true" />
                    </span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

    </div>
  );
};
