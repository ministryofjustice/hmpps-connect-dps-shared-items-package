// Based on ONSDigital's https://github.com/ONSdigital/design-system/blob/main/src/components/autosuggest/autosuggest.ui.js
/* eslint-disable no-param-reassign, @stylistic/lines-between-class-members */

import { abortError, abortTimeout } from './abortable-fetch'

const jsBaseClass = 'hmpps-js-autosuggest'

const classSuffixInitialised = '--initialised'
const classSuffixOption = '__option'
const classSuffixOptionFocused = `${classSuffixOption}--focused`
const classSuffixOptionNoResults = `${classSuffixOption}--no-results`
const classSuffixHasResults = '--has-results'

export const NoResults = {
  type_more: 'TYPE_MORE',
  no_match: 'NO_MATCH',
  server_error: 'SERVER_ERROR',
} as const
type NoResults = typeof NoResults

export interface AddressSuggestion {
  displayText?: string
  uprn?: number
}

export interface AddressSuggestions {
  status: number
  results?: AddressSuggestion[]
}

type AddressSuggestionFunction = (query: string) => Promise<AddressSuggestions>
type AddressSelectedCallback = (selectedResult: AddressSuggestion) => Promise<void>

interface AutosuggestUiOptions {
  context: HTMLDivElement
  suggestionFunction: AddressSuggestionFunction
  onSelect: AddressSelectedCallback
}

export default class AutosuggestUi {
  private readonly context: HTMLDivElement
  public readonly input: HTMLInputElement
  private readonly resultsContainer: HTMLDivElement
  private readonly resultsTitleContainer: HTMLDivElement
  private readonly listbox: HTMLUListElement
  private readonly instructions: HTMLDivElement
  private readonly errorContainer: HTMLDivElement
  private readonly errorTextContainer: HTMLDivElement
  private readonly ariaStatus: HTMLDivElement

  private readonly minChars: number
  private readonly ariaYouHaveSelected: string
  private readonly ariaMinChars: string
  private readonly ariaOneResult: string
  private readonly ariaNResults: string
  private readonly noResults: string
  private readonly typeMore: string
  private readonly listboxId: string
  private readonly errorMessage: string
  private readonly stylingBaseClass: string

  private readonly fetchSuggestions: AddressSuggestionFunction
  private readonly onSelect: AddressSelectedCallback

  private query: string
  private sanitisedQuery: string
  private results: AddressSuggestion[] | undefined
  private resultOptions: HTMLLIElement[]
  private numberOfResults: number

  private blurring: boolean
  private blurTimeout: number
  private scrolling: boolean
  private scrollTimeout: number
  private inputTimeout: number
  private highlightedResultIndex: number | null

  constructor({ context, onSelect, suggestionFunction }: AutosuggestUiOptions) {
    // DOM Elements
    this.context = context
    this.input = context.querySelector<HTMLInputElement>(`.${jsBaseClass}-input`)!
    this.resultsContainer = context.querySelector<HTMLDivElement>(`.${jsBaseClass}-results`)!
    this.resultsTitleContainer = this.resultsContainer.querySelector<HTMLDivElement>(`.${jsBaseClass}-results-title`)!
    this.listbox = this.resultsContainer.querySelector<HTMLUListElement>(`.${jsBaseClass}-listbox`)!
    this.instructions = context.querySelector<HTMLDivElement>(`.${jsBaseClass}-instructions`)!
    this.errorContainer = context.querySelector<HTMLDivElement>(`.${jsBaseClass}-error`)!
    this.errorTextContainer = this.errorContainer.querySelector<HTMLDivElement>('.moj-alert__content')!
    this.ariaStatus = context.querySelector<HTMLDivElement>(`.${jsBaseClass}-aria-status`)!

    // Settings
    this.minChars = 3
    this.ariaYouHaveSelected = context.dataset.ariaYouHaveSelected!
    this.ariaMinChars = context.dataset.ariaMinChars!
    this.ariaOneResult = context.dataset.ariaOneResult!
    this.ariaNResults = context.dataset.ariaNResults!
    this.noResults = context.dataset.noResults!
    this.typeMore = context.dataset.typeMore!
    this.errorMessage = context.dataset.errorApi!
    this.stylingBaseClass = context.dataset.stylingBaseClass!
    this.listboxId = this.listbox.id

    // Callbacks
    this.onSelect = onSelect
    this.fetchSuggestions = suggestionFunction

    // State
    this.query = ''
    this.sanitisedQuery = ''
    this.results = []
    this.resultOptions = []
    this.numberOfResults = 0
    this.highlightedResultIndex = null
    this.blurring = false
    this.blurTimeout = 0
    this.scrolling = false
    this.scrollTimeout = 0
    this.inputTimeout = 0

    this.initialiseUI()
  }

