'use client';

import { CheckCircle2, Moon, Sun, Sparkles } from 'lucide-react';
import { useTheme, type ThemePreference } from './theme-provider';

interface ThemeOption {
  id: ThemePreference;
  title: string;
  badge?: string;
  description: string;
  icon: typeof Moon;
}

const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'dark',
    title: 'Dark Theme',
    badge: 'Standard',
    description: 'Deep charcoal and dark graphite surfaces with focused contrast',
    icon: Moon,
  },
  {
    id: 'light',
    title: 'Light Theme',
    description: 'High-clarity neutral daylight surfaces for illuminated environments',
    icon: Sun,
  },
  {
    id: 'resomesh',
    title: 'RESOMESH-Theme',
    badge: 'Fluid Bubble UI',
    description: 'Luminous light canvas with pastel blue, pink, and mint bubble surfaces & fluid atmosphere',
    icon: Sparkles,
  },
];

export function ThemeSelector() {
  const { preference, setPreference } = useTheme();

  return (
    <div className="theme-selector-container">
      <div className="theme-options-grid">
        {THEME_OPTIONS.map(opt => {
          const isSelected = preference === opt.id;
          const Icon = opt.icon;

          return (
            <button
              key={opt.id}
              type="button"
              className={`theme-option-card ${isSelected ? 'active' : ''} ${opt.id === 'resomesh' ? 'theme-card-resomesh' : ''}`}
              onClick={() => setPreference(opt.id)}
              aria-pressed={isSelected}
            >
              <div className="theme-card-top">
                <div className="theme-card-icon-box">
                  <Icon size={18} className="theme-card-icon" />
                </div>
                {isSelected ? (
                  <span className="theme-selected-pill">
                    <CheckCircle2 size={12} className="text-success" />
                    <span>Active</span>
                  </span>
                ) : (
                  <span className="theme-select-hint">Select</span>
                )}
              </div>

              <div className="theme-card-content">
                <div className="flex items-center gap-2">
                  <span className="theme-card-title">{opt.title}</span>
                  {opt.badge && (
                    <span className={`theme-card-badge ${opt.id === 'resomesh' ? 'badge-resomesh' : ''}`}>
                      {opt.badge}
                    </span>
                  )}
                </div>
                <p className="theme-card-desc">{opt.description}</p>
              </div>

              {opt.id === 'resomesh' && (
                <div className="theme-preview-box" aria-hidden="true">
                  <div className="theme-preview-droplets">
                    <div className="preview-droplet p-droplet-1" />
                    <div className="preview-droplet p-droplet-2" />
                    <div className="preview-droplet p-droplet-3" />
                  </div>
                  <div className="theme-preview-surface">
                    <span className="preview-brand-tag">RESOMESH</span>
                    <span className="preview-caption">Fluid Interface · Atmospheric</span>
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
