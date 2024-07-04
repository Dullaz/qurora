import * as fs from 'fs';
import { expect, test } from 'vitest'

import { generate_data_codewords, get_qr_context } from '../lib/qr/qr'
import { ALPHANUMERIC, BYTE, NUMERIC } from '../lib/qr/types'
import { Matrix, Module } from '../lib/qr/matrix'
import { finder_pattern } from '../lib/qr/qr_table'
import { bitStringToIntArray } from '../lib/utils/util'

test('given numeric data, context is numeric', () => {
    const data = "1234567890"
    const context = get_qr_context(data, "L")

    expect(context.data_type).toEqual(NUMERIC)
})

test('given alphanumeric data, context is alphanumeric', () => {
    const data = "HELLO WORLD"
    const context = get_qr_context(data, "L")

    expect(context.data_type).toEqual(ALPHANUMERIC)
})

test('given byte data, context is byte', () => {
    const data = "\0x03\0x04"
    const context = get_qr_context(data, "L")

    expect(context.data_type).toEqual(BYTE)
})

test('given data, code words are generated', () => {

    const data = "HELLO"
    const context = get_qr_context(data, "L")

    const codewords = generate_data_codewords(context)

    // code words should be
    // mode + caracter count + encoded data + terminator + pad with 0 to multiple of 8 + pad with patterns till data capacity
    // "HELLO" encoded = 0110 0001 0110 1111 0001 1001 1000

    let expected = "0010" + "000000101" + "0110000101101111000110011000" + "000" + "0000"
    while (expected.length < context.codeword_capacity * 8) {
        expected += "11101100"
        if (expected.length < context.codeword_capacity * 8) {
            expected += "00010001"
        }
    }

    // append error correction codewords
    expected += "01101110001110011101110110011000100011101101101100011111"

    expect(codewords).toEqual(expected)
    expect(codewords.length).toEqual(
        context.codeword_capacity * 8 + 
        context.ec_block_len * context.group_1[0] * 8 +
        context.ec_block_len * context.group_2[0] * 8
    )
})

test('matrix generation is correct', () => {

    const data = "01234567"
    const context = get_qr_context(data, 'M')
    const codewords = generate_data_codewords(context)

    const expected = "00010000 00100000 00001100 01010110 01100001 10000000 11101100 00010001 11101100 00010001 11101100 00010001 11101100 00010001 11101100 00010001 10100101 00100100 11010100 1100000111101101 00110110 1100011110000111 00101100 01010101".replace(/ /g, '')
    expect(expected).toEqual(codewords)

    const codewords_bits = bitStringToIntArray(codewords)

    const matrixObj = new Matrix(context.version, context.error_correction_level)
    matrixObj.add_data(codewords_bits)

    // we should expect finder patterns, alignment patterns, timing patterns, and dark module
    // to be set in the matrix
    
    // finder patterns
    expect_finder_patterns(matrixObj.grid)

    // dark module
    expect_dark_module(matrixObj)

    // timing patterns
    expect_timing_patterns(matrixObj)

    // expect mask to be correct
    expect(matrixObj.mask).toEqual(2)

    // load sample
    const expected_json = fs.readFileSync('./tests/samples/01234567.json', 'utf8')

    // compare the two matrices
    const actual_json = JSON.stringify(matrixObj, null, 2)

    expect(actual_json).toEqual(expected_json)

})

function expect_timing_patterns(matrixObj: Matrix) {

    for (let i = 8; i < matrixObj.size - 8; i++) {
        // skip alignment pattern ranges
        // TODO
    }
}

function expect_dark_module(matrixObj: Matrix) {
    const row = (4 * matrixObj.version) + 9
    const col = 8

    expect(matrixObj.grid[row][col].value).toEqual(1)
}

function expect_finder_patterns(grid: Module[][]) {
    // finder patterns
    check_finder_pattern(grid, 0, 0)
    check_finder_pattern(grid, grid.length - finder_pattern.length, 0)
    check_finder_pattern(grid, 0, grid.length - finder_pattern.length)
}

function check_finder_pattern(grid: Module[][], x: number, y: number) {

    for (let i = 0; i < finder_pattern.length; i++) {
        for (let j = 0; j < finder_pattern.length; j++) {
            expect(grid[y + i][x + j].value).toEqual(finder_pattern[i][j])
        }
    }
}