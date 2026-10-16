// @ts-nocheck
import { ReviewDialog, StepChecks } from '@/components/individual-dpr/DataChecks';
import { dismissalKey, openFindings, runDataChecks, KIND_ORDER, type Finding } from '@/lib/individualDpr/dataChecks';
import { auditSubmission, financeWarnings } from '@/lib/individualDpr/submissionAudit';
import { StepIntro } from '@/components/ui/FieldPrompt';
import { ResumeDrafts } from '@/components/individual-dpr/ResumeDrafts';
import { draftSignature, hasDraftContent } from '@/lib/individualDpr/draftState';
import { registerDraftFlusher } from '@/lib/draftFlush';
import { useDraftAutosave } from '@/lib/useDraftAutosave';
import { AuthoringStepper } from '@/components/individual-dpr/AuthoringStepper';
import { computeSections, overallProgress, sectionsUnsaved } from '@/lib/individualDpr/authoringProgress';
import { useBackTarget } from '@/lib/navHistory';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { ClipboardCheck, ArrowLeft, Save, ChevronRight, ChevronLeft, ZoomIn, ZoomOut, Maximize2, RotateCcw, Loader2, ChevronUp, ChevronDown } from 'lucide-react';
import { useIndividualDPRStore } from '@/store/individualDPRStore';
import { IndividualDPRForm } from '@/components/individual-dpr/IndividualDPRForm';
import { IndividualDPRDocumentView } from '@/components/individual-dpr/IndividualDPRDocumentView';
import { StyleEditor } from '@/components/individual-dpr/StyleEditor';
import { getSchemeDocSteps, sectionTitleFromStep } from '@/lib/individualDpr/individualDocModel';
import { defaultStyleForScheme, pageEdgeMm, parseBlockFrameSlot, resolveDocumentStyle, selectionStepOrder, setBlockFrame, setBlockText, setPictureFrame } from '@/lib/individualDpr/documentStyle';
import { styleFromGuide } from '@/lib/individualDpr/reportGuide';
import { useReportGuideStore } from '@/store/reportGuideStore';
import { PageSheet } from '@/components/individual-dpr/PageSheet';
import { toast } from 'react-hot-toast';
import { api } from '@/lib/api';
import { useTranslation } from 'react-i18next';
import { useDevModeStore } from '@/store/devModeStore';
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
  const [reviewOpen, setReviewOpen] = useState(false);
  const dismissFinding = (finding: Finding) =>
    setSchemeExtras({ ...(data.schemeExtras || {}), dismissedChecks: [...dismissedChecks, dismissalKey(finding)] });
  const goToFinding = (finding: Finding) => {
    const local = selectionSteps.find((step) => contentOf(step) === finding.step);
    setReviewOpen(false);
    if (!local) return;
    setInvalidFields(finding.field ? [finding.field] : []);
    setCurrentStep(local);
    setEditStepN(local);
    setEditNonce((n) => n + 1);
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
            if (scrollParent) {
              scrollHitIntoPreview(scrollParent, hits[0], previewZoom);
              highlightHit(hits[0]);
            }
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
  useDraftAutosave({
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

  const guardForward = (targetStep: number) => {
    if (isAdmin && devMode) return true;
    const from = selectionSteps.indexOf(currentStep);
    const to = selectionSteps.indexOf(targetStep);
    if (to <= from) return true;
    for (let i = from; i < to; i += 1) {
      const step = selectionSteps[i];
      const content = getContentStep(step, schemeCode);
      const missing = missingIndividualRequired(content, data[`step${content}`], schemeCode);
      if (missing.length) {
        if (step !== currentStep) setCurrentStep(step);
        warnRequired(missing);
        return false;
      }
      const badFormats = invalidFormats(data[`step${content}`]);
      if (badFormats.length) {
        if (step !== currentStep) setCurrentStep(step);
        window.setTimeout(() => warnFormats(badFormats), step !== currentStep ? 120 : 0);
        return false;
      }
    }
    return true;
  };

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
          window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const handleSaveDraft = async () => {
    const success = await saveToDatabase();
    if (success) toast.success(t('individualDpr.toasts.saveSuccess'));
    else if (!getUnitName(data.step1)) toast.error(t('individualDpr.toasts.needUnitName'));
    else toast.error(t('individualDpr.toasts.saveFailed'));
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

  const saveReportStyle = async () => {
    const latest = useIndividualDPRStore.getState().data;
    const extras = { ...(latest.schemeExtras || {}), documentStyle: docStyle };
    setSchemeExtras(extras);
    try {
      setStyleSaving(true);
      const response = await individualDprApi.saveDraft(toIndividualPayload({ ...latest, schemeExtras: extras }));
      if (response?.success && response.data?.dprId && response.data?.projectId) {
        setDprIds(response.data.dprId, response.data.projectId);
      }
      toast.success('Style saved on this DPR');
    } catch {
      toast.error('Could not save the style. Save the draft after the unit name is filled.');
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
    setIsGenerating(true);
    try {
      if (!data.step1 || !getUnitName(data.step1)) {
        toast.error(t('individualDpr.toasts.needUnitNameGenerate'));
        setIsGenerating(false);
        return;
      }
      const badFormats = invalidFormats(data.step11);
      if (badFormats.length) {
        setCurrentStep(11);
        window.setTimeout(() => warnFormats(badFormats), 120);
        setIsGenerating(false);
        return;
      }
      const saveSuccess = await saveToDatabase();
      if (!saveSuccess) {
        toast.error(t('individualDpr.toasts.saveBeforeGenerateFailed'));
        setIsGenerating(false);
        return;
      }

      toast.loading(t('individualDpr.toasts.generating'), { id: 'generating-dpr' });
      const response = await individualDprApi.generate(
        {
          ...dprPayload,
          currentStep: undefined,
          isDraft: undefined,
          lastSaved: undefined,
          generatedDPR: undefined,
        },
        'bilingual'
      );

      if (response.success && response.data) {
        setGeneratedDPR(response.data.content);
        resetData();
        toast.success(t('individualDpr.toasts.generateSuccess'), { id: 'generating-dpr' });
        navigate(`/dpr/view/${response.data.dprId}`);
      } else {
        throw new Error(response.message || 'Failed to generate DPR');
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || error.message || t('individualDpr.toasts.generateFailed'),
        { id: 'generating-dpr' }
      );
    } finally {
      setIsGenerating(false);
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
    <Layout fullBleed={Boolean(styling && docStyle)}>
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
      <div className={styling && docStyle ? 'flex min-h-0 flex-1 flex-col overflow-hidden bg-background' : 'min-h-screen bg-background'}>
        <div className={styling && docStyle
          ? 'shrink-0 border-b border-border bg-background px-4 pb-4 pt-2'
          : 'sm:sticky top-16 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'}>
          <div className={styling && docStyle ? '' : 'max-w-[1920px] mx-auto px-4 py-4 sm:px-6 lg:px-8'}>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
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
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  {setupPhase === 'pick'
                    ? back.label
                    : setupPhase === 'brief'
                      ? enteredAtBrief.current && back.fromHistory
                        ? back.label
                        : t('individualDpr.picker.backToSchemes', { defaultValue: 'All Schemes' })
                      : enteredAtForm.current
                        ? back.label
                        : t('common.previous')}
                </Button>
                <div>
                  <h1 className="text-2xl font-bold">
                    {isEditing
                      ? t('individualDpr.editTitle', { defaultValue: 'Edit DPR' })
                      : t('individualDpr.title')}
                  </h1>
                  {setupPhase === 'form' ? (
                    <p className="text-sm font-semibold text-foreground mt-0.5">
                      {t('individualDpr.schemeSelected', {
                        defaultValue: 'Scheme: {{name}}',
                        name: selectedSchemeLabel,
                      })}
                    </p>
                  ) : null}
                  <p className="text-sm text-muted-foreground">{headerSubtitle}</p>
                </div>
              </div>

              <div className="ml-auto flex items-center justify-end gap-2 flex-wrap">
                {setupPhase === 'brief' && (
                  <Button variant="primary" onClick={handleBriefNext} className="gap-2">
                    {t('individualDpr.picker.continueToForm', { defaultValue: 'Start DPR steps' })}
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                )}
                {setupPhase === 'form' && (
                  <>
                    <label className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground whitespace-nowrap">
                        {t('individualDpr.schemeLabel', { defaultValue: 'Scheme' })}
                      </span>
                      <select
                        className="max-w-[min(100vw-8rem,22rem)] rounded-md border border-input bg-background px-2 py-1.5 text-sm"
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
                    <Button variant="outline" size="sm" onClick={handleSaveDraft} className="gap-2" title={tf('Saves your answers and current step so you can resume later. Also runs every 30 seconds.')}>
                      <Save className="h-4 w-4" />
                      {t('individualDpr.saveDraft')}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setReviewOpen(true)} className="gap-2" title={tf('Looks for missing, unclear or unusual answers across the whole form.')}>
                      <ClipboardCheck className="h-4 w-4" />
                      {tf('Check my answers')}
                      {allFindings.length ? <span className="rounded-full bg-amber-500 px-1.5 text-xs font-semibold text-white">{allFindings.length}</span> : null}
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => void handleGenerateDPR()}
                      isLoading={isGenerating}
                      className="gap-2"
                      title={tf('Creates the final DPR from your answers. Available on the last step.')}
                      disabled={currentStep !== lastVisible}
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
        {!styling && (
        <div className="sm:sticky top-[8.75rem] z-20 bg-background/95 backdrop-blur border-b border-border">
          <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-3">
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
                if (step === currentStep) return;
                if (!guardForward(step)) return;
                setInvalidFields([]);
                setRequiredNotice('');
                setCurrentStep(step);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              activeClass={schemeUi?.stepActiveClass}
              idleClass={schemeUi?.stepIdleClass}
              stepLabel={(step) => t('individualDpr.stepShort', { n: step })}
              lang={viewLanguage === 'telugu' ? 'te' : 'en'}
            />
          </div>
        </div>
        )}

        {!styling && (
        <div className={schemeUi?.bannerClass || 'bg-amber-50 border-b border-amber-200'}>
            <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
              {schemeUi ? (
                <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-8 lg:justify-between">
                  <div className="min-w-0 text-center lg:text-left">
                    <p
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-[0.08em] uppercase border ${
                        schemeUi.id === 'PMEGP'
                          ? 'bg-teal-100/90 text-teal-900 border-teal-300'
                          : 'bg-indigo-100/90 text-indigo-950 border-indigo-300 rounded-md'
                      }`}
                    >
                      {tf(schemeUi.badge)}
                    </p>
                    <p className="text-base font-semibold text-foreground mt-2 tracking-tight">
                      {selectedSchemeLabel}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-xl mx-auto lg:mx-0">
                      {tf(schemeUi.tagline)}
                    </p>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1 max-w-xl text-left">
                    {schemeImpact.bullets.slice(0, 3).map((b) => (
                      <li key={b} className="flex gap-2">
                        <span
                          className={`mt-1.5 h-1.5 w-1.5 rounded-full flex-shrink-0 ${
                            schemeUi.id === 'PMEGP' ? 'bg-teal-600' : 'bg-indigo-600'
                          }`}
                          aria-hidden
                        />
                        <span>{tf(b)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <>
                  <p className="text-sm font-semibold text-foreground">
                    {t('individualDpr.scheme', {
                      title: selectedSchemeLabel,
                      defaultValue: 'Scheme: {{title}}',
                    })}
                  </p>
                  <ul className="mt-1 text-sm text-muted-foreground list-disc pl-5 space-y-0.5">
                    {schemeImpact.bullets.map((b) => (
                      <li key={b}>{tf(b)}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>
        )}

        <div className={styling && docStyle ? 'min-h-0 flex-1' : 'max-w-[1920px] mx-auto px-4 py-6 sm:px-6 lg:px-8'}>
          {styling && docStyle ? (
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
              onEditSection={(step) => {
                if (step?.n && visibleSteps.includes(step.n)) setCurrentStep(step.n);
              }}
              renderEditor={() => (
                <div className="space-y-6">
                  <Card className={schemeUi?.formShellClass || undefined}>
                    <CardHeader>
                      <CardTitle>
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
                      <IndividualDPRForm
                        key={`step-${currentStep}-${data.projectId || 'new'}-${data.matchedSchemeCode || 'vanilla'}`}
                        currentStep={currentStep}
                        invalidFields={invalidFields}
                        onNext={() => goAdjacent(1)}
                        onPrevious={() => goAdjacent(-1)}
                      />
                    </CardContent>
                  </Card>
                  <div className="flex items-center justify-between">
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
              onTab={setStyleTab}
              onChange={onStyleChange}
              onSave={saveReportStyle}
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
                onEditField={onEditField}
                documentStyle={docStyle}
                activeSectionId={hotSectionId}
                dpr={liveDpr}
                project={liveProject}
                viewLanguage={viewLanguage}
                onEditBlock={(sectionId, blockId, text) => {
                  const raw = docStyleRef.current;
                  if (!raw) return;
                  onStyleChange(setBlockText(raw, sectionId, blockId, text));
                }}
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
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
              <div id="individual-dpr-form" className="space-y-6">
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
                  <Card className={schemeUi?.formShellClass || undefined}>
                    <CardHeader>
                      <CardTitle>
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
                      <IndividualDPRForm
                        key={`step-${currentStep}-${data.projectId || 'new'}-${data.matchedSchemeCode || 'vanilla'}`}
                        currentStep={currentStep}
                        invalidFields={invalidFields}
                        onNext={() => goAdjacent(1)}
                        onPrevious={() => goAdjacent(-1)}
                      />
                    </CardContent>
                  </Card>
                )}

                <div className="flex items-center justify-between">
                  <Button variant="outline" onClick={() => goAdjacent(-1)} disabled={currentStep === selectionSteps[0] || isStepping} className="gap-2">
                    <ChevronLeft className="h-4 w-4" />
                    {t('common.previous')}
                  </Button>
                  {currentStep === lastVisible ? (
                    <Button
                      variant="primary"
                      onClick={() => void handleGenerateDPR()}
                      isLoading={isGenerating}
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
              </div>

              <div className="space-y-6">
                <Card className="sticky top-[13.25rem] max-h-[calc(100vh-14rem)] overflow-hidden flex flex-col">
                  <CardHeader className="flex-shrink-0 space-y-3 border-b border-border">
                    <CardTitle>{t('individualDpr.livePreview')}</CardTitle>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex shrink-0 items-center gap-1 rounded-lg border p-1">
                        <Button variant="ghost" size="sm" onClick={() => setPreviewZoom(Math.max(0.5, previewZoom - 0.1))} className="h-7 w-7 p-0">
                          <ZoomOut className="h-4 w-4" />
                        </Button>
                        <span className="min-w-[3rem] px-2 text-center text-xs">{Math.round(previewZoom * 100)}%</span>
                        <Button variant="ghost" size="sm" onClick={() => setPreviewZoom(Math.min(2, previewZoom + 0.1))} className="h-7 w-7 p-0">
                          <ZoomIn className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setPreviewZoom(1)} className="h-7 w-7 p-0">
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => document.getElementById('dpr-preview-scroll')?.requestFullscreen?.()}
                          className="h-7 shrink-0 gap-1 whitespace-nowrap px-2"
                        >
                          <Maximize2 className="h-4 w-4" />
                          {t('individualDpr.preview')}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
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
                      className="w-full flex-1 min-h-0 overflow-y-auto overflow-x-hidden"
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
                              onEditField={onEditField}
                              onEditBlock={(sectionId, blockId, text) => {
                                const raw = docStyleRef.current || data.schemeExtras?.documentStyle;
                                if (!raw) return;
                                onStyleChange(setBlockText(resolveDocumentStyle(raw, schemeCode), sectionId, blockId, text));
                              }}
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
                    </div>
                  </CardContent>
                </Card>
              </div>
          </div>
          )}
        </div>
          </>
        )}
      </div>
    </Layout>
  );
};
