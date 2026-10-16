// @ts-nocheck
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';
import { IndividualDPRDocumentView } from '@/components/individual-dpr/IndividualDPRDocumentView';
import { PageSheet } from '@/components/individual-dpr/PageSheet';
import { useBackTarget } from '@/lib/navHistory';
import { pageEdgeMm, presetStyle } from '@/lib/individualDpr/documentStyle';
import { highlightHit, scrollHitIntoPreview } from '@/lib/individualDpr/previewFieldHits';
import {
  GUIDE_ALIGNS,
  GUIDE_COLOR_SETS,
  GUIDE_FONTS,
  GUIDE_LOOKS,
  GUIDE_PAGES,
  GUIDE_STEP_SPOTS,
  defaultGuideChoices,
  guideFocusSpot,
  guideSpotFallbacks,
  styleFromGuide,
} from '@/lib/individualDpr/reportGuide';
import { templateSpecimenDpr } from '@/lib/individualDpr/templateSpecimen';
import { useReportGuideStore } from '@/store/reportGuideStore';

const FONT_KEYS = {
  preset: 'preset',
  'Times New Roman': 'times',
  Arial: 'arial',
  Calibri: 'calibri',
  Helvetica: 'helvetica',
  'Noto Sans Telugu': 'telugu',
};

function ChoiceCard({ selected, title, hint, onSelect, swatch }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={`rounded-xl border px-4 py-3 text-left transition-colors ${
        selected ? 'border-primary bg-primary/5 ring-2 ring-primary' : 'border-slate-200 bg-white hover:border-slate-400'
      }`}
    >
      <span className="flex items-start gap-3">
        {swatch ? (
          <span className="mt-0.5 flex h-8 w-8 shrink-0 overflow-hidden rounded-md border border-slate-200" aria-hidden>
            {swatch.map((color, index) => (
              <span key={index} className="h-full flex-1" style={{ background: color }} />
            ))}
          </span>
        ) : null}
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-slate-900">{title}</span>
          {hint ? <span className="mt-0.5 block text-xs text-slate-500">{hint}</span> : null}
        </span>
      </span>
    </button>
  );
}

function colorSwatch(id) {
  if (id === 'preset') return null;
  const map = { navy: 'government', ink: 'bank', teal: 'pmegp', indigo: 'apCmep', stone: 'formal', grey: 'minimal' };
  const colors = presetStyle(map[id]).colors;
  return [colors.primary, colors.header, colors.table, colors.border];
}

