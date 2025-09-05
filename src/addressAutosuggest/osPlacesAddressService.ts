import Fuse from 'fuse.js'
import { OsAddress } from '../types/public/addressAutosuggest/osAddress'
import { convertToTitleCase } from '../utils/utils'
import OsPlacesApiClient from './osPlacesApiClient'
import { ConnectDpsComponentLogger } from '../types/public/ConnectDpsComponentLogger'
import { OsPlacesDeliveryPointAddress, OsPlacesQueryResponse } from '../types/public/addressAutosuggest/osPlaces'

const simplePostCodeRegex = /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i
const stringContainingPostCodeRegex = /^(.*?)([A-Z]{1,2}\d[A-Z\d]? ?)(\d[A-Z]{2})(.*)$/i

export default class OsPlacesAddressService {
  constructor(
    private readonly logger: ConnectDpsComponentLogger,
    private readonly osPlacesApiClient: OsPlacesApiClient,
  ) {}

  public async getAddressesMatchingQuery(searchQuery: string, sanitisePostcode: boolean = true): Promise<OsAddress[]> {
    const response = await this.osPlacesApiClient.getAddressesByFreeTextQuery(
      sanitisePostcode ? this.sanitiseUkPostcode(searchQuery) : searchQuery,
    )

    const rawResults = this.handleResponse(response)

    const bestMatchResults = new Fuse(rawResults, {
      shouldSort: true,
      threshold: 0.2,
      ignoreLocation: true,
      keys: [{ name: 'addressString' }],
    })
      .search(searchQuery)
      .map(result => result.item)

    const queryIsAPostCode = simplePostCodeRegex.test(searchQuery.trim())
    const buildingNumberSort = (a: OsAddress, b: OsAddress) =>
      a?.addressString && b?.addressString && queryIsAPostCode
        ? a.addressString.localeCompare(b.addressString, undefined, { numeric: true, sensitivity: 'base' })
        : 1

    // maximum number of properties in a postcode is 100
    return (bestMatchResults.length ? bestMatchResults : rawResults).sort(buildingNumberSort).slice(0, 100)
  }

  public async getAddressByUprn(uprn: string): Promise<OsAddress | null> {
    const response = await this.osPlacesApiClient.getAddressesByUprn(uprn)
    const result = this.handleResponse(response)

    if (result.length === 0) return null
    if (result.length > 1) this.logger.info(`Multiple results returned for UPRN`)

    return result[result.length - 1]
  }

  public sanitiseUkPostcode(stringContainingPostcode: string) {
    const postCodeQuery = stringContainingPostCodeRegex.exec(stringContainingPostcode?.replace(/[^A-Z0-9 ]/gi, ''))
    if (!postCodeQuery) return stringContainingPostcode

    return `${postCodeQuery[1]}${postCodeQuery[2].toUpperCase().trim()} ${postCodeQuery[3].toUpperCase().trim()}${postCodeQuery[4]}`
  }

  private handleResponse(response: OsPlacesQueryResponse): OsAddress[] {
    if (response.header && response.header.totalresults === 0) return []

    return response.results.filter(result => result.DPA).map(result => this.toOsAddress(result.DPA!))
  }

  private toOsAddress(addressResult: OsPlacesDeliveryPointAddress): OsAddress {
    const {
      UPRN,
      DEPENDENT_LOCALITY,
      SUB_BUILDING_NAME,
      BUILDING_NAME,
      BUILDING_NUMBER,
      THOROUGHFARE_NAME,
      POST_TOWN,
      POSTCODE,
      COUNTRY_CODE,
      LOCAL_CUSTODIAN_CODE_DESCRIPTION,
    } = addressResult

    return {
      addressString: this.formatAddressString(addressResult),
      buildingNumber: BUILDING_NUMBER,
      buildingName: convertToTitleCase(BUILDING_NAME),
      subBuildingName: convertToTitleCase(SUB_BUILDING_NAME),
      thoroughfareName: convertToTitleCase(THOROUGHFARE_NAME),
      dependentLocality: convertToTitleCase(DEPENDENT_LOCALITY),
      postTown: convertToTitleCase(POST_TOWN),
      county: convertToTitleCase(LOCAL_CUSTODIAN_CODE_DESCRIPTION),
      postcode: POSTCODE,
      country: COUNTRY_CODE,
      uprn: UPRN,
    }
  }

  private formatAddressString(addressResult: OsPlacesDeliveryPointAddress) {
    const { ADDRESS, BUILDING_NUMBER, THOROUGHFARE_NAME, POSTCODE } = addressResult
    const withoutPostcode = ADDRESS.replace(`, ${POSTCODE}`, '').replace(
      `${BUILDING_NUMBER}, ${THOROUGHFARE_NAME}`,
      `${BUILDING_NUMBER} ${THOROUGHFARE_NAME}`,
    )
    return `${convertToTitleCase(withoutPostcode)}, ${POSTCODE}`
  }
}
