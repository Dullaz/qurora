import { expect, test } from 'vitest'
import { ALPHANUMERIC, BYTE, NUMERIC } from '../lib/qr/types'
import { get_encoding_mode, encode } from '../lib/qr/qr_encode'

// Encoding here is converting the input data to a bit string according to IEC 18004:2006
// Error correction encoding is not handled here, see tests/gf.test.ts for that

test('correct encoding mode is found', () => {
    expect(get_encoding_mode("123")).toEqual(NUMERIC)
    expect(get_encoding_mode("0123456789")).toEqual(NUMERIC)

    expect(get_encoding_mode("HELLO")).toEqual(ALPHANUMERIC)
    expect(get_encoding_mode("HELLO WITH $%*+-./:")).toEqual(ALPHANUMERIC)

    // lower case letters are not allowed in alphanumeric mode
    expect(get_encoding_mode("https://sample.url/with/path")).toEqual(BYTE)
    expect(get_encoding_mode("http://another.url")).toEqual(BYTE)
    expect(get_encoding_mode("\x00\x01\x02\x03")).toEqual(BYTE)
})

test('encode numeric', () => {
    expect(encode("01234567", NUMERIC, 1, 152).join('')).toEqual("00010000001000000000110001010110011000011000000011101100000100011110110000010001111011000001000111101100000100011110110000010001111011000001000111101100")
})

test('encode alphanumeric', () => {
    expect(encode("AC-42", ALPHANUMERIC, 1, 152).join('')).toEqual("00100000001010011100111011100111001000010000000011101100000100011110110000010001111011000001000111101100000100011110110000010001111011000001000111101100")
})

test('encode byte', () => {
    expect(encode("http://google.com/path", BYTE, 2, 272).join('')).toEqual("01000001011001101000011101000111010001110000001110100010111100101111011001110110111101101111011001110110110001100101001011100110001101101111011011010010111101110000011000010111010001101000000011101100000100011110110000010001111011000001000111101100000100011110110000010001")
})
