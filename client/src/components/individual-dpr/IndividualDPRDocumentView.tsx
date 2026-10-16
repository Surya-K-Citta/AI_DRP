import { FinanceDocSummary } from '@/components/individual-dpr/FinanceModel';
import { businessKind, normalizeAssetItems } from '@/lib/individualDpr/businessKind';
import { ScheduleDocParties } from '@/components/individual-dpr/ScheduleParties';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { getIndividualCoverLines } from '@/lib/individualDpr/coverTitle';
import { useClusterFormText } from '@/lib/clusterDprFormText';
import {
  extractIndividualDocData,
  extractSchemeCode,
  formatDocValue,
  getIndividualDocFields,
  getIndividualUploads,
  getSchemeDocSteps,
  isLeanUnitScheme,
  readDocField,
  sectionTitleFromStep,
  type IndividualDocField,
} from '@/lib/individualDpr/individualDocModel';
import { getSchemeUiTemplate } from '@/lib/individualDpr/schemeUiTemplate';
import {
  layoutOrder,
  pageEdgeMm,
  pictureIdFromToken,
  resizeImageBox,
  resolveDocumentStyle,
  styleCssVars,
  type DocumentStyle,
  type ImageBox,
  type ImageHandle,
} from '@/lib/individualDpr/documentStyle';
import { cmepProjectionsHaveFigures, normalizeCmepProjections } from '@/lib/individualDpr/cmepProjections';
import { isEnteredDocRow, isEnteredDocText } from '@/lib/individualDpr/docEntries';
import {
  CMEP_COST_HEADS,
  deriveCmepBankSheets,
  normalizeCostPhasing,
  normalizeMachineryItems,
  normalizeProductMix,
  normalizePromoters,
  normalizeRawMaterials,
  normalizeRisks,
  normalizeStaffRoles,
  normalizeUtilisationYears,
} from '@/lib/individualDpr/cmepBankPack';
import { normalizeMilestones } from '@/lib/dprAiFieldNormalize';

const NARRATIVE_FIELDS = new Set([
  'executiveSummary',
  'processOfManufacture',
  'sectorDescription',
  'presentActivities',
  'geography',
  'targetMarket',
  'existingDemand',
  'landDetails',
  'waterAndEffluent',
  'impactNote',
]);
import { isKycUploaded } from '@/lib/privacy/kycField';
import { toast } from 'react-hot-toast';
import { toDateInputValue } from '@/lib/dprAiFieldNormalize';
import { isReasonableIsoDate } from '@/lib/individualDpr/isoDate';
import { getDocCellInput, getDocFieldInput, type DocFieldInput } from '@/lib/individualDpr/docFieldInput';

export interface IndividualDPRDocumentViewProps {
  dpr: any;
  project?: any;
  viewLanguage?: 'english' | 'telugu';
  trackFieldHits?: boolean;
  onSectionClick?: (localStep: number) => void;
  /** The user put the cursor in a field of this section (step number and section id). */
  onSectionFocus?: (localStep: number, sectionId: string) => void;
  /** When set, this DPR wears the saved style and section order. */
  documentStyle?: DocumentStyle | null;
  activeSectionId?: string | null;
  /** Drag a picture handle in the live report. Slot is cover, annexure, or a section id. */
  onImageFrame?: (slot: string, box: ImageBox) => void;
  /** Type straight into the live document. Path is stepN.field or stepN.field[i].key. */
  onEditField?: (path: string, text: string) => void;
  /** Type a text block that was inserted into a section. */
  onEditBlock?: (sectionId: string, blockId: string, text: string) => void;
  /** Live editing view: list every section and field, filled or not. Preview and PDF leave this off. */
  showEmpty?: boolean;
  /** Mark the first cover, paragraph, table, header, and watermark for the setup guide preview. */
  markStyleSpots?: boolean;
}

const IMAGE_HANDLES: ImageHandle[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

function SlotFigure({
  src,
  frame,
  onFrame,
}: {
  src: string;
  frame: ImageBox;
  onFrame?: (box: ImageBox) => void;
}) {
  const tf = useClusterFormText();
  const boxRef = React.useRef<HTMLDivElement>(null);
  const onPointerDown = (handle: ImageHandle) => (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!onFrame) return;
    event.preventDefault();
    event.stopPropagation();
    const box = boxRef.current;
    const host = box?.parentElement?.parentElement;
    if (!box || !host) return;
    const startX = event.clientX;
    const startY = event.clientY;
    const maxW = host.getBoundingClientRect().width || box.getBoundingClientRect().width;
    const measuredH = (box.getBoundingClientRect().height / maxW) * 100;
    const start = { ...frame, h: frame.h > 0 ? frame.h : measuredH };
    const move = (moveEvent: PointerEvent) => {
      const dx = ((moveEvent.clientX - startX) / maxW) * 100;
      const dy = ((moveEvent.clientY - startY) / maxW) * 100;
      onFrame(resizeImageBox(start, handle, dx, dy));
    };
    const stop = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', stop);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', stop);
  };

  return (
    <figure className="dpr-slot-figure">
      <div
        ref={boxRef}
        className={onFrame ? 'dpr-slot-box is-live' : 'dpr-slot-box'}
        style={{
          width: `${frame.w}%`,
          marginLeft: frame.x ? `${frame.x}%` : undefined,
          marginTop: frame.y ? `${frame.y}%` : undefined,
          aspectRatio: frame.h ? `${frame.w} / ${frame.h}` : undefined,
        }}
      >
        <img src={src} alt="" style={frame.h ? { height: '100%', objectFit: 'fill' } : undefined} />
        {onFrame
          ? IMAGE_HANDLES.map((handle) => (
            <button
              key={handle}
              type="button"
              className={`dpr-slot-handle is-${handle}`}
              aria-label={tf('Resize picture')}
              title={tf('Resize picture')}
              onPointerDown={onPointerDown(handle)}
            />
          ))
          : null}
      </div>
    </figure>
  );
}

