import { expect, test } from 'vitest'
import { Module } from '../lib/qr/matrix'
import { evaluate_rule_two } from '../lib/qr/qr'
import { mask_pattern } from '../lib/qr/qr_table'

test('rule 2 evaluation of all white matrix', () => {

    const grid = Array.from(Array(10), (_, k) => {
        return Array.from(Array(10), (_, i) => new Module(i, k, 0))
    })

    const expected_score = (9 * 9)

    const actual_score = evaluate_rule_two(grid)

    expect(actual_score).toEqual(expected_score)
})

test('rule 2 evaluation of mixed matrix', () => {

    const grid = Array.from(Array(10), (_, k) => {
        return Array.from(Array(10), (_, i) => new Module(i, k, 0))
    })

    grid[5][5].black("data")
    grid[5][6].black("data")
    grid[6][5].black("data")
    grid[6][6].black("data")

    const expected_score = (((9 * 9) - 8))

    const actual_score = evaluate_rule_two(grid)

    expect(actual_score).toEqual(expected_score)
})

test('rule 2 evaluation of perfect matrix', () => {

    const grid = Array.from(Array(10), (_, k) => {
        return Array.from(Array(10), (_, i) => new Module(i, k, 0))
    })

    // mask pattern 0 is a grid
    for(let i = 0; i < grid.length; i++) {
        for(let j = 0; j < grid[i].length; j++) {
            if (mask_pattern[0](i, j)) {
                grid[i][j].black("data")
            } else {
                grid[i][j].white("data")
            }
        }
    }

    const expected_score = 0

    const actual_score = evaluate_rule_two(grid)

    expect(actual_score).toEqual(expected_score)
})