import * as addressAutosuggest from '../dps/components/address-autosuggest'
import * as webcamCapture from '../dps/components/webcam-capture'

export function initAll() {
  addressAutosuggest.init()
  webcamCapture.init()
}
