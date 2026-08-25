/** Alert types that have a DPS alert flag style */
export enum AlertType {
  /** Care leaver */
  CareLeaver = 'care-leaver',
  /** Ex-armed forces */
  ExArmedForces = 'ex-armed-forces',
  /** MAPPP */
  MAPPP = 'MAPPP-case',
  /** Medical */
  Medical = 'medical',
  /** Risk */
  Risk = 'risk',
  /** Security */
  Security = 'security',
  /** Self harm */
  SelfHarm = 'self-harm',
  /** Vulnerability */
  Vulnerability = 'vulnerability',
  /** Other */
  Other = 'other',
}

/** Find an alert type that has a DPS alert flag style given an alert type code */
export function getAlertTypeForCode(typeCode: string): AlertType | undefined {
  if (typeCode === 'D') return AlertType.Security
  if (typeCode === 'F') return AlertType.ExArmedForces
  if (typeCode === 'H') return AlertType.SelfHarm
  if (typeCode === 'L') return AlertType.CareLeaver
  if (typeCode === 'M') return AlertType.Medical
  if (typeCode === 'O') return AlertType.Other
  if (typeCode === 'P') return AlertType.MAPPP
  if (typeCode === 'R') return AlertType.Risk
  if (typeCode === 'V') return AlertType.Vulnerability
  if (typeCode === 'X') return AlertType.Security
  return undefined
}

/** Returns the classes for use with the DPS alert flag component (ie. the `AlertFlagLabel.classes` property) */
export function getAlertFlagCssClasses(alertType: AlertType): string {
  return Object.values(AlertType).includes(alertType)
    ? `dps-alert-status dps-alert-status--${alertType}`
    : 'dps-alert-status'
}
