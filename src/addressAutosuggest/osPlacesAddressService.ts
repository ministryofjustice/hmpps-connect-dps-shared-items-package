import Fuse, { IFuseOptions } from 'fuse.js'
import { OsAddress } from '../types/public/addressAutosuggest/osAddress'
import { convertToTitleCase, isBlank } from '../utils/utils'
import OsPlacesApiClient from './osPlacesApiClient'
import { ConnectDpsComponentLogger } from '../types/public/ConnectDpsComponentLogger'
import {
  OsPlacesDeliveryPointAddress,
  OsPlacesLandPropertyIdentifier,
  OsPlacesQueryResponse,
} from '../types/public/addressAutosuggest/osPlaces'

const simplePostCodeRegex = /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i
const stringContainingPostCodeRegex = /^(.*?)([A-Z]{1,2}\d[A-Z\d]? ?)(\d[A-Z]{2})(.*)$/i

// Where we know OS Places API struggles with certain search terms, we will perform an additional replacement search:
const knownIssueSearchTermReplacements: Record<string, string> = {
  amazon: 'amazon.co.uk',
  hmp: 'prison', // The entry can sometimes be something like 'HM Prison Ranby' which the API struggles to match
}

export interface AddressesMatchingQueryConfig {
  osPlacesQueryParamOverrides: Record<string, unknown>
  fuzzyMatchOptionOverrides: IFuseOptions<OsAddress>
}

export interface AddressesUprnQueryConfig {
  osPlacesQueryParamOverrides: Record<string, unknown>
}

export default class OsPlacesAddressService {
  constructor(
    private readonly logger: ConnectDpsComponentLogger,
    private readonly osPlacesApiClient: OsPlacesApiClient,
  ) {}

  public async getAddressesMatchingQuery(
    rawSearchQuery: string,
    config: AddressesMatchingQueryConfig = { osPlacesQueryParamOverrides: {}, fuzzyMatchOptionOverrides: {} },
  ): Promise<OsAddress[]> {
    const sanitisedSearchQuery = this.sanitiseString(rawSearchQuery) || ''
    const additionalSearchQuery = Object.keys(knownIssueSearchTermReplacements).reduce((accumulator, currentValue) => {
      const reg = new RegExp(currentValue, 'gi')
      return accumulator.replace(reg, knownIssueSearchTermReplacements[currentValue])
    }, sanitisedSearchQuery)

    const rawResults = await this.getOSPlacesResultsForQuery(sanitisedSearchQuery, config)
    const additionalResultsForKnownIssueSearchTerms =
      sanitisedSearchQuery === additionalSearchQuery
        ? []
        : await this.getOSPlacesResultsForQuery(additionalSearchQuery, config)

    return this.getOptimisedAddressesMatchingQuery(
      sanitisedSearchQuery,
      additionalSearchQuery,
      [...rawResults, ...additionalResultsForKnownIssueSearchTerms],
      config,
    )
  }

  public async getAddressByUprn(
    uprn: string,
    config: AddressesUprnQueryConfig = { osPlacesQueryParamOverrides: {} },
  ): Promise<OsAddress | null> {
    const response = await this.osPlacesApiClient.getAddressesByUprn(uprn, config.osPlacesQueryParamOverrides)
    const result = this.handleResponse(response)

    if (result.length === 0) return null
    if (result.length > 1) this.logger.info('Multiple results returned for UPRN')

    return result[result.length - 1]
  }

  public sanitiseUkPostcode(stringContainingPostcode: string) {
    const postCodeQuery = stringContainingPostCodeRegex.exec(stringContainingPostcode?.replace(/[^A-Z0-9 ]/gi, ''))
    if (!postCodeQuery) return stringContainingPostcode

    return `${postCodeQuery[1]}${postCodeQuery[2].toUpperCase().trim()} ${postCodeQuery[3].toUpperCase().trim()}${postCodeQuery[4]}`
  }

  private async getOSPlacesResultsForQuery(
    searchQuery: string,
    config: AddressesMatchingQueryConfig,
  ): Promise<OsAddress[]> {
    const response = await this.osPlacesApiClient.getAddressesByFreeTextQuery(
      this.sanitiseUkPostcode(searchQuery), // the API responds better when postcodes are properly formatted
      config.osPlacesQueryParamOverrides,
    )

    return this.handleResponse(response)
  }

  private getOptimisedAddressesMatchingQuery(
    searchQuery: string,
    additionalSearchQuery: string,
    rawResults: OsAddress[],
    config: AddressesMatchingQueryConfig,
  ): OsAddress[] {
    const bestMatchResults = new Fuse(rawResults, {
      shouldSort: true,
      threshold: 0.2,
      useExtendedSearch: true, // to allow search terms to be separated
      ignoreLocation: true, // to allow search terms to be separated
      keys: [{ name: 'addressString' }],
      ...config.fuzzyMatchOptionOverrides,
    })
      .search(searchQuery)
      .map(result => result.item)

    const queryIsAPostCode = simplePostCodeRegex.test(searchQuery)
    const isExactMatchToQuery = (addressString: string | undefined) =>
      searchQuery &&
      (this.sanitiseString(addressString)?.includes(searchQuery!) ||
        this.sanitiseString(addressString)?.includes(additionalSearchQuery!))

    // By using `useExtendedSearch` and allowing search terms to be separated, we need to reprioritise exact match results:
    const preferExactMatchSort = (a: OsAddress, b: OsAddress) =>
      isExactMatchToQuery(a?.addressString) && !isExactMatchToQuery(b?.addressString) ? -1 : 1

    // This ensures house numbers are ordered numerically, not alphabetically when doing a search just on postcode:
    const buildingNumberSort = (a: OsAddress, b: OsAddress) =>
      a?.addressString && b?.addressString && queryIsAPostCode
        ? a.addressString.localeCompare(b.addressString, undefined, { numeric: true, sensitivity: 'base' })
        : 1

    // maximum number of properties in a postcode is 100
    return (bestMatchResults.length ? bestMatchResults : rawResults)
      .sort(queryIsAPostCode ? buildingNumberSort : preferExactMatchSort)
      .slice(0, 100)
  }