  private initialiseUI(): void {
    this.input.setAttribute('aria-autocomplete', 'list')
    this.input.setAttribute('aria-controls', this.listbox.id)
    this.input.setAttribute('aria-describedby', this.instructions.id)
    this.input.setAttribute('aria-haspopup', 'true')
    this.input.setAttribute('aria-owns', this.listbox.id)
    this.input.setAttribute('aria-expanded', 'false')
    this.input.setAttribute('autocomplete', 'off')
    this.input.setAttribute('role', 'combobox')

    this.context.classList.add(`${this.stylingBaseClass}${classSuffixInitialised}`)

    this.bindEventListeners()
  }

  private bindEventListeners(): void {
    this.input.addEventListener('keydown', this.handleKeydown.bind(this))
    this.input.addEventListener('keyup', this.handleKeyup.bind(this))
    this.input.addEventListener('input', this.handleChange.bind(this))
    this.input.addEventListener('blur', this.handleBlur.bind(this))
    this.input.addEventListener('focus', this.handleFocus.bind(this))
  }

  private handleKeydown(event: KeyboardEvent): void {
    // eslint-disable-next-line default-case
    switch (event.keyCode) {
      case 38: {
        // Up
        event.preventDefault()
        this.navigateResults(-1)
        break
      }
      case 40: {
        // Down
        event.preventDefault()
        this.navigateResults(1)
        break
      }
      case 27: {
        // Escape
        this.clearListbox()
        break
      }
      case 13: {
        // Enter
        if (this.highlightedResultIndex !== null) {
          event.preventDefault()
        }
        break
      }
    }
  }

  private handleKeyup(event: KeyboardEvent): void {
    // eslint-disable-next-line default-case
    switch (event.keyCode) {
      // Up and down
      case 40:
      case 38: {
        event.preventDefault()
        break
      }
      case 13: {
        // Enter
        if (this.highlightedResultIndex !== null) {
          this.selectResult()
        }
        break
      }
    }
  }

  private handleChange(_event: InputEvent): void {
    if (!this.blurring && this.input.value.trim()) {
      this.getSuggestions()
    } else {
      this.clearListbox()
    }
  }

  private handleBlur(_event: FocusEvent): void {
    clearTimeout(this.blurTimeout)
    this.blurring = true

    // Timeout required to allow user to click an option before clearing the listbox:
    this.blurTimeout = setTimeout(() => {
      this.blurring = false

      this.context.classList.remove(`${this.stylingBaseClass}${classSuffixHasResults}`)
      this.input.setAttribute('aria-expanded', 'false')
      this.setAriaStatus()
    }, 300)
  }

  private handleFocus(_event: FocusEvent): void {
    if (this.listbox.innerHTML) {
      this.context.classList.add(`${this.stylingBaseClass}${classSuffixHasResults}`)
      this.input.setAttribute('aria-expanded', 'true')
      this.setAriaStatus()
    }
  }

  private handleScroll(option: HTMLLIElement, scrollUp: boolean): void {
    clearTimeout(this.scrollTimeout)
    this.scrolling = true
    option.scrollIntoView(scrollUp)

    // Timeout required to allow user to click an option before clearing the listbox:
    this.scrollTimeout = setTimeout(() => {
      this.scrolling = false
    }, 300)
  }

