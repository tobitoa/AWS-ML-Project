import { Search } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
}

export function SearchBar({ value, onChange, label, placeholder }: SearchBarProps) {
  return (
    <label className="search-field">
      <Search size={14} />
      <input
        className="input"
        type="search"
        value={value}
        onChange={event => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={label}
      />
    </label>
  );
}
