import OsPlacesApiClient from '../osPlacesApiClient'

export const osPlacesApiClientMock = (): OsPlacesApiClient =>
  ({
    getAddressesByFreeTextQuery: jest.fn(),
    getAddressesByUprn: jest.fn(),
  }) as unknown as OsPlacesApiClient
