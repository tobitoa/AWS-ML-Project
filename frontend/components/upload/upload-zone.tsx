'use client';

import { useRef, useState } from 'react';
import { FileUp } from 'lucide-react';

interface UploadZoneProps {
  onFile: (file: File) => void;
  busy: boolean;
  currentName?: string;
}

export function UploadZone({ onFile, busy, currentName }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const accept = (file?: File) => {
    if (file) onFile(file);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      className="upload-zone"
      data-dragging={dragging}
      onClick={() => inputRef.current?.click()}
      onKeyDown={event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={event => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={event => {
        event.preventDefault();
        setDragging(false);
        accept(event.dataTransfer.files[0]);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".tsv,.csv,text/tab-separated-values,text/csv"
        aria-label="Choose a TSV or CSV dataset"
        onChange={event => accept(event.currentTarget.files?.[0])}
      />
      <span className="mono text-2xs text-muted font-medium" style={{ letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        INPUT DATA / TABULAR FEED
      </span>
      {busy ? (
        <span className="spinner" aria-label="Uploading" />
      ) : (
        <FileUp size={22} strokeWidth={1.6} />
      )}
      <strong>{busy ? 'Uploading & verifying schema…' : currentName ? `Replace ${currentName}` : 'Select dataset or drop file'}</strong>
      <span>CSV · TSV · maximum 100 MB</span>
    </div>
  );
}
