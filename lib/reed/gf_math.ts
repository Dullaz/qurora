// Galois Field math operations

// over-allocated to save having to mod the input by 255
const gf_exp = new Uint8Array(512); 
const gf_log = new Uint8Array(256);

/**
 * Initialize the tables for the Galois Field
 * This allows for fast multiplication and division within gf(2^8)
 * Whenever we want to find the exp or log of a number, we can just look it up in these tables
 */
function init_tables() {
    let x = 1;
    for (let i = 0; i < 255; i++) {
        gf_exp[i] = x;
        gf_log[x] = i;
        x = x << 1;
        if (x & 0x100) {
            x = x ^ 0x11d;
        }
    }
    for (let i = 255; i < 512; i++) {
        gf_exp[i] = gf_exp[i - 255];
    }
}

init_tables();

// Galois Field operations begin

export function gf_add(a: number, b: number): number {
    return a ^ b
}

export function gf_sub(a: number, b: number): number {
    return a ^ b
}

export function gf_mul(a: number, b: number): number {
    if (a === 0 || b === 0) {
        return 0;
    }
    return gf_exp[gf_log[a] + gf_log[b]];
}

export function gf_div(a: number, b: number): number {
    if (a === 0) {
        return 0;
    }
    if (b === 0) {
        throw new Error("division by zero");
    }
    return gf_exp[(gf_log[a] + 255 - gf_log[b])];
}

export function gf_pow(a: number, b: number): number {
    if (a === 0) {
        return 0;
    }
    if (b === 0) {
        return 1;
    }
    return gf_exp[(gf_log[a] * b)];
}

export function gf_inverse(a: number): number {
    if (a === 0) {
        throw new Error("division by zero");
    }
    return gf_exp[255 - gf_log[a]];
}

// GF Polynomial operations begin

export function gf_poly_scale(p: Uint8Array, x: number): Uint8Array {
    const r = new Uint8Array(p.length);
    for (let i = 0; i < p.length; i++) {
        r[i] = gf_mul(p[i], x);
    }
    return r;
}

export function gf_poly_add(p: Uint8Array, q: Uint8Array): Uint8Array {
    const r = new Uint8Array(Math.max(p.length, q.length));
    for (let i = 0; i < p.length; i++) {
        r[i + r.length - p.length] = p[i];
    }
    for (let i = 0; i < q.length; i++) {
        r[i + r.length - q.length] ^= q[i];
    }
    return r;
}

export function gf_poly_mul(p: Uint8Array, q: Uint8Array): Uint8Array {
    const r = new Uint8Array(p.length + q.length - 1);
    for (let j = 0; j < q.length; j++) {
        for (let i = 0; i < p.length; i++) {
            r[i + j] ^= gf_mul(p[i], q[j]);
        }
    }
    return r;
}

export function gf_poly_eval(p: Uint8Array, x: number): number {
    let y = p[0];
    for (let i = 1; i < p.length; i++) {
        y = gf_mul(y, x) ^ p[i];
    }
    return y;
}