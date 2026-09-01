import { AutosuggestAddress } from './autosuggest-address'

// eslint-disable-next-line import/prefer-default-export
export function init() {
  // Setup all address autosuggest instances:
  document
    .querySelectorAll<HTMLDivElement>('.hmpps-js-address-autosuggest')
    .forEach(addressAutosuggest => new AutosuggestAddress(addressAutosuggest))
}
