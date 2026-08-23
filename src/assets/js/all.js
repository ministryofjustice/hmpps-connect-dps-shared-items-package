import * as addressAutosuggest from '../dps/components/address-autosuggest'
import * as webcamCapture from '../dps/components/webcam-capture'

// eslint-disable-next-line import/prefer-default-export
export function initAll() {
  addressAutosuggest.init()
  webcamCapture.init()
}
