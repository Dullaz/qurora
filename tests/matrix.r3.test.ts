import { expect, test } from 'vitest'
import { Module } from '../lib/qr/matrix'
import { evaluate_rule_three } from '../lib/qr/qr'

test('rule 3 evaluation of a perfect matrix', () => {

    const grid = Array.from(Array(10), (_, k) => {
        return Array.from(Array(10), (_, i) => new Module(i, k, 0))
    })

    const expected_score = 0

    const actual_score = evaluate_rule_three(grid)

    expect(actual_score).toEqual(expected_score)
})

test('rule 3 evaluation of a matrix with a finder pattern', () => {

    const grid = Array.from(Array(11), (_, k) => {
        return Array.from(Array(11), (_, i) => new Module(i, k, 0))
    })


    const FINDER_PATTERN = [1, 0, 1, 1, 1, 0, 1];

    // white before horizontal
    for (let i = 0; i < FINDER_PATTERN.length; i++) {
        grid[2][i+4].set(FINDER_PATTERN[i], "data")
    }

    // white after horizontal
    for (let i = 0; i < FINDER_PATTERN.length; i++) {
        grid[7][i].set(FINDER_PATTERN[i], "data")
    }

    // white before vertical
    for (let i = 0; i < FINDER_PATTERN.length; i++) {
        grid[i+4][0].set(FINDER_PATTERN[i], "data")
    }

    // white after vertical
    for (let i = 0; i < FINDER_PATTERN.length; i++) {
        grid[i][10].set(FINDER_PATTERN[i], "data")
    }

    const expected_score = 40 + 40 + 40 + 40

    const actual_score = evaluate_rule_three(grid)

    expect(actual_score).toEqual(expected_score)
})