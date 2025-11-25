function hmppsWebcamCapture(component) {
  const video = document.getElementById('hmpps-webcam__webcam')
  const captureBtn = document.getElementById('hmpps-webcam__captureImageButton')
  const clearImageBtn = document.getElementById('hmpps-webcam__clearImageButton')
  const snapshot = document.getElementById('hmpps-webcam__snapshot')
  const webcamImageFileInput = document.getElementById('hmpps-webcam__webcam-image-input')
  const webcamSelect = document.getElementById('hmpps-webcam__select-webcam')
  const webcamSelectFormGroup = document.getElementById('hmpps-webcam__webcam-select-form-group')
  const webcamSubmit = document.getElementById('hmpps-webcam__webcam-submit')
  const webcamPlaceholder = document.getElementById('hmpps-webcam__webcam-placeholder')
  const fileName = component.dataset.fileName ?? 'webcam-capture'
  const enableReporting = component.dataset.reportErrors === 'true'

// Permissions
  const permissionRequested = document.getElementById('hmpps-webcam__permission-requested')
  const permissionGranted = document.getElementById('hmpps-webcam__permission-granted')
  const webcamError = document.getElementById('hmpps-webcam__webcam-error')

// Preview elements
  const photoPreviewContainer = document.getElementById('hmpps-webcam__photo-preview-container')
  const photoCaptureContainer = document.getElementById('hmpps-webcam__photo-capture-container')
  const photoCaptureErrorContainer = document.getElementById('hmpps-webcam__photo-capture-container__error')

  const mimetype = 'image/jpeg'

  let stream = null

  function updateWebcamList({ activeDeviceId }) {
    webcamSelect.querySelectorAll('option').forEach(option => {
      if (option.value === activeDeviceId && option.label.indexOf('- Active') === -1) {
        option.label = `${option.label} - Active`
      } else if (option.value !== activeDeviceId && option.label.indexOf('- Active') > -1) {
        option.label = option.label.replace(' - Active', '')
      }
    })
  }

  async function getWebcamList() {
    // get camera permissions
    try {
      permissionRequested.style.display = 'block'
      await navigator.mediaDevices.getUserMedia({ video: true, audio: false })

      navigator.mediaDevices.enumerateDevices().then(devices => {
        const videoDevices = devices.filter(device => device.kind === 'videoinput')

        videoDevices.forEach((device, index) => {
          const option = document.createElement('option')
          option.value = device.deviceId
          option.text = device.label || `Camera ${index + 1}`
          webcamSelect.appendChild(option)
        })

        if (videoDevices.length < 2) {
          webcamSelectFormGroup.style.display = 'none'
        }

        if (videoDevices.length > 0) {
          startWebcam(videoDevices[0].deviceId)
        }
      })
    } catch (e) {
      photoCaptureContainer.style.display = 'none'
      photoCaptureErrorContainer.style.display = 'block'
      if (enableReporting) {
        await fetch(`/api/report-error?pageUrl=${encodeURIComponent(location.href)}&error=${e.name}`, {
          method: 'GET',
        })
      }
    }
  }

  async function stopWebcam() {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
    }
  }

  async function startWebcam(deviceId) {
    try {
      stopWebcam()
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: { exact: deviceId },
        },
      })
      video.srcObject = stream
      permissionRequested.style.display = 'none'
      permissionGranted.style.display = 'block'
      webcamPlaceholder.style.display = 'none'
      video.style.display = 'block'
      captureBtn.disabled = false
      updateWebcamList({ activeDeviceId: deviceId })
    } catch (error) {
      permissionRequested.style.display = 'none'
      webcamError.style.display = 'block'
      console.error('Webcam error:', error)
    }
  }

  webcamSelect.addEventListener('change', () => {
    startWebcam(webcamSelect.value)
  })

  clearImageBtn.addEventListener('click', () => {
    snapshot.src = ''

    photoPreviewContainer.style.display = 'none'
    photoCaptureContainer.style.display = 'block'
    webcamSubmit.disabled = true
  })

  captureBtn.addEventListener('click', () => {
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    const imageDataUrl = canvas.toDataURL(mimetype)
    snapshot.src = imageDataUrl

    canvas.toBlob(
      blob => {
        if (!blob) return

        const file = new File([blob], `${fileName}.jpg`, { type: mimetype })

        const dataTransfer = new DataTransfer()
        dataTransfer.items.add(file)
        webcamImageFileInput.files = dataTransfer.files
      },
      mimetype,
      0.92,
    )

    photoPreviewContainer.style.display = 'block'
    photoCaptureContainer.style.display = 'none'
    webcamSubmit.disabled = false
  })

  function pageInit() {
    photoPreviewContainer.style.display = 'none'
    photoCaptureContainer.style.display = 'block'
    getWebcamList()
  }

  pageInit()
}

export function init() {
  const webcamContainer = document.getElementById('hmpps-webcam-capture-component')
  if (webcamContainer) {
    hmppsWebcamCapture(webcamContainer)
  }
}
