import React from 'react';
import { deriveProfile, isAutoFilled } from '@/lib/individualDpr/contextReuse';
import { useClusterFormText } from '@/lib/clusterDprFormText';

type AnyData = Record<string, any>;

function useRows(data: AnyData) {
  const tf = useClusterFormText();
  const profile = deriveProfile(data);
  return {
    tf,
    rows: [
      { label: 'Promoter / applicant', value: profile.promoterName },
      { label: 'Unit', value: profile.unitName },
      { label: 'Address', value: profile.address },
      { label: 'GSTIN', value: profile.gstin },
    ],
  };
}

/** The promoter, unit, address and GST that the project cost and bank loan schedules carry. Read-only. */
export const ScheduleParties: React.FC<{ data: AnyData }> = ({ data }) => {
  const { tf, rows } = useRows(data);
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4" data-schedule-parties>
      <h3 className="text-sm font-semibold">{tf('Details carried to this schedule')}</h3>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {tf('These come from your unit details (step 1) and applicant details (step 11). Change them there and they update here.')}
      </p>
      <dl className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2">
        {rows.map((row) => (
          <div key={row.label}>
            <dt className="text-xs text-muted-foreground">{tf(row.label)}</dt>
            <dd className="text-sm font-medium">
              {row.value || <span className="font-normal text-muted-foreground">{tf('Not entered yet')}</span>}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
};

/** The same details as a table at the top of the project cost and bank loan sections of the document. */
export const ScheduleDocParties: React.FC<{ data: AnyData; showEmpty?: boolean }> = ({ data, showEmpty = false }) => {
  const { tf, rows } = useRows(data);
  const shown = rows.filter((row) => showEmpty || row.value);
  if (!shown.length) return null;
  return (
    <table className="individual-particulars" data-schedule-parties>
      <caption className="individual-qa-q">{tf('Applicant details for this schedule')}</caption>
      <thead>
        <tr>
          <th>{tf('Particular')}</th>
          <th>{tf('Details')}</th>
        </tr>
      </thead>
      <tbody>
        {shown.map((row) => (
          <tr key={row.label}>
            <td className="part">{tf(row.label)}</td>
            <td>{row.value || '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

/** A short line under an input that was filled from earlier answers, while it still holds that value. */
export const ReusedNote: React.FC<{ data: AnyData; path: string; text: string }> = ({ data, path, text }) => {
  const tf = useClusterFormText();
  if (!isAutoFilled(data, path)) return null;
  return (
    <p className="mt-1 text-xs text-muted-foreground" data-reused-note>
      {tf(text)}
    </p>
  );
};