  private handleResponse(response: OsPlacesQueryResponse): OsAddress[] {
    if (response.header && response.header.totalresults === 0) return []

    return (
      response.results
        .map(
          result => (result.DPA && this.dpaToOsAddress(result.DPA)) || (result.LPI && this.lpiToOsAddress(result.LPI)),
        )
        .filter(result => !!result?.uprn)
        // remove duplicate results with the same UPRN:
        .filter((val, index, self) => self.findIndex(address => address?.uprn === val?.uprn) === index) as OsAddress[]
    )
  }

  private dpaToOsAddress(addressResult: OsPlacesDeliveryPointAddress): OsAddress | undefined {
    const {
      UPRN,
      ADDRESS,
      DEPENDENT_LOCALITY,
      ORGANISATION_NAME,
      SUB_BUILDING_NAME,
      BUILDING_NAME,
      BUILDING_NUMBER,
      THOROUGHFARE_NAME,
      POST_TOWN,
      POSTCODE,
      COUNTRY_CODE,
      LOCAL_CUSTODIAN_CODE_DESCRIPTION,
      POSTAL_ADDRESS_CODE,
    } = addressResult

    // Do not return address data that does not have a valid postal address:
    if (POSTAL_ADDRESS_CODE === 'N') return undefined

    const useOrganisationNameAsBuildingName =
      !isBlank(ORGANISATION_NAME) && isBlank(BUILDING_NAME) && isBlank(SUB_BUILDING_NAME)

    const buildingName = convertToTitleCase(useOrganisationNameAsBuildingName ? ORGANISATION_NAME : BUILDING_NAME)
    const subBuildingName = [useOrganisationNameAsBuildingName ? null : ORGANISATION_NAME, SUB_BUILDING_NAME]
      .filter(name => !isBlank(name))
      .map(name => convertToTitleCase(name!))
      .join(', ')

    return {
      addressString: this.formatAddressString(ADDRESS, BUILDING_NUMBER, THOROUGHFARE_NAME, POSTCODE),
      buildingNumber: BUILDING_NUMBER,
      buildingName,
      subBuildingName,
      thoroughfareName: convertToTitleCase(THOROUGHFARE_NAME),
      dependentLocality: convertToTitleCase(DEPENDENT_LOCALITY),
      postTown: convertToTitleCase(POST_TOWN),
      county: convertToTitleCase(LOCAL_CUSTODIAN_CODE_DESCRIPTION),
      postcode: POSTCODE,
      country: COUNTRY_CODE,
      uprn: UPRN,
    }
  }

  private lpiToOsAddress(addressResult: OsPlacesLandPropertyIdentifier): OsAddress | undefined {
    const {
      UPRN,
      ADDRESS,
      ORGANISATION,
      SAO_TEXT,
      PAO_START_NUMBER,
      PAO_TEXT,
      STREET_DESCRIPTION,
      TOWN_NAME,
      POSTCODE_LOCATOR,
      COUNTRY_CODE,
      POSTAL_ADDRESS_CODE,
    } = addressResult

    // Do not return address data that does not have a valid postal address:
    if (POSTAL_ADDRESS_CODE === 'N') return undefined

    const useOrganisationAsBuildingName = !isBlank(ORGANISATION) && isBlank(PAO_TEXT) && isBlank(SAO_TEXT)

    const buildingName = convertToTitleCase(useOrganisationAsBuildingName ? ORGANISATION : PAO_TEXT)
    const subBuildingName = [useOrganisationAsBuildingName ? null : ORGANISATION, SAO_TEXT]
      .filter(name => !isBlank(name))
      .map(name => convertToTitleCase(name!))
      .join(', ')

    return {
      addressString: this.formatAddressString(ADDRESS, PAO_START_NUMBER, STREET_DESCRIPTION, POSTCODE_LOCATOR),
      buildingNumber: PAO_START_NUMBER,
      buildingName,
      subBuildingName,
      thoroughfareName: convertToTitleCase(STREET_DESCRIPTION),
      postTown: convertToTitleCase(TOWN_NAME),
      postcode: POSTCODE_LOCATOR,
      country: COUNTRY_CODE,
      uprn: UPRN,
    }
  }

  private formatAddressString(
    addressString: string,
    buildingNumber: number,
    thoroughfareName: string,
    postcode: string,
  ) {
    const withoutPostcode = addressString
      .replace(`, ${postcode}`, '')
      .replace(`${buildingNumber}, ${thoroughfareName}`, `${buildingNumber} ${thoroughfareName}`)
    return `${convertToTitleCase(withoutPostcode)}, ${postcode}`
  }

  private sanitiseString(input: string | undefined) {
    return input
      ?.trim()
      ?.toLowerCase()
      ?.replace(/[^A-Z0-9-.' ]/gi, '')
  }
}
