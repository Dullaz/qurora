import { expect, test } from 'vitest'
import { Module } from '../lib/qr/matrix'
import { evaluate_rule_four } from '../lib/qr/qr'
import { mask_pattern } from '../lib/qr/qr_table'

test('rule 4 evaluation of a perfect matrix', () => {

    const grid = Array.from(Array(10), (_, k) => {
        return Array.from(Array(10), (_, i) => new Module(i, k, mask_pattern[0](i, k) ? 1 : 0))
    })

    const expected_score = 0

    const actual_score = evaluate_rule_four(grid)

    expect(actual_score).toEqual(expected_score)
})

test('rule 4 evaluation of a imperfect matrix', () => {

    const grid = Array.from(Array(10), (_, k) => {
        return Array.from(Array(10), (_, i) => new Module(i, k, 0))
    })

    const expected_score = 100

    const actual_score = evaluate_rule_four(grid)

    expect(actual_score).toEqual(expected_score)
})