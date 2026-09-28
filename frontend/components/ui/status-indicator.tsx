type Tone = 'default' | 'success' | 'error' | 'progress' | 'muted';

const TONES: Record<string, Tone> = {
  completed: 'success',
  matched: 'success',
  valid: 'success',
  running: 'progress',
  queued: 'muted',
  unmatched: 'muted',
  failed: 'error',
};

function label(status: string) {
  const value = status.trim();
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

export function StatusIndicator({ status }: { status: string }) {
  const tone = TONES[status.toLowerCase()] ?? 'default';
  return (
    <span className="status" data-tone={tone}>
      <span className="status-dot" aria-hidden="true" />
      {label(status)}
    </span>
  );
}
