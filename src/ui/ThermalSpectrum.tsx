/**
 * @module ui/ThermalSpectrum
 *
 * A surface-temperature spectrum: a 0–1000 K gradient bar with a needle at
 * the computed temperature. Canvas-drawn; guards a null 2D context (jsdom
 * provides none) so it renders harmlessly in tests. Reads computed state;
 * authors no physics.
 */

import { useEffect, useRef } from 'react';
import type { JSX } from 'react';

const SCALE_MIN_K = 0;
const SCALE_MAX_K = 1000;
const WIDTH = 300;
const HEIGHT = 22;

/** Gradient stops (fraction of 0–1000 K → CSS rgb), cold → lethal heat. */
const STOPS: { at: number; color: string }[] = [
  { at: 0, color: 'rgb(60, 80, 180)' },
  { at: 0.2, color: 'rgb(80, 130, 200)' },
  { at: 0.38, color: 'rgb(61, 202, 122)' },
  { at: 0.52, color: 'rgb(61, 202, 122)' },
  { at: 0.65, color: 'rgb(220, 170, 50)' },
  { at: 0.85, color: 'rgb(220, 80, 40)' },
  { at: 1, color: 'rgb(180, 30, 20)' },
];

export function ThermalSpectrum({
  temperatureKelvin,
}: {
  temperatureKelvin: number;
}): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas === null) {
      return;
    }
    const context = canvas.getContext('2d');
    if (context === null) {
      return; // jsdom: no 2D context — nothing to draw, harmless
    }
    const dpr = window.devicePixelRatio || 1;
    canvas.width = WIDTH * dpr;
    canvas.height = HEIGHT * dpr;
    context.scale(dpr, dpr);
    context.clearRect(0, 0, WIDTH, HEIGHT);

    const gradient = context.createLinearGradient(0, 0, WIDTH, 0);
    for (const stop of STOPS) {
      gradient.addColorStop(stop.at, stop.color);
    }
    context.fillStyle = gradient;
    context.fillRect(0, 0, WIDTH, HEIGHT - 6);

    const fraction = Math.max(
      0,
      Math.min(1, (temperatureKelvin - SCALE_MIN_K) / (SCALE_MAX_K - SCALE_MIN_K)),
    );
    const needleX = fraction * WIDTH;
    context.fillStyle = '#ffffff';
    context.fillRect(needleX - 1, 0, 2, HEIGHT - 6);
    context.beginPath();
    context.moveTo(needleX - 4, HEIGHT - 6);
    context.lineTo(needleX + 4, HEIGHT - 6);
    context.lineTo(needleX, HEIGHT);
    context.closePath();
    context.fill();
  }, [temperatureKelvin]);

  return (
    <canvas
      ref={canvasRef}
      className="thermal-spectrum"
      style={{ width: `${WIDTH}px`, height: `${HEIGHT}px` }}
      role="img"
      aria-label={`Surface temperature ${Math.round(temperatureKelvin)} K on a thermal spectrum`}
    />
  );
}
