import type { OsAddress } from './osAddress'

/** The JSON payload expected by the Address Autosuggest component when loading suggestions */
export type AddressAutosuggestResponse =
  | {
      status: number
      results: OsAddress[]
    }
  | {
      status: number
      error: string
    }