  private checkCharCount(): void {
    if (this.input.value.length > 1 && this.input.value.length < this.minChars) {
      this.inputTimeout = setTimeout(() => {
        this.handleNoResults(NoResults.type_more)
      }, 2000)
    } else {
      clearTimeout(this.inputTimeout)
    }
  }

  private navigateResults(direction: number): void {
    let index: number | null = 0
    if (this.highlightedResultIndex !== null) {
      index = this.highlightedResultIndex + direction
    }

    if (index < this.numberOfResults) {
      if (index < 0) {
        index = null
      }

      this.setHighlightedResult(index)
    }
  }

  private sanitiseAutosuggestText(string: string): string {
    let sanitisedString = string.toLowerCase()

    sanitisedString = sanitisedString.trim()
    sanitisedString = sanitisedString.replace(/,/g, '')
    sanitisedString = sanitisedString.replace(/\s\s+/g, ' ')
    sanitisedString = sanitisedString.replace(/&/g, '%26')
    sanitisedString = sanitisedString.replace(/\d(?=[a-z]{3,})/gi, '$& ')

    return sanitisedString
  }

  private getSuggestions(): void {
    this.query = this.input.value

    const sanitisedQuery = this.sanitiseAutosuggestText(this.query)

    if (sanitisedQuery !== this.sanitisedQuery) {
      this.sanitisedQuery = sanitisedQuery
      this.unsetResults()
      this.checkCharCount()

      if (this.sanitisedQuery.length >= this.minChars) {
        this.fetchSuggestions(this.sanitisedQuery)
          .then(this.handleResults.bind(this))
          .catch(error => {
            if (error.name !== abortError && error.reason !== abortTimeout) {
              // eslint-disable-next-line no-console
              console.log('error:', error)
              this.handleNoResults(NoResults.server_error)
            }
          })
      } else {
        this.clearListbox()
      }
    }
  }

  private unsetResults(): void {
    this.results = []
    this.resultOptions = []
  }

  private clearListbox(): void {
    this.listbox.innerHTML = ''
    this.context.classList.remove(`${this.stylingBaseClass}${classSuffixHasResults}`)
    this.input.removeAttribute('aria-activedescendant')
    this.input.setAttribute('aria-expanded', 'false')
    this.setHighlightedResult(null)
    this.setAriaStatus()
  }

  private handleResults(response: AddressSuggestions): void {
    this.results = response?.results
    this.numberOfResults = this.results?.length || 0
    this.setAriaStatus()
    this.listbox.innerHTML = ''

    this.resultOptions =
      this.results?.map((result, index) => {
        this.resultsTitleContainer?.classList?.remove('hmpps-display-none')
        const listElement = this.createListElement(result, index)
        this.listbox.appendChild(listElement)
        return listElement
      }) ?? []

    this.setHighlightedResult(null)
    this.input.setAttribute('aria-expanded', this.numberOfResults ? 'true' : 'false')

    if (!!this.numberOfResults && this.sanitisedQuery.length >= this.minChars) {
      this.context.classList.add(`${this.stylingBaseClass}${classSuffixHasResults}`)
    } else {
      this.context.classList.remove(`${this.stylingBaseClass}${classSuffixHasResults}`)
      this.clearListbox()
    }

    if (this.numberOfResults === 0 && this.noResults) {
      this.handleNoResults(NoResults.no_match)
    }
  }

  private createListElement(result: AddressSuggestion, index: number): HTMLLIElement {
    const innerHTML = this.emboldenMatch(result.displayText ?? '', this.query)
    const listElement: HTMLLIElement = document.createElement('li')
    listElement.className = `${this.stylingBaseClass}${classSuffixOption}`
    listElement.setAttribute('id', `${this.listboxId}__option--${index}`)
    listElement.setAttribute('role', 'option')
    listElement.innerHTML = innerHTML
    listElement.addEventListener('click', () => {
      this.selectResult(index)
    })
    listElement.addEventListener('mouseenter', () => !this.scrolling && this.setHighlightedResult(index))
    return listElement
  }

