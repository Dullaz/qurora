import { gf_mul } from "./gf_math";
import { rs_gen_poly } from "./rs_math";

export function rs_encode_message(msg: string[], error_codewords: number) {

    const gen = rs_gen_poly(error_codewords)

    const msg_in = Uint8Array.from(Array(msg.length).fill(0))
    for (let i = 0; i < msg.length; i++) {
        msg_in[i] = parseInt(msg[i], 2)
    }

    const msg_out = Uint8Array.from(Array(msg_in.length + gen.length - 1).fill(0))

    msg_out.set(msg_in)

    for (let i = 0; i < msg_in.length; i++) {
        const coef = msg_out[i]
        if (coef === 0) {
            continue
        }
        for (let j = 1; j < gen.length; j++) {
            msg_out[i + j] ^= gf_mul(gen[j], coef)
        }
    }

    //msg_out.set(msg_in)

    return msg_out.slice(msg.length)
}