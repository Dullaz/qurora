import { Matrix } from "./qr/matrix";
import { generate_data_codewords, get_qr_context } from "./qr/qr";
import { ECC_LEVEL } from "./qr/types";
import { bitStringToIntArray } from "./utils/util";

export function generate(data: string, error_correction_level: ECC_LEVEL) {

    const context = get_qr_context(data, error_correction_level)

    const codewords = generate_data_codewords(context)

    // TODO: make it so that generate_data_codewords returns an array of integers
    const codewords_bits = bitStringToIntArray(codewords)

    const matrix = new Matrix(context.version, context.error_correction_level)

    matrix.add_data(codewords_bits)

    return matrix.grid
}