// Based on ONSDigital's https://github.com/ONSdigital/design-system/blob/main/src/components/address-input/autosuggest.address.js
import { AutosuggestUi, NoResults } from './autosuggest-ui'
import { abortableFetch, abortError, FetchStatus } from './abortable-fetch'

const classUPRN = 'hmpps-js-uprn'
const classInputContainer = 'hmpps-address-autosuggest'
const classInput = 'hmpps-js-autosuggest-input'

export class AutosuggestAddress {
  constructor(context) {
    this.context = context
    this.input = context.querySelector(`.${classInput}`)
    this.container = context.querySelector(`.${classInputContainer}`)
    this.uprn = context.querySelector(`.${classUPRN}`)
    this.findUrl = this.container.getAttribute('data-find-url')
    this.fetchDelay = this.container.getAttribute('data-fetch-delay')

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

  async checkAPIStatus() {
    this.fetch = abortableFetch(`${this.findUrl}/SW1H9AJ`, { fetchDelay: this.fetchDelay })

    try {
      const response = await this.fetch.send()
      const status = response && (await response.json()).status
      if (status !== 200) {
        this.autosuggest.handleNoResults(NoResults.server_error)
      }
    } catch (error) {
      if (error.name !== abortError) {
        this.autosuggest.handleNoResults(NoResults.server_error)
      }
    }
  }

  async suggestAddresses(query) {
    if (this.fetch && this.fetch.status !== FetchStatus.done) {
      this.fetch.abort()
    }

    // Reset any previously selected result:
    this.uprn.value = ''

    return await this.findAddress(query?.replace(/[^A-Z0-9-.' ]/gi, ''))
  }

  async findAddress(query) {
    this.fetch = abortableFetch(`${this.findUrl}/${query}`, { fetchDelay: this.fetchDelay })
    const data = await this.fetch.send()
    const response = await data.json()
    const status = response.status
    const addresses = response.results
    return this.mapFindResults(addresses, status)
  }

  mapFindResults(results, status) {
    if (!results) return { status }

    return {
      results: this.addressMapping(results),
      status: status,
    }
  }

  addressMapping(addresses) {
    if (!addresses?.length) return []

    return addresses.map(address => ({ uprn: address.uprn, displayText: address.addressString }))
  }

  async onAddressSelect(selectedResult) {
    if (this.fetch && this.fetch.status !== FetchStatus.done) {
      this.fetch.abort()
    }

    this.autosuggest.input.value = selectedResult.displayText
    this.uprn.value = selectedResult.uprn
  }
}
