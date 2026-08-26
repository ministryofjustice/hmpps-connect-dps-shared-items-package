import { AlertType, getAlertFlagCssClasses, getAlertTypeForCode } from './alertTypes'

describe('getAlertTypeForCode', () => {
  it('should return known alert type', () => {
    expect(getAlertTypeForCode('M')).toEqual(AlertType.Medical)
    expect(getAlertTypeForCode('X')).toEqual(AlertType.Security)
  })

  it('should return undefined for unknown alert type', () => {
    expect(getAlertTypeForCode('q')).toBeUndefined()
  })
})

describe('getAlertFlagCssClasses', () => {
  it('should return classes for a known alert type', () => {
    expect(getAlertFlagCssClasses(AlertType.Security)).toEqual('dps-alert-status dps-alert-status--security')
  })

  it('should return only the default class for unknown alert type', () => {
    expect(getAlertFlagCssClasses('unknown' as AlertType)).toEqual('dps-alert-status')
  })
})
