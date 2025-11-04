import superagent from 'superagent'
import { ApiConfig } from '@ministryofjustice/hmpps-rest-client'
import { OsPlacesQueryResponse } from '../types/public/addressAutosuggest/osPlaces'
import { ConnectDpsComponentLogger } from '../types/public/ConnectDpsComponentLogger'

export default class OsPlacesApiClient {
  constructor(
    private readonly logger: ConnectDpsComponentLogger,
    private readonly config: ApiConfig & { apiKey: string },
  ) {}

  async getAddressesByFreeTextQuery(
    freeTextQuery: string,
    queryParamOverrides: Record<string, unknown> = {},
  ): Promise<OsPlacesQueryResponse> {
    const queryParams: Record<string, unknown> = {
      query: freeTextQuery,
      key: this.config.apiKey,
      lr: 'EN',
      fq: ['LOGICAL_STATUS_CODE:1', 'LPI_LOGICAL_STATUS_CODE:1'], // only want active addresses
      dataset: 'LPI', // LPI chosen as default since it appears to perform better, especially for business addresses
      ...queryParamOverrides,
    }

    return this.get<Promise<OsPlacesQueryResponse>>('/find', queryParams)
  }

  async getAddressesByUprn(
    uprn: string,
    queryParamOverrides: Record<string, unknown> = {},
  ): Promise<OsPlacesQueryResponse> {
    const queryParams: Record<string, string> = {
      uprn,
      key: this.config.apiKey,
      dataset: 'DPA,LPI', // Both datasets available for the lookup by UPRN, preference for DPA because of the preferred data structure
      ...queryParamOverrides,
    }

    return this.get<Promise<OsPlacesQueryResponse>>('/uprn', queryParams)
  }

  private async get<T>(path: string, query: Record<string, unknown>): Promise<T> {
    const endpoint = `${this.config.url}${path}`
    try {
      const result = await superagent
        .get(endpoint)
        .retry(2, (err, _res) => {
          if (err) this.logger.info(`Retry handler found API error with ${err.code} ${err.message}`)
          return undefined // retry handler only for logging retries, not to influence retry logic
        })
        .query(query)
        .timeout(this.config.timeout)

      return result.body
    } catch (error) {
      const errorMessage = error && typeof error === 'object' && 'message' in error ? error.message : error
      throw Error(`Error calling OS Places API: ${errorMessage}`)
    }
  }
}
