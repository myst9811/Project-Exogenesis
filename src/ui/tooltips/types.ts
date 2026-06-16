export interface TooltipAnchor {
  label: string;
  value: string;
  isEarth?: boolean;
}

export interface ParameterTooltip {
  title: string;
  definition: string;
  analogy?: string;
  anchors?: TooltipAnchor[];
}

export type ParameterTooltipKey =
  | 'spectralClass' | 'stellarMass' | 'stellarAge'
  | 'semiMajorAxis' | 'eccentricity'
  | 'planetMass' | 'planetRadius' | 'compositionClass'
  | 'rotationPeriod' | 'axialTilt'
  | 'pressureN2' | 'pressureO2' | 'pressureCO2' | 'pressureH2O'
  | 'pressureCH4' | 'pressureAr' | 'pressureHe' | 'pressureH2'
  | 'gravity' | 'surfaceTemperature' | 'habitability'
  | 'atmosphericPressure' | 'atmosphere'
  | 'escapeVelocity' | 'dayLength' | 'yearLength';
