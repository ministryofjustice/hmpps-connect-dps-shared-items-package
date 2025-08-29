export type Alert = BasicAlert | PrisonApiAlert | AlertsServiceAlert

export interface BasicAlert {
  alertType: string
  alertCode: string
  active: boolean
  expired: boolean
}

export interface PrisonApiAlert {
  alertId: string
  alertType: string
  alertTypeDescription: string
  alertCode: string
  alertCodeDescription: string
  comment?: string
  dateCreated: string
  modifiedDateTime?: string
  dateExpires?: string
  expired: boolean
  active: boolean
  addedByFirstName?: string
  addedByLastName?: string
  addedByFullName?: string
  expiredByFirstName?: string
  expiredByLastName?: string
  expiredByFullName?: string
}

export interface AlertsServiceAlert {
  alertUuid?: string
  prisonNumber?: string
  alertCode: {
    alertTypeCode: string
    alertTypeDescription: string
    code: string
    description: string
  }
  description: string
  authorisedBy?: string
  activeFrom: string
  activeTo?: string
  isActive: boolean
  comments?: [
    {
      commentUuid: string
      comment: string
      createdAt: string
      createdBy: string
      createdByDisplayName: string
    },
  ]
  createdAt?: string
  createdBy?: string
  createdByDisplayName: string
  lastModifiedAt?: string
  lastModifiedBy?: string
  lastModifiedByDisplayName?: string
  activeToLastSetAt?: string
  activeToLastSetBy?: string
  activeToLastSetByDisplayName?: string
}