function fieldHit(
  path: string,
  children: React.ReactNode,
  track: boolean
): React.ReactNode {
  if (!track) return children;
  return <span data-dpr-field={path}>{children}</span>;
}

function isPlainValue(value: unknown): boolean {
  return value == null || value === '' || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
}

function EditableDocText({
  path,
  display,
  placeholder,
  onEdit,
  multiline,
  track,
}: {
  path: string;
  display: string;
  placeholder: string;
  onEdit: (path: string, text: string) => void;
  multiline?: boolean;
  track?: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const focused = useRef(false);
  const shown = !display || display === '—' ? '' : display;
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || focused.current) return;
    if (el.textContent !== shown) el.textContent = shown;
  }, [shown]);
  return (
    <span
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      spellCheck
      data-dpr-field={track ? path : undefined}
      data-placeholder={placeholder}
      className="dpr-inline-edit"
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
      onFocus={() => { focused.current = true; }}
      onBlur={() => {
        focused.current = false;
        onEdit(path, ref.current?.textContent ?? '');
      }}
      onKeyDown={(event) => {
        if (!multiline && event.key === 'Enter') {
          event.preventDefault();
          (event.currentTarget as HTMLElement).blur();
        }
      }}
    />
  );
}

/**
 * Picking from a dropdown or date box inside the zoomed live report can make the browser scroll the
 * page to a wrong spot (it re-focuses the control and the update re-flows the page). Put the report back
 * where it was for a moment after the change.
 */
function holdScroll(from: HTMLElement | null) {
  const box = from?.closest('[data-dpr-scroll]') as HTMLElement | null;
  if (!box) return;
  const top = box.scrollTop;
  const left = box.scrollLeft;
  const restore = () => {
    if (box.scrollTop !== top) box.scrollTop = top;
    if (box.scrollLeft !== left) box.scrollLeft = left;
  };
  requestAnimationFrame(() => {
    restore();
    requestAnimationFrame(restore);
  });
  [60, 150, 300].forEach((ms) => window.setTimeout(restore, ms));
}

function DocControl({
  path,
  display,
  raw,
  input,
  placeholder,
  onEdit,
  multiline,
  track,
  tf,
  rangeCheck,
}: {
  path: string;
  display: string;
  raw: unknown;
  input: DocFieldInput;
  placeholder: string;
  onEdit: (path: string, text: string) => void;
  multiline?: boolean;
  track?: boolean;
  tf: (text: string) => string;
  rangeCheck?: (next: string) => string | null;
}) {
  const value = raw == null ? '' : String(raw);
  const [draft, setDraft] = useState(value);
  const typing = useRef(false);
  useEffect(() => {
    if (!typing.current) setDraft(value);
  }, [value]);

  if (input.kind === 'select') {
    return (
      <select
        className="dpr-inline-select"
        data-dpr-field={track ? path : undefined}
        value={value}
        disabled={input.disabled}
        onMouseDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
        onChange={(event) => {
          holdScroll(event.currentTarget);
          onEdit(path, event.target.value);
        }}
      >
        <option value="">{tf(input.blank)}</option>
        {input.options.map((option) => (
          <option key={option.value} value={option.value}>{tf(option.label)}</option>
        ))}
      </select>
    );
  }
  if (input.kind === 'number') {
    return (
      <input
        type="number"
        inputMode="decimal"
        step="any"
        className="dpr-inline-input"
        data-dpr-field={track ? path : undefined}
        value={draft}
        placeholder={placeholder}
        onMouseDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
        onFocus={() => { typing.current = true; }}
        onBlur={() => { typing.current = false; setDraft(value); }}
        onChange={(event) => {
          holdScroll(event.currentTarget);
          setDraft(event.target.value);
          onEdit(path, event.target.value);
        }}
      />
    );
  }
  if (input.kind === 'date') {
    return (
      <input
        type="date"
        className="dpr-inline-input"
        data-dpr-field={track ? path : undefined}
        value={toDateInputValue(raw)}
        onMouseDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
        onChange={(event) => {
          const next = event.target.value;
          if (next && !isReasonableIsoDate(next)) {
            toast.error(tf('Enter a valid date between 1990 and 2100'));
            return;
          }
          const problem = next && rangeCheck ? rangeCheck(next) : null;
          if (problem) {
            toast.error(tf(problem));
            return;
          }
          holdScroll(event.currentTarget);
          onEdit(path, next);
        }}
      />
    );
  }
  return (
    <EditableDocText
      path={path}
      display={display}
      placeholder={placeholder}
      onEdit={onEdit}
      multiline={multiline || input.kind === 'textarea'}
      track={track}
    />
  );
}