  public handleNoResults(reason: NoResults[keyof NoResults]): void {
    if (reason === NoResults.type_more || reason === NoResults.no_match) {
      this.context.classList.add(`${this.stylingBaseClass}${classSuffixHasResults}`)
      this.resultsTitleContainer?.classList?.add('hmpps-display-none')
      this.input.setAttribute('aria-expanded', 'true')

      const message = reason === NoResults.type_more ? this.typeMore : this.noResults
      this.setAriaStatus(message)
      this.listbox.innerHTML = ''
      const noResultsItem = document.createElement('li')
      noResultsItem.className = `${this.stylingBaseClass}${classSuffixOption} ${this.stylingBaseClass}${classSuffixOptionNoResults}`
      noResultsItem.textContent = message
      this.listbox.appendChild(noResultsItem)
    } else {
      this.displayAPIError()
    }
  }

  private displayAPIError(): void {
    this.input.value = ''
    this.input.setAttribute('disabled', 'true')
    this.clearListbox()
    this.errorContainer.classList.remove('hmpps-display-none')
    this.errorTextContainer.textContent = this.errorMessage
    this.ariaStatus.setAttribute('aria-hidden', 'true')
    this.setAriaStatus(this.errorMessage)
  }

  private setHighlightedResult(index: number | null): void {
    this.highlightedResultIndex = index

    if (this.highlightedResultIndex === null) {
      this.input.removeAttribute('aria-activedescendant')
    }

    if (this.numberOfResults) {
      this.resultOptions.forEach((option, optionIndex) => {
        if (index !== null && optionIndex === index) {
          if (this.isAboveViewport(option)) {
            this.handleScroll(option, true)
          }
          if (this.isBelowViewport(option)) {
            this.handleScroll(option, false)
          }
          option.classList.add(`${this.stylingBaseClass}${classSuffixOptionFocused}`)
          option.setAttribute('aria-selected', 'true')
          this.input.setAttribute('aria-activedescendant', option.id)
          const optionText = option.innerHTML.replace('<b>', '').replace('</b>', '')
          this.setAriaStatus(optionText)
        } else {
          option.classList.remove(`${this.stylingBaseClass}${classSuffixOptionFocused}`)
          option.removeAttribute('aria-selected')
        }
      })
    }
  }

  private selectResult(index?: number): void {
    if (!this.results?.length) return

    const selectedIndex = typeof index === 'number' ? index : this.highlightedResultIndex
    if (selectedIndex === null || selectedIndex === undefined) return

    const result = this.results?.[selectedIndex]
    if (!result) return

    this.onSelect(result)
    this.clearListbox()
    this.setAriaStatus(`${this.ariaYouHaveSelected}: ${result.displayText}.`)
  }

  private setAriaStatus(content?: string): void {
    if (!content) {
      const queryTooShort = this.sanitisedQuery.length < this.minChars
      const noResults = this.numberOfResults === 0
      if (queryTooShort) {
        content = this.ariaMinChars
      } else if (noResults) {
        content = `${this.noResults}: "${this.query}"`
      } else if (this.numberOfResults === 1) {
        content = this.ariaOneResult
      } else {
        content = this.ariaNResults.replace('{n}', `${this.numberOfResults}`)
      }
    }
    this.ariaStatus.textContent = content
  }

  private emboldenMatch(string: string, query: string): string {
    return this.escapeRegExp(query)
      .trim()
      .replace(/\s\s+/g, ' ')
      .split(' ')
      .reduce((accumulator, currentValue) => {
        const reg = new RegExp(`(?<!<)${currentValue}(?![\\w\\s]*>)`, 'gi')
        return accumulator.replace(reg, '<b>$&</b>')
      }, string)
  }

  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  private isAboveViewport(element: HTMLLIElement): boolean {
    return element.getBoundingClientRect().top < 0
  }

  private isBelowViewport(element: HTMLLIElement): boolean {
    return element.getBoundingClientRect().bottom > (window.innerHeight || document.documentElement.clientHeight)
  }
}
