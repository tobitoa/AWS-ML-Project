'use client';

import { useState, useEffect } from 'react';
import { PageHeading } from '@/components/ui/page-heading';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThemeSelector } from '@/components/theme/theme-selector';
import { api } from '@/lib/api';
import {
  Palette,
  Sliders,
  Eye,
  Bell,
  Accessibility,
  Database,
  CheckCircle2,
  RefreshCw,
  Info,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Cpu,
  Layers,
  Trash2,
  RotateCcw,
} from 'lucide-react';

export default function SettingsPage() {
  // Appearance & Motion
  const [animationIntensity, setAnimationIntensity] = useState('fluid');
  const [enableDroplets, setEnableDroplets] = useState(true);

  // Workspace Defaults
  const [pageSize, setPageSize] = useState('25');
  const [defaultSort, setDefaultSort] = useState('confidence_desc');
  const [rememberFilters, setRememberFilters] = useState(true);

  // Results & Table Display
  const [confidenceFormat, setConfidenceFormat] = useState('percentage');
  const [matchTagDisplay, setMatchTagDisplay] = useState('compact');
  const [tableDensity, setTableDensity] = useState('comfortable');

  // Notifications
  const [notifyRunCompleted, setNotifyRunCompleted] = useState(true);
  const [notifyRunFailed, setNotifyRunFailed] = useState(true);
  const [notifyValidation, setNotifyValidation] = useState(true);

  // Accessibility
  const [reducedMotion, setReducedMotion] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [fontScale, setFontScale] = useState('standard');

  // Diagnostics & Status
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [healthStatus, setHealthStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [modelDetails, setModelDetails] = useState<{ name: string; mode: string } | null>(null);

  // Save feedback state
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [clearCacheMessage, setClearCacheMessage] = useState('');

  // Load stored preferences
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const savedPageSize = localStorage.getItem('resomesh_page_size');
      if (savedPageSize) setPageSize(savedPageSize);

      const savedSort = localStorage.getItem('resomesh_default_sort');
      if (savedSort) setDefaultSort(savedSort);

      const savedRemember = localStorage.getItem('resomesh_remember_filters');
      if (savedRemember !== null) setRememberFilters(savedRemember === 'true');

      const savedAnim = localStorage.getItem('resomesh_animation_intensity');
      if (savedAnim) setAnimationIntensity(savedAnim);

      const savedDroplets = localStorage.getItem('resomesh_enable_droplets');
      if (savedDroplets !== null) setEnableDroplets(savedDroplets === 'true');

      const savedConf = localStorage.getItem('resomesh_conf_format');
      if (savedConf) setConfidenceFormat(savedConf);

      const savedTags = localStorage.getItem('resomesh_match_tags');
      if (savedTags) setMatchTagDisplay(savedTags);

      const savedDensity = localStorage.getItem('resomesh_table_density');
      if (savedDensity) setTableDensity(savedDensity);

      const savedNotifComp = localStorage.getItem('resomesh_notif_completed');
      if (savedNotifComp !== null) setNotifyRunCompleted(savedNotifComp === 'true');

      const savedNotifFail = localStorage.getItem('resomesh_notif_failed');
      if (savedNotifFail !== null) setNotifyRunFailed(savedNotifFail === 'true');

      const savedNotifVal = localStorage.getItem('resomesh_notif_validation');
      if (savedNotifVal !== null) setNotifyValidation(savedNotifVal === 'true');

      const savedHighContrast = localStorage.getItem('resomesh_high_contrast');
      if (savedHighContrast !== null) {
        const isHigh = savedHighContrast === 'true';
        setHighContrast(isHigh);
        document.documentElement.setAttribute('data-contrast', isHigh ? 'high' : 'normal');
      }

      const savedFontScale = localStorage.getItem('resomesh_font_scale');
      if (savedFontScale) setFontScale(savedFontScale);

      // System reduced motion query
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      const savedMotion = localStorage.getItem('resomesh_reduced_motion');
      setReducedMotion(savedMotion !== null ? savedMotion === 'true' : mq.matches);
    } catch {
      // LocalStorage unavailable
    }

    // Health check for diagnostics panel
    api
      .health()
      .then(res => {
        setHealthStatus('online');
        setModelDetails({ name: res.model_name, mode: res.model_mode });
      })
      .catch(() => {
        setHealthStatus('offline');
        setModelDetails(null);
      });
  }, []);

  const handleSave = () => {
    setSaveState('saving');
    try {
      localStorage.setItem('resomesh_page_size', pageSize);
      localStorage.setItem('resomesh_default_sort', defaultSort);
      localStorage.setItem('resomesh_remember_filters', String(rememberFilters));
      localStorage.setItem('resomesh_animation_intensity', animationIntensity);
      localStorage.setItem('resomesh_enable_droplets', String(enableDroplets));
      localStorage.setItem('resomesh_conf_format', confidenceFormat);
      localStorage.setItem('resomesh_match_tags', matchTagDisplay);
      localStorage.setItem('resomesh_table_density', tableDensity);
      localStorage.setItem('resomesh_notif_completed', String(notifyRunCompleted));
      localStorage.setItem('resomesh_notif_failed', String(notifyRunFailed));
      localStorage.setItem('resomesh_notif_validation', String(notifyValidation));
      localStorage.setItem('resomesh_reduced_motion', String(reducedMotion));
      localStorage.setItem('resomesh_high_contrast', String(highContrast));
      localStorage.setItem('resomesh_font_scale', fontScale);

      document.documentElement.setAttribute('data-contrast', highContrast ? 'high' : 'normal');
    } catch {
      // Ignore storage errors
    }

    setTimeout(() => {
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 2500);
    }, 350);
  };

  const handleResetDefaults = () => {
    setPageSize('25');
    setDefaultSort('confidence_desc');
    setRememberFilters(true);
    setAnimationIntensity('fluid');
    setEnableDroplets(true);
    setConfidenceFormat('percentage');
    setMatchTagDisplay('compact');
    setTableDensity('comfortable');
    setNotifyRunCompleted(true);
    setNotifyRunFailed(true);
    setNotifyValidation(true);
    setReducedMotion(false);
    setHighContrast(false);
    setFontScale('standard');
    document.documentElement.setAttribute('data-contrast', 'normal');

    try {
      const keys = [
        'resomesh_page_size',
        'resomesh_default_sort',
        'resomesh_remember_filters',
        'resomesh_animation_intensity',
        'resomesh_enable_droplets',
        'resomesh_conf_format',
        'resomesh_match_tags',
        'resomesh_table_density',
        'resomesh_notif_completed',
        'resomesh_notif_failed',
        'resomesh_notif_validation',
        'resomesh_reduced_motion',
        'resomesh_high_contrast',
        'resomesh_font_scale',
      ];
      keys.forEach(k => localStorage.removeItem(k));
    } catch {
      // Storage unavailable
    }

    setSaveState('saved');
    setTimeout(() => setSaveState('idle'), 2500);
  };

  const handleClearCache = () => {
    try {
      // Retain theme preference, clear operational caches
      const theme = localStorage.getItem('resomesh-theme-preference');
      sessionStorage.clear();
      localStorage.removeItem('resomesh-run-id');
      localStorage.removeItem('convia-run-id');
      if (theme) localStorage.setItem('resomesh-theme-preference', theme);
      setClearCacheMessage('Local query cache and session states cleared successfully.');
      setTimeout(() => setClearCacheMessage(''), 4000);
    } catch {
      setClearCacheMessage('Unable to clear cache in this environment.');
    }
  };

  return (
    <>
      <PageHeading
        title="Settings & Preferences"
        description="Configure appearance, workspace defaults, results presentation, and accessibility options."
        actions={
          <div className="flex items-center gap-3">
            {saveState === 'saved' && (
              <span className="flex items-center gap-1.5 text-xs text-success font-medium">
                <CheckCircle2 size={14} />
                Preferences saved
              </span>
            )}
            {saveState === 'saving' && (
              <span className="flex items-center gap-1.5 text-xs text-muted font-medium">
                <RefreshCw size={12} className="animate-spin" />
                Saving...
              </span>
            )}
            <Button variant="primary" onClick={handleSave} disabled={saveState === 'saving'}>
              Save Changes
            </Button>
          </div>
        }
      />

      <div className="stack-list" style={{ gap: 'var(--space-6)' }}>
        {/* 1. Appearance & Theme */}
        <section className="card">
          <div className="card-header">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-surface-2 border border-border">
                <Palette size={18} className="text-accent" />
              </div>
              <div>
                <h2 className="section-title">Appearance & Theme</h2>
                <p className="section-description">Select color identity, motion level, and visual ambiance</p>
              </div>
            </div>
          </div>

          <div className="card-body stack-list">
            <ThemeSelector />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 pt-4 border-t border-border">
              <div className="settings-field">
                <label className="settings-label">Animation Atmosphere</label>
                <select
                  className="select mt-1.5"
                  value={animationIntensity}
                  onChange={e => setAnimationIntensity(e.target.value)}
                  aria-label="Animation Atmosphere"
                >
                  <option value="fluid">Fluid (Atmospheric glow & soft transitions)</option>
                  <option value="balanced">Balanced (Standard interface motion)</option>
                  <option value="minimal">Minimal (Reduced transitions & static backgrounds)</option>
                </select>
                <p className="text-2xs text-muted mt-1.5">
                  Controls page gradient animation speed and visual fluid transitions.
                </p>
              </div>

              <div className="settings-field">
                <label className="settings-label">Ambient Droplets</label>
                <select
                  className="select mt-1.5"
                  value={enableDroplets ? 'enabled' : 'disabled'}
                  onChange={e => setEnableDroplets(e.target.value === 'enabled')}
                  aria-label="Ambient Droplets"
                >
                  <option value="enabled">Enabled (Interactive soft floating bubbles)</option>
                  <option value="disabled">Disabled (Clean background without droplet canvas)</option>
                </select>
                <p className="text-2xs text-muted mt-1.5">
                  Renders delicate floating translucent bubbles behind primary workspace surfaces.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Workspace Defaults */}
        <section className="card">
          <div className="card-header">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-surface-2 border border-border">
                <Sliders size={18} className="text-accent" />
              </div>
              <div>
                <h2 className="section-title">Workspace Defaults</h2>
                <p className="section-description">Configure default record limits and search behavior</p>
              </div>
            </div>
          </div>

          <div className="card-body stack-list">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="settings-field">
                <label className="settings-label">Default Page Size</label>
                <select
                  className="select mt-1.5"
                  value={pageSize}
                  onChange={e => setPageSize(e.target.value)}
                  aria-label="Default Page Size"
                >
                  <option value="25">25 rows per page (Recommended)</option>
                  <option value="50">50 rows per page</option>
                  <option value="100">100 rows per page</option>
                </select>
                <p className="text-2xs text-muted mt-1.5">
                  Initial batch size loaded when browsing entity results or candidate pairs.
                </p>
              </div>

              <div className="settings-field">
                <label className="settings-label">Default Result Sorting</label>
                <select
                  className="select mt-1.5"
                  value={defaultSort}
                  onChange={e => setDefaultSort(e.target.value)}
                  aria-label="Default Result Sorting"
                >
                  <option value="confidence_desc">Confidence Descending (Matches first)</option>
                  <option value="entity_id_asc">Source 1 Entity ID (Ascending)</option>
                  <option value="matches_desc">Match Count (Highest first)</option>
                </select>
                <p className="text-2xs text-muted mt-1.5">
                  Initial order applied to the matching results ledger.
                </p>
              </div>

              <div className="settings-field">
                <label className="settings-label">Session Memory</label>
                <select
                  className="select mt-1.5"
                  value={rememberFilters ? 'remember' : 'reset'}
                  onChange={e => setRememberFilters(e.target.value === 'remember')}
                  aria-label="Session Memory"
                >
                  <option value="remember">Remember active run and filter criteria</option>
                  <option value="reset">Reset filters on each navigation</option>
                </select>
                <p className="text-2xs text-muted mt-1.5">
                  Persists active search keywords and source filters across page visits.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Results & Entity Display */}
        <section className="card">
          <div className="card-header">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-surface-2 border border-border">
                <Eye size={18} className="text-accent" />
              </div>
              <div>
                <h2 className="section-title">Results & Entity Display</h2>
                <p className="section-description">Customize formatting of confidence metrics, entity tags, and row density</p>
              </div>
            </div>
          </div>

          <div className="card-body stack-list">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="settings-field">
                <label className="settings-label">Confidence Score Format</label>
                <select
                  className="select mt-1.5"
                  value={confidenceFormat}
                  onChange={e => setConfidenceFormat(e.target.value)}
                  aria-label="Confidence Score Format"
                >
                  <option value="percentage">Percentage (e.g. 94%)</option>
                  <option value="decimal">Decimal (e.g. 0.942)</option>
                </select>
                <p className="text-2xs text-muted mt-1.5">
                  Primary format used for similarity scores and match likelihoods.
                </p>
              </div>

              <div className="settings-field">
                <label className="settings-label">Matched Entity Tags</label>
                <select
                  className="select mt-1.5"
                  value={matchTagDisplay}
                  onChange={e => setMatchTagDisplay(e.target.value)}
                  aria-label="Matched Entity Tags"
                >
                  <option value="compact">Compact Cluster (First 3 + count badge)</option>
                  <option value="expanded">Expanded (Display all aligned entity IDs)</option>
                </select>
                <p className="text-2xs text-muted mt-1.5">
                  Determines how cross-source matching IDs are shown in tables.
                </p>
              </div>

              <div className="settings-field">
                <label className="settings-label">Table Density</label>
                <select
                  className="select mt-1.5"
                  value={tableDensity}
                  onChange={e => setTableDensity(e.target.value)}
                  aria-label="Table Density"
                >
                  <option value="comfortable">Comfortable (Standard row spacing)</option>
                  <option value="compact">Compact (Dense high-information view)</option>
                </select>
                <p className="text-2xs text-muted mt-1.5">
                  Adjusts vertical padding across results and candidate pair tables.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Notifications */}
        <section className="card">
          <div className="card-header">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-surface-2 border border-border">
                <Bell size={18} className="text-accent" />
              </div>
              <div>
                <h2 className="section-title">Notifications</h2>
                <p className="section-description">Manage in-app status updates for background resolution runs</p>
              </div>
            </div>
          </div>

          <div className="card-body">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="p-3 rounded-lg bg-surface-2 border border-border flex items-center justify-between cursor-pointer hover:bg-surface-3 transition-colors">
                <span className="text-xs font-medium text-primary">Run Completed</span>
                <input
                  type="checkbox"
                  checked={notifyRunCompleted}
                  onChange={e => setNotifyRunCompleted(e.target.checked)}
                  className="accent-accent"
                />
              </label>

              <label className="p-3 rounded-lg bg-surface-2 border border-border flex items-center justify-between cursor-pointer hover:bg-surface-3 transition-colors">
                <span className="text-xs font-medium text-primary">Run Failed / Interrupted</span>
                <input
                  type="checkbox"
                  checked={notifyRunFailed}
                  onChange={e => setNotifyRunFailed(e.target.checked)}
                  className="accent-accent"
                />
              </label>

              <label className="p-3 rounded-lg bg-surface-2 border border-border flex items-center justify-between cursor-pointer hover:bg-surface-3 transition-colors">
                <span className="text-xs font-medium text-primary">Validation Audit Completed</span>
                <input
                  type="checkbox"
                  checked={notifyValidation}
                  onChange={e => setNotifyValidation(e.target.checked)}
                  className="accent-accent"
                />
              </label>
            </div>
          </div>
        </section>

        {/* 5. Accessibility */}
        <section className="card">
          <div className="card-header">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-surface-2 border border-border">
                <Accessibility size={18} className="text-accent" />
              </div>
              <div>
                <h2 className="section-title">Accessibility</h2>
                <p className="section-description">Fine-tune visual contrast, interface scale, and motion preferences</p>
              </div>
            </div>
          </div>

          <div className="card-body stack-list">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="settings-field">
                <label className="settings-label">Reduced Motion</label>
                <select
                  className="select mt-1.5"
                  value={reducedMotion ? 'active' : 'inactive'}
                  onChange={e => setReducedMotion(e.target.value === 'active')}
                  aria-label="Reduced Motion"
                >
                  <option value="inactive">Standard Fluid Motion</option>
                  <option value="active">Active (Disable decorative animations)</option>
                </select>
                <p className="text-2xs text-muted mt-1.5">
                  Suppresses floating droplet drifts and page-load transitions.
                </p>
              </div>

              <div className="settings-field">
                <label className="settings-label">High Contrast Borders</label>
                <select
                  className="select mt-1.5"
                  value={highContrast ? 'enabled' : 'disabled'}
                  onChange={e => setHighContrast(e.target.value === 'enabled')}
                  aria-label="High Contrast Borders"
                >
                  <option value="disabled">Standard Soft Borders</option>
                  <option value="enabled">High Contrast (Stronger boundaries)</option>
                </select>
                <p className="text-2xs text-muted mt-1.5">
                  Enhances card outlines and table dividers for high-contrast viewing.
                </p>
              </div>

              <div className="settings-field">
                <label className="settings-label">Interface Text Scale</label>
                <select
                  className="select mt-1.5"
                  value={fontScale}
                  onChange={e => setFontScale(e.target.value)}
                  aria-label="Interface Text Scale"
                >
                  <option value="standard">Standard (14px base font)</option>
                  <option value="large">Comfortable (+10% font scale)</option>
                </select>
                <p className="text-2xs text-muted mt-1.5">
                  Scales typography across tables, headers, and navigation items.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Data & Cache Management */}
        <section className="card">
          <div className="card-header">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-surface-2 border border-border">
                <Database size={18} className="text-accent" />
              </div>
              <div>
                <h2 className="section-title">Data & Cache Management</h2>
                <p className="section-description">Reset stored preferences or purge client query cache</p>
              </div>
            </div>
          </div>

          <div className="card-body">
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-lg bg-surface-2 border border-border">
              <div>
                <h4 className="text-xs font-semibold text-primary">Clear Local Storage Cache</h4>
                <p className="text-2xs text-muted mt-0.5">
                  Purges browser-cached run selections, entity query history, and table scroll states.
                </p>
                {clearCacheMessage && (
                  <p className="text-2xs text-success font-medium mt-1">{clearCacheMessage}</p>
                )}
              </div>
              <Button variant="secondary" size="sm" onClick={handleClearCache}>
                <Trash2 size={13} />
                Clear Cache
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-lg bg-surface-2 border border-border mt-3">
              <div>
                <h4 className="text-xs font-semibold text-primary">Reset All Preferences to Defaults</h4>
                <p className="text-2xs text-muted mt-0.5">
                  Restores theme, table density, page size, and motion settings to factory defaults.
                </p>
              </div>
              <Button variant="secondary" size="sm" onClick={handleResetDefaults}>
                <RotateCcw size={13} />
                Reset Defaults
              </Button>
            </div>
          </div>
        </section>

        {/* 7. Model Information (Read-Only Technical Specs) */}
        <section className="card">
          <div className="card-header">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-surface-2 border border-border">
                <ShieldCheck size={18} className="text-accent" />
              </div>
              <div>
                <h2 className="section-title">Model Information</h2>
                <p className="section-description">Read-only technical specifications of the active resolution engine</p>
              </div>
            </div>
            <Badge tone="success">Production Verified</Badge>
          </div>

          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 rounded-lg bg-surface-2 border border-border flex flex-col gap-1">
                <span className="text-2xs text-muted font-medium">Model Engine</span>
                <span className="font-semibold text-primary">aws-main-ml</span>
                <span className="text-2xs text-muted">Authoritative single source of truth</span>
              </div>

              <div className="p-3.5 rounded-lg bg-surface-2 border border-border flex flex-col gap-1">
                <span className="text-2xs text-muted font-medium">Pipeline Strategy</span>
                <span className="font-semibold text-primary">Signal-Ranked Inverted Index</span>
                <span className="text-2xs text-muted">Multi-pass candidate generation</span>
              </div>

              <div className="p-3.5 rounded-lg bg-surface-2 border border-border flex flex-col gap-1">
                <span className="text-2xs text-muted font-medium">Decision Boundary</span>
                <span className="font-semibold text-accent mono">&ge; 0.72 Similarity</span>
                <span className="text-2xs text-muted">Fixed threshold calibrated by ML service</span>
              </div>

              <div className="p-3.5 rounded-lg bg-surface-2 border border-border flex flex-col gap-1">
                <span className="text-2xs text-muted font-medium">Validation Benchmark</span>
                <span className="font-semibold text-primary">Official F₀.₅ Metric</span>
                <span className="text-2xs text-muted">Precision-weighted submission verification</span>
              </div>
            </div>
          </div>
        </section>

        {/* 8. System Diagnostics (Collapsed by Default) */}
        <section className="card">
          <button
            type="button"
            className="w-full card-header text-left flex items-center justify-between cursor-pointer hover:bg-surface-2/40 transition-colors"
            onClick={() => setShowDiagnostics(!showDiagnostics)}
            aria-expanded={showDiagnostics}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-surface-2 border border-border">
                <Cpu size={18} className="text-accent" />
              </div>
              <div>
                <h2 className="section-title">System Diagnostics</h2>
                <p className="section-description">Internal service signals, isolated run paths, and platform telemetry</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone={healthStatus === 'online' ? 'success' : 'error'}>
                {healthStatus === 'online' ? 'Service Healthy' : 'Offline'}
              </Badge>
              {showDiagnostics ? <ChevronDown size={18} className="text-muted" /> : <ChevronRight size={18} className="text-muted" />}
            </div>
          </button>

          {showDiagnostics && (
            <div className="card-body pt-0 stack-list">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-3 border-t border-border">
                <div className="p-3 rounded-lg bg-surface-2 border border-border flex flex-col gap-1">
                  <span className="text-2xs text-muted font-medium">API Service Status</span>
                  <span className="font-semibold text-primary">
                    {healthStatus === 'online' ? 'Online · Responding' : 'Offline · Unreachable'}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-surface-2 border border-border flex flex-col gap-1">
                  <span className="text-2xs text-muted font-medium">ML Service Readiness</span>
                  <span className="font-semibold text-primary">
                    {modelDetails?.name || 'aws-main-ml Pipeline'}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-surface-2 border border-border flex flex-col gap-1">
                  <span className="text-2xs text-muted font-medium">Workspace Execution Root</span>
                  <span className="font-semibold mono text-primary">runs/RUN-YYYY-MMDD-XXXXXX/</span>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      {saveState === 'saved' && (
        <div className="fixed bottom-6 right-6 p-4 rounded-lg bg-surface border border-accent text-sm text-primary shadow-lg flex items-center gap-2 animate-fadeIn z-50">
          <CheckCircle2 size={16} className="text-success" />
          <span>Settings saved and stored locally.</span>
        </div>
      )}
    </>
  );
}
