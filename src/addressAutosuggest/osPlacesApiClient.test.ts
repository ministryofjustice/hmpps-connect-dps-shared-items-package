import nock from 'nock'
import { ApiConfig } from '@ministryofjustice/hmpps-rest-client'
import OsPlacesApiClient from './osPlacesApiClient'
import {
  mockOsPlacesAddressQueryResponse,
  mockOsPlacesAddressQuerySingleResponse,
  mockOsPlacesInvalidApiKey,
} from './testMocks/osPlacesAddressQueryResponse'

const apiKey = '123456'
const osPlacesUrl = 'http://localhost:123'

describe('osPlacesApiClient', () => {
  let fakeOsPlaceApi: nock.Scope
  let osPlacesApiClient: OsPlacesApiClient
  const testQuery = '1,A123BC'

  beforeEach(() => {
    fakeOsPlaceApi = nock(osPlacesUrl)
    osPlacesApiClient = new OsPlacesApiClient(console, { ...({ url: osPlacesUrl } as ApiConfig), apiKey })
  })

  afterEach(() => {
    jest.resetAllMocks()
    nock.cleanAll()
  })

  describe('getAddressesByFreeTextQuery', () => {
    it('should return data from api', async () => {
      fakeOsPlaceApi
        .get(
          `/find?query=${testQuery}&key=${apiKey}&lr=EN&fq=LOGICAL_STATUS_CODE%3A1&fq=LPI_LOGICAL_STATUS_CODE%3A1&dataset=LPI`,
        )
        .reply(200, mockOsPlacesAddressQueryResponse)

      const output = await osPlacesApiClient.getAddressesByFreeTextQuery(testQuery)
      expect(output).toEqual(mockOsPlacesAddressQueryResponse)
    })

    it('should allow query parameter override', async () => {
      fakeOsPlaceApi
        .get(
          `/find?query=${testQuery}&key=${apiKey}&lr=EN&fq=LOGICAL_STATUS_CODE%3A1&fq=LPI_LOGICAL_STATUS_CODE%3A1&dataset=LPI&foo=bar`,
        )
        .reply(200, mockOsPlacesAddressQueryResponse)

      const output = await osPlacesApiClient.getAddressesByFreeTextQuery(testQuery, { foo: 'bar' })
      expect(output).toEqual(mockOsPlacesAddressQueryResponse)
    })

    it('default fq query parameters depend on dataset', async () => {
      fakeOsPlaceApi
        .get(`/find?query=${testQuery}&key=${apiKey}&lr=EN&fq=LOGICAL_STATUS_CODE%3A1&dataset=DPA`)
        .reply(200, mockOsPlacesAddressQueryResponse)

      const output = await osPlacesApiClient.getAddressesByFreeTextQuery(testQuery, { dataset: 'DPA' })
      expect(output).toEqual(mockOsPlacesAddressQueryResponse)
    })

    it('should handle error responses', async () => {
      fakeOsPlaceApi
        .get(
          `/find?query=${testQuery}&key=${apiKey}&lr=EN&fq=LOGICAL_STATUS_CODE%3A1&fq=LPI_LOGICAL_STATUS_CODE%3A1&dataset=LPI`,
        )
        .reply(401, mockOsPlacesInvalidApiKey)

      await expect(osPlacesApiClient.getAddressesByFreeTextQuery(testQuery)).rejects.toMatchObject({
        message: 'Error calling OS Places API: Unauthorized',
      })
    })
  })

  describe('getAddressesByUprn', () => {
    const uprn = mockOsPlacesAddressQuerySingleResponse?.results[0]?.DPA?.UPRN

    it('should return data from api', async () => {
      fakeOsPlaceApi
        .get(`/uprn?uprn=${uprn}&key=${apiKey}&dataset=DPA,LPI`)
        .reply(200, mockOsPlacesAddressQueryResponse)

      const output = await osPlacesApiClient.getAddressesByUprn(uprn!.toString())
      expect(output).toEqual(mockOsPlacesAddressQueryResponse)
    })

    it('should allow query parameter override', async () => {
      fakeOsPlaceApi.get(`/uprn?uprn=${uprn}&key=${apiKey}&dataset=DPA`).reply(200, mockOsPlacesAddressQueryResponse)

      const output = await osPlacesApiClient.getAddressesByUprn(uprn!.toString(), { dataset: 'DPA' })
      expect(output).toEqual(mockOsPlacesAddressQueryResponse)
    })

    it('should handle error responses', async () => {
      fakeOsPlaceApi.get(`/uprn?uprn=${uprn}&key=${apiKey}&dataset=DPA,LPI`).reply(401, mockOsPlacesInvalidApiKey)

      await expect(osPlacesApiClient.getAddressesByUprn(uprn!.toString())).rejects.toMatchObject({
        message: 'Error calling OS Places API: Unauthorized',
      })
    })
  })
})
