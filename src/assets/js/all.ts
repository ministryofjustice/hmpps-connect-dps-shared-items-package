import * as addressAutosuggest from '../dps/components/address-autosuggest'
import { Modal } from '../dps/components/modal'
import * as webcamCapture from '../dps/components/webcam-capture'

export function initAll() {
  addressAutosuggest.init()
  Modal.init()
  webcamCapture.init()
}
