import { alphanumeric_lookup_table, cc_bits_table } from "./qr_table";
import { DATA_TYPE, NUMERIC, ALPHANUMERIC, BYTE, KANJI, ECI, DATA_MODE_NAME } from "./types";
import { split_into_groups } from "../utils/util";

const TERMINATOR = "0000"

/*
    * Encodes the data into a bit stream and prepends mode and character count indicators.
    *
    * @param data The data to encode.
    * @param data_type The type of data to encode (NUMERIC, ALPHANUMERIC, BYTE, KANJI, ECI).
    * @param version The QR code version number. (1-40)
    * 
    * @returns The binary string representing the encoded data.

*/
export function encode(data: string, data_type: DATA_TYPE, version: number, data_bits_length: number) {

    let bit_stream: string

    switch (data_type) {
        case NUMERIC:
            bit_stream = encode_numeric(data);
            break
        case ALPHANUMERIC:
            bit_stream = encode_alphanumeric(data);
            break
        case BYTE:
            bit_stream = encode_byte(data);
            break
        case KANJI:
            throw new Error("Kanji encoding not implemented yet");
        default:
            bit_stream = encode_byte(data);
            break
    }

    const bits_to_prepend = get_prepend_bits(data.length, data_type, version)
    const padded_bit_stream = pad_bit_stream(bit_stream, bits_to_prepend, data_bits_length)

    return split_into_groups(padded_bit_stream, 8)
}

function encode_numeric(data: string) {

    const data_as_binary = split_into_groups(data, 3)
        .flatMap(group => {
            if (group.length === 1) { 
                return parseInt(group).toString(2).padStart(4, '0')
            } else if (group.length === 2) {
                return parseInt(group).toString(2).padStart(7, '0')
            }
            return parseInt(group).toString(2).padStart(10, '0')
        }).join('')

    return data_as_binary
}

function encode_alphanumeric(data: string) {

    const upper_case_data = data.toUpperCase()

    const data_as_binary = split_into_groups(upper_case_data, 2)
        .flatMap(group => {

            if (group.length === 1) {
                return alphanumeric_lookup_table[group].toString(2).padStart(6, '0')
            }

            const first_char = group[0]
            const second_char = group[1]

            let group_value = alphanumeric_lookup_table[first_char] * 45
            group_value += alphanumeric_lookup_table[second_char]

            return group_value.toString(2).padStart(11, '0')
        }).join('')

    return data_as_binary
}

function encode_byte(data: string) {

    const data_as_binary = data.split('')
        .map(char => char.charCodeAt(0).toString(2).padStart(8, '0'))
        .join('')

    return data_as_binary
}

function pad_bit_stream(input_stream: string, bits_to_prepend: string, data_bits_length: number) {

    let final_bit_stream = bits_to_prepend + input_stream

    const remaining_bits = data_bits_length - final_bit_stream.length

    if (remaining_bits < 0) 
        throw new Error("Data too long to encode")
    
    if (remaining_bits === 0) 
        return final_bit_stream

    if (remaining_bits < 4) {
        final_bit_stream = final_bit_stream + "0".repeat(remaining_bits)
        return final_bit_stream
    }

    final_bit_stream = final_bit_stream + TERMINATOR

    // pad to multiple of 8
    while (final_bit_stream.length % 8 !== 0) {
        final_bit_stream = final_bit_stream + "0"
    }

    const padding_pattern = "11101100"
    const padding_pattern_2 = "00010001"

    while (final_bit_stream.length < data_bits_length) {

        final_bit_stream = final_bit_stream + padding_pattern
        if (final_bit_stream.length < data_bits_length) {
            final_bit_stream = final_bit_stream + padding_pattern_2
        }
    }

    return final_bit_stream
}

/*
    * Returns the number of bits required to encode the character count indicator for the specified version and mode.
    *
    * @param version_num The QR code version number.
    * @param mode The encoding mode of the data. (1, 2, 4, 8, 7)
    * 
    * @returns The number of bits required to encode the character count indicator.
*/
export function cc_bits(version_num: number, data_mode: DATA_MODE_NAME) {

    const cc_bits_column = cc_bits_table[data_mode]

    if (version_num <= 9) {
        return cc_bits_column[0]
    }
    if (version_num <= 26) {
        return cc_bits_column[1]
    }
    return cc_bits_column[2]
}

/*
    * Returns the bits that need to be prepended to the data to create the final binary string.
    *
    * @param data_len The length of the data to encode.
    * @param mode The encoding mode of the data. (1, 2, 4, 8, 7)
    * @param version The QR code version number.
    * 
    * @returns The bits that need to be prepended to the data.

*/
export function get_prepend_bits(data_len: number, data_type: DATA_TYPE, version: number) {

    const character_count_bits = cc_bits(version, data_type.name)
    const character_count = data_len.toString(2).padStart(character_count_bits, '0')

    const mode_indicator = data_type.encoding_mode.toString(2).padStart(4, '0')

    return mode_indicator + character_count
}

/*
    * Returns the encoding mode of the data.
    *
    * The encoding mode is a 4-bit value that represents the type of data that is being encoded.
    * 1 - Numeric data
    * 2 - Alphanumeric data
    * 4 - Byte data (Latin-1 encoded)
    * 8 - Kanji data
    * 7 - ECI data
    * 
    * @param data The data to encode.
    * @returns The encoding mode of the data.
*/
export function get_encoding_mode(data: string) {

    if (NUMERIC.regex.test(data)) {
        return NUMERIC;
    }
    if (ALPHANUMERIC.regex.test(data)) {
        return ALPHANUMERIC;
    }
    if (BYTE.regex.test(data)) {
        return BYTE;
    }
    if (KANJI.regex.test(data)) {
        return KANJI;
    }

    return ECI;
}
