import OsPlacesAddressService from './osPlacesAddressService'
import OsPlacesApiClient from './osPlacesApiClient'
import {
  mockOsPlacesAddressQueryEmptyResponse,
  mockOsPlacesAddressQueryResponse,
  mockOsPlacesAddressQuerySingleResponse,
} from './testMocks/osPlacesAddressQueryResponse'
import { osPlacesApiClientMock } from './testMocks/osPlacesApiClientMock'
import { OsPlacesQueryResponse } from '../types/public/addressAutosuggest/osPlaces'
import { OsAddress } from '../types/public/addressAutosuggest/osAddress'

describe('osPlacesAddressService', () => {
  let osPlacesApiClient: OsPlacesApiClient
  let osPlacesAddressService: OsPlacesAddressService

  beforeEach(() => {
    osPlacesApiClient = osPlacesApiClientMock()

    osPlacesAddressService = new OsPlacesAddressService(console, osPlacesApiClient)
  })

  describe('sanitiseUkPostcode', () => {
    it.each([
      [undefined, undefined],
      [null, null],
      ['', ''],
      ['a12bc', 'A1 2BC'],
      ['SW1H 9AJ', 'SW1H 9AJ'],
      ['SW1H9AJ', 'SW1H 9AJ'],
      ['sw1h9aj', 'SW1H 9AJ'],
      ['before sw1h9aj after', 'before SW1H 9AJ after'],
      ['b.&e?for"e sw1+-//h#9a...j af,_ter', 'before SW1H 9AJ after'],
      ['not a postcode', 'not a postcode'],
    ])(`before: '%s', after: '%s'`, (before, after) => {
      expect(osPlacesAddressService.sanitiseUkPostcode(before as string)).toEqual(after)
    })
  })

  describe('getAddressesMatchingQuery', () => {
    const searchQuery = 'The Road, My Town'

    it('Handles empty address response', async () => {
      osPlacesApiClient.getAddressesByFreeTextQuery = jest.fn(async () => mockOsPlacesAddressQueryEmptyResponse)
      const addresses = await osPlacesAddressService.getAddressesMatchingQuery(searchQuery)
      expect(addresses.length).toEqual(0)
    })

    it('Maps the returned addresses correctly', async () => {
      osPlacesApiClient.getAddressesByFreeTextQuery = jest.fn(async () => mockOsPlacesAddressQueryResponse)
      const addresses = await osPlacesAddressService.getAddressesMatchingQuery(searchQuery)

      expect(addresses.length).toEqual(2)
      validateExpectedAddressResponse(addresses[1])
    })

    it('Sanitises post codes before querying the API', async () => {
      osPlacesApiClient.getAddressesByFreeTextQuery = jest.fn(async () => mockOsPlacesAddressQueryResponse)
      await osPlacesAddressService.getAddressesMatchingQuery('petty france sw1H9eA 102')
      expect(osPlacesApiClient.getAddressesByFreeTextQuery).toHaveBeenCalledWith('petty france SW1H 9EA 102')
    })

    it('should use fuse to remove spurious results', async () => {
      osPlacesApiClient.getAddressesByFreeTextQuery = jest.fn(
        async () =>
          ({
            ...mockOsPlacesAddressQueryResponse,
            results: [
              mockOsPlacesAddressQueryResponse.results[0],
              {
                ...mockOsPlacesAddressQueryResponse.results[1],
                DPA: { ...mockOsPlacesAddressQueryResponse.results[1].DPA, ADDRESS: 'something completely random' },
              },
            ],
          }) as OsPlacesQueryResponse,
      )

      const addresses = await osPlacesAddressService.getAddressesMatchingQuery(searchQuery)
      expect(addresses.length).toEqual(1)
    })

    it('should order by building number if query is a postcode', async () => {
      osPlacesApiClient.getAddressesByFreeTextQuery = jest.fn(async () => mockOsPlacesAddressQueryResponse)
      const addresses = await osPlacesAddressService.getAddressesMatchingQuery('SW1H9EA')
      expect(addresses).toEqual([
        expect.objectContaining({ buildingNumber: 1 }),
        expect.objectContaining({ buildingNumber: 2 }),
      ])
    })
  })

  describe('getAddressByUprn', () => {
    it('returns null if empty result returned', async () => {
      osPlacesApiClient.getAddressesByUprn = jest.fn(async () => mockOsPlacesAddressQueryEmptyResponse)
      const result = await osPlacesAddressService.getAddressByUprn('123')
      expect(result).toBeNull()
    })

    it('Picks the last result if multiple are returned', async () => {
      osPlacesApiClient.getAddressesByUprn = jest.fn(
        async () =>
          ({
            header: { ...mockOsPlacesAddressQueryEmptyResponse.header, totalresults: 2 },
            results: [
              { DPA: { UPRN: 12345, ADDRESS: '', BUILDING_NUMBER: 1 } },
              { DPA: { UPRN: 12345, ADDRESS: '', BUILDING_NUMBER: 2 } },
            ],
          }) as OsPlacesQueryResponse,
      )

      const address = await osPlacesAddressService.getAddressByUprn('12345')

      expect(address!.buildingNumber).toEqual(2)
    })

    it('Maps the returned address correctly', async () => {
      osPlacesApiClient.getAddressesByUprn = jest.fn(async () => mockOsPlacesAddressQuerySingleResponse)

      const address = await osPlacesAddressService.getAddressByUprn('12345')

      validateExpectedAddressResponse(address!)
    })
  })

  function validateExpectedAddressResponse(address: OsAddress) {
    expect(address.addressString).toEqual('1 The Road, My Town, A123BC')
    expect(address.buildingNumber).toEqual(1)
    expect(address.subBuildingName).toEqual('')
    expect(address.thoroughfareName).toEqual('The Road')
    expect(address.dependentLocality).toEqual('My Town')
    expect(address.postTown).toEqual('My Post Town')
    expect(address.county).toEqual('My County')
    expect(address.postcode).toEqual('A123BC')
    expect(address.country).toEqual('E')
    expect(address.uprn).toEqual(12345)
  }
})
