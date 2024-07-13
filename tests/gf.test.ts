import { expect, test } from 'vitest'
import { gf_add, gf_sub, gf_mul } from '../lib/reed/gf_math'
import { rs_encode_message } from '../lib/reed/rs'
import { rs_gen_poly } from '../lib/reed/rs_math'

test('gallois field addition is correct', () => {
    expect(gf_add(0b1011, 0b1101)).toEqual(0b0110)
    expect(gf_add(0b1111, 0b1111)).toEqual(0b0000)
    expect(gf_add(0b0000, 0b0000)).toEqual(0b0000)
    expect(gf_add(0b0000, 0b1111)).toEqual(0b1111)
})

test('gallois field subtraction is correct', () => {
    expect(gf_sub(0b1011, 0b1101)).toEqual(0b0110)
    expect(gf_sub(0b1111, 0b1111)).toEqual(0b0000)
    expect(gf_sub(0b0000, 0b0000)).toEqual(0b0000)
    expect(gf_sub(0b0000, 0b1111)).toEqual(0b1111)
})

test('gallois field multiplication is correct', () => {
    expect(gf_mul(0b10001001, 0b00101010)).toEqual(0b11000011)

})

test('generator polynomial is generated correctly', () => {

    expect(rs_gen_poly(0)).toEqual(Uint8Array.from([1]))
    expect(rs_gen_poly(1)).toEqual(Uint8Array.from([1, 1]))
    expect(rs_gen_poly(2)).toEqual(Uint8Array.from([1, 3, 2]))
    expect(rs_gen_poly(3)).toEqual(Uint8Array.from([1, 7, 14, 8]))
    expect(rs_gen_poly(4)).toEqual(Uint8Array.from([1, 15, 54, 120, 64]))

});

test('reed solomon encoder', () => {
    // "hello" in binary = 0110100001100101011011000110110001101111
    const data = ["01101000", "01100101", "01101100", "01101100", "01101111"]
    const error_codewords = 10

    const expected_output = Uint8Array.from([169,117,16,53,134,36,116,82,77,82])

    const encoded = rs_encode_message(data, error_codewords )
    
    expect(encoded).toEqual(expected_output)
});