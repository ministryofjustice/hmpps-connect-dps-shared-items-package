import * as addressAutosuggest from '../dps/components/address-autosuggest'
import { Modal } from '../dps/components/modal'
import * as webcamCapture from '../dps/components/webcam-capture'

// eslint-disable-next-line import/prefer-default-export
export function initAll() {
  addressAutosuggest.init()
  Modal.init()
  webcamCapture.init()
}
