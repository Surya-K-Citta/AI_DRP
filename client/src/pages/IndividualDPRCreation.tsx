// @ts-nocheck
import { ReviewDialog, StepChecks } from '@/components/individual-dpr/DataChecks';
import { dismissalKey, openFindings, runDataChecks, KIND_ORDER, type Finding } from '@/lib/individualDpr/dataChecks';
import { auditSubmission, financeWarnings } from '@/lib/individualDpr/submissionAudit';
import { StepIntro } from '@/components/ui/FieldPrompt';
import { ResumeDrafts } from '@/components/individual-dpr/ResumeDrafts';
import { draftSignature, hasDraftContent } from '@/lib/individualDpr/draftState';
import { registerDraftFlusher } from '@/lib/draftFlush';
import { useDraftAutosave } from '@/lib/useDraftAutosave';
import { useDataHistory } from '@/lib/useDataHistory';
import { AuthoringStepper } from '@/components/individual-dpr/AuthoringStepper';
import { computeSections, overallProgress, sectionsUnsaved } from '@/lib/individualDpr/authoringProgress';
import { useBackTarget } from '@/lib/navHistory';
import { BackButton } from '@/components/ui/BackButton';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { ClipboardCheck, Save, ChevronRight, ChevronLeft, ZoomIn, ZoomOut, Maximize2, RotateCcw, Loader2, ChevronUp, ChevronDown, FlaskConical, LayoutTemplate, Eye } from 'lucide-react';
import { useIndividualDPRStore } from '@/store/individualDPRStore';
import { IndividualDPRForm } from '@/components/individual-dpr/IndividualDPRForm';
import { IndividualDPRDocumentView } from '@/components/individual-dpr/IndividualDPRDocumentView';
import { StyleEditor } from '@/components/individual-dpr/StyleEditor';
import { getSchemeDocSteps, sectionTitleFromStep } from '@/lib/individualDpr/individualDocModel';
import { applyPreset, defaultStyleForScheme, layoutOrder, moveSection, pageEdgeMm, parseBlockFrameSlot, resolveDocumentStyle, selectionStepOrder, setBlockFrame, setBlockText, setPictureFrame } from '@/lib/individualDpr/documentStyle';
import { styleFromGuide } from '@/lib/individualDpr/reportGuide';
import { useReportGuideStore } from '@/store/reportGuideStore';
import { PageSheet } from '@/components/individual-dpr/PageSheet';
import { toast } from 'react-hot-toast';
import { api } from '@/lib/api';
import { useTranslation } from 'react-i18next';
import { useDevModeStore } from '@/store/devModeStore';
import { useEditModeStore } from '@/store/editModeStore';
import { TemplatePickerDialog } from '@/components/individual-dpr/TemplatePickerDialog';
import { STEP_INTROS } from '@/lib/plainLanguage';
import { StepAccordion } from '@/components/individual-dpr/StepAccordion';
import { SaveDraftButton } from '@/components/individual-dpr/SaveDraftButton';
import { FinalPreviewDialog } from '@/components/individual-dpr/FinalPreviewDialog';
import { EditModeToggle } from '@/components/individual-dpr/EditModeToggle';
import { DocFieldGuide } from '@/components/individual-dpr/DocFieldGuide';
import { applySampleToStore } from '@/lib/individualDpr/sampleData/apply';
import { exportGeneratedDpr, type ExportedFile, type ExportFormat } from '@/lib/exportGeneratedDpr';
import { GenerateFormatDialog } from '@/components/individual-dpr/GenerateFormatDialog';
import { downloadBlob } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { isSuperAdmin } from '@/lib/rbac';
import { useClusterFormText } from '@/lib/clusterDprFormText';
import { toIndividualPayload, getUnitName } from '@/lib/individualDpr/toIndividualPayload';
import { individualDprApi } from '@/lib/individualDpr/individualDprApi';
import { getVisibleSteps, getStepTitle, getSchemeImpact, SCHEME_OPTIONS, getContentStep } from '@/lib/individualDpr/schemeFormConfig';
import { missingIndividualRequired } from '@/lib/requiredStepFields';
import { invalidFormats } from '@/lib/validation/stepFormats';
import { contentToLocal, getSchemeStepCount } from '@/lib/individualDpr/schemeStepCatalog';
import { patchFromDocEdit } from '@/lib/individualDpr/liveDocEdit';
import { peekHandoff } from '@/lib/ventureMatch/mapToDpr';
import { hasUnder18Applicant } from '@/lib/privacy/under18';
import { SchemeBriefPanel } from '@/components/individual-dpr/SchemeBriefPanel';
import { SchemePickerGrid } from '@/components/individual-dpr/SchemePickerGrid';
import { getSchemeUiTemplate } from '@/lib/individualDpr/schemeUiTemplate';
import {
  collectFieldHits,
  diffPayloadFieldPaths,
  highlightHit,
  scrollHitIntoPreview,
} from '@/lib/individualDpr/previewFieldHits';

type SetupPhase = 'pick' | 'brief' | 'form';

