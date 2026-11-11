import React from 'react';
import { AlertCircle, CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { useClusterFormText } from '@/lib/clusterDprFormText';

export const UPLOAD_ACCEPT = '.pdf,.doc,.docx,.jpg,.jpeg,.png';

interface UploadSlotProps {
  id: string;
  /** The field label, already drawn by the form (with its help text). */
  label: React.ReactNode;
  /** Name of the file kept for this slot, or null when nothing is uploaded. */
  uploadedName: string | null;
  uploading: boolean;
  failed: boolean;
  onFile: (file: File | null) => void;
}

/**
 * One document slot in "Documents & uploads". Every slot has the same parts in the same order: the label, the file box,
 * and one status line that is always there (not uploaded, uploading, uploaded with the file name, or failed). The line
 * keeps its height in every state, so slots line up and nothing jumps when a file arrives.
 */
export const UploadSlot: React.FC<UploadSlotProps> = ({ id, label, uploadedName, uploading, failed, onFile }) => {
  const tf = useClusterFormText();
  const state = uploading ? 'uploading' : uploadedName ? 'uploaded' : failed ? 'failed' : 'empty';
  const tone = {
    uploading: 'text-muted-foreground',
    uploaded: 'text-success-text',
    failed: 'text-destructive-text',
    empty: 'text-muted-foreground',
  }[state];
  return (
    <div data-upload-slot={id} data-upload-state={state}>
      {label}
      <Input
        type="file"
        accept={UPLOAD_ACCEPT}
        onChange={(e) => onFile(e.target.files?.[0] || null)}
        disabled={uploading}
        aria-describedby={`upload-status-${id}`}
      />
      <p id={`upload-status-${id}`} role="status" aria-live="polite" className={`mt-1 flex min-h-[1.5rem] items-center gap-1.5 text-sm ${tone}`}>
        {state === 'uploading' ? (
          <>
            <Loader2 className="h-4 w-4 flex-none animate-spin" aria-hidden="true" />
            <span>{tf('Uploading…')}</span>
          </>
        ) : state === 'uploaded' ? (
          <>
            <CheckCircle2 className="h-4 w-4 flex-none" aria-hidden="true" />
            <span className="min-w-0 break-words">{tf('Uploaded')}: {uploadedName}</span>
          </>
        ) : state === 'failed' ? (
          <>
            <AlertCircle className="h-4 w-4 flex-none" aria-hidden="true" />
            <span>{tf('Upload failed. Choose the file again.')}</span>
          </>
        ) : (
          <>
            <Circle className="h-4 w-4 flex-none" aria-hidden="true" />
            <span>{tf('Not uploaded yet')}</span>
          </>
        )}
      </p>
    </div>
  );
};
