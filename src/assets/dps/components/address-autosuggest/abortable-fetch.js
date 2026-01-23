// Based on ONSDigital's https://github.com/ONSdigital/design-system/blob/main/src/js/abortable-fetch.js

export const FetchStatus = {
  unsent: 'UNSENT',
  loading: 'LOADING',
  done: 'DONE',
}

export const abortError = 'AbortError'
export const abortTimeout = 'AbortTimeout'

class AbortableFetch {
  constructor(url, options) {
    this.url = url
    this.controller = new window.AbortController()
    this.status = FetchStatus.unsent
    this.fetchDelay = options?.fetchDelay || 500
  }

  async send() {
    this.status = FetchStatus.loading
    try {
      // Abortable delay before querying the API to limit the rate of requests when someone is typing:
      await new Promise((resolve) => {
        setTimeout(resolve, this.fetchDelay)
        this.controller.signal.addEventListener('abort', () => { resolve() }, { once: true })
      })

      setTimeout(() => {
        this.controller.abort(abortTimeout)
      }, 5000)

      const response = await window.fetch(this.url, { signal: this.controller.signal })

      if (!(+response.status === 200)) {
        const error = new Error(`API error: ${response?.status ?? 500}`)
        error.response = response
        throw error
      }
      return response
    } finally {
      this.status = FetchStatus.done
    }
  }

  abort() {
    this.controller.abort()
  }
}

export const abortableFetch = (url, options) => new AbortableFetch(url, options)
