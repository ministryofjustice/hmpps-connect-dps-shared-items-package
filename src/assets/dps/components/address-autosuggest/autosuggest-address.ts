// Based on ONSDigital's https://github.com/ONSdigital/design-system/blob/main/src/components/address-input/autosuggest.address.js
/* eslint-disable import/prefer-default-export, @stylistic/lines-between-class-members */

import type { AddressAutosuggestResponse } from '../../../../types/public/addressAutosuggest/addressAutosuggestResponse'
import type { OsAddress } from '../../../../types/public/addressAutosuggest/osAddress'
import AutosuggestUi, { type AddressSuggestion, type AddressSuggestions, NoResults } from './autosuggest-ui'
import { type AbortableFetch, abortableFetch, abortError, FetchStatus } from './abortable-fetch'

const classUPRN = 'hmpps-js-uprn'
const classInputContainer = 'hmpps-address-autosuggest'
const classInput = 'hmpps-js-autosuggest-input'

export class AutosuggestAddress {
  public readonly input: HTMLInputElement
  public readonly container: HTMLDivElement
  public readonly uprn: HTMLInputElement
  private readonly findUrl: string
  private readonly fetchDelay: number | undefined
  private fetch: AbortableFetch | null
  private autosuggest: AutosuggestUi

  constructor(public readonly context: HTMLDivElement) {
    this.input = context.querySelector(`.${classInput}`)!
    this.container = context.querySelector(`.${classInputContainer}`)!
    this.uprn = context.querySelector(`.${classUPRN}`)!
    this.findUrl = this.container.dataset.findUrl!
    const fetchDelay = Number.parseInt(this.container.dataset.fetchDelay!, 10)
    if (Number.isSafeInteger(fetchDelay)) {
      this.fetchDelay = fetchDelay
    }

    // State:
    this.fetch = null

    // Initialise autosuggest:
    this.autosuggest = new AutosuggestUi({
      context: this.container,
      onSelect: this.onAddressSelect.bind(this),
      suggestionFunction: this.suggestAddresses.bind(this),
    })

    // Check API status:
    this.checkAPIStatus()
  }

  private async checkAPIStatus(): Promise<void> {
    this.fetch = abortableFetch(`${this.findUrl}/SW1H9AJ`, { fetchDelay: this.fetchDelay })

    try {
      const response = await this.fetch.send()
      const status = response && ((await response.json()) as AddressAutosuggestResponse).status
      if (status !== 200) {
        this.autosuggest.handleNoResults(NoResults.server_error)
      }
    } catch (error) {
      if (error && typeof error === 'object' && 'name' in error && error.name !== abortError) {
        this.autosuggest.handleNoResults(NoResults.server_error)
      }
    }
  }

  public async suggestAddresses(query: string): Promise<AddressSuggestions> {
    if (this.fetch && this.fetch.status !== FetchStatus.done) {
      this.fetch.abort()
    }

    // Reset any previously selected result:
    this.uprn.value = ''

    return await this.findAddress(query?.replace(/[^A-Z0-9-.' ]/gi, ''))
  }

  private async findAddress(query: string): Promise<AddressSuggestions> {
    this.fetch = abortableFetch(`${this.findUrl}/${query}`, { fetchDelay: this.fetchDelay })
    const data = await this.fetch.send()
    const response: AddressAutosuggestResponse = await data.json()
    return this.mapFindResults(response)
  }

  private mapFindResults(response: AddressAutosuggestResponse): AddressSuggestions {
    const { status } = response
    if (!('results' in response)) {
      return { status }
    }
    const { results } = response
    return {
      results: this.addressMapping(results),
      status,
    }
  }

  private addressMapping(addresses: OsAddress[]): AddressSuggestion[] {
    if (!addresses?.length) {
      return []
    }

    return addresses.map(address => ({ uprn: address.uprn, displayText: address.addressString }))
  }

  public async onAddressSelect(selectedResult: AddressSuggestion): Promise<void> {
    if (this.fetch && this.fetch.status !== FetchStatus.done) {
      this.fetch.abort()
    }

    this.autosuggest.input.value = selectedResult.displayText ? selectedResult.displayText : ''
    this.uprn.value = `${selectedResult.uprn}`
  }
}
