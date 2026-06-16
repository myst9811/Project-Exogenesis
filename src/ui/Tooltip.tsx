/**
 * @module ui/Tooltip
 *
 * Floating tooltip card triggered by a hover/focus ⓘ button.
 * The ⓘ is hidden at rest via CSS; the parent row's :hover selector
 * reveals it (.tactical-field:hover .tooltip-trigger, etc.).
 * Opening the card requires hovering or focusing the ⓘ itself.
 */

import { useEffect, useId, useRef, useState } from 'react';
import type { JSX } from 'react';

import type { ParameterTooltip } from './tooltips/types';

export function Tooltip({ tooltip }: { tooltip: ParameterTooltip }): JSX.Element {
  const [open, setOpen] = useState(false);
  const id = useId();
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    if (!open || cardRef.current === null) return;
    const rect = cardRef.current.getBoundingClientRect();
    if (rect.right > window.innerWidth - 8) {
      cardRef.current.style.left = 'auto';
      cardRef.current.style.right = '0';
    }
  }, [open]);

  return (
    <span className="tooltip-wrap">
      <button
        type="button"
        className="tooltip-trigger"
        aria-label="More information"
        aria-describedby={id}
        onMouseEnter={() => { setOpen(true); }}
        onMouseLeave={() => { setOpen(false); }}
        onFocus={() => { setOpen(true); }}
        onBlur={() => { setOpen(false); }}
      >
        <span aria-hidden="true">ⓘ</span>
      </button>
      {open && (
        <div role="tooltip" id={id} className="tooltip-card" ref={cardRef}>
          <p className="tooltip-title">{tooltip.title}</p>
          <p className="tooltip-def">{tooltip.definition}</p>
          {tooltip.analogy !== undefined && (
            <p className="tooltip-analogy">{tooltip.analogy}</p>
          )}
          {tooltip.anchors !== undefined && tooltip.anchors.length > 0 && (
            <div className="tooltip-anchors">
              <span className="tooltip-anchors-label">Known values</span>
              {tooltip.anchors.map((anchor) => (
                <div key={anchor.label} className="tooltip-anchor-row">
                  <span className="tooltip-anchor-name">{anchor.label}</span>
                  {' · '}
                  <span className="tooltip-anchor-value">{anchor.value}</span>
                  {anchor.isEarth === true && (
                    <span className="tooltip-earth-mark"> ✓</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </span>
  );
}
