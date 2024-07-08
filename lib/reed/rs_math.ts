// Reed-Solomon error correction functions
// This makes use of the Galois Field math functions in gf_math.ts

import { gf_poly_mul, gf_pow } from "./gf_math"

// Depending on the number of error correction codewords, we need a differently sized generator polynomial
// This will store all the generator polynomials for each degree up to a maximum of 255
// Why is 255 the max number of error correction codewords?
// Because our Galois Field is gf(2^8) which has 256 elements, including 0, which is enough to represent all 256 possible values of a byte
// Our RS generator polynomial is built using this Galois Field.
// Generating larger polynomials would require a larger Galois Field, which implies your underlying data chunk would be larger than a byte

const generator_polynomials: Uint8Array[] = []

function rs_table_init() {
  for (let i = 0; i < 256; i++) {
    generator_polynomials[i] = rs_generate_polynomial(i)
  }
}

function rs_generate_polynomial(degree: number) {
  let polynomial = Uint8Array.from([1])
  for (let i = 0; i < degree; i++) {
    polynomial = gf_poly_mul(polynomial, Uint8Array.from([1, gf_pow(2, i)]))
  }
  return polynomial
}

export function rs_gen_poly(degree: number) {
    return Uint8Array.from(generator_polynomials[degree])
}

rs_table_init()