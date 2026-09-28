import { CircleAlert } from 'lucide-react';

export function ErrorNotice({ message }: { message: string }) {
  return (
    <div className="notice notice-error" role="alert">
      <CircleAlert size={15} />
      <span>{message}</span>
    </div>
  );
}