export const IndividualDPRDocumentView: React.FC<IndividualDPRDocumentViewProps> = ({
  dpr,
  project,
  viewLanguage = 'english',
  trackFieldHits = false,
  onSectionClick,
  onSectionFocus,
  documentStyle,
  activeSectionId = null,
  onImageFrame,
  onEditField,
  onEditBlock,
  showEmpty = false,
  markStyleSpots = false,
}) => {
  const tf = useClusterFormText();
  const data = extractIndividualDocData(dpr, project);
  const schemeCode = extractSchemeCode(dpr, project, data);
  const schemeUi = getSchemeUiTemplate(schemeCode);
  const catalogSteps = getSchemeDocSteps(schemeCode);
  const extras = data.schemeExtras || {};
  const explicitStyle = documentStyle !== undefined ? documentStyle : extras.documentStyle;
  const style = explicitStyle ? resolveDocumentStyle(explicitStyle, schemeCode) : null;
  const step1 = data.step1 || {};
  const cover = getIndividualCoverLines(
    step1,
    schemeCode,
    viewLanguage === 'telugu' ? 'te' : 'en'
  );
  const budget = data.ventureMatchAnswers?.budget;
  const kind = businessKind(data);
  const uploads = getIndividualUploads(schemeCode, data);
  const uploadStore = data.step18 || data.uploads || {};

  const typeHere = tf('Type here');
  const focusIn = (n: number, id: string) => onSectionFocus
    ? (event: React.FocusEvent<HTMLElement>) => {
        if ((event.target as HTMLElement).matches?.('input, select, textarea, [contenteditable="true"]')) {
          onSectionFocus(n, id);
        }
      }
    : undefined;
  const coverDef = catalogSteps.find((step) => step.contentStep === 1);
  const renderBlocks = (sectionId: string) => {
    const blocks = style?.sectionBlocks?.[sectionId] || [];
    if (!blocks.length) return null;
    return blocks.map((block) => {
      if (block.kind === 'text') {
        if (!block.text.trim() && !onEditBlock) return null;
        return (
          <div key={block.id} className="individual-qa-a mt-2">
            {onEditBlock ? (
              <EditableDocText
                path={`block:${sectionId}:${block.id}`}
                display={block.text || '—'}
                placeholder={typeHere}
                multiline
                onEdit={(_path, text) => onEditBlock(sectionId, block.id, text)}
              />
            ) : (block.text || '—')}
          </div>
        );
      }
      if (block.hidden) return null;
      return (
        <SlotFigure
          key={block.id}
          src={block.src}
          frame={block.frame}
          onFrame={onImageFrame ? (box) => onImageFrame(`block:${sectionId}:${block.id}`, box) : undefined}
        />
      );
    });
  };
  const lean = isLeanUnitScheme(schemeCode);
  const fieldName = (path: string) => (path.match(/([A-Za-z0-9_]+)(?:\[\d+\])?$/)?.[1] || path);
  const dateOrder = (path: string) => (next: string): string | null => {
    const name = fieldName(path);
    const stepData = data[path.split('.')[0]] || {};
    if (name === 'commitmentDate') {
      const start = toDateInputValue(stepData.yearOfEstablishment);
      return start && next < start ? 'Commitment Date must be on or after Start Date' : null;
    }
    if (name === 'yearOfEstablishment' && lean) {
      const commit = toDateInputValue(stepData.commitmentDate);
      return commit && next > commit ? 'Commitment Date must be on or after Start Date' : null;
    }
    return null;
  };
  const editableValue = (path: string, display: string, raw: unknown, multiline = false) => {
    if (onEditField && isPlainValue(raw)) {
      return (
        <DocControl
          path={path}
          display={display}
          raw={raw}
          input={getDocFieldInput(fieldName(path), { path, schemeCode, lean, data, current: raw })}
          placeholder={typeHere}
          onEdit={onEditField}
          multiline={multiline}
          track={trackFieldHits}
          tf={tf}
          rangeCheck={dateOrder(path)}
        />
      );
    }
    return fieldHit(path, display === '—' ? '—' : tf(display), trackFieldHits);
  };

  const styleSpots = { body: false, table: false, money: false };
  const claimSpot = (kind: 'body' | 'table' | 'money') => {
    if (!markStyleSpots || styleSpots[kind]) return undefined;
    styleSpots[kind] = true;
    return kind;
  };

  const renderSectionFields = (fields: IndividualDocField[]) => {
    if (!fields.length) return null;

    const blocks: React.ReactNode[] = [];
      let particulars: IndividualDocField[] = [];
      const flushParticulars = () => {
        if (!particulars.length) return;
        const rows = showEmpty ? particulars : particulars.filter((field) => formatDocValue(readDocField(field, data)) !== '—');
        particulars = [];
        if (!rows.length) return;
        blocks.push(
          <table key={rows.map((field) => field.path).join('|')} className="individual-particulars" data-style-spot={claimSpot('table')}>
            <thead>
              <tr>
                <th>{tf('Particular')}</th>
                <th>{tf('Details')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((field) => {
                const text = formatDocValue(readDocField(field, data));
                const empty = text === '—';
                return (
                  <tr key={field.path}>
                    <td className="part">{tf(field.label)}</td>
                    <td className={empty ? 'is-empty' : ''}>
                      {editableValue(field.path, text, readDocField(field, data))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        );
      };
      const prose = (field: IndividualDocField, text: string) => (
        <article key={field.path} className="individual-qa-block" data-style-spot={claimSpot('body')}>
          <h3 className="individual-qa-q">{tf(field.label)}</h3>
          <div className={`individual-qa-a${text === '—' ? ' is-empty' : ''}`}>
            {editableValue(field.path, text, readDocField(field, data), true)}
          </div>
        </article>
      );
      const dataTable = (
        key: string,
        title: string,
        headers: string[],
        body: string[][],
        cellPaths?: Array<Array<string | null>>,
        skipIndexes: number[] = [],
        keepAll = false
      ) => {
        const paired = body.map((row, index) => ({ row, paths: cellPaths?.[index] }));
        const kept = keepAll || showEmpty ? paired : paired.filter(({ row }) => isEnteredDocRow(row, skipIndexes));
        if (!kept.length && showEmpty) kept.push({ row: headers.map(() => ''), paths: cellPaths?.[0] });
        if (!kept.length) return null;
        const money = /yearProjection|machinery|costPhasing|means|finance|sales/i.test(key);
        return (
        <table key={key} className="individual-particulars" data-style-spot={money ? claimSpot('money') : claimSpot('table')}>
          <caption className="individual-qa-q">{tf(title)}</caption>
          <thead>
            <tr>{headers.map((header) => <th key={header}>{tf(header)}</th>)}</tr>
          </thead>
          <tbody>
            {kept.map(({ row, paths }, index) => (
              <tr key={index}>{row.map((cell, cellIndex) => {
                const cellPath = paths?.[cellIndex];
                return (
                  <td key={cellIndex}>
                    {cellPath && onEditField ? (
                      <DocControl
                        path={cellPath}
                        display={cell || '—'}
                        raw={cell}
                        input={getDocCellInput(fieldName(cellPath), cell)}
                        placeholder={typeHere}
                        onEdit={onEditField}
                        track={trackFieldHits}
                        tf={tf}
                      />
                    ) : (cell || '—')}
                  </td>
                );
              })}</tr>
            ))}
          </tbody>
        </table>
        );
      };
      const editPaths = (base: string, keys: Array<string | null>, count: number) => {
        if (!onEditField) return undefined;
        const rows = Math.max(count, 1);
        return Array.from({ length: rows }, (_, index) => keys.map((key) => (key ? `${base}[${index}].${key}` : null)));
      };

      for (const field of fields) {
        const raw = readDocField(field, data);
        if (field.name === 'yearProjections' && schemeCode !== 'AP_CMEP') {
          flushParticulars();
          const years = Array.isArray(raw) ? raw : [];
          blocks.push(dataTable(
            field.path,
            field.label,
            ['Year', 'Sales (₹ Lakhs)', 'Raw material', 'Wages', 'Power', 'Net profit'],
            years.map((row) => {
              const item = row && typeof row === 'object' ? row as Record<string, unknown> : {};
              return [
                item.year != null ? `Year ${item.year}` : String(item.label || ''),
                String(item.sales ?? ''),
                String(item.rm ?? ''),
                String(item.wages ?? ''),
                String(item.power ?? ''),
                String(item.netProfit ?? ''),
              ];
            }),
            editPaths(field.path, [null, 'sales', 'rm', 'wages', 'power', 'netProfit'], years.length),
            [0]
          ));
          continue;
        }
        if (field.name === 'yearProjections' && schemeCode === 'AP_CMEP') {
          flushParticulars();
          const columns = normalizeCmepProjections(raw);
          if (!cmepProjectionsHaveFigures(columns) && !showEmpty) continue;
          const amount = (value: number) => (Number.isInteger(value) ? String(value) : String(Math.round(value * 100) / 100));
          blocks.push(dataTable(
            field.path,
            'Sales and operating costs (₹ Lakhs)',
            ['Year', 'Sales', 'Raw material', 'Wages', 'Power', 'Salaries', 'Rent', 'Maintenance', 'Admin'],
            columns.map((col) => [col.label, amount(col.sales), amount(col.rm), amount(col.wages), amount(col.power), amount(col.salaries), amount(col.rent), amount(col.maintenance), amount(col.admin)]),
            undefined,
            [0],
            true
          ));
          blocks.push(dataTable(
            `${field.path}.profit`,
            'Interest, depreciation and profit (₹ Lakhs)',
            ['Year', 'Interest', 'Depreciation', 'Tax', 'Net profit'],
            columns.map((col) => [col.label, amount(col.interest), amount(col.depreciation), amount(col.tax), amount(col.netProfit)]),
            undefined,
            [0],
            true
          ));
          const derived = deriveCmepBankSheets({ step12: data.step12, step13: data.step13, step15: data.step15 });
          const derivedEntered = [
            derived.repayment.amount,
            derived.breakEvenSales,
            derived.averageDscr,
          ].some((value) => Number(value) !== 0)
            || derived.depreciation.some((asset) => asset.years.some((year) => year.additions !== 0 || year.depreciation !== 0));
          if (!derivedEntered && !showEmpty) continue;
          blocks.push(
            <table key="cmep-repay" className="individual-particulars">
              <caption className="individual-qa-q">{tf('Repayment, break-even and DSCR')}</caption>
              <thead>
                <tr>
                  <th>{tf('Particular')}</th>
                  <th>{tf('Details')}</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Term loan (₹ Lakhs)', amount(derived.repayment.amount)],
                  ['Interest rate (% per year)', amount(Number(data.step13?.interestRate) || 0)],
                  ['Moratorium (months)', String(derived.repayment.moratoriumMonths || 0)],
                  ['Loan tenure (months)', String(Number(data.step13?.loanTenureMonths) || 0)],
                  ['Indicative EMI (₹ Lakhs)', amount(derived.repayment.emi)],
                  ['Break-even sales (₹ Lakhs)', amount(derived.breakEvenSales)],
                  ['Break-even capacity (%)', amount(derived.breakEvenCapacity)],
                  ['Average DSCR', amount(derived.averageDscr)],
                ].filter(([, value]) => showEmpty || isEnteredDocText(value)).map(([label, value]) => (
                  <tr key={label}>
                    <td className="part">{tf(label)}</td>
                    <td>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          );
          blocks.push(dataTable(
            'cmep-dscr',
            'DSCR by year (₹ Lakhs)',
            ['Year', 'Cash profit', 'Repayment', 'DSCR'],
            derived.dscr.map((row) => [row.label, amount(row.cashProfit), amount(row.repayment), amount(row.ratio)]),
            undefined,
            [0]
          ));
          derived.depreciation.forEach((asset) => {
            blocks.push(dataTable(
              `cmep-dep-${asset.asset}`,
              `${asset.asset} — depreciation ${Math.round(asset.rate * 100)}%`,
              ['Year', 'Opening', 'Additions', 'Depreciation', 'Closing'],
              asset.years.map((year) => [year.label, amount(year.opening), amount(year.additions), amount(year.depreciation), amount(year.closing)]),
              undefined,
              [0]
            ));
          });
          continue;
        }
        if (field.name === 'productMix') {
          flushParticulars();
          const mix = normalizeProductMix(raw);
          blocks.push(dataTable(field.path, field.label, ['Product', 'Share of output (%)', 'Selling price (₹)'], mix.map((row) => [row.name, String(row.sharePercent || ''), String(row.sellingPrice || '')]), editPaths(field.path, ['name', 'sharePercent', 'sellingPrice'], mix.length)));
          continue;
        }
        if (field.name === 'rawMaterialItems') {
          flushParticulars();
          const materials = normalizeRawMaterials(raw);
          blocks.push(dataTable(field.path, field.label, ['Material', 'Use', 'How it is bought'], materials.map((row) => [row.name, row.use, row.basis]), editPaths(field.path, ['name', 'use', 'basis'], materials.length)));
          continue;
        }
        if (field.name === 'staffRoles') {
          flushParticulars();
          const roles = normalizeStaffRoles(raw);
          blocks.push(dataTable(field.path, field.label, ['Role', 'Number of people', 'Monthly pay (₹)'], roles.map((row) => [row.role, String(row.count || ''), String(row.monthlyPay || '')]), editPaths(field.path, ['role', 'count', 'monthlyPay'], roles.length)));
          continue;
        }
        if (field.name === 'risks') {
          flushParticulars();
          const risks = normalizeRisks(raw);
          blocks.push(dataTable(field.path, field.label, ['Risk', 'How it will be handled'], risks.map((row) => [row.risk, row.mitigation]), editPaths(field.path, ['risk', 'mitigation'], risks.length)));
          continue;
        }
        if (field.name === 'utilisationByYear') {
          flushParticulars();
          const utilisation = normalizeUtilisationYears(raw);
          blocks.push(dataTable(field.path, field.label, ['Year', 'Capacity utilisation (%)'], utilisation.map((row) => [row.label, String(row.percent || '')]), editPaths(field.path, ['label', 'percent'], utilisation.length)));
          continue;
        }
        if (field.name === 'milestones') {
          flushParticulars();
          const milestones = normalizeMilestones(raw);
          blocks.push(dataTable(field.path, field.label, ['Activity', 'Time', 'Start', 'End'], milestones.map((row) => [row.activity, row.timeRequired, row.startDate, row.endDate]), editPaths(field.path, ['activity', 'timeRequired', 'startDate', 'endDate'], milestones.length)));
          continue;
        }
        if (field.name === 'promoters') {
          flushParticulars();
          const promoters = (Array.isArray(raw) ? normalizePromoters(raw) : []).filter((row) => showEmpty || isEnteredDocRow([
            row.name, row.relationName, row.age, row.education, row.experienceYears, row.phone,
          ]));
          blocks.push(dataTable(field.path, field.label, ['Name', 'Relation', 'Age', 'Education', 'Experience (years)', 'Phone'], promoters.map((row) => [row.name, row.relationName, row.age, row.education, row.experienceYears, row.phone]), editPaths(field.path, ['name', 'relationName', 'age', 'education', 'experienceYears', 'phone'], promoters.length)));
          continue;
        }
        if (field.name === 'machineryItems') {
          flushParticulars();
          const items = normalizeMachineryItems(raw).filter((row) => showEmpty || isEnteredDocRow([
            row.description,
            row.condition,
            row.supplier,
            row.quantity > 1 ? row.quantity : '',
            row.unitCost,
            row.gst,
            row.transport,
            row.installation,
            row.lifeYears,
            row.annualMaintenance,
          ]));
          const detailed = schemeCode === 'AP_CMEP';
          const headers = ['Description', 'New / used', 'Supplier', 'Qty', 'Unit cost (₹ Lakhs)'];
          if (detailed) headers.push('GST', 'Transport', 'Installation', 'Life (years)', 'Yearly maintenance');
          const machineKeys = ['description', 'condition', 'supplier', 'quantity', 'unitCost'];
          if (detailed) machineKeys.push('gst', 'transport', 'installation', 'lifeYears', 'annualMaintenance');
          blocks.push(dataTable(field.path, field.label, headers, items.map((row) => {
            const cells = [row.description, row.condition, row.supplier, String(row.quantity || ''), String(row.unitCost || '')];
            if (detailed) cells.push(String(row.gst || ''), String(row.transport || ''), String(row.installation || ''), String(row.lifeYears || ''), String(row.annualMaintenance || ''));
            return cells;
          }), editPaths(field.path, machineKeys, items.length)));
          continue;
        }
        if (field.name === 'assetItems') {
          flushParticulars();
          const assets = normalizeAssetItems(raw).filter((row) => showEmpty || isEnteredDocRow([row.item, row.quantity > 1 ? row.quantity : '', row.unitCost]));
          blocks.push(dataTable(field.path, field.label, ['Asset', 'Type', 'Qty', 'Unit cost (₹ Lakhs)'], assets.map((row) => [row.item, row.category, String(row.quantity || ''), String(row.unitCost || '')])));
          continue;
        }
        if (field.name === 'costPhasing') {
          flushParticulars();
          const phasing = normalizeCostPhasing(raw, data.step12);
          blocks.push(dataTable(field.path, field.label, ['Particulars', 'Already incurred', 'To be incurred', 'Total'], CMEP_COST_HEADS.map((head) => {
            const cell = phasing[head.key];
            return [tf(head.label), String(cell.incurred || 0), String(cell.proposed || 0), String((cell.incurred || 0) + (cell.proposed || 0))];
          }), undefined, [0]));
          continue;
        }
        const text = formatDocValue(raw);
        if (text === '—' && !showEmpty) continue;
        if (NARRATIVE_FIELDS.has(field.name) || text.length > 160) {
          flushParticulars();
          blocks.push(prose(field, text));
          continue;
        }
        particulars.push(field);
      }
      flushParticulars();
      const visible = blocks.filter(Boolean);
      if (!visible.length) return null;
      return <div className="individual-sec-body">{visible}</div>;
  };

  const blockVisible = (sectionId: string) => (style?.sectionBlocks?.[sectionId] || []).some((block) => {
    if (block.kind === 'image') return !block.hidden;
    return Boolean(block.text?.trim()) || Boolean(onEditBlock);
  });
  const fieldHasAnswers = (field: IndividualDocField) => {
    const raw = readDocField(field, data);
    if (field.name === 'yearProjections' && schemeCode === 'AP_CMEP') {
      return cmepProjectionsHaveFigures(normalizeCmepProjections(raw));
    }
    if (field.name === 'yearProjections') {
      const years = Array.isArray(raw) ? raw : [];
      return years.some((row) => {
        const item = row && typeof row === 'object' ? row as Record<string, unknown> : {};
        return isEnteredDocRow([item.sales, item.rm, item.wages, item.power, item.netProfit]);
      });
    }
    if (field.name === 'productMix') return normalizeProductMix(raw).some((row) => isEnteredDocRow([row.name, row.sharePercent, row.sellingPrice]));
    if (field.name === 'rawMaterialItems') return normalizeRawMaterials(raw).some((row) => isEnteredDocRow([row.name, row.use, row.basis]));
    if (field.name === 'staffRoles') return normalizeStaffRoles(raw).some((row) => isEnteredDocRow([row.role, row.count, row.monthlyPay]));
    if (field.name === 'risks') return normalizeRisks(raw).some((row) => isEnteredDocRow([row.risk, row.mitigation]));
    if (field.name === 'utilisationByYear') return normalizeUtilisationYears(raw).some((row) => isEnteredDocRow([row.label, row.percent]));
    if (field.name === 'milestones') return normalizeMilestones(raw).some((row) => isEnteredDocRow([row.activity, row.timeRequired, row.startDate, row.endDate]));
    if (field.name === 'promoters') {
      return (Array.isArray(raw) ? normalizePromoters(raw) : []).some((row) => isEnteredDocRow([
        row.name, row.relationName, row.age, row.education, row.experienceYears, row.phone,
      ]));
    }
    if (field.name === 'machineryItems') {
      return normalizeMachineryItems(raw).some((row) => isEnteredDocRow([
        row.description, row.condition, row.supplier, row.quantity > 1 ? row.quantity : '', row.unitCost,
        row.gst, row.transport, row.installation, row.lifeYears, row.annualMaintenance,
      ]));
    }
    if (field.name === 'assetItems') {
      return normalizeAssetItems(raw).some((row) => isEnteredDocRow([row.item, row.quantity > 1 ? row.quantity : '', row.unitCost]));
    }
    if (field.name === 'costPhasing') {
      const phasing = normalizeCostPhasing(raw, data.step12);
      return CMEP_COST_HEADS.some((head) => isEnteredDocRow([phasing[head.key]?.incurred, phasing[head.key]?.proposed]));
    }
    return formatDocValue(raw) !== '—';
  };
  const sectionHasAnswers = (def: (typeof catalogSteps)[number]) => {
    if (style?.hiddenSectionIds.includes(def.id)) return false;
    if (showEmpty) return true;
    if (def.id === 'uploads' || def.contentStep === 18) {
      return uploads.some((item) => isKycUploaded(uploadStore[item.id] || uploadStore[item.label])) || blockVisible(def.id);
    }
    return getIndividualDocFields(def.contentStep, schemeCode, budget, kind).some(fieldHasAnswers) || blockVisible(def.id);
  };
  type ReportEntry = { id: string; title: string; custom: boolean; n: number };
  const reportEntries: ReportEntry[] = (style ? layoutOrder(catalogSteps, style) : catalogSteps.map((step) => step.id)).flatMap((token): ReportEntry[] => {
    if (pictureIdFromToken(token)) return [];
    const custom = style?.customSections?.find((item) => item.id === token);
    if (custom) {
      if (style?.hiddenSectionIds.includes(custom.id)) return [];
      return [{ id: custom.id, title: custom.title, custom: true as const, n: 0 }];
    }
    const def = catalogSteps.find((step) => step.id === token);
    if (!def || !sectionHasAnswers(def)) return [];
    return [{ id: def.id, title: sectionTitleFromStep(def), custom: false as const, n: def.n }];
  });

  const unitTitle = String(step1.unitName || step1.clusterName || '').trim();

  return (
    <div
      className={`dpr-document individual-dpr-document${schemeUi ? ` ${schemeUi.documentClass}` : ''}${
        style ? ' dpr-styled' : ''
      }${style?.tableStriped ? ' dpr-striped' : ''}${style?.wideTablesLandscape ? ' dpr-wide-landscape' : ''}`}
      style={style ? styleCssVars(style) : undefined}
      data-dpr-styled={style ? '1' : undefined}
      data-template={style?.preset}
      data-page-size={style?.pageSize}
      data-page-edge-top={style ? String(pageEdgeMm(style.marginMm.top)) : undefined}
      data-page-edge-bottom={style ? String(pageEdgeMm(style.marginMm.bottom)) : undefined}
      data-wide-landscape={style?.wideTablesLandscape ? '1' : undefined}
      data-page-numbers={style?.pageNumberStyle}
      data-page-of-label={style ? tf('Page {n} of {total}') : undefined}
      data-page-print-before={style?.pageNumberStyle === 'of' ? tf('Page ') : undefined}
      data-page-print-mid={style?.pageNumberStyle === 'of' ? tf(' of ') : undefined}
    >
      {markStyleSpots ? <div data-style-spot="page" className="h-1" aria-hidden /> : null}
      {style?.watermark ? (
        <div className="dpr-watermark" aria-hidden="true" data-style-spot={markStyleSpots ? 'watermark' : undefined}>
          {style.watermark}
        </div>
      ) : null}
      {style && (style.agencyName || style.logoDataUrl || style.headerLine) ? (
        <div
          className={`dpr-style-header is-${style.logoAlign}${style.headerLine ? ' has-line' : ''}`}
          data-style-spot={markStyleSpots ? 'header' : undefined}
        >
          {style.logoDataUrl ? <img src={style.logoDataUrl} alt="" className="dpr-style-logo" /> : null}
          {style.agencyName ? <span>{style.agencyName}</span> : null}
        </div>
      ) : null}
      <header className="individual-cover" onFocusCapture={coverDef ? focusIn(coverDef.n, coverDef.id) : undefined}>
        {schemeUi?.id === 'PMEGP' ? (
          <>
            <div className="pmegp-flag-band" aria-hidden="true" />
            <div className="pmegp-cover-top">
              <div className="pmegp-agency">
                <span className="pmegp-agency-mark">{tf('KVIC')}</span>
                <span className="pmegp-agency-text">{tf('Khadi & Village Industries Commission')}</span>
              </div>
              <p className="cover-pack-badge">{tf(schemeUi.badge)}</p>
            </div>
          </>
        ) : schemeUi ? (
          <p className="cover-pack-badge">{tf(schemeUi.badge)}</p>
        ) : null}
        <p className="cover-kicker">{schemeUi ? tf(schemeUi.coverKicker) : 'DETAILED PROJECT REPORT'}</p>
        <p className="cover-on">{tf('On')}</p>
        <p className="cover-action">{tf(cover.actionLine)}</p>
        {unitTitle || showEmpty ? (
          <h1 className="cover-unit" data-style-spot={markStyleSpots ? 'cover' : undefined}>
            {onEditField
              ? editableValue('step1.unitName', unitTitle || '—', step1.unitName || step1.clusterName || '')
              : fieldHit('step1.unitName', unitTitle, trackFieldHits)}
          </h1>
        ) : null}
        <div className="cover-scheme-block">
          <p className="cover-scheme">{cover.underLine}</p>
          {schemeUi ? <p className="cover-tagline">{tf(schemeUi.tagline)}</p> : null}
        </div>
        {(showEmpty || step1.district || step1.location || extras.entrepreneurName) ? (
          <div className={`cover-meta${schemeUi?.id === 'PMEGP' ? ' pmegp-cover-meta' : ''}`}>
            {showEmpty || step1.district ? (
              <div>
                <span>{tf('District')}</span>
                {editableValue('step1.district', step1.district || '—', step1.district)}
              </div>
            ) : null}
            {showEmpty || step1.location ? (
              <div>
                <span>{tf('Location')}</span>
                {editableValue('step1.location', step1.location || '—', step1.location)}
              </div>
            ) : null}
            {showEmpty || extras.entrepreneurName ? (
              <div>
                <span>{tf('Entrepreneur name')}</span>
                {editableValue('schemeExtras.entrepreneurName', extras.entrepreneurName || '—', extras.entrepreneurName)}
              </div>
            ) : null}
          </div>
        ) : null}
        {schemeUi?.id === 'PMEGP' ? <div className="pmegp-cover-rule" aria-hidden="true" /> : null}
      </header>

      {reportEntries.length ? (
      <section className="individual-toc">
        <h2 className="individual-sec-title">
          <span className="individual-sec-num">0</span>
          {tf('Table of Contents')}
        </h2>
        <ol className="individual-toc-list">
          {reportEntries.map((entry, index) => (
            <li
              key={entry.id}
              className={onSectionClick && !entry.custom ? 'is-clickable' : undefined}
              onClick={() => { if (!entry.custom) onSectionClick?.(entry.n); }}
            >
              <span className="toc-num">{index + 1}</span>
              <span className="toc-label">{entry.custom ? entry.title : tf(entry.title)}</span>
            </li>
          ))}
        </ol>
      </section>
      ) : null}

      {(style ? layoutOrder(catalogSteps, style) : catalogSteps.map((step) => step.id)).map((token) => {
        const custom = style?.customSections?.find((item) => item.id === token);
        if (custom) {
          if (style?.hiddenSectionIds.includes(custom.id)) return null;
          const customNum = reportEntries.findIndex((entry) => entry.id === custom.id) + 1;
          return (
            <section key={custom.id} data-dpr-section={custom.id} className="individual-sec">
              <h2 className="individual-sec-title">
                <span className="individual-sec-num">{customNum}</span>
                {custom.title}
              </h2>
              {renderBlocks(custom.id)}
            </section>
          );
        }
        const picId = pictureIdFromToken(token);
        if (picId) {
          const picture = style?.pictures?.find((item) => item.id === picId);
          if (!picture || picture.hidden) return null;
          return (
            <SlotFigure
              key={picture.id}
              src={picture.src}
              frame={picture.frame}
              onFrame={onImageFrame ? (box) => onImageFrame(picture.id, box) : undefined}
            />
          );
        }
        const def = catalogSteps.find((step) => step.id === token);
        if (!def || !sectionHasAnswers(def)) return null;
        const title = tf(sectionTitleFromStep(def));
        const num = reportEntries.findIndex((entry) => entry.id === def.id) + 1;
        const hot = activeSectionId === def.id;
        if (def.id === 'uploads' || def.contentStep === 18) {
          const uploaded = showEmpty
            ? uploads
            : uploads.filter((item) => isKycUploaded(uploadStore[item.id] || uploadStore[item.label]));
          return (
            <section key={def.id} id={`individual-section-${def.n}`} data-dpr-section={def.id} onFocusCapture={focusIn(def.n, def.id)} className={`individual-sec${hot ? ' dpr-sec-hot' : ''}`}>
              <h2 className="individual-sec-title">
                <span className="individual-sec-num">{num}</span>
                {title}
              </h2>
              {uploaded.length ? (
                <ul className="individual-doc-list">
                  {uploaded.map((u) => (
                    <li key={u.id} className={isKycUploaded(uploadStore[u.id] || uploadStore[u.label]) ? 'is-uploaded' : undefined}>
                      <span className="doc-label">{tf(u.label)}</span>
                      <span className="doc-status">{isKycUploaded(uploadStore[u.id] || uploadStore[u.label]) ? tf('Uploaded') : tf('Not uploaded')}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
              {renderBlocks(def.id)}
            </section>
          );
        }
        const fields = getIndividualDocFields(def.contentStep, schemeCode, budget, kind);
        return (
          <section key={def.id} id={`individual-section-${def.n}`} data-dpr-section={def.id} onFocusCapture={focusIn(def.n, def.id)} className={`individual-sec${hot ? ' dpr-sec-hot' : ''}`}>
            <h2 className="individual-sec-title">
              <span className="individual-sec-num">{num}</span>
              {title}
            </h2>
            {def.contentStep === 12 || def.contentStep === 13 ? <ScheduleDocParties data={data} showEmpty={showEmpty} /> : null}
            {def.contentStep === 15 ? <FinanceDocSummary data={data} showEmpty={showEmpty} /> : null}
            {renderSectionFields(fields)}
            {renderBlocks(def.id)}
          </section>
        );
      })}

      {style?.agencyName ? (
        <footer className="dpr-style-footer">
          <span>{style.agencyName}</span>
        </footer>
      ) : null}

      {schemeUi?.id === 'PMEGP' && !style ? (
        <footer className="pmegp-doc-footer">
          <span>{tf('PMEGP · Bank-unit Detailed Project Report')}</span>
          <span>{tf('Confidential — for lending appraisal')}</span>
        </footer>
      ) : null}
    </div>
  );
};
