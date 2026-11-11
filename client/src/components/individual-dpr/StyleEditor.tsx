// @ts-nocheck
import { checkUploadFile } from '@/lib/security/fileGuard';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ChevronDown, ClipboardList, Eye, EyeOff, FileText, GripVertical, ImagePlus, ListOrdered, Maximize2, Palette, Plus, Redo2, RotateCcw, Type, Undo2, X, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PageSheet } from '@/components/individual-dpr/PageSheet';
import { IndividualDPRDocumentView } from '@/components/individual-dpr/IndividualDPRDocumentView';
import { templateSpecimenDpr, templateSpecimenStyle } from '@/lib/individualDpr/templateSpecimen';
import { TemplateThumb } from '@/components/individual-dpr/TemplateThumb';
import { useDialogFocus, useDialogPresence } from '@/lib/useDialog';
import { useClusterFormText } from '@/lib/clusterDprFormText';
import {
  FONT_CHOICES,
  MARGIN_MAX,
  MARGIN_MIN,
  COLOR_PALETTES,
  MARGIN_CHOICES,
  PRESET_IDS,
  PRESET_LABELS,
  PRESET_NOTES,
  SPACING_CHOICES,
  presetStyle,
  scaleTypeSizes,
  applyPreset,
  contrastOk,
  defaultStyleForScheme,
  addCustomSection,
  addSectionBlock,
  insertPicture,
  layoutOrder,
  moveSection,
  newContentId,
  removeCustomSection,
  removeSectionBlock,
  renameCustomSection,
  pageEdgeMm,
  pageWidthMm,
  pictureToken,
  styleProblems,
  type DocumentStyle,
  type DocPresetId,
  type PageSize,
  type TypeRole,
} from '@/lib/individualDpr/documentStyle';

const PT = '\u00a0pt';
const PAGE_SIZES: PageSize[] = ['A4', 'A3', 'Letter', 'Legal'];
const ROLE_KEYS = ['cover', 'sectionTitle', 'body', 'table', 'caption'] as const;

const ROLE_LABELS: Record<(typeof ROLE_KEYS)[number], string> = {
  cover: 'Cover',
  sectionTitle: 'Section title',
  body: 'Body',
  table: 'Table',
  caption: 'Caption',
};

