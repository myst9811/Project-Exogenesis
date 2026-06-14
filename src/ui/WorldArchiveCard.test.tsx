/**
 * @module ui/WorldArchiveCard.test
 * @vitest-environment jsdom
 */

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { WorldArchiveCard } from './WorldArchiveCard';
import type { WorldArchiveEntry } from '../types/archive';

afterEach(cleanup);

const entry: WorldArchiveEntry = {
  configurationHash: 'a3f2b1ffffff',
  commonName: 'Aurelia',
  shareToken: 'tok',
  designatedAt: '2026-06-14T00:00:00.000Z',
  updatedAt: '2026-06-14T00:00:00.000Z',
  catalogSnapshot: {
    spectralClass: 'G',
    semiMajorAxisAu: 1,
    surfaceTemperatureKelvin: 288,
    surfaceGravityEarthG: 1,
    survivabilityScore: 100,
    habitableZonePosition: 'inside-optimistic',
    limitingFactor: 'thermal',
  },
};

function setup(): {
  entry: WorldArchiveEntry;
  isActive: boolean;
  onLoad: ReturnType<typeof vi.fn>;
  onRename: ReturnType<typeof vi.fn>;
  onDelete: ReturnType<typeof vi.fn>;
  onCopyLink: ReturnType<typeof vi.fn>;
} {
  const props = {
    entry,
    isActive: false,
    onLoad: vi.fn(),
    onRename: vi.fn(),
    onDelete: vi.fn(),
    onCopyLink: vi.fn(),
  };
  render(
    <ul>
      <WorldArchiveCard {...props} />
    </ul>,
  );
  return props;
}

describe('WorldArchiveCard', () => {
  it('shows the name, designation, and a cataloged readout', () => {
    setup();
    expect(screen.getByText('Aurelia')).not.toBeNull();
    expect(screen.getByText(/A3F2B1/)).not.toBeNull();
    expect(screen.getByText(/288 K/)).not.toBeNull();
  });

  it('loads when the load action is clicked', () => {
    const props = setup();
    fireEvent.click(screen.getByRole('button', { name: /load/i }));
    expect(props.onLoad).toHaveBeenCalledWith(entry);
  });

  it('asks for confirmation before deleting', () => {
    const props = setup();
    fireEvent.click(screen.getByRole('button', { name: /^delete$/i }));
    fireEvent.click(screen.getByRole('button', { name: /confirm delete/i }));
    expect(props.onDelete).toHaveBeenCalledWith(entry);
  });
});
