'use client';

import { useTheme } from './theme-provider';

export function DropletLayer() {
  const { resolved } = useTheme();

  if (resolved !== 'resomesh') return null;

  return (
    <div className="droplet-layer" aria-hidden="true">
      <div className="droplet droplet-1" />
      <div className="droplet droplet-2" />
      <div className="droplet droplet-3" />
      <div className="droplet droplet-4" />
      <div className="droplet droplet-5" />
      <div className="droplet-shimmer" />
    </div>
  );
}
