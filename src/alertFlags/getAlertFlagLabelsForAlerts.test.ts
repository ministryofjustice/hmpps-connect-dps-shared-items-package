import { alertFlagLabels, getAlertFlagLabelsForAlerts } from './getAlertFlagLabelsForAlerts'
import { AlertsServiceAlert, BasicAlert, PrisonApiAlert } from '../types/public/alertFlags/Alert'

describe('mapAlertFlagsFromPrisonerAlerts', () => {
  describe('prisoner alerts are basic from prisonerSearch', () => {
    const getAlert = (overrides: Partial<BasicAlert> = {}): BasicAlert => ({
      alertType: 'X',
      alertCode: 'HA1',
      active: true,
      expired: false,
      ...overrides,
    })

    it('should return the corresponding flags for the alerts passed in', () => {
      const output = getAlertFlagLabelsForAlerts([getAlert({ alertCode: 'HA1' }), getAlert({ alertCode: 'SA' })])
      expect(output).toEqual([
        {
          alertIds: ['HA1'],
          alertCodes: ['HA1'],
          classes: 'dps-alert-status dps-alert-status--self-harm',
          label: 'ACCT post closure',
        },
        {
          alertCodes: ['XSA', 'SA'],
          alertIds: ['SA'],
          classes: 'dps-alert-status dps-alert-status--security',
          label: 'Staff assaulter',
        },
      ])
    })

    it('should discard inactive alerts', () => {
      const output = getAlertFlagLabelsForAlerts([
        getAlert({ alertCode: 'HA1' }),
        getAlert({ alertCode: 'SA', active: false }),
      ])
      expect(output).toEqual([
        {
          alertIds: ['HA1'],
          alertCodes: ['HA1'],
          classes: 'dps-alert-status dps-alert-status--self-harm',
          label: 'ACCT post closure',
        },
      ])
    })

    it('should discard expired alerts', () => {
      const output = getAlertFlagLabelsForAlerts([
        getAlert({ alertCode: 'HA1', expired: true }),
        getAlert({ alertCode: 'SA' }),
      ])
      expect(output).toEqual([
        {
          alertIds: ['SA'],
          alertCodes: ['XSA', 'SA'],
          classes: 'dps-alert-status dps-alert-status--security',
          label: 'Staff assaulter',
        },
      ])
    })

    it('should work for all alert flag types', () => {
      const prisonerAlerts = alertFlagLabels.map(({ alertCodes }) => getAlert({ alertCode: alertCodes[0] }))
      const output = getAlertFlagLabelsForAlerts(prisonerAlerts)

      expect(output).toEqual(alertFlagLabels.map(flag => ({ ...flag, alertIds: [flag.alertCodes[0]] })))
    })
  })

  describe('prisoner alerts are from prison Api', () => {
    const getAlert = (overrides: Partial<PrisonApiAlert> = {}): PrisonApiAlert => ({
      active: true,
      alertCode: 'HA1',
      alertCodeDescription: '',
      alertId: '',
      alertType: '',
      alertTypeDescription: '',
      dateCreated: '',
      expired: false,
      ...overrides,
    })

    it('should return the corresponding flags for the alerts passed in', () => {
      const output = getAlertFlagLabelsForAlerts([getAlert({ alertCode: 'HA1' }), getAlert({ alertCode: 'SA' })])
      expect(output).toEqual([
        {
          alertIds: ['HA1'],
          alertCodes: ['HA1'],
          classes: 'dps-alert-status dps-alert-status--self-harm',
          label: 'ACCT post closure',
        },
        {
          alertCodes: ['XSA', 'SA'],
          alertIds: ['SA'],
          classes: 'dps-alert-status dps-alert-status--security',
          label: 'Staff assaulter',
        },
      ])
    })

    it('should discard inactive alerts', () => {
      const output = getAlertFlagLabelsForAlerts([
        getAlert({ alertCode: 'HA1' }),
        getAlert({ alertCode: 'SA', active: false }),
      ])
      expect(output).toEqual([
        {
          alertIds: ['HA1'],
          alertCodes: ['HA1'],
          classes: 'dps-alert-status dps-alert-status--self-harm',
          label: 'ACCT post closure',
        },
      ])
    })

    it('should discard expired alerts', () => {
      const output = getAlertFlagLabelsForAlerts([
        getAlert({ alertCode: 'HA1', expired: true }),
        getAlert({ alertCode: 'SA' }),
      ])
      expect(output).toEqual([
        {
          alertIds: ['SA'],
          alertCodes: ['XSA', 'SA'],
          classes: 'dps-alert-status dps-alert-status--security',
          label: 'Staff assaulter',
        },
      ])
    })

    it('should work for all alert flag types', () => {
      const prisonerAlerts = alertFlagLabels.map(({ alertCodes }) => getAlert({ alertCode: alertCodes[0] }))
      const output = getAlertFlagLabelsForAlerts(prisonerAlerts)

      expect(output).toEqual(alertFlagLabels.map(flag => ({ ...flag, alertIds: [flag.alertCodes[0]] })))
    })
  })

  describe('prisoner alerts are from alerts service', () => {
    const getAlert = (overrides: Partial<AlertsServiceAlert> = {}): AlertsServiceAlert => ({
      alertUuid: 'uuid',
      activeFrom: '',
      alertCode: { alertTypeCode: '', alertTypeDescription: '', code: 'HA1', description: '' },
      createdByDisplayName: '',
      description: '',
      isActive: true,
      ...overrides,
    })

    it('should return the corresponding flags for the alerts passed in', () => {
      const output = getAlertFlagLabelsForAlerts([
        getAlert({ alertCode: { alertTypeCode: '', alertTypeDescription: '', code: 'HA1', description: '' } }),
        getAlert({
          alertUuid: 'SaUuid',
          alertCode: { alertTypeCode: '', alertTypeDescription: '', code: 'SA', description: '' },
        }),
      ])
      expect(output).toEqual([
        {
          alertIds: ['uuid'],
          alertCodes: ['HA1'],
          classes: 'dps-alert-status dps-alert-status--self-harm',
          label: 'ACCT post closure',
        },
        {
          alertCodes: ['XSA', 'SA'],
          alertIds: ['SaUuid'],
          classes: 'dps-alert-status dps-alert-status--security',
          label: 'Staff assaulter',
        },
      ])
    })

    it('should discard inactive alerts', () => {
      const output = getAlertFlagLabelsForAlerts([
        getAlert({ alertCode: { alertTypeCode: '', alertTypeDescription: '', code: 'HA1', description: '' } }),
        getAlert({
          alertCode: { alertTypeCode: '', alertTypeDescription: '', code: 'SA', description: '' },
          isActive: false,
        }),
      ])
      expect(output).toEqual([
        {
          alertIds: ['uuid'],
          alertCodes: ['HA1'],
          classes: 'dps-alert-status dps-alert-status--self-harm',
          label: 'ACCT post closure',
        },
      ])
    })

    it('should include all uuids as alertIds for each alertCode', () => {
      const output = getAlertFlagLabelsForAlerts([
        getAlert({
          alertUuid: 'id1',
          alertCode: { alertTypeCode: '', alertTypeDescription: '', code: 'HA1', description: '' },
        }),
        getAlert({
          alertUuid: 'id2',
          alertCode: { alertTypeCode: '', alertTypeDescription: '', code: 'HA1', description: '' },
        }),
      ])
      expect(output).toEqual([
        {
          alertIds: ['id1', 'id2'],
          alertCodes: ['HA1'],
          classes: 'dps-alert-status dps-alert-status--self-harm',
          label: 'ACCT post closure',
        },
      ])
    })

    it('should include all uuids as alertIds when multiple alertCodes on flag', () => {
      const output = getAlertFlagLabelsForAlerts([
        getAlert({
          alertUuid: 'id1',
          alertCode: { alertTypeCode: '', alertTypeDescription: '', code: 'SA', description: '' },
        }),
        getAlert({
          alertUuid: 'id2',
          alertCode: { alertTypeCode: '', alertTypeDescription: '', code: 'XSA', description: '' },
        }),
      ])
      expect(output).toEqual([
        {
          alertCodes: ['XSA', 'SA'],
          alertIds: ['id1', 'id2'],
          classes: 'dps-alert-status dps-alert-status--security',
          label: 'Staff assaulter',
        },
      ])
    })

    it('should work for all alert flag types', () => {
      const prisonerAlerts = alertFlagLabels.map(({ alertCodes }) =>
        getAlert({
          alertCode: { alertTypeCode: '', alertTypeDescription: '', code: alertCodes[0], description: '' },
        }),
      )
      const output = getAlertFlagLabelsForAlerts(prisonerAlerts)

      expect(output).toEqual(alertFlagLabels.map(flag => ({ ...flag, alertIds: ['uuid'] })))
    })
  })
})
