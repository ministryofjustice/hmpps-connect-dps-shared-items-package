import nock from 'nock'
import { ApiConfig } from '@ministryofjustice/hmpps-rest-client'
import OsPlacesApiClient from './osPlacesApiClient'
import { mockOsPlacesAddressQueryResponse, mockOsPlacesInvalidApiKey } from './testMocks/osPlacesAddressQueryResponse'

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
      fakeOsPlaceApi.get(`/find?query=${testQuery}&lr=EN&key=${apiKey}`).reply(200, mockOsPlacesAddressQueryResponse)

      const output = await osPlacesApiClient.getAddressesByFreeTextQuery(testQuery)
      expect(output).toEqual(mockOsPlacesAddressQueryResponse)
    })

    it('should handle error responses', async () => {
      fakeOsPlaceApi.get(`/find?query=${testQuery}&lr=EN&key=${apiKey}`).reply(401, mockOsPlacesInvalidApiKey)

      await expect(osPlacesApiClient.getAddressesByFreeTextQuery(testQuery)).rejects.toMatchObject({
        message: 'Error calling OS Places API: Unauthorized',
      })
    })
  })
})
