import { AutosuggestAddress } from './autosuggest-address'

export function init() {
  // Setup all address autosuggest instances:
  const addressAutosuggests = [...document.querySelectorAll('.hmpps-js-address-autosuggest')]

  if (addressAutosuggests.length) {
    addressAutosuggests.forEach(addressAutosuggest => new AutosuggestAddress(addressAutosuggest))
  }
}