async function readImageFile(file: File): Promise<string> {
  // Only real PNG, JPEG or WebP pictures: the file's bytes are checked, not its name or declared type.
  const verdict = await checkUploadFile(file, ['image']);
  if (!verdict.ok) throw new Error('Choose a JPG, PNG or WebP picture.');
  return new Promise((resolve, reject) => {
    if (file.size > 350_000) {
      reject(new Error('Use an image under 350 KB.'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Could not read that image.'));
    reader.readAsDataURL(file);
  });
}

function StyleGroup({ title, open, onToggle, children }) {
  // The content is built the first time the group opens and then kept, so reopening is instant and nothing re-renders.
  const [seen, setSeen] = useState(!!open);
  const box = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!open) return undefined;
    setSeen(true);
    // The group above may be closing, which moves this one: keep it in view once things have settled.
    const timer = window.setTimeout(() => box.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 230);
    return () => window.clearTimeout(timer);
  }, [open]);
  return (
    <section ref={box} className="rounded-md border border-slate-200 bg-white">
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-700 transition-colors hover:bg-slate-50"
      >
        <span>{title}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-500 transition-transform duration-200 ${open ? '' : '-rotate-90'}`} />
      </button>
      <div className="motion-collapse" data-open={open ? 'true' : 'false'} aria-hidden={!open} {...(open ? {} : { inert: '' })}>
        <div>
          {seen ? <div className="space-y-2 border-t border-slate-200 px-3 py-3">{children}</div> : null}
        </div>
      </div>
    </section>
  );
}

function Segmented({ value, options, onChange, label }) {
  return (
    <div role="group" aria-label={label} className="inline-flex w-full overflow-hidden rounded-md border border-slate-300 text-xs">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          aria-pressed={value === option.id}
          onClick={() => onChange(option.id)}
          className={`flex-1 px-2 py-1.5 font-medium transition-colors ${value === option.id ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function StyleEditor({
  style,
  schemeCode,
  steps,
  activeSectionId,
  onActiveSection,
  editMode = 'form',
  onEditMode,
  onChange,
  onSave,
  saveButton,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onClose,
  saving,
  canSaveSchemeDefault,
  onSaveSchemeDefault,
  language,
  renderEditor,
  editNonce,
  editStepN,
  onEditSection,
  tab = 'form',
  onTab,
  finalPreview,
  stepsBar,
  children,
}) {
  const tf = useClusterFormText();
  // Document mode: the report is edited in place and the form pane is folded away (Sections and Style open as slide-overs).
  const docMode = editMode === 'document';
  const past = useRef<DocumentStyle[]>([]);
  const future = useRef<DocumentStyle[]>([]);
  const [historyTick, setHistoryTick] = useState(0);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropHint, setDropHint] = useState(null);
  const [panel, setPanel] = useState(null);
  // The Sections / Style slide-over: slides in and out, and closes on a click outside it or Esc.
  const panelOpen = panel === 'sections' || panel === 'style';
  const panelPresence = useDialogPresence(panelOpen, 200);
  const lastPanel = useRef('sections');
  if (panelOpen) lastPanel.current = panel;
  const shownPanel = panelOpen ? panel : lastPanel.current;
  const panelRef = useRef<HTMLDivElement>(null);
  // Document mode: the side pane is closed until Sections or Style is chosen, then it opens next to the report (pushing it right) with only those two tabs.
  // One set of buttons in the same place in both modes: [Form | Document] [Sections] [Style].
  //  - The first button is the "home" view: the form in Form mode, the report alone in Document mode.
  //  - Sections and Style open the side pane beside the report; pressing the open one again goes back to the home view.
  //  - There is no separate Minimise button: pressing the open button again goes back to the home view. Below 1024 px there is no room for a pane, so they open as a slide-over (outside click or Esc closes it).
  const [wide, setWide] = useState(() => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches);
  useEffect(() => {
    const query = window.matchMedia('(min-width: 1024px)');
    const update = () => setWide(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  const [formPaneOpen, setFormPaneOpen] = useState(true);
  useEffect(() => {
    if (!docMode) setFormPaneOpen(true);
  }, [docMode]);
  const paneOpen = docMode ? panelOpen : formPaneOpen;
  const paneTab = docMode ? (panel === 'style' ? 'style' : 'sections') : tab;
  const homeActive = wide ? (docMode ? !panelOpen : formPaneOpen && tab === 'form') : docMode ? !panelOpen : panel === 'edit';
  const goHome = () => {
    if (docMode) setPanel(null);
    else if (wide) {
      onTab?.('form');
      setFormPaneOpen(true);
    } else openEdit(editStep || steps[0]);
  };
  const tabActive = (id: string) => (wide ? (docMode ? panel === id : formPaneOpen && tab === id) : panel === id);
  const chooseTab = (id: string) => {
    if (!wide || docMode) setPanel(panel === id ? null : id);
    else if (formPaneOpen && tab === id) onTab?.('form');
    else {
      onTab?.(id);
      setFormPaneOpen(true);
    }
  };
  useEffect(() => {
    if (!panelOpen) return undefined;
    const onDown = (event: PointerEvent) => {
      // On a wide screen the panel is a side pane next to the report (so changes show while you work); only the narrow-screen overlay minimises on an outside click.
      if (window.matchMedia('(min-width: 1024px)').matches) return;
      const target = event.target as Element | null;
      if (!target || panelRef.current?.contains(target)) return;
      // The buttons that open and close the panel, and any pop-up opened from inside it, handle themselves.
      if (target.closest?.('[data-panel-toggle], [role="dialog"], [role="alertdialog"], .motion-overlay')) return;
      setPanel(null);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPanel(null);
    };
    document.addEventListener('pointerdown', onDown, true);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown, true);
      window.removeEventListener('keydown', onKey);
    };
  }, [panelOpen]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewZoom, setPreviewZoom] = useState(0.8);
  const [templatePreview, setTemplatePreview] = useState(null);
  const previewBoxRef = useRef<HTMLDivElement>(null);
  const previewDialogRef = useRef<HTMLDivElement>(null);
  const templateDialogRef = useRef<HTMLDivElement>(null);
  const previewPresence = useDialogPresence(previewOpen);
  const templatePresence = useDialogPresence(!!templatePreview);
  // The template pop-up keeps showing the last template while it fades out.
  const lastTemplate = useRef(null);
  if (templatePreview) lastTemplate.current = templatePreview;
  const shownTemplate = templatePreview || lastTemplate.current;
  useDialogFocus(previewOpen, previewDialogRef);
  useDialogFocus(!!templatePreview, templateDialogRef);
  const [openGroups, setOpenGroups] = useState({});
  // One group open at a time: opening one closes the rest.
  const toggleGroup = (id) => setOpenGroups((current) => (current[id] ? {} : { [id]: true }));
  const [editStep, setEditStep] = useState(null);
  const [zoom, setZoom] = useState(0.55);
  const [fitWidth, setFitWidth] = useState(true);
  const fitWidthRef = useRef(true);
  const [slot, setSlot] = useState('cover');
  const [imageError, setImageError] = useState('');
  const [pendingPictures, setPendingPictures] = useState([]);
  const [addingSection, setAddingSection] = useState(false);
  const [sectionTitle, setSectionTitle] = useState('');
  const blockFileRef = useRef(null);
  const blockSectionRef = useRef('');
  const [pictureName, setPictureName] = useState('');
  const [deletePictureId, setDeletePictureId] = useState('');
  const [wideTable, setWideTable] = useState(false);
  const [blockedColor, setBlockedColor] = useState('');
  const EDIT_MIN = 480;
  const editFloor = useRef(EDIT_MIN);
  const editPaneRef = useRef(null);
  const [paneWidths, setPaneWidths] = useState({ edit: EDIT_MIN });
  const centerRef = useRef<HTMLDivElement>(null);
  const clampPane = (value, min, max) => Math.min(max, Math.max(min, value));

  const startPaneResize = (key) => (event) => {
    event.preventDefault();
    const startX = event.clientX;
    const startEdit = Math.max(paneWidths.edit, editFloor.current);
    const move = (moveEvent) => {
      const dx = moveEvent.clientX - startX;
      if (key === 'edit') setPaneWidths({ edit: clampPane(startEdit + dx, editFloor.current, 720) });
    };
    const stop = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', stop);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', stop);
  };

  const paneHandle = (key) => (
    <div
      role="separator"
      aria-orientation="vertical"
      title={tf('Drag to resize')}
      onPointerDown={startPaneResize(key)}
      className="group relative hidden w-2 shrink-0 cursor-col-resize bg-slate-200 hover:bg-teal-600 lg:block"
    />
  );

  const applyFit = () => {
    const box = centerRef.current;
    if (!box || !fitWidthRef.current) return;
    const probe = document.createElement('div');
    probe.style.cssText = `width:${pageWidthMm(style.pageSize)}mm;height:0;position:absolute;visibility:hidden;pointer-events:none`;
    box.appendChild(probe);
    const pagePx = probe.offsetWidth;
    box.removeChild(probe);
    if (!pagePx) return;
    const available = Math.max(120, box.clientWidth - 24);
    const next = Math.min(1.35, Math.max(0.22, available / pagePx));
    setZoom(Math.round(next * 100) / 100);
  };

  useLayoutEffect(() => {
    const width = editPaneRef.current?.getBoundingClientRect().width;
    if (width && width > editFloor.current) editFloor.current = Math.round(width);
  }, []);

  useLayoutEffect(() => {
    fitWidthRef.current = fitWidth;
    const box = centerRef.current;
    if (!box) return;
    applyFit();
    const observer = new ResizeObserver(() => applyFit());
    observer.observe(box);
    return () => observer.disconnect();
  }, [style.pageSize, fitWidth, panel, tab]);

  const fitPreview = () => {
    const box = previewBoxRef.current;
    if (!box) return;
    const probe = document.createElement('div');
    probe.style.cssText = `width:${pageWidthMm(style.pageSize)}mm;height:0;position:absolute;visibility:hidden;pointer-events:none`;
    box.appendChild(probe);
    const pagePx = probe.offsetWidth;
    box.removeChild(probe);
    if (!pagePx) return;
    const next = Math.min(1.35, Math.max(0.3, (box.clientWidth - 48) / pagePx));
    setPreviewZoom(Math.round(next * 100) / 100);
  };

  useLayoutEffect(() => {
    if (previewOpen) fitPreview();
  }, [previewOpen, style.pageSize]);

  useEffect(() => {
    if (!previewOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPreviewOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [previewOpen]);

  useEffect(() => {
    if (!templatePreview) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setTemplatePreview(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [templatePreview]);

  const scrollLiveToSection = (step) => {
    const id = step?.id;
    if (!id) return;
    requestAnimationFrame(() => {
      const root = centerRef.current;
      if (!root) return;
      const target = root.querySelector(`[data-dpr-section="${CSS.escape(id)}"]`);
      if (!(target instanceof HTMLElement)) return;
      const parentRect = root.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      root.scrollTo({
        top: Math.max(0, root.scrollTop + (targetRect.top - parentRect.top) - 8),
        behavior: 'smooth',
      });
    });
  };

  const openEdit = (step) => {
    if (!renderEditor || !step) return;
    setEditStep(step);
    setPanel('edit');
    onActiveSection?.(step.id);
    onEditSection?.(step);
    scrollLiveToSection(step);
  };

  // Only a request made while this editor is on screen counts (it is mounted again when the page switches back from the form layout).
  const seenNonce = useRef(editNonce);
  useEffect(() => {
    if (seenNonce.current === editNonce) return;
    seenNonce.current = editNonce;
    if (!editNonce || editStepN == null) return;
    const step = steps.find((item) => item.n === editStepN);
    if (step) {
      openEdit(step);
      onTab?.('form');
    }
  }, [editNonce]);

  const commit = (next: DocumentStyle) => {
    past.current.push(style);
    if (past.current.length > 30) past.current.shift();
    future.current = [];
    setHistoryTick((n) => n + 1);
    onChange(next);
  };

  const undo = () => {
    const prev = past.current.pop();
    if (!prev) return;
    future.current.push(style);
    setHistoryTick((n) => n + 1);
    onChange(prev);
  };

  const redo = () => {
    const next = future.current.pop();
    if (!next) return;
    past.current.push(style);
    setHistoryTick((n) => n + 1);
    onChange(next);
  };

  useEffect(() => {
    const root = centerRef.current;
    if (!root) return;
    const tables = root.querySelectorAll('.cmep-fin-table');
    let tight = false;
    tables.forEach((table) => {
      const wrap = table.parentElement;
      if (wrap && table.scrollWidth > wrap.clientWidth + 8) tight = true;
    });
    setWideTable(tight);
  }, [style, zoom, children]);

  const problems = styleProblems(style, { telugu: language === 'telugu', wideTable });
  const problemFor = (key: string) => problems.find((item) => item.key === key)?.message;
  const blocking = problems.some((item) => item.key.startsWith('margin') || ['primary', 'header', 'table', 'border'].includes(item.key));

  const setColor = (key: 'primary' | 'header' | 'table' | 'border', value: string) => {
    const ok = key === 'table' ? contrastOk('#ffffff', value) : contrastOk(value, '#ffffff');
    if (!ok) {
      setBlockedColor(key);
      return;
    }
    setBlockedColor('');
    commit({ ...style, colors: { ...style.colors, [key]: value } });
  };

  const setRole = (key: (typeof ROLE_KEYS)[number], patch: Partial<TypeRole>) => {
    commit({ ...style, [key]: { ...style[key], ...patch } });
  };

  /** Put one group of settings back to what the chosen template ships with. Content (logo, agency name, pictures) is kept. */
  const groupKeys = {
    page: ['pageSize', 'wideTablesLandscape', 'marginMm'],
    type: ['cover', 'sectionTitle', 'body', 'table', 'caption', 'align', 'lineHeight', 'paragraphGap'],
    colors: ['colors'],
    header: ['logoAlign', 'headerLine', 'pageNumberStyle', 'footerText'],
    watermark: ['watermark', 'watermarkOpacity', 'watermarkAngle'],
    tables: ['tableStriped', 'tableDensity', 'tableBorders'],
    layout: ['showToc', 'headingNumbers', 'sectionBreak'],
  };
  const groupIsDefault = (group) => {
    const base = presetStyle(style.preset);
    return groupKeys[group].every((key) => JSON.stringify(style[key]) === JSON.stringify(base[key]));
  };
  const resetGroup = (group) => {
    const base = presetStyle(style.preset);
    const next = { ...style };
    groupKeys[group].forEach((key) => { next[key] = base[key]; });
    setBlockedColor('');
    commit(next);
  };
  const resetLink = (group) => (
    <button
      type="button"
      disabled={groupIsDefault(group)}
      onClick={() => resetGroup(group)}
      className="text-xs font-medium text-teal-700 underline-offset-2 hover:underline disabled:cursor-default disabled:text-slate-400 disabled:no-underline"
    >
      {tf('Reset to template')}
    </button>
  );
  const allGroups = ['presets', 'page', 'type', 'colors', 'header', 'watermark', 'tables', 'layout', 'pictures'];
  const anyGroupOpen = allGroups.some((id) => openGroups[id]);
  const setAllGroups = (open) => setOpenGroups(Object.fromEntries(allGroups.map((id) => [id, open])));
  const marginChoice = MARGIN_CHOICES.find((c) => ['top', 'right', 'bottom', 'left'].every((s) => style.marginMm[s] === c.mm))?.id || '';
  const spacingChoice = SPACING_CHOICES.find((c) => c.lineHeight === style.lineHeight && c.paragraphGap === style.paragraphGap)?.id || '';
  const paletteChoice = COLOR_PALETTES.find((c) => ['primary', 'header', 'table', 'border'].every((k) => c.colors[k] === style.colors[k]))?.id || '';

  const setMargin = (side: keyof DocumentStyle['marginMm'], raw: string) => {
    const n = Number(raw);
    if (!Number.isFinite(n)) return;
    const value = Math.min(MARGIN_MAX, Math.max(MARGIN_MIN, n));
    commit({ ...style, marginMm: { ...style.marginMm, [side]: value } });
  };

  const placeFromEvent = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return event.clientY < rect.top + rect.height / 2 ? 'before' : 'after';
  };

  const onRowDragOver = (id) => (event) => {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
    if (!dragId || dragId === id) {
      if (dropHint) setDropHint(null);
      return;
    }
    const place = placeFromEvent(event);
    setDropHint((current) => (current?.id === id && current.place === place ? current : { id, place }));
  };

  const clearDrag = () => {
    setDragId(null);
    setDropHint(null);
    onActiveSection?.(null);
  };

  // Moving a section without dragging: focus the handle and press the Up or Down arrow (the same move the drag makes).
  const moveBy = (id: string, delta: number) => {
    const order = layoutOrder(steps, style);
    const at = order.indexOf(id);
    const target = order[at + delta];
    if (at < 0 || !target) return;
    commit({ ...style, sectionOrder: moveSection(order, steps, id, target, delta < 0 ? 'before' : 'after') });
  };
  const grip = (id: string, name: string) => (
    <span className="inline-flex shrink-0 items-center gap-0.5">
      <span
        role="button"
        tabIndex={0}
        aria-label={`${tf('Move')}: ${name}. ${tf('Use the Up and Down arrow keys')}`}
        title={tf('Drag, or press the Up and Down arrow keys to move')}
        onMouseDown={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
            event.preventDefault();
            moveBy(id, event.key === 'ArrowUp' ? -1 : 1);
          }
        }}
        className="inline-flex shrink-0 cursor-grab rounded text-slate-400 outline-none hover:text-slate-600 focus-visible:ring-2 focus-visible:ring-ring"
      >
        <GripVertical className="h-4 w-4" aria-hidden />
      </span>
      {/* A click alternative to dragging (shown when the row is pointed at, focused, or on a touch screen). */}
      <span className="a11y-move inline-flex items-center">
        <button
          type="button"
          className="inline-flex h-6 w-6 items-center justify-center rounded text-slate-500 hover:bg-white focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`${tf('Move up')}: ${name}`}
          title={tf('Move up')}
          onMouseDown={(event) => event.stopPropagation()}
          onClick={() => moveBy(id, -1)}
        >
          <ChevronDown className="h-4 w-4 rotate-180" aria-hidden />
        </button>
        <button
          type="button"
          className="inline-flex h-6 w-6 items-center justify-center rounded text-slate-500 hover:bg-white focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`${tf('Move down')}: ${name}`}
          title={tf('Move down')}
          onMouseDown={(event) => event.stopPropagation()}
          onClick={() => moveBy(id, 1)}
        >
          <ChevronDown className="h-4 w-4" aria-hidden />
        </button>
      </span>
    </span>
  );

  const onDrop = (targetId, event) => {
    event.preventDefault();
    if (!dragId || dragId === targetId) {
      clearDrag();
      return;
    }
    const place = placeFromEvent(event);
    const order = layoutOrder(steps, style);
    commit({ ...style, sectionOrder: moveSection(order, steps, dragId, targetId, place) });
    clearDrag();
  };

  const dropLine = (id, place) => (
    dropHint?.id === id && dropHint.place === place ? (
      <div
        data-drop-line={place}
        className={`pointer-events-none absolute left-1 right-1 z-10 h-1 rounded-full bg-teal-600 ${
          place === 'before' ? '-top-1' : '-bottom-1'
        }`}
      />
    ) : null
  );

  const toggleHidden = (id: string) => {
    const hidden = new Set(style.hiddenSectionIds);
    if (hidden.has(id)) hidden.delete(id);
    else hidden.add(id);
    commit({ ...style, hiddenSectionIds: [...hidden] });
  };

  const orderedIds = layoutOrder(steps, style);
  const pictureById = new Map((style.pictures || []).map((picture) => [picture.id, picture]));
  const customById = new Map((style.customSections || []).map((section) => [section.id, section]));
  const addTextBlock = (sectionId) => {
    commit(addSectionBlock(style, sectionId, { id: newContentId('blk'), kind: 'text', text: '' }));
  };
  const pickSectionImage = (sectionId) => {
    blockSectionRef.current = sectionId;
    blockFileRef.current?.click();
  };
  const sidebarRows = orderedIds.reduce((acc, token) => {
    if (token.startsWith('pic:')) {
      const picture = pictureById.get(token.slice(4));
      if (picture) acc.rows.push({ kind: 'picture', picture });
      return acc;
    }
    const custom = customById.get(token);
    if (custom) {
      const hidden = style.hiddenSectionIds.includes(custom.id);
      const num = hidden ? '–' : acc.next;
      acc.rows.push({ kind: 'custom', section: custom, hidden, num });
      if (!hidden) acc.next += 1;
      return acc;
    }
    const step = steps.find((item) => item.id === token);
    if (!step) return acc;
    const hidden = style.hiddenSectionIds.includes(step.id);
    const num = hidden ? '–' : acc.next;
    acc.rows.push({ kind: 'section', step, hidden, num });
    if (!hidden) acc.next += 1;
    return acc;
  }, { rows: [], next: 1 }).rows;

  const sheet = (
    <PageSheet
      pageSize={style.pageSize}
      edgeTopMm={pageEdgeMm(style.marginMm.top)}
      edgeBottomMm={pageEdgeMm(style.marginMm.bottom)}
      className="mx-auto shadow-lg"
    >
      {children}
    </PageSheet>
  );

  const sectionBlockTools = (sectionId) => (
    <div className="basis-full pl-7">
      <div className="flex flex-wrap items-center gap-1">
        {(style.sectionBlocks?.[sectionId] || []).map((block) => (
          <span key={block.id} className="inline-flex max-w-full items-center gap-1 rounded bg-white px-1.5 py-0.5 text-[11px] text-slate-600">
            <span className="max-w-[8rem] truncate">{block.kind === 'text' ? (block.text || tf('Text')) : block.name}</span>
            <button
              type="button"
              className="text-red-700"
              title={tf('Delete')}
              data-confirm-delete
              data-confirm-title={tf('Delete this item?')}
              data-confirm-body={tf('It will be removed from this section.')}
              onMouseDown={(event) => event.stopPropagation()}
              onClick={() => commit(removeSectionBlock(style, sectionId, block.id))}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[11px]"
          title={tf('Add text')}
          onMouseDown={(event) => event.stopPropagation()}
          onClick={() => addTextBlock(sectionId)}
        >
          <Type className="h-3 w-3" />
          {tf('Text')}
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[11px]"
          title={tf('Add image')}
          onMouseDown={(event) => event.stopPropagation()}
          onClick={() => pickSectionImage(sectionId)}
        >
          <ImagePlus className="h-3 w-3" />
          {tf('Image')}
        </button>
      </div>
    </div>
  );

  const sectionsPanel = (
    <aside className="flex h-full min-h-0 flex-col border-border bg-white lg:border-r lg:pt-12">
      <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
        <div className="flex w-full items-center justify-between gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary"
            onClick={() => { setAddingSection(true); setSectionTitle(''); }}
          >
            <Plus className="h-3.5 w-3.5" />
            {tf('New section')}
          </button>
          <button
            type="button"
            className="text-xs font-medium text-primary"
            onClick={() => commit({
              ...style,
              hiddenSectionIds: [],
              sectionOrder: layoutOrder(steps, { ...style, sectionOrder: steps.map((step) => step.id) }),
            })}
          >
            {tf('Original order')}
          </button>
        </div>
      </div>
      {addingSection ? (
        <form
          className="flex items-center gap-2 border-b px-3 py-2"
          onSubmit={(event) => {
            event.preventDefault();
            const title = sectionTitle.trim();
            if (!title) return;
            commit(addCustomSection(style, steps, title));
            setSectionTitle('');
            setAddingSection(false);
          }}
        >
          <input
            className="min-w-0 flex-1 rounded-md border px-2 py-1 text-sm"
            value={sectionTitle}
            autoFocus
            placeholder={tf('Section title')}
            onChange={(event) => setSectionTitle(event.target.value)}
          />
          <Button type="submit" size="sm" disabled={!sectionTitle.trim()}>{tf('Add')}</Button>
        </form>
      ) : null}
      <input
        ref={blockFileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          const sectionId = blockSectionRef.current;
          if (!file || !sectionId) return;
          try {
            const src = await readImageFile(file);
            if (src.length > 500_000) {
              setImageError('That image is too large.');
              return;
            }
            const name = file.name.replace(/\.[^.]+$/, '').slice(0, 80) || 'Picture';
            commit(addSectionBlock(style, sectionId, {
              id: newContentId('blk'),
              kind: 'image',
              name,
              src,
              hidden: false,
              frame: { w: 100, h: 0, x: 0, y: 0 },
            }));
            setImageError('');
          } catch (error) {
            setImageError(error?.message || 'Could not read that image.');
          }
        }}
      />
      {imageError ? <p className="px-3 py-1 text-xs font-medium text-red-700">{tf(imageError)}</p> : null}
      <ol className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
        {sidebarRows.map((row) => {
          if (row.kind === 'picture') {
            const { picture } = row;
            const token = pictureToken(picture.id);
            const hot = dragId === token;
            return (
              <li
                key={token}
                draggable
                onDragStart={(event) => {
                  setDragId(token);
                  if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
                }}
                onDragOver={onRowDragOver(token)}
                onDrop={(event) => onDrop(token, event)}
                onDragEnd={clearDrag}
                className={`relative flex items-center gap-2 rounded-md border px-2 py-1.5 text-sm ${
                  dragId === token ? 'opacity-50' : hot ? 'border-teal-600 bg-teal-50' : 'border-transparent bg-slate-50'
                } ${picture.hidden ? 'opacity-45' : ''}`}
              >
                {dropLine(token, 'before')}
                {dropLine(token, 'after')}
                {grip(token, picture.name)}
                <span className="min-w-0 flex-1 truncate text-left">{picture.name}</span>
                <button
                  type="button"
                  className="rounded p-1 text-slate-500 hover:bg-white"
                  title={picture.hidden ? tf('Show picture') : tf('Hide picture')}
                  onMouseDown={(event) => event.stopPropagation()}
                  onClick={() => commit({
                    ...style,
                    pictures: style.pictures.map((item) => (
                      item.id === picture.id ? { ...item, hidden: !item.hidden } : item
                    )),
                  })}
                >
                  {picture.hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  className="rounded p-1 text-red-700 hover:bg-white"
                  title={tf('Delete picture')}
                  onMouseDown={(event) => event.stopPropagation()}
                  onClick={() => setDeletePictureId(picture.id)}
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            );
          }
          if (row.kind === 'custom') {
            const { section, hidden, num } = row;
            return (
              <li
                key={section.id}
                draggable
                onDragStart={(event) => {
                  setDragId(section.id);
                  if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
                }}
                onDragOver={onRowDragOver(section.id)}
                onDrop={(event) => onDrop(section.id, event)}
                onDragEnd={clearDrag}
                className={`relative flex flex-wrap items-center gap-2 rounded-md border px-2 py-1.5 text-sm ${
                  dragId === section.id ? 'opacity-50' : 'border-transparent bg-slate-50'
                } ${hidden ? 'opacity-45' : ''}`}
              >
                {dropLine(section.id, 'before')}
                {dropLine(section.id, 'after')}
                {grip(section.id, section.title)}
                <span className="w-5 shrink-0 text-xs text-slate-500">{num}</span>
                <input
                  className="min-w-0 flex-1 bg-transparent text-sm"
                  value={section.title}
                  onMouseDown={(event) => event.stopPropagation()}
                  onChange={(event) => commit(renameCustomSection(style, section.id, event.target.value))}
                />
                <button
                  type="button"
                  className="rounded p-1 text-slate-500 hover:bg-white"
                  title={hidden ? tf('Show section') : tf('Hide section')}
                  onMouseDown={(event) => event.stopPropagation()}
                  onClick={() => toggleHidden(section.id)}
                >
                  {hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  className="rounded p-1 text-red-700 hover:bg-white"
                  title={tf('Delete section')}
                  data-confirm-delete
                  data-confirm-title={tf('Delete this section?')}
                  data-confirm-body={tf('The section and everything you added to it will be removed.')}
                  onMouseDown={(event) => event.stopPropagation()}
                  onClick={() => commit(removeCustomSection(style, section.id))}
                >
                  <X className="h-4 w-4" />
                </button>
                {sectionBlockTools(section.id)}
              </li>
            );
          }
          const { step, hidden, num } = row;
          const hot = dragId === step.id || activeSectionId === step.id;
          return (
            <li
              key={step.id}
              draggable
              onDragStart={(event) => {
                setDragId(step.id);
                onActiveSection?.(step.id);
                if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
              }}
              onDragOver={onRowDragOver(step.id)}
              onDrop={(event) => onDrop(step.id, event)}
              onDragEnd={clearDrag}
              className={`relative flex flex-wrap items-center gap-2 rounded-md border px-2 py-1.5 text-sm ${
                dragId === step.id ? 'opacity-50' : hot ? 'border-teal-600 bg-teal-50' : 'border-transparent bg-slate-50'
              } ${hidden ? 'opacity-45' : ''}`}
            >
              {dropLine(step.id, 'before')}
              {dropLine(step.id, 'after')}
              {grip(step.id, tf(step.title))}
              <span className="w-5 shrink-0 text-xs text-slate-500">{num}</span>
              <button
                type="button"
                className="min-w-0 flex-1 truncate text-left"
                onMouseDown={(event) => event.stopPropagation()}
                onClick={() => openEdit(step)}
              >
                {tf(step.title)}
              </button>
              <button
                type="button"
                className="rounded p-1 text-slate-500 hover:bg-white"
                title={hidden ? tf('Show section') : tf('Hide section')}
                onMouseDown={(event) => event.stopPropagation()}
                onClick={() => toggleHidden(step.id)}
              >
                {hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
              {sectionBlockTools(step.id)}
            </li>
          );
        })}
      </ol>
    </aside>
  );

  const stylePanel = (
    <aside className="flex h-full min-h-0 flex-col bg-white lg:border-l lg:pt-12">
      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
        <div className="flex items-center justify-between px-1 pb-1">
          <p className="text-xs text-slate-500">{tf('Changes apply to this report only.')}</p>
        </div>
        <StyleGroup title={tf('Templates')} open={!!openGroups.presets} onToggle={() => toggleGroup('presets')}>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(7.5rem,1fr))] gap-3">
            {PRESET_IDS.map((id, index) => (
              <div key={id} className="group relative">
                <button
                  type="button"
                  onClick={() => commit(applyPreset(style, id))}
                  aria-pressed={style.preset === id}
                  title={tf(PRESET_LABELS[id])}
                  className={`flex w-full flex-col items-center gap-1.5 rounded-lg border p-2 text-xs font-medium transition-colors hover:border-slate-400 ${
                    style.preset === id ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900' : 'border-slate-200 bg-white'
                  }`}
                >
                  <TemplateThumb id={id} style={style} schemeCode={schemeCode} order={index} />
                  <span>{tf(PRESET_LABELS[id])}</span>
                  <span className="text-center text-[11px] font-normal leading-tight text-slate-500">{tf(PRESET_NOTES[id])}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTemplatePreview(id)}
                  aria-label={`${tf('Enlarge preview')}: ${tf(PRESET_LABELS[id])}`}
                  title={tf('Enlarge preview')}
                  className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white/90 text-slate-600 opacity-80 shadow-sm backdrop-blur transition hover:bg-white hover:text-slate-900 hover:opacity-100 focus-visible:opacity-100 group-hover:opacity-100"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </StyleGroup>

        <StyleGroup title={tf('Page')} open={!!openGroups.page} onToggle={() => toggleGroup('page')}>
          <label className="block text-xs">
            {tf('Page size')}
            <select
              className="mt-1 w-full rounded-md border px-2 py-1.5 text-sm"
              value={style.pageSize}
              onChange={(event) => commit({ ...style, pageSize: event.target.value })}
            >
              {PAGE_SIZES.map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </label>
          <p className="text-xs text-slate-500">{tf('Portrait for the write-up.')}</p>
          <label className={`flex items-start gap-2 text-xs ${problemFor('wide') ? 'text-red-700' : ''}`}>
            <input
              type="checkbox"
              className="mt-0.5"
              checked={style.wideTablesLandscape}
              onChange={(event) => commit({ ...style, wideTablesLandscape: event.target.checked })}
            />
            <span>{tf('Landscape for wide money tables')}</span>
          </label>
          {problemFor('wide') ? <p className="text-xs font-medium text-red-700">{tf(problemFor('wide'))}</p> : null}
          <div>
            <p className="mb-1 text-xs">{tf('Margins')}</p>
            <Segmented
              label={tf('Margins')}
              value={marginChoice}
              options={MARGIN_CHOICES.map((c) => ({ id: c.id, label: `${tf(c.label)} · ${c.mm}` }))}
              onChange={(id) => {
                const mm = MARGIN_CHOICES.find((c) => c.id === id).mm;
                commit({ ...style, marginMm: { top: mm, right: mm, bottom: mm, left: mm } });
              }}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
              <label key={side} className="text-xs capitalize">
                {tf(side)} (mm)
                <input
                  type="number"
                  min={MARGIN_MIN}
                  max={MARGIN_MAX}
                  className={`mt-1 w-full rounded-md border px-2 py-1.5 text-sm ${problemFor(`margin-${side}`) ? 'border-red-500' : ''}`}
                  value={style.marginMm[side]}
                  onChange={(event) => setMargin(side, event.target.value)}
                />
              </label>
            ))}
          </div>
          {resetLink('page')}
        </StyleGroup>

        <StyleGroup title={tf('Type')} open={!!openGroups.type} onToggle={() => toggleGroup('type')}>
          <div className="flex items-center justify-between gap-2 rounded-md bg-slate-50 px-2 py-1.5 text-xs">
            <span>{tf('Text size')} ({style.body.size}{PT})</span>
            <span className="flex gap-1">
              <Button type="button" variant="outline" size="sm" className="h-7 px-2 text-xs" aria-label={tf('Smaller text')} onClick={() => commit(scaleTypeSizes(style, -0.5))}>A−</Button>
              <Button type="button" variant="outline" size="sm" className="h-7 px-2 text-xs" aria-label={tf('Larger text')} onClick={() => commit(scaleTypeSizes(style, 0.5))}>A+</Button>
            </span>
          </div>
          <div>
            <p className="mb-1 text-xs">{tf('Spacing')}</p>
            <Segmented
              label={tf('Spacing')}
              value={spacingChoice}
              options={SPACING_CHOICES.map((c) => ({ id: c.id, label: tf(c.label) }))}
              onChange={(id) => {
                const choice = SPACING_CHOICES.find((c) => c.id === id);
                commit({ ...style, lineHeight: choice.lineHeight, paragraphGap: choice.paragraphGap });
              }}
            />
          </div>
          {ROLE_KEYS.map((key) => (
            <div key={key} className={`rounded-md border p-2 ${problemFor('body-font') && key === 'body' ? 'border-red-500' : 'border-slate-200'}`}>
              <p className="mb-1 text-xs font-medium">{tf(ROLE_LABELS[key])}</p>
              <div className="grid grid-cols-3 gap-1">
                <select
                  className="rounded border px-1 py-1 text-xs"
                  value={style[key].family}
                  onChange={(event) => setRole(key, { family: event.target.value })}
                >
                  {FONT_CHOICES.map((font) => (
                    <option key={font} value={font}>{font}</option>
                  ))}
                </select>
                <input
                  type="number"
                  min={8}
                  max={36}
                  className="rounded border px-1 py-1 text-xs"
                  value={style[key].size}
                  onChange={(event) => setRole(key, { size: Number(event.target.value) })}
                />
                <select
                  className="rounded border px-1 py-1 text-xs"
                  value={style[key].weight}
                  onChange={(event) => setRole(key, { weight: Number(event.target.value) })}
                >
                  <option value={400}>{tf('Regular')}</option>
                  <option value={600}>{tf('Semibold')}</option>
                  <option value={700}>{tf('Bold')}</option>
                </select>
              </div>
            </div>
          ))}
          {problemFor('body-font') ? <p className="text-xs font-medium text-red-700">{tf(problemFor('body-font'))}</p> : null}
          <label className="block text-xs">
            {tf('Alignment')}
            <select
              className="mt-1 w-full rounded-md border px-2 py-1.5 text-sm"
              value={style.align}
              onChange={(event) => commit({ ...style, align: event.target.value })}
            >
              <option value="left">{tf('Left')}</option>
              <option value="justify">{tf('Justified')}</option>
            </select>
          </label>
          <label className="block text-xs">
            {tf('Line spacing')}
            <input
              type="number"
              step="0.05"
              min={1}
              max={2}
              className="mt-1 w-full rounded-md border px-2 py-1.5 text-sm"
              value={style.lineHeight}
              onChange={(event) => commit({ ...style, lineHeight: Number(event.target.value) })}
            />
          </label>
          <label className="block text-xs">
            {tf('Space between paragraphs')} (pt)
            <input
              type="number"
              min={0}
              max={24}
              className="mt-1 w-full rounded-md border px-2 py-1.5 text-sm"
              value={style.paragraphGap}
              onChange={(event) => commit({ ...style, paragraphGap: Number(event.target.value) })}
            />
          </label>
          {resetLink('type')}
        </StyleGroup>

        <StyleGroup title={tf('Colors')} open={!!openGroups.colors} onToggle={() => toggleGroup('colors')}>
          <div>
            <p className="mb-1 text-xs">{tf('Color sets')}</p>
            <div className="flex flex-wrap gap-2">
              {COLOR_PALETTES.map((palette) => (
                <button
                  key={palette.id}
                  type="button"
                  title={tf(palette.label)}
                  aria-label={tf(palette.label)}
                  aria-pressed={paletteChoice === palette.id}
                  onClick={() => { setBlockedColor(''); commit({ ...style, colors: { ...palette.colors } }); }}
                  className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 ${paletteChoice === palette.id ? 'border-slate-900 ring-2 ring-offset-1 ring-slate-400' : 'border-white shadow'}`}
                  style={{ background: `linear-gradient(135deg, ${palette.colors.primary} 50%, ${palette.colors.table} 50%)` }}
                />
              ))}
            </div>
          </div>
          {([
            ['primary', 'Primary'],
            ['header', 'Header'],
            ['table', 'Table header'],
            ['border', 'Borders'],
          ] as const).map(([key, label]) => (
            <label key={key} className={`flex items-center justify-between gap-2 text-xs ${problemFor(key) || blockedColor === key ? 'text-red-700' : ''}`}>
              <span>{tf(label)}</span>
              <input
                type="color"
                value={style.colors[key]}
                onChange={(event) => setColor(key, event.target.value)}
                className={`h-8 w-12 rounded border ${problemFor(key) || blockedColor === key ? 'border-red-500' : ''}`}
              />
            </label>
          ))}
          {blockedColor ? (
            <p className="text-xs font-medium text-red-700">{tf('That color would hide the text, so it was not applied.')}</p>
          ) : null}
          {['primary', 'header', 'table', 'border'].map((key) =>
            problemFor(key) ? <p key={key} className="text-xs font-medium text-red-700">{tf(problemFor(key))}</p> : null
          )}
          {resetLink('colors')}
        </StyleGroup>

        <StyleGroup title={tf('Header and footer')} open={!!openGroups.header} onToggle={() => toggleGroup('header')}>
          <label className="block text-xs">
            {tf('Logo place')}
            <select
              className="mt-1 w-full rounded-md border px-2 py-1.5 text-sm"
              value={style.logoAlign}
              onChange={(event) => commit({ ...style, logoAlign: event.target.value })}
            >
              <option value="left">{tf('Left')}</option>
              <option value="center">{tf('Center')}</option>
              <option value="right">{tf('Right')}</option>
            </select>
          </label>
          <label className="block text-xs">
            {tf('Agency name')}
            <input
              className="mt-1 w-full rounded-md border px-2 py-1.5 text-sm"
              value={style.agencyName}
              onChange={(event) => commit({ ...style, agencyName: event.target.value })}
            />
          </label>
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={style.headerLine}
              onChange={(event) => commit({ ...style, headerLine: event.target.checked })}
            />
            {tf('Thin line under the header')}
          </label>
          <label className="block text-xs">
            {tf('Page numbers')}
            <select
              className="mt-1 w-full rounded-md border px-2 py-1.5 text-sm"
              value={style.pageNumberStyle}
              onChange={(event) => commit({ ...style, pageNumberStyle: event.target.value })}
            >
              <option value="plain">3</option>
              <option value="of">{tf('Page 3 of 12')}</option>
            </select>
          </label>
          <label className="block text-xs">
            {tf('Footer text (left of the page number)')}
            <input
              className="mt-1 w-full rounded-md border px-2 py-1.5 text-sm"
              maxLength={80}
              placeholder={tf('For example: Sri Lakshmi Foods · Draft')}
              value={style.footerText || ''}
              onChange={(event) => commit({ ...style, footerText: event.target.value })}
            />
          </label>
          <label className="block text-xs">
            {tf('Logo')}
            <input
              type="file"
              accept="image/*"
              className="mt-1 block w-full text-xs"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                event.target.value = '';
                if (!file) return;
                try {
                  const url = await readImageFile(file);
                  commit({ ...style, logoDataUrl: url });
                  setImageError('');
                } catch (error) {
                  setImageError(error?.message || 'Could not read that image.');
                }
              }}
            />
          </label>
          {style.logoDataUrl ? (
            <button type="button" className="text-xs text-red-700" onClick={() => commit({ ...style, logoDataUrl: '' })}>
              {tf('Remove logo')}
            </button>
          ) : null}
          {resetLink('header')}
        </StyleGroup>

        <StyleGroup title={tf('Watermark')} open={!!openGroups.watermark} onToggle={() => toggleGroup('watermark')}>
          <input
            className="w-full rounded-md border px-2 py-1.5 text-sm"
            value={style.watermark}
            onChange={(event) => commit({ ...style, watermark: event.target.value })}
          />
          <label className="block text-xs">
            {tf('How faint')}
            <input
              type="range"
              min={0.04}
              max={0.4}
              step={0.01}
              className="mt-1 w-full"
              value={style.watermarkOpacity}
              onChange={(event) => commit({ ...style, watermarkOpacity: Number(event.target.value) })}
            />
          </label>
          <label className="block text-xs">
            {tf('Angle')}
            <input
              type="number"
              min={-90}
              max={90}
              className="mt-1 w-full rounded-md border px-2 py-1.5 text-sm"
              value={style.watermarkAngle}
              onChange={(event) => commit({ ...style, watermarkAngle: Number(event.target.value) })}
            />
          </label>
          {resetLink('watermark')}
        </StyleGroup>

        <StyleGroup title={tf('Tables')} open={!!openGroups.tables} onToggle={() => toggleGroup('tables')}>
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={style.tableStriped}
              onChange={(event) => commit({ ...style, tableStriped: event.target.checked })}
            />
            {tf('Striped rows')}
          </label>
          <div>
            <p className="mb-1 text-xs">{tf('Row height')}</p>
            <Segmented
              label={tf('Row height')}
              value={style.tableDensity}
              options={[
                { id: 'compact', label: tf('Compact') },
                { id: 'normal', label: tf('Normal') },
                { id: 'roomy', label: tf('Roomy') },
              ]}
              onChange={(id) => commit({ ...style, tableDensity: id })}
            />
          </div>
          <div>
            <p className="mb-1 text-xs">{tf('Table lines')}</p>
            <Segmented
              label={tf('Table lines')}
              value={style.tableBorders}
              options={[
                { id: 'template', label: tf('Template') },
                { id: 'grid', label: tf('Grid') },
                { id: 'rows', label: tf('Rows') },
                { id: 'none', label: tf('None') },
              ]}
              onChange={(id) => commit({ ...style, tableBorders: id })}
            />
          </div>
          {resetLink('tables')}
        </StyleGroup>

        <StyleGroup title={tf('Layout')} open={!!openGroups.layout} onToggle={() => toggleGroup('layout')}>
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={style.showToc}
              onChange={(event) => commit({ ...style, showToc: event.target.checked })}
            />
            {tf('Show the table of contents')}
          </label>
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={style.headingNumbers}
              onChange={(event) => commit({ ...style, headingNumbers: event.target.checked })}
            />
            {tf('Number the section headings')}
          </label>
          <label className="flex items-start gap-2 text-xs">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={style.sectionBreak === 'newPage'}
              onChange={(event) => commit({ ...style, sectionBreak: event.target.checked ? 'newPage' : 'flow' })}
            />
            <span>{tf('Start each section on a new page')}</span>
          </label>
          {resetLink('layout')}
        </StyleGroup>

        <StyleGroup title={tf('Pictures')} open={!!openGroups.pictures} onToggle={() => toggleGroup('pictures')}>
          <p className="text-xs text-slate-500">{tf('Choose where a new picture starts. Name it, then drag it in Sections.')}</p>
          <select className="w-full rounded-md border px-2 py-1.5 text-sm" value={slot} onChange={(event) => setSlot(event.target.value)}>
            <option value="cover">{tf('Cover')}</option>
            {steps.map((step) => (
              <option key={step.id} value={`after:${step.id}`}>{tf('After')} {tf(step.title)}</option>
            ))}
            <option value="annexure">{tf('Annexure')}</option>
          </select>
          <input
            type="file"
            accept="image/*"
            multiple
            className="block w-full text-xs"
            onChange={async (event) => {
              const files = [...(event.target.files || [])];
              event.target.value = '';
              if (!files.length) return;
              const place = slot === 'cover' || slot === 'annexure' ? slot : slot.slice('after:'.length);
              const next = [];
              for (const file of files) {
                try {
                  const src = await readImageFile(file);
                  const suggested = file.name.replace(/\.[^.]+$/, '').slice(0, 80) || 'Picture';
                  next.push({ src, suggested, place });
                } catch (error) {
                  setImageError(error?.message || 'Could not read that image.');
                }
              }
              if (!next.length) return;
              setImageError('');
              setPendingPictures(next);
              setPictureName(next[0].suggested);
            }}
          />
          {imageError ? <p className="text-xs font-medium text-red-700">{tf(imageError)}</p> : null}
        </StyleGroup>
      </div>
      {canSaveSchemeDefault ? (
        <div className="shrink-0 border-t bg-slate-50 p-3">
          <p className="mb-2 text-xs text-slate-500">{tf('Admin: makes this look the starting style for new DPRs of this scheme.')}</p>
          <Button type="button" variant="outline" size="sm" className="w-full" onClick={onSaveSchemeDefault} disabled={saving || blocking}>
            {tf('Save as the scheme default')}
          </Button>
        </div>
      ) : null}
    </aside>
  );

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-slate-100">
      <div className="relative z-[55] border-b bg-white"><div className="mx-auto w-full max-w-7xl px-4 py-2">{stepsBar}</div></div>
            <div className="relative z-[55] lg:pointer-events-none lg:-mb-12">
            <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-2">
              <div className="flex flex-wrap items-center gap-3 lg:pointer-events-auto">
                {/* The same three tabs, in the same place and the same fixed width, in both modes (so nothing shifts when the first one changes between Form and Document). */}
                <div role="tablist" aria-label={tf('Panels')} className="flex shrink-0 gap-0.5 rounded-xl border border-white/70 bg-white/40 p-1 shadow-sm backdrop-blur-md dark:border-white/15 dark:bg-white/5">
                  {([
                    [docMode ? tf('Document') : tf('Form'), homeActive, goHome, docMode ? FileText : ClipboardList],
                    [tf('Sections'), tabActive('sections'), () => chooseTab('sections'), ListOrdered],
                    [tf('Style'), tabActive('style'), () => chooseTab('style'), Palette],
                  ] as const).map(([label, active, onClick, Icon]) => (
                    <button
                      key={label}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      data-panel-toggle
                      onClick={onClick}
                      className={`inline-flex h-8 w-9 items-center justify-center gap-1.5 rounded-lg text-sm font-semibold transition-all duration-200 sm:w-28 ${
                        active ? 'bg-white/90 text-teal-900 shadow-sm ring-1 ring-slate-300/70 dark:bg-slate-700 dark:text-white dark:ring-white/20' : 'text-slate-600 hover:bg-white/40 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white'
                      }`}
                      title={label}
                      aria-label={label}
                    >
                      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span className="max-sm:hidden">{label}</span>
                    </button>
                  ))}
                </div>
                <span aria-hidden="true" className="hidden h-6 w-px bg-slate-300/60 dark:bg-white/20 sm:block" />
                <div className="flex items-center gap-0.5 rounded-lg border border-white/70 bg-white/40 p-0.5 shadow-sm backdrop-blur-md dark:border-white/15 dark:bg-white/5">
                  <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" title={tf('Undo')} aria-label={tf('Undo')} onClick={onUndo || undo} disabled={onUndo ? !canUndo : historyTick < 0 || !past.current.length}><Undo2 className="h-4 w-4" /></Button>
                  <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" title={tf('Redo')} aria-label={tf('Redo')} onClick={onRedo || redo} disabled={onRedo ? !canRedo : historyTick < 0 || !future.current.length}><Redo2 className="h-4 w-4" /></Button>
                  <span aria-hidden="true" className="mx-0.5 h-4 w-px bg-slate-300/60 dark:bg-white/20" />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1 px-2 text-xs max-sm:w-7 max-sm:px-0"
                    title={tf("Restore the scheme's original look.")}
                    aria-label={tf('Reset')}
                    onClick={() => {
                      past.current = [];
                      future.current = [];
                      setHistoryTick((n) => n + 1);
                      onChange(defaultStyleForScheme(schemeCode));
                    }}
                  >
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                    <span className="max-sm:hidden">{tf('Reset')}</span>
                  </Button>
                </div>
              </div>
              <div className="ml-auto flex flex-wrap items-center justify-end gap-2 lg:pointer-events-auto">
              <div className="flex items-center gap-0.5 rounded-lg border border-white/70 bg-white/40 p-0.5 shadow-sm backdrop-blur-md dark:border-white/15 dark:bg-white/5">
                <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" title={tf('Zoom out')} aria-label={tf('Zoom out')} onClick={() => { fitWidthRef.current = false; setFitWidth(false); setZoom((z) => Math.max(0.22, Math.round((z - 0.05) * 100) / 100)); }}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="w-10 text-center text-xs tabular-nums">{Math.round(zoom * 100)}%</span>
                <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" title={tf('Zoom in')} aria-label={tf('Zoom in')} onClick={() => { fitWidthRef.current = false; setFitWidth(false); setZoom((z) => Math.min(1.35, Math.round((z + 0.05) * 100) / 100)); }}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <span aria-hidden="true" className="mx-0.5 h-4 w-px bg-slate-300/60 dark:bg-white/20" />
                <Button type="button" variant="ghost" size="sm" className="h-7 whitespace-nowrap px-2 text-xs" title={tf('Fit the page to the available width.')} onClick={() => { fitWidthRef.current = true; setFitWidth(true); }}>
                  {tf('Fit page')}
                </Button>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 shrink-0 gap-1.5 whitespace-nowrap border-white/70 bg-white/40 text-xs shadow-sm backdrop-blur-md hover:bg-white/60 dark:border-white/15 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
                title={tf('See the final document, read-only.')}
                onClick={() => setPreviewOpen(true)}
              >
                <Eye className="h-4 w-4" aria-hidden="true" />
                <span className="max-sm:hidden">{tf('Preview')}</span>
              </Button>
              {saveButton ? (
                saveButton({ disabled: !!saving || !!blocking })
              ) : (
              <Button type="button" size="sm" className="h-8 whitespace-nowrap" title={tf('Keeps this look (fonts, layout, sections) on this DPR only.')} onClick={onSave} disabled={saving || blocking}>
                {saving ? tf('Saving') : tf('Save on this DPR')}
              </Button>
              )}
              </div>
            </div>
            </div>
      <div className="relative mx-auto min-h-0 w-full max-w-7xl flex-1 px-4 pb-3">
        <div className="flex h-full min-h-0">
          <div className="relative flex h-full min-h-0 min-w-0 flex-1 lg:flex-row-reverse">
            <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
            <div ref={centerRef} data-dpr-scroll data-dpr-inset={wide ? 48 : 0} className="relative z-10 min-h-0 flex-1 overflow-auto bg-slate-100 p-3 lg:pt-16">
              <div style={{ zoom }}>{sheet}</div>
            </div>
            </div>
          {paneOpen && paneHandle('edit')}
          <div
            ref={editPaneRef}
            style={!paneOpen
              ? { width: 0, minWidth: 0, maxWidth: 0, flex: '0 0 0px' }
              : {
                  width: Math.max(paneWidths.edit, editFloor.current),
                  minWidth: editFloor.current,
                  maxWidth: 720,
                  flex: `0 0 ${Math.max(paneWidths.edit, editFloor.current)}px`,
                }}
            // Document mode folds this pane to nothing and Form mode opens it again, sliding; the content keeps its width so it does not re-flow meanwhile.
            className={`hidden h-full min-h-0 flex-col overflow-hidden bg-white transition-[width,min-width,max-width,flex-basis,opacity] duration-300 ease-in-out lg:flex ${!paneOpen ? 'pointer-events-none border-r-0 opacity-0' : 'border-r opacity-100'}`}
            aria-hidden={!paneOpen}
            {...(!paneOpen ? { inert: '' } : {})}
          >
            <div className="flex h-full min-h-0 flex-col" style={{ width: Math.max(paneWidths.edit, editFloor.current), maxWidth: 720 }}>
            <div key={paneTab} className="motion-tab min-h-0 flex-1 overflow-hidden flex flex-col">
            {paneTab === 'sections' || (paneTab === 'form' && !renderEditor) ? sectionsPanel : paneTab === 'style' ? stylePanel : (
              <>
                <div className="fill-edit-scroll min-h-0 flex-1 overflow-y-auto p-3">
                  {(editStep || steps[0]) ? renderEditor(editStep || steps[0]) : null}
                </div>
              </>
            )}
            </div>
            </div>
          </div>
          </div>
        </div>
        {panelPresence.render ? (
          <div
            ref={panelRef}
            className={`motion-panel${panelPresence.closing ? ' is-closing' : ''} absolute inset-y-0 left-0 z-30 flex w-[min(40rem,92%)] max-w-full flex-col border-r bg-white shadow-xl lg:hidden`}
          >
            <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
              <p className="min-w-0 truncate text-sm font-semibold">{tf(shownPanel === 'sections' ? 'Sections' : 'Style')}</p>
            </div>
            <div className="min-h-0 flex-1 overflow-hidden">{shownPanel === 'sections' ? sectionsPanel : stylePanel}</div>
          </div>
        ) : null}
        {panel === 'edit' && editStep && renderEditor ? (
          <div className="absolute inset-y-0 left-0 z-30 flex w-[min(40rem,92%)] max-w-full flex-col border-r bg-white shadow-xl lg:hidden">
            <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
              <p className="min-w-0 truncate text-sm font-semibold">{tf(editStep.title)}</p>
              <button type="button" className="shrink-0 text-xs font-medium text-slate-600" onClick={() => setPanel(null)}>
                {tf('Close')}
              </button>
            </div>
            <div className="fill-edit-scroll min-h-0 flex-1 overflow-y-auto p-3">
              {renderEditor(editStep)}
            </div>
          </div>
        ) : null}
      </div>
      {previewPresence.render && (
        <div
          className={`motion-overlay${previewPresence.closing ? ' is-closing' : ''} fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/50 p-3 sm:p-6`}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setPreviewOpen(false);
          }}
        >
          <div
            ref={previewDialogRef}
            className="flex h-full max-h-[92vh] min-h-0 w-full max-w-6xl flex-col overflow-hidden rounded-xl bg-slate-100 shadow-2xl outline-none"
            role="dialog"
            aria-modal="true"
            aria-label={tf('Final preview')}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-white px-4 py-2">
              <div>
                <p className="text-sm font-semibold">{tf('Final preview')}</p>
                <p className="text-xs text-slate-500">{tf('Read only. This is how the DPR will print: only the answers you filled in.')}</p>
              </div>
              <div className="flex items-center gap-1">
                <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label={tf('Zoom out')} onClick={() => setPreviewZoom((z) => Math.max(0.3, Math.round((z - 0.05) * 100) / 100))}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="w-10 text-center text-xs">{Math.round(previewZoom * 100)}%</span>
                <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label={tf('Zoom in')} onClick={() => setPreviewZoom((z) => Math.min(1.35, Math.round((z + 0.05) * 100) / 100))}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={fitPreview}>{tf('Fit page')}</Button>
                <Button type="button" size="sm" className="ml-2" onClick={() => setPreviewOpen(false)} aria-label={tf('Close preview')}>
                  <X className="mr-1 h-4 w-4" />
                  {tf('Close preview')}
                </Button>
              </div>
            </div>
            <div ref={previewBoxRef} className="min-h-0 flex-1 overflow-auto p-6">
              <div style={{ zoom: previewZoom }}>
                <PageSheet
                  pageSize={style.pageSize}
                  edgeTopMm={pageEdgeMm(style.marginMm.top)}
                  edgeBottomMm={pageEdgeMm(style.marginMm.bottom)}
                  className="mx-auto shadow-lg"
                >
                  {finalPreview}
                </PageSheet>
              </div>
            </div>
          </div>
        </div>
      )}
      {pendingPictures[0] ? (
        <div className="motion-overlay fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/40 p-4">
          <form
            className="w-full max-w-sm rounded-lg bg-white p-4 shadow-xl"
            onSubmit={(event) => {
              event.preventDefault();
              const name = pictureName.trim().slice(0, 80);
              const pending = pendingPictures[0];
              if (!name || !pending) return;
              const picture = {
                id: `pic_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
                name,
                src: pending.src,
                hidden: false,
                place: pending.place,
                frame: { w: 100, h: 0, x: 0, y: 0 },
              };
              commit(insertPicture(style, steps, picture));
              const rest = pendingPictures.slice(1);
              setPendingPictures(rest);
              setPictureName(rest[0]?.suggested || '');
            }}
          >
            <p className="text-sm font-semibold">{tf('Name this picture')}</p>
            <p className="mt-1 text-xs text-slate-500">{tf('This name is how you find it in Sections.')}</p>
            <input
              className="mt-3 w-full rounded-md border px-2 py-1.5 text-sm"
              value={pictureName}
              autoFocus
              onChange={(event) => setPictureName(event.target.value)}
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const rest = pendingPictures.slice(1);
                  setPendingPictures(rest);
                  setPictureName(rest[0]?.suggested || '');
                }}
              >
                {tf('Cancel')}
              </Button>
              <Button type="submit" size="sm" disabled={!pictureName.trim()}>{tf('Save')}</Button>
            </div>
          </form>
        </div>
      ) : null}
      {deletePictureId ? (
        <div className="motion-overlay fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-4 shadow-xl">
            <p className="text-sm font-semibold">{tf('Delete this image?')}</p>
            <p className="mt-1 text-xs text-slate-500">
              {(style.pictures || []).find((picture) => picture.id === deletePictureId)?.name}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setDeletePictureId('')}>
                {tf('Cancel')}
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  const pictures = (style.pictures || []).filter((picture) => picture.id !== deletePictureId);
                  commit({ ...style, pictures, sectionOrder: layoutOrder(steps, { ...style, pictures }) });
                  setDeletePictureId('');
                }}
              >
                {tf('Delete')}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
      {templatePresence.render && shownTemplate ? (
        <div
          className={`motion-overlay${templatePresence.closing ? ' is-closing' : ''} fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/50 p-3 sm:p-6`}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setTemplatePreview(null);
          }}
        >
         <div
          ref={templateDialogRef}
          className="flex h-full max-h-[92vh] min-h-0 w-full max-w-6xl flex-col overflow-hidden rounded-xl bg-slate-100 shadow-2xl outline-none"
          role="dialog"
          aria-modal="true"
          aria-label={tf(PRESET_LABELS[shownTemplate])}
         >
          <div className="flex shrink-0 items-center justify-between gap-3 bg-white px-4 py-3 shadow">
            <p className="min-w-0 truncate text-sm font-semibold">{tf(PRESET_LABELS[shownTemplate])}</p>
            <div className="flex shrink-0 items-center gap-2">
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => {
                  commit(applyPreset(style, shownTemplate));
                  setTemplatePreview(null);
                }}
              >
                {tf('Use this theme')}
              </Button>
              <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label={tf('Close')} onClick={() => setTemplatePreview(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-auto p-6">
            <PageSheet
              pageSize="A4"
              edgeTopMm={pageEdgeMm(16)}
              edgeBottomMm={pageEdgeMm(16)}
              className="mx-auto shadow-lg"
            >
              <IndividualDPRDocumentView
                dpr={templateSpecimenDpr(schemeCode)}
                documentStyle={templateSpecimenStyle(style, shownTemplate, schemeCode)}
              />
            </PageSheet>
          </div>
         </div>
        </div>
      ) : null}
    </div>
  );
}