export function ReportGuide() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const back = useBackTarget({ path: '/dashboard' });
  const setPending = useReportGuideStore((s) => s.setPending);
  const [step, setStep] = useState(0);
  const [choices, setChoices] = useState(defaultGuideChoices);
  const previewRef = useRef(null);
  const focusSpot = useRef('cover');
  const [focusTick, setFocusTick] = useState(0);
  const showSpot = (spot) => {
    focusSpot.current = spot;
    setFocusTick((n) => n + 1);
  };
  const patch = (partial) => {
    setChoices((current) => ({ ...current, ...partial }));
    showSpot(guideFocusSpot(partial));
  };
  const specimen = useMemo(() => templateSpecimenDpr(null), []);
  const liveStyle = useMemo(() => styleFromGuide(choices, null), [choices]);

  useEffect(() => {
    showSpot(GUIDE_STEP_SPOTS[step] || 'cover');
  }, [step]);

  useEffect(() => {
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => {
        const root = previewRef.current;
        if (!root) return;
        const target = guideSpotFallbacks(focusSpot.current)
          .map((name) => root.querySelector(`[data-style-spot="${name}"]`))
          .find(Boolean);
        if (!target) return;
        scrollHitIntoPreview(root, target);
        highlightHit(target);
      });
    });
    return () => {
      cancelAnimationFrame(outer);
      if (inner) cancelAnimationFrame(inner);
    };
  }, [focusTick, choices]);

  const steps = [
    {
      title: t('reportGuide.steps.look.title'),
      hint: t('reportGuide.steps.look.hint'),
      body: (
        <div className="grid gap-2 sm:grid-cols-2">
          {GUIDE_LOOKS.map((id) => (
            <ChoiceCard
              key={id}
              selected={choices.look === id}
              title={t(`reportGuide.look.${id}`)}
              hint={t(`reportGuide.look.${id}Hint`)}
              onSelect={() => patch({ look: id })}
            />
          ))}
        </div>
      ),
    },
    {
      title: t('reportGuide.steps.paper.title'),
      hint: t('reportGuide.steps.paper.hint'),
      body: (
        <div className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-2">
            {GUIDE_PAGES.map((id) => (
              <ChoiceCard
                key={id}
                selected={choices.pageSize === id}
                title={t(`reportGuide.paper.${id}`)}
                hint={t(`reportGuide.paper.${id}Hint`)}
                onSelect={() => patch({ pageSize: id })}
              />
            ))}
          </div>
          <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
            <input
              type="checkbox"
              className="mt-1"
              checked={choices.wideTablesLandscape}
              onChange={(event) => patch({ wideTablesLandscape: event.target.checked })}
            />
            <span>
              <span className="block text-sm font-semibold">{t('reportGuide.paper.wide')}</span>
              <span className="mt-0.5 block text-xs text-slate-500">{t('reportGuide.paper.wideHint')}</span>
            </span>
          </label>
        </div>
      ),
    },
    {
      title: t('reportGuide.steps.type.title'),
      hint: t('reportGuide.steps.type.hint'),
      body: (
        <div className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-2">
            {GUIDE_FONTS.map((id) => (
              <ChoiceCard
                key={id}
                selected={choices.font === id}
                title={t(`reportGuide.type.${FONT_KEYS[id]}`)}
                hint={t(`reportGuide.type.${FONT_KEYS[id]}Hint`)}
                onSelect={() => patch({ font: id })}
              />
            ))}
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            {GUIDE_ALIGNS.map((id) => (
              <ChoiceCard
                key={id}
                selected={choices.align === id}
                title={t(`reportGuide.type.align${id === 'preset' ? 'Preset' : id === 'left' ? 'Left' : 'Justify'}`)}
                hint={id === 'preset' ? '' : t(`reportGuide.type.align${id === 'left' ? 'Left' : 'Justify'}Hint`)}
                onSelect={() => patch({ align: id })}
              />
            ))}
          </div>
        </div>
      ),
    },
    {
      title: t('reportGuide.steps.colors.title'),
      hint: t('reportGuide.steps.colors.hint'),
      body: (
        <div className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-2">
            {GUIDE_COLOR_SETS.map((id) => (
              <ChoiceCard
                key={id}
                selected={choices.colors === id}
                title={t(`reportGuide.colors.${id}`)}
                swatch={colorSwatch(id)}
                onSelect={() => patch({ colors: id })}
              />
            ))}
          </div>
          <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
            <input
              type="checkbox"
              className="mt-1"
              checked={choices.tableStriped}
              onChange={(event) => patch({ tableStriped: event.target.checked })}
            />
            <span className="text-sm font-semibold">{t('reportGuide.colors.striped')}</span>
          </label>
        </div>
      ),
    },
    {
      title: t('reportGuide.steps.page.title'),
      hint: t('reportGuide.steps.page.hint'),
      body: (
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-semibold">{t('reportGuide.chrome.logo')}</p>
            <div className="grid gap-2 sm:grid-cols-3">
              {['left', 'center', 'right'].map((id) => (
                <ChoiceCard
                  key={id}
                  selected={choices.logoAlign === id}
                  title={t(`reportGuide.chrome.${id}`)}
                  onSelect={() => patch({ logoAlign: id })}
                />
              ))}
            </div>
          </div>
          <label className="block">
            <span className="text-sm font-semibold">{t('reportGuide.chrome.agency')}</span>
            <span className="mt-0.5 block text-xs text-slate-500">{t('reportGuide.chrome.agencyHint')}</span>
            <input
              className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={choices.agencyName}
              placeholder={t('reportGuide.chrome.agencyPlaceholder')}
              onChange={(event) => patch({ agencyName: event.target.value.slice(0, 160) })}
            />
          </label>
          <div>
            <p className="mb-2 text-sm font-semibold">{t('reportGuide.chrome.numbers')}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <ChoiceCard
                selected={choices.pageNumberStyle === 'plain'}
                title={t('reportGuide.chrome.plain')}
                onSelect={() => patch({ pageNumberStyle: 'plain' })}
              />
              <ChoiceCard
                selected={choices.pageNumberStyle === 'of'}
                title={t('reportGuide.chrome.of')}
                onSelect={() => patch({ pageNumberStyle: 'of' })}
              />
            </div>
          </div>
          <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
            <input
              type="checkbox"
              className="mt-1"
              checked={choices.watermarkOn}
              onChange={(event) => patch({ watermarkOn: event.target.checked })}
            />
            <span>
              <span className="block text-sm font-semibold">{t('reportGuide.chrome.watermark')}</span>
              <span className="mt-0.5 block text-xs text-slate-500">{t('reportGuide.chrome.watermarkHint')}</span>
            </span>
          </label>
          <p className="text-sm text-slate-600">{t('reportGuide.photosLater')}</p>
        </div>
      ),
    },
  ];

  const current = steps[step];
  const last = step === steps.length - 1;

  const startUsual = () => {
    setPending(null);
    navigate('/individual-dpr/create?new=true');
  };

  const finish = () => {
    setPending(choices);
    navigate('/individual-dpr/create?new=true&guide=1');
  };

  return (
    <Layout>
      <div className="mx-auto max-w-7xl">
        <button type="button" onClick={back.go} className="text-sm font-medium text-primary hover:underline">
          {back.label}
        </button>
        <h1 className="mt-3 text-3xl font-bold">{t('reportGuide.title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('reportGuide.intro')}</p>

        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
        <div className="order-2 rounded-2xl border bg-white p-5 shadow-sm sm:p-6 lg:order-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            {t('reportGuide.stepOf', { current: step + 1, total: steps.length })}
          </p>
          <h2 className="mt-1 text-xl font-semibold">{current.title}</h2>
          <p className="mt-1 text-sm text-slate-500">{current.hint}</p>
          <div className="mt-4">{current.body}</div>
          <p className="mt-4 text-xs text-slate-500">{t('reportGuide.later')}</p>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <Button type="button" variant="outline" disabled={step === 0} onClick={() => setStep((n) => n - 1)}>
              {t('reportGuide.back')}
            </Button>
            <div className="flex flex-wrap gap-2">
              {step === 0 ? (
                <Button type="button" variant="ghost" onClick={startUsual}>
                  {t('reportGuide.skip')}
                </Button>
              ) : null}
              <Button type="button" variant="primary" onClick={() => (last ? finish() : setStep((n) => n + 1))}>
                {last ? t('reportGuide.start') : t('reportGuide.next')}
              </Button>
            </div>
          </div>
          {step === 0 ? <p className="mt-2 text-right text-xs text-slate-500">{t('reportGuide.skipHint')}</p> : null}
        </div>

        <div className="order-1 lg:sticky lg:top-4 lg:order-2">
          <p className="text-sm font-semibold text-slate-900">{t('reportGuide.sample')}</p>
          <p className="mt-1 text-xs text-slate-500">{t('reportGuide.sampleHint')}</p>
          {step === 0 ? <p className="mt-1 text-xs text-slate-500">{t('reportGuide.lookAlso')}</p> : null}
          <div
            ref={previewRef}
            className="sticky top-16 mt-3 max-h-[42vh] overflow-auto rounded-xl border border-slate-200 bg-slate-100 p-3 lg:static lg:max-h-[calc(100dvh-9rem)]"
          >
            <div style={{ zoom: 0.55 }}>
              <PageSheet
                pageSize={liveStyle.pageSize}
                edgeTopMm={pageEdgeMm(liveStyle.marginMm.top)}
                edgeBottomMm={pageEdgeMm(liveStyle.marginMm.bottom)}
                className="shadow-lg"
              >
                <IndividualDPRDocumentView dpr={specimen} documentStyle={liveStyle} markStyleSpots />
              </PageSheet>
            </div>
          </div>
        </div>
        </div>
      </div>
    </Layout>
  );
}