export const IndividualDPRCreation: React.FC = () => {
  const { t, i18n } = useTranslation();
  const tf = useClusterFormText();
  const navigate = useNavigate();
  const back = useBackTarget({ path: '/dashboard' });
  const params = useParams();
  const [searchParams] = useSearchParams();
  const {
    data,
    setCurrentStep,
    setGeneratedDPR,
    resetData,
    setDprIds,
    loadDataFromProject,
    setMatchedSchemeCode,
    setVentureMatchAnswers,
    setSchemeExtras,
  } = useIndividualDPRStore();
  const onEditField = useCallback((path: string, text: string) => {
    const store = useIndividualDPRStore.getState();
    const patch = patchFromDocEdit(store.data, path, text);
    if (!patch) return;
    if (patch.extras) store.setSchemeExtras(patch.extras);
    if (patch.step != null && patch.stepData) store.setStepData(patch.step, patch.stepData);
  }, []);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isStepping, setIsStepping] = useState(false);
  const [invalidFields, setInvalidFields] = useState<string[]>([]);
  const [requiredNotice, setRequiredNotice] = useState('');
  const devMode = useDevModeStore((s) => s.on);
  const setDevMode = useDevModeStore((s) => s.setOn);
  useEffect(() => {
    setDevMode(false);
    return () => setDevMode(false);
  }, [setDevMode]);
  useEffect(() => {
    if (devMode) {
      setInvalidFields([]);
      setRequiredNotice('');
    }
  }, [devMode]);
  const isAdmin = isSuperAdmin(useAuthStore((s) => s.user?.role));
  const [previewZoom, setPreviewZoom] = useState(0.6);
  const [project, setProject] = useState<any>(null);
  const isNewDraft = searchParams.get('new') === 'true';
  const [isLoadingData, setIsLoadingData] = useState(!isNewDraft);
  const isEditing = Boolean(params.projectId || searchParams.get('projectId'));
  // Opened straight onto a saved report (Edit from the dashboard, a resumed draft): Back leaves the page.
  // The under-18 notice appears as a notification (once each time it starts to apply), not as a banner that pushes the form down.
  const under18Applicant = hasUnder18Applicant(data);
  const under18Shown = useRef(false);
  useEffect(() => {
    if (under18Applicant && !under18Shown.current) {
      under18Shown.current = true;
      toast.error(t('privacy.guardianMessage'), { id: 'under18-applicant', duration: 9000 });
    } else if (!under18Applicant) {
      under18Shown.current = false;
    }
  }, [under18Applicant, t]);

  const enteredAtForm = useRef(Boolean(params.projectId || searchParams.get('projectId')));
  const enteredAtBrief = useRef(isNewDraft && Boolean(searchParams.get('scheme')));
  const [setupPhase, setSetupPhase] = useState<SetupPhase>(
    isNewDraft && searchParams.get('scheme') ? 'brief' : 'pick'
  );
  const viewLanguage: 'english' | 'telugu' = i18n.language.startsWith('te') ? 'telugu' : 'english';

  const currentStep = data.currentStep || 1;
  // Where the person fills in: the form (report is a read-only preview) or the report itself (form folded away).
  const editMode = useEditModeStore((s) => s.mode);
  const setEditMode = useEditModeStore((s) => s.setMode);
  const docMode = editMode === 'document';
  // A brand-new DPR always opens in Basic (the form). Editing an existing one opens in the mode that was used last.
  // The visit is remembered by its history entry, so reloading a new DPR in Advanced does not flip it back to Basic.
  const visitKey = useLocation().key;
  useEffect(() => {
    if (!isNewDraft || isEditing) return;
    try {
      if (sessionStorage.getItem('dpr-new-mode-visit') === visitKey) return;
      sessionStorage.setItem('dpr-new-mode-visit', visitKey);
    } catch {
      /* without storage it simply applies on every load */
    }
    setEditMode('form');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Document-mode guide: the answer that has the cursor, and which required answers are still empty (shown as UI only, never in the report).
  const [focusedPath, setFocusedPath] = useState<string | null>(null);
  // Which way the person moved between steps, so the new step slides in from that side.
  const lastStepRef = useRef(data.currentStep || 1);
  const stepSlide = useRef('motion-step-forward');
  if (lastStepRef.current !== currentStep) {
    stepSlide.current = currentStep < lastStepRef.current ? 'motion-step-back' : 'motion-step-forward';
    lastStepRef.current = currentStep;
  }
  const schemeCode = data.matchedSchemeCode || null;
  const visibleSteps = getVisibleSteps(schemeCode);
  const schemeImpact = getSchemeImpact(schemeCode);
  const dprPayload = toIndividualPayload(data);

  const prevPayloadRef = useRef<any>(null);
  const pendingPathsRef = useRef<string[]>([]);
  const lastHitPathsRef = useRef<string[]>([]);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextDiffRef = useRef(true);
  const [previewHitIndex, setPreviewHitIndex] = useState(0);
  const [previewHitCount, setPreviewHitCount] = useState(0);
  const [styling, setStyling] = useState(false);
  const [finalPreviewOpen, setFinalPreviewOpen] = useState(false);
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const [styleTab, setStyleTab] = useState<'form' | 'sections' | 'style'>('form');
  const [docStyle, setDocStyle] = useState<any>(null);
  const selectionSteps = selectionStepOrder(getSchemeDocSteps(schemeCode), docStyle?.sectionOrder, visibleSteps);
  const lastVisible = selectionSteps[selectionSteps.length - 1] || getSchemeStepCount(schemeCode);
  // Automated checks: missing, unclear, mismatched or unusual answers (advisory, never block on their own).
  const contentOf = (step: number) => getContentStep(step, schemeCode);
  const visibleContent = new Set(selectionSteps.map(contentOf));
  const dismissedChecks: string[] = data.schemeExtras?.dismissedChecks || [];
  const stepFindings = openFindings(runDataChecks(data), dismissedChecks).filter((f) => f.step === contentOf(currentStep));
  // Hard stops first (required fields, funding rules), then the advisory notes. A blocker replaces the advisory note of the same kind.
  const blockers = auditSubmission(data, [...visibleContent], (step, stepData) => missingIndividualRequired(step, stepData, schemeCode)).filter((f) => visibleContent.has(f.step));
  const blockerIds = new Set(blockers.map((f) => f.id));
  const advisory = openFindings([...runDataChecks(data, { final: true }), ...financeWarnings(data)], dismissedChecks).filter(
    (f) => visibleContent.has(f.step) && !blockerIds.has(f.id)
  );
  const allFindings = [...blockers, ...advisory].sort((x, y) => KIND_ORDER.indexOf(x.kind) - KIND_ORDER.indexOf(y.kind) || x.step - y.step);
  const canBypassBlocks = isAdmin && devMode;
  const [applyingSample, setApplyingSample] = useState(false);
  /** Dev mode only: fill every answer of the chosen scheme with realistic sample data. Everything stays editable. */
  const handleApplySampleData = async () => {
    setApplyingSample(true);
    try {
      if (!(await applySampleToStore())) {
        toast.error('No sample data for this scheme yet.');
        return;
      }
      setInvalidFields([]);
      setRequiredNotice('');
      toast.success('Sample data applied. Review and edit as needed. Uploads are not filled.');
    } catch (error) {
      console.error('Apply sample data failed', error);
      toast.error('Could not apply sample data.');
    } finally {
      setApplyingSample(false);
    }
  };
  const [reviewOpen, setReviewOpen] = useState(false);
  const [formatOpen, setFormatOpen] = useState(false);
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const [readyFile, setReadyFile] = useState<ExportedFile | null>(null);
  const lastGenerated = useRef<{ key: string; id: string } | null>(null);
  const generateAbort = useRef<AbortController | null>(null);
  /** Closing the chooser while a file is being made stops it: the request is aborted and nothing downloads. */
  const closeFormatDialog = () => {
    generateAbort.current?.abort();
    setFormatOpen(false);
    setReadyFile(null);
  };
  const dismissFinding = (finding: Finding) =>
    setSchemeExtras({ ...(data.schemeExtras || {}), dismissedChecks: [...dismissedChecks, dismissalKey(finding)] });
  /** Document mode: bring this step's section of the report into view. */
  /** Brings the step's form into view: the page itself on a wide screen, the form's top on a phone (where the page scrolls inside its own frame). */
  const showFormTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (window.matchMedia?.('(max-width: 1023px)').matches) {
      window.requestAnimationFrame(() => document.getElementById('individual-dpr-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    }
  };
  const scrollDocToStep = (step: number) => {
    const def = getSchemeDocSteps(schemeCode).find((item) => item.n === step);
    if (!def) return;
    window.setTimeout(() => {
      document.querySelector(`[data-dpr-section="${def.id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  };
  const goToFinding = (finding: Finding) => {
    const local = selectionSteps.find((step) => contentOf(step) === finding.step);
    setReviewOpen(false);
    if (!local) return;
    setInvalidFields(finding.field ? [finding.field] : []);
    setCurrentStep(local);
    setEditStepN(local);
    setEditNonce((n) => n + 1);
    if (docMode) scrollDocToStep(local);
    // Bring the field into view once its step has rendered.
    if (finding.field) {
      window.setTimeout(() => {
        const el = document.querySelector(`[data-required-field="${finding.field}"]`) as HTMLElement | null;
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el?.focus?.();
      }, 250);
    }
  };
  // Section-by-section progress: live from what is on screen, and "saved" from the last saved copy.
  const sectionDefs = getSchemeDocSteps(schemeCode);
  // Progress reads the answers as typed (the store), not the outgoing payload, which adds defaults such as the unit name.
  const sections = computeSections(data, schemeCode, sectionDefs, selectionSteps);
  const overall = overallProgress(sections);

  // The sticky bars stack under the site navbar; their heights are measured so the preview card below always sits just under them.
  const pageHeaderRef = useRef(null);
  const stepperBarRef = useRef(null);
  const [chromeTops, setChromeTops] = useState({ stepper: 140, body: 212 });
  useEffect(() => {
    const measure = () => {
      const nav = 64;
      const head = pageHeaderRef.current ? pageHeaderRef.current.offsetHeight : 76;
      const steps = stepperBarRef.current ? stepperBarRef.current.offsetHeight : 0;
      setChromeTops((prev) => (prev.stepper === nav + head && prev.body === nav + head + steps + 8 ? prev : { stepper: nav + head, body: nav + head + steps + 8 }));
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(measure);
    if (pageHeaderRef.current) observer.observe(pageHeaderRef.current);
    if (stepperBarRef.current) observer.observe(stepperBarRef.current);
    return () => observer.disconnect();
  }, [setupPhase, styling, docMode]);
  // The toolbar editor (Sections, Style, and Document mode) or the guided two-card Form layout.
  // Form mode's step list: the open row is the current step; pressing the open row closes it, and choosing any row opens it.
  const [stepOpen, setStepOpen] = useState(true);
  useEffect(() => {
    setStepOpen(true);
  }, [currentStep]);
  // The step list shares the report's section settings with Document mode: hiding a step leaves its section out of the report, and moving a
  // step moves its section (the answers are kept either way).
  const docSteps = getSchemeDocSteps(schemeCode);
  const stepToId = (step: number) => docSteps.find((item) => item.n === step)?.id;
  const hiddenSteps = new Set(
    docSteps.filter((item) => docStyle?.hiddenSectionIds?.includes(item.id)).map((item) => item.n)
  );
  const toggleStepHidden = (step: number) => {
    const id = stepToId(step);
    if (!id || !docStyle) return;
    const hidden = docStyle.hiddenSectionIds || [];
    onStyleChange({ ...docStyle, hiddenSectionIds: hidden.includes(id) ? hidden.filter((item) => item !== id) : [...hidden, id] });
  };
  const moveStep = (from: number, to: number, place: 'before' | 'after') => {
    const fromId = stepToId(from);
    const toId = stepToId(to);
    if (!fromId || !toId || !docStyle) return;
    const order = layoutOrder(docSteps, docStyle);
    onStyleChange({ ...docStyle, sectionOrder: moveSection(order, docSteps, fromId, toId, place) });
  };
  const selectFormStep = (step: number) => {
    if (step === currentStep) {
      setStepOpen((open) => !open);
      return;
    }
    if (!guardForward(step)) return;
    setInvalidFields([]);
    setRequiredNotice('');
    setStepOpen(true);
    setCurrentStep(step);
  };
  const stylingLayout = Boolean(styling && docStyle && (docMode || styleTab !== 'form'));

  // Changing between the guided form and the report editor: the screen fades out, the new one is put in, and it fades and rises in.
  const [layoutFading, setLayoutFading] = useState(false);
  const fadeBusy = useRef(false);
  const fadeThen = (change: () => void) => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced || fadeBusy.current) {
      change();
      return;
    }
    fadeBusy.current = true;
    setLayoutFading(true);
    window.setTimeout(() => {
      change();
      window.setTimeout(() => {
        setLayoutFading(false);
        fadeBusy.current = false;
      }, 30);
    }, 160);
  };

  // Form layout: the live report keeps the chosen step at its top. Choosing a step (the dots, Previous, Next) scrolls the report there,
  // and it stays there while answers are typed (the report grows and shrinks around it). Scrolling the report yourself lets go of it until
  // you pick a step again or click into an answer in the form.
  // A step with nothing to show yet has no section in the report: the report then goes to where that step will appear (the next section
  // that exists, or the end of the report when nothing comes after it).
  const [followNonce, setFollowNonce] = useState(0);
  const previewPinnedRef = useRef(false);
  useEffect(() => {
    if (setupPhase !== 'form' || stylingLayout) return undefined;
    const defs = getSchemeDocSteps(schemeCode);
    const at = defs.findIndex((item) => item.n === currentStep);
    if (at < 0) return undefined;
    let pinned = true;
    previewPinnedRef.current = true;
    let timer = 0;
    const settleTimers: number[] = [];
    let observer: ResizeObserver | null = null;
    let mutations: MutationObserver | null = null;
    let cleanup = () => {};
    let frame = 0;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    // Where the report's scroll should be so the step's section sits at the top.
    const wanted = (box: HTMLElement) => {
      let target: HTMLElement | null = null;
      for (let i = at; i < defs.length && !target; i += 1) {
        target = box.querySelector(`[data-dpr-section="${defs[i].id}"]`) as HTMLElement | null;
      }
      return Math.max(
        0,
        target ? box.scrollTop + (target.getBoundingClientRect().top - box.getBoundingClientRect().top) - 12 : box.scrollHeight
      );
    };
    const stop = () => {
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0;
    };
    // A glide with its own easing. The place it is heading for is read again on every frame, so the glide stays smooth even while the
    // report is redrawing around it (no jumps, no second correction).
    const glide = (duration: number) => {
      const box = document.getElementById('dpr-preview-scroll');
      if (!box) return;
      stop();
      const from = box.scrollTop;
      if (reduced || duration <= 0) {
        box.scrollTop = wanted(box);
        return;
      }
      const distance = Math.abs(wanted(box) - from);
      if (distance < 2) return;
      // Longer trips take a little longer, so a far step does not rush past.
      const length = Math.min(1000, Math.max(duration, 300 + distance * 0.2));
      const began = performance.now();
      const step = (now: number) => {
        const progress = Math.min(1, (now - began) / length);
        const eased = progress < 0.5 ? 2 * progress * progress : 1 - (-2 * progress + 2) ** 2 / 2;
        const goal = wanted(box);
        box.scrollTop = from + (goal - from) * eased;
        frame = progress < 1 ? window.requestAnimationFrame(step) : 0;
      };
      frame = window.requestAnimationFrame(step);
    };
    const start = window.setTimeout(() => {
      const box = document.getElementById('dpr-preview-scroll');
      const content = document.getElementById('dpr-preview-container');
      const form = document.getElementById('individual-dpr-form');
      if (!box) return;
      glide(520);
      [900, 1700].forEach((delay) => settleTimers.push(window.setTimeout(() => pinned && glide(260), delay)));
      const letGo = () => {
        pinned = false;
        previewPinnedRef.current = false;
        stop();
      };
      const repin = () => {
        pinned = true;
        previewPinnedRef.current = true;
        glide(280);
      };
      const realign = () => {
        if (!pinned) return;
        window.clearTimeout(timer);
        timer = window.setTimeout(() => glide(220), 80);
      };
      box.addEventListener('wheel', letGo, { passive: true });
      box.addEventListener('touchmove', letGo, { passive: true });
      box.addEventListener('pointerdown', letGo);
      form?.addEventListener('focusin', repin);
      if (content && typeof ResizeObserver !== 'undefined') {
        observer = new ResizeObserver(realign);
        observer.observe(content);
      }
      // The report is redrawn as answers change (sizes can stay the same while the places move), so its content is watched too.
      if (content && typeof MutationObserver !== 'undefined') {
        mutations = new MutationObserver(realign);
        mutations.observe(content, { childList: true, subtree: true, characterData: true });
      }
      cleanup = () => {
        box.removeEventListener('wheel', letGo);
        box.removeEventListener('touchmove', letGo);
        box.removeEventListener('pointerdown', letGo);
        form?.removeEventListener('focusin', repin);
      };
    }, 120);
    return () => {
      previewPinnedRef.current = false;
      window.clearTimeout(start);
      window.clearTimeout(timer);
      settleTimers.forEach((id) => window.clearTimeout(id));
      stop();
      observer?.disconnect();
      mutations?.disconnect();
      cleanup();
    };
  }, [currentStep, followNonce, setupPhase, stylingLayout, schemeCode]);
  // Sizes the preview so one page just fits the width of the preview box.
  const fitPreview = () => {
    const box = document.getElementById('dpr-preview-scroll');
    const sheet = document.getElementById('dpr-preview');
    if (!box || !sheet) return;
    const width = sheet.getBoundingClientRect().width / previewZoom;
    if (width > 0) setPreviewZoom(Math.max(0.3, Math.min(2, Math.round(((box.clientWidth - 16) / width) * 100) / 100)));
  };
  const missingRequired = blockers
    .filter((finding) => String(finding.id).startsWith('required.'))
    .map((finding) => ({ path: `step${finding.step}.${finding.field}`, label: String(finding.vars?.a || finding.field), step: finding.step }));
  const jumpToField = (path: string) => {
    const el = document.querySelector(`[data-dpr-field="${path}"]`) as HTMLElement | null;
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    window.setTimeout(() => el.focus?.(), 250);
  };
  // Document mode: the guide floats beside the answer being typed (it is not part of the report).
  const guideLayer = docMode ? (
    <DocFieldGuide
      schemeCode={schemeCode}
      focusedPath={focusedPath}
      onDismiss={() => setFocusedPath(null)}
      missing={missingRequired}
      findings={allFindings}
      data={data}
      setStepData={useIndividualDPRStore.getState().setStepData}
      getStepData={useIndividualDPRStore.getState().getStepData}
      setSchemeExtras={setSchemeExtras}
      onApplyText={(path, text) => onEditField(path, text)}
      onJump={jumpToField}
    />
  ) : null;
  const [savedPayload, setSavedPayload] = useState<any>(null);
  const savedSections = savedPayload ? computeSections(savedPayload, schemeCode, sectionDefs, selectionSteps) : null;
  const savedPercent = savedSections ? overallProgress(savedSections).percent : 0;
  const unsavedSections = sectionsUnsaved(sections, savedSections);
  // Anything typed since the last save (whole draft, not just the answers the stepper counts).
  const draftIsDirty = savedPayload
    ? draftSignature(data) !== draftSignature(savedPayload)
    : hasDraftContent(data);
  const dirtyRef = useRef(false);
  dirtyRef.current = draftIsDirty;
  // A report opened from the server starts out saved.
  useEffect(() => {
    if (!isLoadingData && data.projectId && savedPayload === null) setSavedPayload(JSON.parse(JSON.stringify(data)));
  }, [isLoadingData, data.projectId]);


  const stepOrdinal = Math.max(1, selectionSteps.indexOf(currentStep) + 1);
  const docStyleRef = useRef<any>(null);
  docStyleRef.current = docStyle;
  const [hotSectionId, setHotSectionId] = useState<string | null>(null);
  const [styleSaving, setStyleSaving] = useState(false);
  const [editNonce, setEditNonce] = useState(0);
  const [editStepN, setEditStepN] = useState<number | null>(null);
  const styleBeforeEdit = useRef<any>(null);
  const previewHitsRef = useRef<HTMLElement[]>([]);

  const refreshHits = useCallback((paths: string[]) => {
    const root = document.getElementById('dpr-preview');
    const hits = collectFieldHits(root, paths);
    previewHitsRef.current = hits;
    lastHitPathsRef.current = paths;
    setPreviewHitCount(hits.length);
    return hits;
  }, []);

  const goToPreviewHit = useCallback(
    (index: number) => {
      const fresh = refreshHits(lastHitPathsRef.current);
      if (!fresh.length) return;
      const next = Math.max(0, Math.min(index, fresh.length - 1));
      setPreviewHitIndex(next);
      const scrollParent = document.getElementById('dpr-preview-scroll');
      const target = fresh[next];
      if (scrollParent && target) {
        scrollHitIntoPreview(scrollParent, target, previewZoom);
        highlightHit(target);
      }
    },
    [previewZoom, refreshHits]
  );

  useEffect(() => {
    if (skipNextDiffRef.current) {
      skipNextDiffRef.current = false;
      prevPayloadRef.current = dprPayload;
      return;
    }
    const changed = diffPayloadFieldPaths(prevPayloadRef.current, dprPayload);
    prevPayloadRef.current = dprPayload;
    if (!changed.length) return;

    pendingPathsRef.current = Array.from(
      new Set([...pendingPathsRef.current, ...changed])
    );
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      const paths = pendingPathsRef.current;
      pendingPathsRef.current = [];
      // Double rAF: wait for React commit + layout after fieldHit DOM updates
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const hits = refreshHits(paths);
          if (hits.length > 0) {
            setPreviewHitIndex(0);
            const scrollParent = document.getElementById('dpr-preview-scroll');
            // While the report is holding the chosen step at its top, a changed answer is only marked: scrolling to it would move the step off the top.
            if (scrollParent && !previewPinnedRef.current) scrollHitIntoPreview(scrollParent, hits[0], previewZoom);
            if (scrollParent) highlightHit(hits[0]);
          } else {
            setPreviewHitIndex(0);
            highlightHit(null);
          }
        });
      });
    }, 140);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [dprPayload, previewZoom, refreshHits]);

  useEffect(() => {
    const load = async () => {
      try {
        const projectIdFromUrl = params.projectId || searchParams.get('projectId');
        const dprIdFromUrl = params.dprId || searchParams.get('dprId');
        const isNew = searchParams.get('new') === 'true';
        const schemeFromUrl = searchParams.get('scheme');
        setSavedPayload(null);
        setLastSavedAt(null);
        setSaveStatus('idle');

        if (isNew) {
          enteredAtForm.current = false;
          resetData();
          setDprIds('', '');
          setProject(null);

          const handoff = peekHandoff();
          const answers = handoff?.answers || null;
          // Keep answers for overlay rules (uploads / MUDRA bands) only — do not prefill form fields.
          if (answers) setVentureMatchAnswers(answers);

          const scheme = schemeFromUrl || null;
          setMatchedSchemeCode(scheme);
          if (searchParams.get('guide') !== '1') {
            useReportGuideStore.getState().setPending(null);
          }

          setCurrentStep(1);
          // Scheme Finder with a code → brief; otherwise show cards first
          setSetupPhase(scheme ? 'brief' : 'pick');
          setIsLoadingData(false);
          return;
        }

        setIsLoadingData(true);
        if (projectIdFromUrl) {
          // Opened onto a saved report (Resume, Edit): Back leaves the page rather than stepping inside it.
          enteredAtForm.current = true;
          try {
            const projectResponse = await api.getProject(projectIdFromUrl);
            const projectData = projectResponse.data || projectResponse;
            setProject(projectData);
            let dprData = null;
            if (dprIdFromUrl) {
              try {
                const dprResponse = await individualDprApi.get(dprIdFromUrl);
                dprData = dprResponse.data || dprResponse;
              } catch {
                /* draft only */
              }
            }
            loadDataFromProject(projectData, dprData);
            const pid = projectData._id || projectData.id;
            setDprIds(dprData?._id || dprData?.id || '', pid);
            setSetupPhase('form');
            const loaded = useIndividualDPRStore.getState().data;
            const visible = getVisibleSteps(loaded.matchedSchemeCode);
            const first = visible[0] || 1;
            // Resume where the person left off (a legacy step number is mapped to this scheme's numbering).
            const saved = Number(loaded.currentStep) || first;
            const mapped = visible.includes(saved) ? saved : contentToLocal(loaded.matchedSchemeCode, saved);
            const start = mapped && visible.includes(mapped) ? mapped : first;
            setCurrentStep(start);
            void openStyleEditor(start);
          } catch {
            resetData();
            setSetupPhase('pick');
          }
        } else {
          resetData();
          setSetupPhase('pick');
        }
      } finally {
        setIsLoadingData(false);
      }
    };
    load();
    // Runs again when the address points at a different report (for example Resume on the scheme picker,
    // which stays on this same page). The save that follows a first draft only rewrites the address bar
    // without going through the router, so it does not trigger this.
  }, [params.projectId, params.dprId, searchParams.get('projectId'), searchParams.get('dprId'), searchParams.get('new')]);

  useEffect(() => {
    // Remap legacy content-step numbers (e.g. 12) to scheme-local consecutive steps (e.g. PMEGP step 8)
    if (!visibleSteps.includes(currentStep) && visibleSteps.length) {
      const mapped = contentToLocal(schemeCode, currentStep);
      setCurrentStep(mapped && visibleSteps.includes(mapped) ? mapped : visibleSteps[0]);
    }
  }, [schemeCode]);

  // Saving: one at a time. A manual save, an automatic one and the save on moving between steps never overlap,
  // so a draft cannot be created twice, and each save sends the newest answers (read fresh from the store).
  const saveChain = useRef<Promise<boolean>>(Promise.resolve(true));
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'error'>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const autosaveWarned = useRef(false);

  const saveToDatabase = useCallback(
    (options?: { silent?: boolean }): Promise<boolean> => {
      const silent = Boolean(options?.silent);
      const run = async (): Promise<boolean> => {
        const fresh = useIndividualDPRStore.getState().data;
        try {
          if (hasUnder18Applicant(fresh)) {
            if (!silent) toast.error(t('privacy.guardianMessage'));
            return false;
          }
          if (silent && !getUnitName(fresh.step1)) return false;
          if (!hasDraftContent(fresh) && !fresh.projectId) return false;
          setSaveStatus('saving');
          const response = await individualDprApi.saveDraft(toIndividualPayload(fresh));
          if (response.success && response.data) {
            setSavedPayload(JSON.parse(JSON.stringify(fresh)));
            setLastSavedAt(new Date());
            setSaveStatus('idle');
            autosaveWarned.current = false;
            if (response.data.dprId && response.data.projectId) {
              setDprIds(response.data.dprId, response.data.projectId);
              const schemeQ = fresh.matchedSchemeCode ? `&scheme=${fresh.matchedSchemeCode}` : '';
              const url = `/individual-dpr/create?projectId=${response.data.projectId}&dprId=${response.data.dprId}${schemeQ}`;
              // Keep the router's own history entry (replacing it with `{}` would break going back).
              if (`${window.location.pathname}${window.location.search}` !== url) {
                window.history.replaceState(window.history.state, '', url);
              }
            }
            return true;
          }
          setSaveStatus('error');
          return false;
        } catch (error) {
          console.error('Error saving draft:', error);
          setSaveStatus('error');
          if (!silent) toast.error(t('individualDpr.toasts.saveFailedDb'));
          else if (!autosaveWarned.current) {
            autosaveWarned.current = true;
            toast.error(tf('Could not auto-save. We will keep trying every 30 seconds.'));
          }
          return false;
        }
      };
      const next = saveChain.current.then(run, run);
      saveChain.current = next.catch(() => false);
      return next;
    },
    [setDprIds, t]
  );

  // Automatic draft saving every 30 seconds while the form is open and something has changed. It stays quiet
  // (no toasts) and waits until there is a unit name, which the server needs to create the draft.
  // Undo / redo for answers and the report look together (the look is kept inside the draft's extras).
  const history = useDataHistory({
    enabled: setupPhase === 'form' && !isLoadingData,
    onRestore: (restored) => {
      const raw = restored?.schemeExtras?.documentStyle;
      if (!raw) return;
      const look = resolveDocumentStyle(raw, schemeCode);
      docStyleRef.current = look;
      setDocStyle(look);
    },
  });
  const autosave = useDraftAutosave({
    enabled: setupPhase === 'form' && !isLoadingData,
    intervalMs: 30_000,
    shouldSave: () => {
      const latest = useIndividualDPRStore.getState().data;
      return dirtyRef.current && !!getUnitName(latest.step1) && !hasUnder18Applicant(latest);
    },
    save: () => saveToDatabase({ silent: true }),
  });

  // Last chance to keep changes: before signing out (the top bar asks us), when the tab is hidden, when
  // leaving this page, and a browser warning if the tab is closed with changes that are not saved yet.
  useEffect(() => {
    const flush = async () => {
      const latest = useIndividualDPRStore.getState().data;
      if (!dirtyRef.current) return { dirty: false, ok: true };
      if (!getUnitName(latest.step1) || hasUnder18Applicant(latest)) return { dirty: true, ok: false };
      return { dirty: true, ok: await saveToDatabase({ silent: true }) };
    };
    const unregister = registerDraftFlusher(flush);
    const onHide = () => {
      if (document.visibilityState === 'hidden' && dirtyRef.current) void flush();
    };
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirtyRef.current) return;
      event.preventDefault();
      event.returnValue = '';
    };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('beforeunload', onBeforeUnload);
      unregister();
      if (dirtyRef.current) void flush();
    };
  }, [saveToDatabase]);

  const warnRequired = (missing: { key: string; label: string }[]) => {
    const keys = missing.map((field) => field.key);
    setInvalidFields(keys);
    const message = `${tf('Fill the required fields before continuing')}: ${missing
      .map((field) => tf(field.label))
      .join(', ')}`;
    setRequiredNotice(message);
    toast.error(message);
    window.setTimeout(() => {
      const root = document.getElementById('individual-dpr-form');
      const first = keys
        .map((key) => root?.querySelector(`[data-required-field="${key}"]`))
        .find(Boolean) as HTMLElement | undefined;
      (first || document.getElementById('required-fields-notice'))?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }, 80);
  };

  const warnFormats = (problems: ReturnType<typeof invalidFormats>) => {
    const root = document.getElementById('individual-dpr-form');
    problems.forEach((problem) => {
      const el = root?.querySelector(`[data-format-field="${problem.key}"]`) as HTMLInputElement | null;
      if (el) {
        el.focus();
        el.blur();
      }
    });
    toast.error(
      `${tf('Correct these fields before continuing')}: ${problems
        .map((problem) => tf(problem.label))
        .join(', ')}`
    );
    (root?.querySelector(`[data-format-field="${problems[0].key}"]`) as HTMLElement | null)?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  };

  // Any step can be opened at any time, with or without its required answers: the stepper marks what is still missing, "Check my answers"
  // lists it, and Generate DPR stays off until it is all filled in.
  const guardForward = (_targetStep: number) => true;

  const goAdjacent = async (dir: 1 | -1) => {
    if (isStepping) return;
    const advancing = dir === 1;
    const idx = selectionSteps.indexOf(currentStep);
    const target = selectionSteps[idx + dir];
    if (advancing && target && !guardForward(target)) return;
    if (advancing) {
      setInvalidFields([]);
      setRequiredNotice('');
    }
    if (advancing) setIsStepping(true);
    try {
      await saveToDatabase();
      const idx = selectionSteps.indexOf(currentStep);
      const next = selectionSteps[idx + dir];
      if (next) {
        setCurrentStep(next);
        if (styling) {
          setEditStepN(next);
          setEditNonce((n) => n + 1);
          document.querySelectorAll('.fill-edit-scroll').forEach((node) => {
            node.scrollTo({ top: 0 });
          });
        } else {
          showFormTop();
        }
      }
    } finally {
      if (advancing) setIsStepping(false);
    }
  };

  const aiAssistedKey = JSON.stringify(data.schemeExtras?.aiAssistedSteps || []);
  useEffect(() => {
    const assisted: number[] = data.schemeExtras?.aiAssistedSteps || [];
    const content = getContentStep(currentStep, schemeCode);
    if (!assisted.includes(content)) return;
    const missing = missingIndividualRequired(content, data[`step${content}`], schemeCode);
    setInvalidFields(missing.map((field) => field.key));
    // Highlight skipped required fields once AI content is applied on this step.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiAssistedKey]);

  useEffect(() => {
    if (!invalidFields.length) return;
    const content = getContentStep(currentStep, schemeCode);
    const still = missingIndividualRequired(content, data[`step${content}`], schemeCode).map(
      (field) => field.key
    );
    const next = invalidFields.filter((key) => still.includes(key));
    if (next.length !== invalidFields.length) {
      setInvalidFields(next);
      if (!next.length) setRequiredNotice('');
    }
  }, [data, currentStep, schemeCode, invalidFields]);

  const handleSaveDraft = async (): Promise<boolean> => {
    const success = await saveToDatabase();
    if (success) toast.success(t('individualDpr.toasts.saveSuccess'));
    else if (!getUnitName(useIndividualDPRStore.getState().data.step1)) toast.error(t('individualDpr.toasts.needUnitName'));
    else toast.error(t('individualDpr.toasts.saveFailed'));
    return success;
  };

  const openStyleEditor = async (step?: number) => {
    const latest = useIndividualDPRStore.getState().data;
    const code = latest.matchedSchemeCode || schemeCode;
    const start = step || currentStep;
    styleBeforeEdit.current = latest.schemeExtras?.documentStyle || null;
    const saved = latest.schemeExtras?.documentStyle;
    setEditStepN(start);
    setEditNonce((n) => n + 1);
    if (saved) {
      setDocStyle(resolveDocumentStyle(saved, code));
      setStyling(true);
      return;
    }
    setDocStyle(defaultStyleForScheme(code));
    setStyling(true);
    if (!code) return;
    try {
      const res = await api.getSchemeDocumentStyle(code);
      if (res?.data?.documentStyle) {
        setDocStyle(resolveDocumentStyle(res.data.documentStyle, code));
      }
    } catch {
      /* the local default is already on screen */
    }
  };

  const onStyleChange = (next: any) => {
    docStyleRef.current = next;
    setDocStyle(next);
    const current = useIndividualDPRStore.getState().data.schemeExtras || {};
    setSchemeExtras({ ...current, documentStyle: next });
  };

  // "Save on this DPR": the look goes into the draft, and the draft is saved the same way the Save Draft button saves it
  // (answers, step and look together, with the same saved status afterwards).
  const saveReportStyle = async () => {
    const latest = useIndividualDPRStore.getState().data;
    setSchemeExtras({ ...(latest.schemeExtras || {}), documentStyle: docStyle });
    try {
      setStyleSaving(true);
      const saved = await saveToDatabase();
      if (saved) toast.success('Style saved on this DPR');
      else if (!getUnitName(useIndividualDPRStore.getState().data.step1)) toast.error(t('individualDpr.toasts.needUnitName'));
      else toast.error(t('individualDpr.toasts.saveFailed'));
    } finally {
      setStyleSaving(false);
    }
  };

  const saveSchemeDefault = async () => {
    if (!schemeCode || !docStyle) return;
    try {
      setStyleSaving(true);
      await api.saveSchemeDocumentStyle(schemeCode, docStyle);
      toast.success('The next DPR for this scheme starts from this look');
    } catch {
      toast.error('Could not save the scheme default');
    } finally {
      setStyleSaving(false);
    }
  };

  /** "Generate DPR": check the answers, then ask which file format to make. The person stays on this page. */
  const handleGenerateDPR = async (bypassReview = false) => {
    if (blockers.length && !canBypassBlocks) {
      setReviewOpen(true);
      toast.error(tf('The DPR cannot be generated yet. Fix the items marked "Must fix first".'));
      return;
    }
    if (!bypassReview && allFindings.length) {
      setReviewOpen(true);
      return;
    }
    setReviewOpen(false);
    setReadyFile(null);
    setFormatOpen(true);
  };

  /** Saves, generates the DPR (once for the same answers), makes the chosen file and offers it for download. */
  const generateInFormat = async (format: ExportFormat) => {
    const abort = new AbortController();
    generateAbort.current = abort;
    const cancelled = () => abort.signal.aborted;
    setIsGenerating(true);
    setExporting(format);
    try {
      if (!data.step1 || !getUnitName(data.step1)) {
        toast.error(t('individualDpr.toasts.needUnitNameGenerate'));
        setFormatOpen(false);
        return;
      }
      const badFormats = invalidFormats(data.step11);
      if (badFormats.length) {
        setFormatOpen(false);
        setCurrentStep(11);
        window.setTimeout(() => warnFormats(badFormats), 120);
        return;
      }
      const payload = {
        ...dprPayload,
        currentStep: undefined,
        isDraft: undefined,
        lastSaved: undefined,
        generatedDPR: undefined,
      };
      // The same answers give the same DPR: picking the other format afterwards does not create a second one.
      // Ids and timestamps change when the draft is saved, so they are left out of the comparison.
      const key = JSON.stringify(payload, (name, value) => (/^(_id|id|draftId|projectId|dprId|sessionId|lastSaved|updatedAt|createdAt|savedAt)$/.test(name) ? undefined : value));
      let dprId: string | null = lastGenerated.current?.key === key ? lastGenerated.current.id : null;
      if (!dprId) {
        const saveSuccess = await saveToDatabase();
        if (cancelled()) return;
        if (!saveSuccess) {
          toast.error(t('individualDpr.toasts.saveBeforeGenerateFailed'));
          return;
        }
        toast.loading(t('individualDpr.toasts.generating'), { id: 'generating-dpr' });
        const response = await individualDprApi.generate(payload, 'bilingual');
        if (!(response.success && response.data)) throw new Error(response.message || 'Failed to generate DPR');
        setGeneratedDPR(response.data.content);
        dprId = String(response.data.dprId);
        lastGenerated.current = { key, id: dprId };
        if (cancelled()) {
          toast.dismiss('generating-dpr');
          return;
        }
      }
      toast.loading(tf('Generating your DPR…'), { id: 'generating-dpr' });
      const file = await exportGeneratedDpr(dprId, format, abort.signal);
      toast.remove('generating-dpr');
      // Try the download straight away. A browser may block an automatic download, so the dialog also shows a real
      // download link: a click on it is always allowed.
      downloadBlob(file.blob, file.filename);
      setReadyFile(file);
    } catch (error: any) {
      if (cancelled() || error?.name === 'CanceledError' || error?.name === 'AbortError' || error?.code === 'ERR_CANCELED') {
        toast.dismiss('generating-dpr');
        return;
      }
      toast.error(
        error.response?.data?.message || error.message || t('individualDpr.toasts.generateFailed'),
        { id: 'generating-dpr' }
      );
    } finally {
      if (generateAbort.current === abort) generateAbort.current = null;
      setIsGenerating(false);
      setExporting(null);
    }
  };

  const getStepCompletion = (localStep: number): boolean => {
    const content = getContentStep(localStep, schemeCode);
    const stepData = data[`step${content}`];
    return !!stepData && typeof stepData === 'object' && Object.keys(stepData).length > 0;
  };

  const handlePickScheme = (code: string | null) => {
    setMatchedSchemeCode(code);
    const nextVisible = getVisibleSteps(code);
    setCurrentStep(nextVisible[0] || 1);
    setSetupPhase('brief');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBriefNext = async () => {
    const step = visibleSteps[0] || 1;
    setSetupPhase('form');
    setCurrentStep(step);
    const guide = searchParams.get('guide') === '1'
      ? useReportGuideStore.getState().takePending()
      : null;
    if (guide) {
      const code = useIndividualDPRStore.getState().data.matchedSchemeCode || schemeCode;
      let savedSchemeStyle = null;
      if (guide.look === 'match' && code) {
        try {
          const res = await api.getSchemeDocumentStyle(code);
          if (res?.data?.documentStyle) savedSchemeStyle = resolveDocumentStyle(res.data.documentStyle, code);
        } catch {
          /* the built-in scheme look is enough */
        }
      }
      const style = styleFromGuide(guide, code, savedSchemeStyle);
      const current = useIndividualDPRStore.getState().data.schemeExtras || {};
      setSchemeExtras({ ...current, documentStyle: style });
    }
    void openStyleEditor(step);
  };

  const handleSchemeDropdownChange = (code: string) => {
    const nextCode = code || null;
    setMatchedSchemeCode(nextCode);
    const nextVisible = getVisibleSteps(nextCode);
    if (!nextVisible.includes(currentStep)) {
      setCurrentStep(nextVisible[0] || 1);
    }
  };

  const selectedSchemeLabel =
    tf(SCHEME_OPTIONS.find((o) => o.code === (data.matchedSchemeCode || ''))?.label || '') ||
    tf(schemeImpact.title);
  const schemeUi = getSchemeUiTemplate(data.matchedSchemeCode || null);

  const headerSubtitle =
    setupPhase === 'pick'
      ? t('individualDpr.picker.headerHint', { defaultValue: 'Select a scheme to continue' })
      : setupPhase === 'brief'
        ? t('individualDpr.picker.briefHint', { defaultValue: 'Review the scheme, then continue to the form' })
        : t('individualDpr.stepOf', {
            current: stepOrdinal,
            total: visibleSteps.length,
            defaultValue: `Step ${stepOrdinal} of ${visibleSteps.length}`,
          });

  const liveDpr = {
    content: { english: { clusterData: dprPayload } },
    metadata: {
      clusterData: dprPayload,
      isIndividualDPR: true,
      matchedSchemeCode: data.matchedSchemeCode || null,
    },
  };
  const liveProject = project || {
    _id: data.projectId,
    id: data.projectId,
    projectName: getUnitName(data.step1),
    projectType: 'individual',
    stepData: dprPayload,
  };

  return (
    <Layout fullBleed={stylingLayout || setupPhase === 'form'}>
      {reviewOpen ? (
        <ReviewDialog
          findings={allFindings}
          stepTitle={(step) => {
            const local = selectionSteps.find((st) => contentOf(st) === step);
            return local ? getStepTitle(local, data.matchedSchemeCode) : `Step ${step}`;
          }}
          onClose={() => setReviewOpen(false)}
          onGo={goToFinding}
          onDismiss={dismissFinding}
          onGenerate={() => {
            setReviewOpen(false);
            void handleGenerateDPR(true);
          }}
        />
      ) : null}
      <div className={stylingLayout ? 'flex min-h-0 flex-1 flex-col overflow-hidden bg-background' : setupPhase === 'form' ? 'flex min-h-0 flex-1 flex-col overflow-y-auto bg-muted/40 lg:overflow-hidden' : 'min-h-screen bg-background'}>
        <div ref={pageHeaderRef} className={stylingLayout
          ? 'relative z-[55] shrink-0 border-b border-border bg-background pb-2 pt-1.5'
          : (setupPhase === 'form' ? 'relative z-[56] shrink-0 border-b border-border bg-background shadow-[0_1px_2px_rgba(16,24,40,0.04)]' : 'sm:sticky top-16 z-[55] border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60')}>
          <div className={stylingLayout ? 'mx-auto w-full max-w-7xl px-4' : 'mx-auto w-full max-w-7xl px-4 py-2'}>
            <div className="flex items-center justify-between gap-x-4 gap-y-2 flex-wrap">
              <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                <BackButton
                  label={setupPhase === 'pick'
                    ? back.label
                    : setupPhase === 'brief'
                      ? enteredAtBrief.current && back.fromHistory
                        ? back.label
                        : t('individualDpr.picker.backToSchemes', { defaultValue: 'All Schemes' })
                      : enteredAtForm.current
                        ? back.label
                        : t('common.previous')}
                  onClick={() => {
                    if (setupPhase === 'brief') {
                      if (enteredAtBrief.current && back.fromHistory) {
                        back.go();
                        return;
                      }
                      setSetupPhase('pick');
                      return;
                    }
                    if (setupPhase === 'form') {
                      if (enteredAtForm.current) {
                        back.go();
                        return;
                      }
                      setStyling(false);
                      setSetupPhase('brief');
                      return;
                    }
                    back.go();
                  }}
                />
                <div className="min-w-0">
                  <h1 className="text-xl font-bold leading-tight">
                    {isEditing
                      ? t('individualDpr.editTitle', { defaultValue: 'Edit DPR' })
                      : t('individualDpr.title')}
                  </h1>
                  <p className="text-sm text-muted-foreground">{headerSubtitle}</p>
                </div>
              </div>

              <div className="flex w-full flex-wrap items-center gap-2 sm:ml-auto sm:w-auto sm:justify-end">
                {setupPhase === 'brief' && (
                  <Button variant="primary" onClick={handleBriefNext} className="gap-2" data-tour="start-steps">
                    {t('individualDpr.picker.continueToForm', { defaultValue: 'Start DPR steps' })}
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                )}
                {setupPhase === 'form' && (
                  <>
                    <label data-tour="scheme-select" className="flex w-full items-center gap-2 text-sm sm:w-auto">
                      <span className="text-muted-foreground whitespace-nowrap">
                        {t('individualDpr.schemeLabel', { defaultValue: 'Scheme' })}
                      </span>
                      <select
                        className="min-w-0 flex-1 truncate rounded-md sm:w-80 sm:flex-none border border-input bg-background px-2 py-1.5 text-sm xl:w-[26rem] 2xl:w-[32rem]"
                        title={SCHEME_OPTIONS.find((opt) => opt.code === (data.matchedSchemeCode || '')) ? tf(SCHEME_OPTIONS.find((opt) => opt.code === (data.matchedSchemeCode || '')).label) : undefined}
                        value={data.matchedSchemeCode || ''}
                        onChange={(e) => handleSchemeDropdownChange(e.target.value)}
                        aria-label={t('individualDpr.schemeLabel', { defaultValue: 'Scheme' })}
                      >
                        {SCHEME_OPTIONS.map((opt) => (
                          <option key={opt.code || 'vanilla'} value={opt.code}>
                            {tf(opt.label)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <span data-tour="mode-toggle" className="inline-flex max-sm:min-w-0 max-sm:flex-1 max-sm:[&>*]:w-full">
                      <EditModeToggle mode={editMode} onChange={(mode) => (mode === editMode ? undefined : fadeThen(() => setEditMode(mode)))} />
                    </span>
                    {isAdmin && devMode && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void handleApplySampleData()}
                        isLoading={applyingSample}
                        className="gap-2 border-amber-400 bg-amber-50 text-amber-950 hover:bg-amber-100"
                        title={tf('Dev mode: fills every step of this scheme with sample answers. You can edit them afterwards.')}
                      >
                        <FlaskConical className="h-4 w-4" />
                        {tf('Apply sample data')}
                      </Button>
                    )}
                    {/* Below a wide screen the Check button shows only its icon (the name is the tooltip), so the row never wraps. */}
                    <Button variant="outline" size="sm" onClick={() => setReviewOpen(true)} className="relative gap-2" data-tour="check-answers" aria-label={tf('Check my answers')} title={tf('Looks for missing, unclear or unusual answers across the whole form.')}>
                      <ClipboardCheck className="h-4 w-4" />
                      <span className="hidden xl:inline">{tf('Check my answers')}</span>
                      {allFindings.length ? <span className="rounded-full bg-amber-500 px-1.5 text-xs font-semibold text-slate-900 max-xl:absolute max-xl:-right-1.5 max-xl:-top-1.5">{allFindings.length}</span> : null}
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => void handleGenerateDPR()}
                      isLoading={isGenerating}
                      className="gap-2 max-sm:flex-1 max-sm:whitespace-nowrap max-sm:px-2"
                      data-tour="generate"
                      title={overall.readyToGenerate ? tf('Creates the final DPR from your answers.') : tf('Creates the final DPR. It turns on as soon as every required answer is filled in.')}
                      disabled={!overall.readyToGenerate}
                    >
                      {t('individualDpr.generateDpr')}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {setupPhase === 'pick' && (
          <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {isLoadingData ? (
              <div className="flex flex-col items-center justify-center gap-4 py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">{t('individualDpr.loading')}</p>
              </div>
            ) : (
              <>
                <div className="mx-auto max-w-6xl">
                  <ResumeDrafts />
                </div>
                <SchemePickerGrid onSelect={handlePickScheme} />
              </>
            )}
          </div>
        )}

        {setupPhase === 'brief' && (
          <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="max-w-5xl mx-auto space-y-6">
              <SchemeBriefPanel
                schemeCode={data.matchedSchemeCode || null}
                formNotes={{
                  title: tf(schemeImpact.title),
                  bullets: schemeImpact.bullets.map((b) => tf(b)),
                }}
              />
            </div>
          </div>
        )}

        {setupPhase === 'form' && (
          <>
        {!stylingLayout && (
        <div ref={stepperBarRef} data-tour="stepper" className="relative z-[55] shrink-0 bg-background border-b border-border shadow-[0_8px_16px_-14px_rgba(16,24,40,0.28)]">
          <div className="mx-auto w-full max-w-7xl px-4 py-1.5">
            <AuthoringStepper
              variant="full"
              sections={sections}
              overall={overall}
              savedPercent={savedPercent}
              unsaved={unsavedSections}
              dirty={draftIsDirty}
              saveStatus={saveStatus}
              lastSavedAt={lastSavedAt}
              currentStep={currentStep}
              onSelect={(step) => {
                if (docMode) {
                  // In Document mode every section is open to edit: go straight there, no required-answer gate.
                  setCurrentStep(step);
                  scrollDocToStep(step);
                  return;
                }
                if (step === currentStep) {
                  setFollowNonce((n) => n + 1);
                  return;
                }
                if (!guardForward(step)) return;
                setInvalidFields([]);
                setRequiredNotice('');
                setCurrentStep(step);
                showFormTop();
              }}
              activeClass={schemeUi?.stepActiveClass}
              idleClass={schemeUi?.stepIdleClass}
              stepLabel={(step) => t('individualDpr.stepShort', { n: step })}
              lang={viewLanguage === 'telugu' ? 'te' : 'en'}
            />
          </div>
        </div>
        )}

        <div
          key={stylingLayout ? 'editor' : 'form'}
          style={{ opacity: layoutFading ? 0 : 1, transform: layoutFading ? 'translateY(4px)' : undefined }}
          className={`dpr-layout-in transition-[opacity,transform] duration-150 ease-out ${stylingLayout ? 'min-h-0 flex-1' : 'mx-auto w-full max-w-7xl px-4 py-3 lg:min-h-0 lg:flex-1'}`}
        >
          {stylingLayout ? (
            <StyleEditor
              style={docStyle}
              schemeCode={schemeCode}
              steps={getSchemeDocSteps(schemeCode).map((step) => ({
                id: step.id,
                title: sectionTitleFromStep(step),
                n: step.n,
              }))}
              activeSectionId={hotSectionId}
              onActiveSection={setHotSectionId}
              editMode={editMode}
              onEditMode={setEditMode}
              onEditSection={(step) => {
                if (step?.n && visibleSteps.includes(step.n)) setCurrentStep(step.n);
              }}
              renderEditor={() => (
                <div className="space-y-6">
                  <Card className={schemeUi?.formShellClass || undefined}>
                    <CardHeader>
                      <CardTitle className="text-xl">
                        {tf(getStepTitle(currentStep, data.matchedSchemeCode))}
                      </CardTitle>
                      <StepIntro title={getStepTitle(currentStep, data.matchedSchemeCode)} />
                      {schemeUi ? (
                        <p className="text-xs text-muted-foreground mt-1">{tf(schemeUi.badge)}</p>
                      ) : null}
                    </CardHeader>
                    <CardContent>
                      {requiredNotice ? (
                        <div
                          id="required-fields-notice"
                          role="alert"
                          className="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
                        >
                          {requiredNotice}
                        </div>
                      ) : null}
                      {(data.schemeExtras?.aiAssistedSteps || []).includes(
                        getContentStep(currentStep, data.matchedSchemeCode)
                      ) ? (
                        <p className="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                          {tf(
                            'AI-generated content. Please cross-check all details. The submitter is responsible for the accuracy of the final document.'
                          )}
                        </p>
                      ) : null}
                      <StepChecks findings={stepFindings} onDismiss={dismissFinding} />
                      <div key={`step-${currentStep}-${data.projectId || 'new'}-${data.matchedSchemeCode || 'vanilla'}`} className={stepSlide.current}>
                        <IndividualDPRForm
                          currentStep={currentStep}
                          invalidFields={invalidFields}
                          onNext={() => goAdjacent(1)}
                          onPrevious={() => goAdjacent(-1)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                  <div className="sticky bottom-0 z-10 -mx-3 -mb-3 flex items-center justify-between gap-2 border-t border-border bg-background/95 px-3 py-2 backdrop-blur">
                    <div className="flex items-center gap-2">
                      <Button
                      variant="outline"
                      onClick={() => goAdjacent(-1)}
                      disabled={currentStep === selectionSteps[0] || isStepping}
                      className="gap-2"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      {t('common.previous')}
                    </Button>
                      {currentStep === lastVisible ? (
                      <Button
                        variant="primary"
                        onClick={() => void handleGenerateDPR()}
                        isLoading={isGenerating}
                        disabled={!overall.readyToGenerate}
                        className="gap-2"
                      >
                        {t('individualDpr.generateDpr')}
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        onClick={() => goAdjacent(1)}
                        isLoading={isStepping}
                        className="gap-2"
                      >
                        {t('common.next')}
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    )}
                    </div>
                    <SaveDraftButton
                      label={t('individualDpr.saveDraft')}
                      savedLabel={tf('Saved')}
                      dirty={draftIsDirty || unsavedSections.size > 0}
                      saveStatus={saveStatus}
                      dueAt={autosave.dueAt}
                      intervalMs={autosave.intervalMs}
                      onClick={handleSaveDraft}
                    />
                  </div>
                </div>
              )}
              editNonce={editNonce}
              editStepN={editStepN}
              stepsBar={(
            <AuthoringStepper
              variant="compact"
              sections={sections}
              overall={overall}
              savedPercent={savedPercent}
              unsaved={unsavedSections}
              dirty={draftIsDirty}
              saveStatus={saveStatus}
              lastSavedAt={lastSavedAt}
              currentStep={currentStep}
              onSelect={(step) => {
                if (step !== currentStep && !guardForward(step)) return;
                setInvalidFields([]);
                setRequiredNotice('');
                setCurrentStep(step);
                setEditStepN(step);
                setEditNonce((n) => n + 1);
              }}
              activeClass={schemeUi?.stepActiveClass}
              idleClass={schemeUi?.stepIdleClass}
              stepLabel={(step) => t('individualDpr.stepShort', { n: step })}
              lang={viewLanguage === 'telugu' ? 'te' : 'en'}
            />
              )}
              finalPreview={
                <IndividualDPRDocumentView
                  documentStyle={docStyle}
                  dpr={liveDpr}
                  project={liveProject}
                  viewLanguage={viewLanguage}
                />
              }
              tab={styleTab}
              onTab={(next) => (next === 'form' && !docMode ? fadeThen(() => setStyleTab(next)) : setStyleTab(next))}
              onChange={onStyleChange}
              onSave={saveReportStyle}
              onUndo={history.undo}
              onRedo={history.redo}
              canUndo={history.canUndo}
              canRedo={history.canRedo}
              saveButton={({ disabled }) => (
                <SaveDraftButton
                  compact
                  disabled={disabled}
                  label={t('individualDpr.saveDraft')}
                  savedLabel={tf('Saved')}
                  dirty={draftIsDirty || unsavedSections.size > 0}
                  saveStatus={saveStatus}
                  dueAt={autosave.dueAt}
                  intervalMs={autosave.intervalMs}
                  onClick={handleSaveDraft}
                />
              )}
              onClose={() => {
                const current = useIndividualDPRStore.getState().data.schemeExtras || {};
                if (styleBeforeEdit.current) {
                  setSchemeExtras({ ...current, documentStyle: styleBeforeEdit.current });
                } else {
                  const next = { ...current };
                  delete next.documentStyle;
                  setSchemeExtras(next);
                }
                setDocStyle(null);
                setStyling(false);
                setStyleTab('form');
                setSetupPhase('brief');
              }}
              saving={styleSaving}
              canSaveSchemeDefault={isAdmin}
              onSaveSchemeDefault={saveSchemeDefault}
              language={viewLanguage}
              onLanguage={(lang) => i18n.changeLanguage(lang === 'telugu' ? 'te' : 'en')}
              hasTelugu
            >
              <IndividualDPRDocumentView
                trackFieldHits
                showEmpty
                onEditField={docMode ? onEditField : undefined}
                onFieldFocus={docMode ? (path: string) => setFocusedPath(path) : undefined}
                guideMissing={docMode ? missingRequired.map((item) => item.path) : undefined}
                onOpenInForm={docMode ? (stepNumber: number) => {
                  if (visibleSteps.includes(stepNumber)) setCurrentStep(stepNumber);
                  setEditStepN(stepNumber);
                  setEditNonce((n) => n + 1);
                  setStyleTab('form');
                  setEditMode('form');
                } : undefined}
                documentStyle={docStyle}
                activeSectionId={hotSectionId}
                dpr={liveDpr}
                project={liveProject}
                viewLanguage={viewLanguage}
                onEditBlock={docMode ? (sectionId, blockId, text) => {
                  const raw = docStyleRef.current;
                  if (!raw) return;
                  onStyleChange(setBlockText(raw, sectionId, blockId, text));
                } : undefined}
                onImageFrame={(slot, box) => {
                  if (!docStyleRef.current) return;
                  onStyleChange(parseBlockFrameSlot(slot)
                    ? setBlockFrame(docStyleRef.current, slot, box)
                    : setPictureFrame(docStyleRef.current, slot, box));
                }}
                onSectionFocus={(stepNumber: number, sectionId: string) => {
                  setHotSectionId(sectionId);
                  setStyleTab('form');
                  if (!visibleSteps.includes(stepNumber) || stepNumber === currentStep) return;
                  setInvalidFields([]);
                  setRequiredNotice('');
                  setCurrentStep(stepNumber);
                  document.querySelectorAll('.fill-edit-scroll').forEach((node) => {
                    node.scrollTo({ top: 0 });
                  });
                }}
                onSectionClick={(stepNumber: number) => {
                  if (visibleSteps.includes(stepNumber)) setCurrentStep(stepNumber);
                  setEditStepN(stepNumber);
                  setEditNonce((n) => n + 1);
                }}
              />
            </StyleEditor>
          ) : (
          <>
          <div className="grid grid-cols-1 gap-4 lg:h-full lg:min-h-0 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
              <div
                id="individual-dpr-form"
                data-tour="form-pane"
                className="dpr-form-card flex min-w-0 flex-col rounded-2xl border border-border/70 bg-card shadow-[0_1px_2px_rgba(16,24,40,0.05),0_12px_28px_-12px_rgba(16,24,40,0.16)] lg:h-full lg:min-h-0 lg:overflow-hidden"
              >
                {(
                <>
                {isLoadingData ? (
                  <Card>
                    <CardContent className="py-12">
                      <div className="flex flex-col items-center justify-center gap-4">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">{t('individualDpr.loading')}</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <StepAccordion
                    sections={sections}
                    current={currentStep}
                    open={stepOpen}
                    onSelect={selectFormStep}
                    hiddenSteps={hiddenSteps}
                    onToggleHidden={docStyle ? toggleStepHidden : undefined}
                    onMove={docStyle ? moveStep : undefined}
                    describe={(step) => {
                      const key = getStepTitle(step, data.matchedSchemeCode).replace(/^Step \d+:\s*/, '');
                      const text = STEP_INTROS[key];
                      return text ? tf(text) : undefined;
                    }}
                  >
                      {requiredNotice ? (
                        <div
                          id="required-fields-notice"
                          role="alert"
                          className="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
                        >
                          {requiredNotice}
                        </div>
                      ) : null}
                      {(data.schemeExtras?.aiAssistedSteps || []).includes(
                        getContentStep(currentStep, data.matchedSchemeCode)
                      ) ? (
                        <p className="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                          {tf(
                            'AI-generated content. Please cross-check all details. The submitter is responsible for the accuracy of the final document.'
                          )}
                        </p>
                      ) : null}
                      <StepChecks findings={stepFindings} onDismiss={dismissFinding} />
                      <div key={`step-${currentStep}-${data.projectId || 'new'}-${data.matchedSchemeCode || 'vanilla'}`} className={stepSlide.current}>
                        <IndividualDPRForm
                          currentStep={currentStep}
                          invalidFields={invalidFields}
                          onNext={() => goAdjacent(1)}
                          onPrevious={() => goAdjacent(-1)}
                        />
                      </div>
                  </StepAccordion>
                )}

                <div className="relative z-10 flex shrink-0 items-center justify-between gap-2 border-t border-border/70 bg-card/95 px-5 py-3 shadow-[0_-10px_18px_-14px_rgba(16,24,40,0.25)] backdrop-blur max-lg:sticky max-lg:bottom-0">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => goAdjacent(-1)} disabled={currentStep === selectionSteps[0] || isStepping} className="gap-2">
                    <ChevronLeft className="h-4 w-4" />
                    {t('common.previous')}
                  </Button>
                    {currentStep === lastVisible ? (
                    <Button
                      variant="primary"
                      onClick={() => void handleGenerateDPR()}
                      isLoading={isGenerating}
                      disabled={!overall.readyToGenerate}
                      className="gap-2"
                    >
                      {t('individualDpr.generateDpr')}
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      onClick={() => goAdjacent(1)}
                      isLoading={isStepping}
                      className="gap-2"
                    >
                      {t('common.next')}
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  )}
                  </div>
                  <SaveDraftButton
                      label={t('individualDpr.saveDraft')}
                      savedLabel={tf('Saved')}
                      dirty={draftIsDirty || unsavedSections.size > 0}
                      saveStatus={saveStatus}
                      dueAt={autosave.dueAt}
                      intervalMs={autosave.intervalMs}
                      onClick={handleSaveDraft}
                    />
                </div>
                </>
                )}
              </div>

              <div className="min-w-0 lg:h-full lg:min-h-0">
                <Card className="flex h-[70vh] min-h-[22rem] flex-col overflow-hidden rounded-2xl border-border/70 shadow-[0_1px_2px_rgba(16,24,40,0.05),0_12px_28px_-12px_rgba(16,24,40,0.16)] lg:h-full">
                  <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border/70 bg-gradient-to-b from-muted/50 to-card px-5 py-3">
                    <h2 className="text-base font-semibold">
                      {t('individualDpr.livePreview')}{' '}
                      <span className="text-sm font-normal text-muted-foreground">({tf('Read only')})</span>
                    </h2>
                    <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTemplatePickerOpen(true)}
                      className="gap-1.5"
                      title={tf('Pick how the report looks: a ready-made template.')}
                    >
                      <LayoutTemplate className="h-4 w-4" aria-hidden="true" />
                      {tf('Template')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFinalPreviewOpen(true)}
                      className="gap-1.5"
                      title={tf('See the final document, read-only.')}
                    >
                      <Eye className="h-4 w-4" aria-hidden="true" />
                      {tf('Preview')}
                    </Button>
                    </div>
                  </div>
                  <CardContent className="flex-1 min-h-0 overflow-hidden p-0 bg-gray-100 relative flex flex-col">
                    {previewHitCount > 0 && (
                      <div className="absolute top-3 right-3 z-20 flex flex-col gap-1 no-print">
                        {previewHitIndex > 0 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 px-2 bg-white/95 shadow"
                            onClick={() => goToPreviewHit(previewHitIndex - 1)}
                            title={tf('Previous changed place')}
                          >
                            <ChevronUp className="h-4 w-4 mr-1" />
                            {tf('Up')}
                          </Button>
                        )}
                        {previewHitIndex < previewHitCount - 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 px-2 bg-white/95 shadow"
                            onClick={() => goToPreviewHit(previewHitIndex + 1)}
                            title={tf('Next changed place')}
                          >
                            <ChevronDown className="h-4 w-4 mr-1" />
                            {tf('Down')}
                          </Button>
                        )}
                        <span className="text-[10px] text-center text-gray-600 bg-white/90 rounded px-1 py-0.5 shadow">
                          {previewHitIndex + 1}/{previewHitCount}
                        </span>
                      </div>
                    )}
                    {/*
                      Use CSS zoom (affects layout) instead of transform scale.
                      Transform left layout at full size → broken vertical scroll + horizontal drift.
                    */}
                    <div
                      id="dpr-preview-scroll"
                      role="region"
                      aria-label={tf('Live DPR Preview (Read only)')}
                      tabIndex={0}
                      className="w-full flex-1 min-h-0 overflow-y-auto overflow-x-hidden focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
                    >
                      <div
                        id="dpr-preview-container"
                        className="py-4"
                        style={{ zoom: previewZoom } as React.CSSProperties}
                      >
                        {(() => {
                          const saved = data.schemeExtras?.documentStyle;
                          const look = saved ? resolveDocumentStyle(saved, schemeCode) : null;
                          const doc = (
                            <IndividualDPRDocumentView
                              trackFieldHits
                              // Every step's full set of rows is shown from the first step, so scrolling the live report
                              // always shows the whole form, not only the steps already opened.
                              showEmpty
                              onEditField={docMode ? onEditField : undefined}
                              onFieldFocus={docMode ? (path: string) => setFocusedPath(path) : undefined}
                              guideMissing={docMode ? missingRequired.map((item) => item.path) : undefined}
                              onSectionFocus={docMode ? (stepNumber: number) => {
                                // The step strip follows where you are typing in the report.
                                if (visibleSteps.includes(stepNumber) && stepNumber !== currentStep) setCurrentStep(stepNumber);
                              } : undefined}
                              onOpenInForm={docMode ? (stepNumber: number) => {
                                if (visibleSteps.includes(stepNumber)) setCurrentStep(stepNumber);
                                setEditMode('form');
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              } : undefined}
                              onEditBlock={docMode ? (sectionId, blockId, text) => {
                                const raw = docStyleRef.current || data.schemeExtras?.documentStyle;
                                if (!raw) return;
                                onStyleChange(setBlockText(resolveDocumentStyle(raw, schemeCode), sectionId, blockId, text));
                              } : undefined}
                              onImageFrame={(slot, box) => {
                                const raw = docStyleRef.current || data.schemeExtras?.documentStyle;
                                if (!raw) return;
                                const current = resolveDocumentStyle(raw, schemeCode);
                                onStyleChange(parseBlockFrameSlot(slot) ? setBlockFrame(current, slot, box) : setPictureFrame(current, slot, box));
                              }}
                              dpr={{
                                content: {
                                  english: {
                                    clusterData: dprPayload,
                                  },
                                },
                                metadata: {
                                  clusterData: dprPayload,
                                  isIndividualDPR: true,
                                  matchedSchemeCode: data.matchedSchemeCode || null,
                                },
                              }}
                              project={project || {
                                _id: data.projectId,
                                id: data.projectId,
                                projectName: getUnitName(data.step1),
                                projectType: 'individual',
                                stepData: dprPayload,
                              }}
                              viewLanguage={viewLanguage}
                              onSectionClick={(stepNumber: number) => {
                                if (visibleSteps.includes(stepNumber)) setCurrentStep(stepNumber);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                            />
                          );
                          if (!look) {
                            return (
                              <div
                                id="dpr-preview"
                                className="bg-white mx-auto shadow-lg"
                                style={{ minHeight: '100%', width: '21cm', padding: '2rem' }}
                              >
                                {doc}
                              </div>
                            );
                          }
                          return (
                            <PageSheet
                              id="dpr-preview"
                              className="bg-white mx-auto shadow-lg"
                              pageSize={look.pageSize}
                              edgeTopMm={pageEdgeMm(look.marginMm.top)}
                              edgeBottomMm={pageEdgeMm(look.marginMm.bottom)}
                            >
                              {doc}
                            </PageSheet>
                          );
                        })()}
                      </div>
                      {/* Room under the last page, so even the final sections can be brought to the top when their step is chosen. */}
                      <div aria-hidden="true" className="no-print" style={{ height: 'calc(100% - 6rem)' }} />
                    </div>
                  </CardContent>
                  <div className="relative z-10 flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-border/70 bg-card px-4 py-2.5 shadow-[0_-10px_18px_-14px_rgba(16,24,40,0.2)]">
                    <div className="flex items-center gap-1 rounded-lg border p-0.5">
                      <Button variant="ghost" size="sm" onClick={() => setPreviewZoom(Math.max(0.3, previewZoom - 0.1))} className="h-7 w-7 p-0" aria-label={tf('Zoom out')} title={tf('Zoom out')}>
                        <ZoomOut className="h-4 w-4" />
                      </Button>
                      <span className="min-w-[3rem] px-1 text-center text-xs tabular-nums">{Math.round(previewZoom * 100)}%</span>
                      <Button variant="ghost" size="sm" onClick={() => setPreviewZoom(Math.min(2, previewZoom + 0.1))} className="h-7 w-7 p-0" aria-label={tf('Zoom in')} title={tf('Zoom in')}>
                        <ZoomIn className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button variant="outline" size="sm" onClick={fitPreview} className="gap-1.5" title={tf('Fit the page to the available width.')}>
                      <Maximize2 className="h-4 w-4" aria-hidden="true" />
                      {tf('Fit page')}
                    </Button>
                  </div>
                </Card>
              </div>
          </div>
          </>
          )}
        </div>
          </>
        )}
      </div>
      {docStyle ? (
        <FinalPreviewDialog open={finalPreviewOpen} onClose={() => setFinalPreviewOpen(false)} style={docStyle}>
          <IndividualDPRDocumentView documentStyle={docStyle} dpr={liveDpr} project={liveProject} viewLanguage={viewLanguage} />
        </FinalPreviewDialog>
      ) : null}
      {docStyle ? (
        <TemplatePickerDialog
          open={templatePickerOpen}
          onClose={() => setTemplatePickerOpen(false)}
          style={docStyle}
          schemeCode={schemeCode}
          onPick={(id) => onStyleChange(applyPreset(docStyle, id))}
        />
      ) : null}
      <GenerateFormatDialog open={formatOpen} busy={exporting} ready={readyFile} onChoose={(format) => void generateInFormat(format)} onAnother={() => setReadyFile(null)} onClose={closeFormatDialog} />
      {guideLayer}
    </Layout>
  );
};
