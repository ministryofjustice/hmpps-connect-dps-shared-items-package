import { AutosuggestAddress } from './autosuggest-address'

export function init() {
  // Setup all address autosuggest instances:
  document
    .querySelectorAll<HTMLDivElement>('.hmpps-js-address-autosuggest')
    .forEach(addressAutosuggest => new AutosuggestAddress(addressAutosuggest))
}
