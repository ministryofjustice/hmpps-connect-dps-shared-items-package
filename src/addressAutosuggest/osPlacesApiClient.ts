import superagent from 'superagent'
import { ApiConfig } from '@ministryofjustice/hmpps-rest-client'
import { OsPlacesQueryResponse } from '../types/public/addressAutosuggest/osPlaces'
import { ConnectDpsComponentLogger } from '../types/public/ConnectDpsComponentLogger'

export default class OsPlacesApiClient {
  constructor(
    private readonly logger: ConnectDpsComponentLogger,
    private readonly config: ApiConfig & { apiKey: string },
  ) {}

  async getAddressesByFreeTextQuery(freeTextQuery: string): Promise<OsPlacesQueryResponse> {
    const queryParams: Record<string, string> = {
      query: freeTextQuery,
      lr: 'EN',
      key: this.config.apiKey,
    }

    return this.get<Promise<OsPlacesQueryResponse>>('/find', queryParams)
  }

  async getAddressesByUprn(uprn: string): Promise<OsPlacesQueryResponse> {
    const queryParams: Record<string, string> = {
      uprn,
      key: this.config.apiKey,
    }

    return this.get<Promise<OsPlacesQueryResponse>>('/uprn', queryParams)
  }

  async get<T>(path: string, query: Record<string, string>): Promise<T> {
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
