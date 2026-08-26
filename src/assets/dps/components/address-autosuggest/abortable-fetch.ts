// Based on ONSDigital's https://github.com/ONSdigital/design-system/blob/main/src/js/abortable-fetch.js
/* eslint-disable max-classes-per-file, @stylistic/lines-between-class-members */

export const FetchStatus = {
  unsent: 'UNSENT',
  loading: 'LOADING',
  done: 'DONE',
} as const
export type FetchStatus = typeof FetchStatus

export const abortError = 'AbortError' as const
export const abortTimeout = 'AbortTimeout' as const

export interface AbortableFetchOptions {
  /** How long to delay the fetch call for; defaults to 0.5s */
  fetchDelay?: number
}

export class AbortableFetch {
  private controller: AbortController
  public status: FetchStatus[keyof FetchStatus]
  private readonly fetchDelay: number
  private readonly url: string

  constructor(url: string, options: AbortableFetchOptions = {}) {
    this.url = url
    this.controller = new window.AbortController()
    this.status = FetchStatus.unsent
    this.fetchDelay = options?.fetchDelay || 500
  }

  public async send(): Promise<Response> {
    this.status = FetchStatus.loading
    try {
      // Abortable delay before querying the API to limit the rate of requests when someone is typing:
      await new Promise<void>(resolve => {
        setTimeout(resolve, this.fetchDelay)
        this.controller.signal.addEventListener(
          'abort',
          () => {
            resolve()
          },
          { once: true },
        )
      })

      setTimeout(() => {
        this.controller.abort(abortTimeout)
      }, 5000)

      const response = await window.fetch(this.url, { signal: this.controller.signal })

      if (!response.ok) {
        throw new ResponseError(`API error: ${response.status ?? 500}`, response)
      }
      return response
    } finally {
      this.status = FetchStatus.done
    }
  }

  public abort(): void {
    this.controller.abort()
  }
}

export class ResponseError extends Error {
  constructor(
    message: string,
    public readonly response: Response,
  ) {
    super(message)
  }
}

export const abortableFetch = (url: string, options: AbortableFetchOptions) => new AbortableFetch(url, options)
