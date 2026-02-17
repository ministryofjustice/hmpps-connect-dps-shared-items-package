import { Alert, AlertsServiceAlert } from '../types/public/alertFlags/Alert'
import { AlertFlagLabel } from '../types/public/alertFlags/AlertFlagLabel'

export const alertFlagLabels: AlertFlagLabel[] = [
  { alertCodes: ['HA'], classes: 'dps-alert-status dps-alert-status--self-harm', label: 'ACCT open' },
  {
    alertCodes: ['HA1'],
    classes: 'dps-alert-status dps-alert-status--self-harm',
    label: 'ACCT post closure',
  },
  {
    alertCodes: ['XSA', 'SA'],
    classes: 'dps-alert-status dps-alert-status--security',
    label: 'Staff assaulter',
  },
  {
    alertCodes: ['XA'],
    classes: 'dps-alert-status dps-alert-status--security',
    label: 'Arsonist',
  },
  {
    alertCodes: ['PEEP'],
    classes: 'dps-alert-status dps-alert-status--medical',
    label: 'PEEP',
  },
  {
    alertCodes: ['HID'],
    classes: 'dps-alert-status dps-alert-status--medical',
    label: 'Hidden disability',
  },
  { alertCodes: ['XEL'], classes: 'dps-alert-status dps-alert-status--security', label: 'E-list' },
  { alertCodes: ['XELH'], classes: 'dps-alert-status dps-alert-status--security', label: 'E-list heightened' },
  { alertCodes: ['XER'], classes: 'dps-alert-status dps-alert-status--security', label: 'Escape risk' },
  {
    alertCodes: ['XRF'],
    classes: 'dps-alert-status dps-alert-status--security',
    label: 'Risk to females',
  },
  { alertCodes: ['XTACT'], classes: 'dps-alert-status dps-alert-status--security', label: 'TACT' },
  {
    alertCodes: ['XCO'],
    classes: 'dps-alert-status dps-alert-status--security',
    label: 'Corruptor',
  },
  {
    alertCodes: ['XCA'],
    classes: 'dps-alert-status dps-alert-status--security',
    label: 'Chemical attacker',
  },
  {
    alertCodes: ['XCI'],
    classes: 'dps-alert-status dps-alert-status--security',
    label: 'Concerted indiscipline',
  },
  { alertCodes: ['XR'], classes: 'dps-alert-status dps-alert-status--security', label: 'Racist' },
  {
    alertCodes: ['RTP', 'RLG'],
    classes: 'dps-alert-status dps-alert-status--risk',
    label: 'Risk to LGBT',
  },
  {
    alertCodes: ['XHT'],
    classes: 'dps-alert-status dps-alert-status--security',
    label: 'Hostage taker',
  },
  {
    alertCodes: ['XCU'],
    classes: 'dps-alert-status dps-alert-status--security',
    label: 'Controlled unlock',
  },
  {
    alertCodes: ['XGANG'],
    classes: 'dps-alert-status dps-alert-status--security',
    label: 'Gang member',
  },
  { alertCodes: ['CSIP'], classes: 'dps-alert-status dps-alert-status--other', label: 'CSIP' },
  { alertCodes: ['F1'], classes: 'dps-alert-status dps-alert-status--ex-armed-forces', label: 'Veteran' },
  {
    alertCodes: ['LCE'],
    classes: 'dps-alert-status dps-alert-status--care-leaver',
    label: 'Care experienced',
  },
  {
    alertCodes: ['RNO121'],
    classes: 'dps-alert-status dps-alert-status--risk',
    label: 'No one-to-one',
  },
  { alertCodes: ['RCON'], classes: 'dps-alert-status dps-alert-status--risk', label: 'Conflict' },
  {
    alertCodes: ['RKS'],
    classes: 'dps-alert-status dps-alert-status--risk-to-known-adults',
    label: 'Risk to known adults',
  },
  {
    alertCodes: ['PVN'],
    classes: 'dps-alert-status dps-alert-status--multicase dps-alert-status--visor',
    label: 'ViSOR',
  },
  {
    alertCodes: ['XCDO'],
    classes: 'dps-alert-status dps-alert-status--security',
    label: 'Involved in 2024 civil disorder',
  },
  {
    alertCodes: ['XVL'],
    classes: 'dps-alert-status dps-alert-status--security',
    label: 'Violent',
  },
  {
    alertCodes: ['DOCGM'],
    classes: 'dps-alert-status dps-alert-status--security',
    label: 'OCG nominal (do not share)',
  },
  {
    alertCodes: ['RSS'],
    classes: 'dps-alert-status dps-alert-status--risk',
    label: 'Risk to staff',
  },
  {
    alertCodes: ['XCOP'],
    classes: 'dps-alert-status dps-alert-status--security',
    label: 'Potential corruptor',
  },
].sort((a, b) => a.label.localeCompare(b.label))

function isAlertsServiceAlert(alert: Alert): alert is AlertsServiceAlert {
  return typeof alert.alertCode !== 'string'
}

export function getAlertFlagLabelsForAlerts(prisonerAlerts: Alert[]): AlertFlagLabel[] {
  return alertFlagLabels.reduce(
    (acc: AlertFlagLabel[], flag: { alertCodes: string[]; classes: string; label: string }) => {
      const alertIds = prisonerAlerts
        .filter(alert => {
          const alertsServiceAlert = isAlertsServiceAlert(alert)
          const alertIsActive = alertsServiceAlert ? alert.isActive : alert.active && !alert.expired
          const prisonerAlertCode = alertsServiceAlert ? alert.alertCode.code : alert.alertCode

          return alertIsActive && flag.alertCodes.includes(prisonerAlertCode)
        })
        .map(alert => (isAlertsServiceAlert(alert) ? (alert.alertUuid as string) : alert.alertCode))

      return alertIds.length ? [...acc, { ...flag, alertIds }] : acc
    },
    [] as AlertFlagLabel[],
  )
}
