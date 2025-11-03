import { convertToTitleCase, properCaseName } from './utils'

describe('utils', () => {
  describe('convertToTitleCase', () => {
    it.each([
      [null, null, ''],
      ['empty string', '', ''],
      ['Lower case', 'robert', 'Robert'],
      ['Upper case', 'ROBERT', 'Robert'],
      ['Mixed case', 'RoBErT', 'Robert'],
      ['Multiple words', 'RobeRT SMiTH', 'Robert Smith'],
      ['Leading spaces', '  RobeRT', '  Robert'],
      ['Trailing spaces', 'RobeRT  ', 'Robert  '],
      ['Hyphenated', 'Robert-John SmiTH-jONes-WILSON', 'Robert-John Smith-Jones-Wilson'],
      ['In parentheses', 'JIM (JAMES) SMITH', 'Jim (James) Smith'],
    ])('%s convertToTitleCase(%s, %s)', (_: string | null, a: string | null, expected: string) => {
      // @ts-expect-error for testing:
      expect(convertToTitleCase(a)).toEqual(expected)
    })
  })

  describe('properCaseName', () => {
    it('null string', () => {
      // @ts-expect-error for testing:
      expect(properCaseName(null)).toEqual('')
    })
    it('empty string', () => {
      expect(properCaseName('')).toEqual('')
    })
    it('Lower Case', () => {
      expect(properCaseName('bob')).toEqual('Bob')
    })
    it('Mixed Case', () => {
      expect(properCaseName('GDgeHHdGr')).toEqual('Gdgehhdgr')
    })
    it('Multiple words', () => {
      expect(properCaseName('BOB SMITH')).toEqual('Bob smith')
    })
    it('Hyphenated', () => {
      expect(properCaseName('MONTGOMERY-FOSTER-SMYTH-WALLACE-BOB')).toEqual('Montgomery-Foster-Smyth-Wallace-Bob')
    })
  })
})
