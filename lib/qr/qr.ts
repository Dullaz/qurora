import { Module } from "./matrix";
import { encode, get_encoding_mode } from "./qr_encode";
import { ERROR_CORRECTION_COL, GROUP_1_BLOCKS, GROUP_1_DATA, GROUP_2_BLOCKS, GROUP_2_DATA, TOTAL_CODEWORDS_COL, alignment_pattern, alignment_pattern_location_table, finder_pattern, qr_table } from "./qr_table";
import { rs_encode_message } from "../reed/rs";
import { DATA_TYPE, ECC_LEVEL, QR_CONTEXT, QR_VERSION } from "./types";
import { intArrayToBitString } from "../utils/util";

/**
 * Returns the context needed to create a QR code image.
 * 
 * @param data message to encode
 * @param error_correction_level error correction level to use (L, M, Q, H)
 * @returns QR_CONTEXT object
 */
export function get_qr_context(data: string, error_correction_level: ECC_LEVEL): QR_CONTEXT {
    const data_type = get_encoding_mode(data)
    const [version, codeword_capacity, ec_blocks, group_1, group_2] = get_version_info(data.length, data_type, error_correction_level)

    return {
        data,
        error_correction_level,
        version,
        data_type,
        codeword_capacity,
        ec_block_len: ec_blocks,
        group_1,
        group_2
    } as QR_CONTEXT
}

/*
    * Returns the QR version information that can be used to encode the data.
    *
    * @param data_len The length of the data to encode.
    * @param mode The encoding mode of the data. (NUMERIC, ALPHANUMERIC, BYTE, KANJI, ECI)
    * @param error_correction The error correction level to use. (L, M, Q, H)
    * 
    * @returns [version, [[blocks, data_codewords, ecc_codewords], [blocks, data_codewords, ecc_codewords]]]
*/
export function get_version_info(
    data_len: number, 
    data_type: DATA_TYPE, 
    error_correction: ECC_LEVEL) {

    let version;
    let info;

    const version_section = qr_table[error_correction];

    // find the smallest version that can fit the data
    for (let i = 0; i < version_section.length; i++) {
        if (version_section[i][data_type.table_column] >= data_len) {
            version = i + 1;
            info = version_section[i];
            break;
        }
    }

    // TODO: check max length before the loop
    if (!version) {
        throw new Error("Data too long to encode");
    }

    const res = [
        version,        
        info[TOTAL_CODEWORDS_COL],
        info[ERROR_CORRECTION_COL],
        [info[GROUP_1_BLOCKS], info[GROUP_1_DATA]],
        [info[GROUP_2_BLOCKS], info[GROUP_2_DATA]]
    ]

    return res
}


/**
 * Converts a string into the codeword sequence for the QR code data region.
 * This involves picking the right version, encoding the data, adding error correction, and padding.
 * 
 * @param data string to encode
 * @param error_correction_level  error correction level to use (L, M, Q, H)
 * @returns bit stream of the encoded data (string of 1s and 0s)
 */

export function generate_data_codewords(context: QR_CONTEXT) {

    const bit_stream = encode(context.data, context.data_type, context.version, context.codeword_capacity * 8);

    const groups: number[][] = []
    groups.push(context.group_1)
    groups.push(context.group_2)

    // find out of group one or group two goes first
    // smaller data codewords go first
    if (groups[0][1] > groups[1][1]) {
        groups.reverse()
    }

    const data_blocks: string[][] = []
    const ec_blocks: string[][] = []

    for(let i = 0; i < groups.length; i++) {
        const block_count = groups[i][0]
        const data_codewords_len = groups[i][1]

        for (let block = 0; block < block_count; block++) {
            const start = block * (data_codewords_len )
            const end = start + (data_codewords_len)

            const data_code_words = bit_stream.slice(start, end)
            const ecc_code_words = rs_encode_message(data_code_words, context.ec_block_len)
            data_blocks.push(data_code_words)
            ec_blocks.push(intArrayToBitString(ecc_code_words))

        }
    }

    const final_bit_stream: string[] = []
    
    const group_1_len = groups[0][1]
    const group_2_len = groups[1][1]

    // push first group data
    for (let i = 0; i < group_1_len; i++) {
        for (let j = 0; j < data_blocks.length; j++) {
            final_bit_stream.push(data_blocks[j][i])
        }
    }

    // push second group data
    for (let i = group_1_len; i < group_2_len; i++) {
        for (let j = 0; j < data_blocks.length; j++) {
            final_bit_stream.push(data_blocks[j][i])
        }
    }

    // push ec blocks
    // ec blocks are always the same length
    for (let i = 0; i < ec_blocks[0].length; i++) {
        for (let j = 0; j < ec_blocks.length; j++) {
            final_bit_stream.push(ec_blocks[j][i])
        }
    }

    let final_bit_stream_str = final_bit_stream.join('')

    return final_bit_stream_str
}

/**
 * Function which evalutes the QR code matrix based on the rules defined in the QR code standard.
 * 
 * @param grid The modules that make up the QR code matrix
 * @returns integer representing the penalty score
 */
export function evaluate_matrix(grid: Module[][]) {
    const rule_1 = evaluate_rule_one(grid)
    const rule_2 = evaluate_rule_two(grid)
    const rule_3 = evaluate_rule_three(grid)
    const rule_4 = evaluate_rule_four(grid)

    const total = rule_1 + rule_2 + rule_3 + rule_4

    return total
}

/**
 * Rule 1 is to evaluate how many adjacent modules are the same color.
 * If there are 5 or more adjacent modules of the same color, then the penalty is 3 + (n - 5)
 * 
 * @param matrix QR code matrix
 */
function evaluate_rule_one(grid: Module[][]): number {
    const calculate_penalty = (line: Module[]): number => {
        let count = 1;
        let colour = line[0].value;
        let penalty = 0;

        for (let j = 1; j < line.length; j++) {
            if (line[j].value === colour) {
                count++;
            } else {
                if (count >= 5) {
                    penalty += 3 + (count - 5);
                }
                count = 1;
                colour = line[j].value;
            }
        }

        if (count >= 5) {
            penalty += 3 + (count - 5);
        }

        return penalty;
    };

    let row_penalty = 0;
    let col_penalty = 0;

    for (let i = 0; i < grid.length; i++) {
        row_penalty += calculate_penalty(grid[i]);
        col_penalty += calculate_penalty(grid.map(row => row[i]));
    }

    return row_penalty + col_penalty;
}

/**
 * Rule 2 is to evaluate how many 2x2 blocks of the same color are present.
 * If there are any 2x2 blocks of the same color, then the penalty is 3 times the number of 2x2 blocks.
 *
 * @param matrix QR code matrix
 */
function evaluate_rule_two(grid: Module[][]): number {
    let penalty = 0;

    for (let i = 0; i < grid.length - 1; i++) {
        for (let j = 0; j < grid.length - 1; j++) {
            const top_left = grid[i][j].value;
            const top_right = grid[i][j + 1].value;
            const bottom_left = grid[i + 1][j].value;
            const bottom_right = grid[i + 1][j + 1].value;

            if (top_left === top_right && top_right === bottom_left && bottom_left === bottom_right) {
                penalty += 3;
            }
        }
    }

    return penalty;
}


/**
 * Rule 3 is to evalute the existence of a finder pattern preceeded or followed by 4 modules of light
 * If the pattern is found, then the penalty is 40
 * 
 * @param matrix 
 */
function evaluate_rule_three(grid: Module[][]): number {
    const FINDER_PATTERN = [1, 0, 1, 1, 1, 0, 1];
    const WHITE_PATTERN = [0, 0, 0, 0];
    const BEFORE_PATTERN = WHITE_PATTERN.concat(FINDER_PATTERN);
    const AFTER_PATTERN = FINDER_PATTERN.concat(WHITE_PATTERN);
    const PATTERN_LENGTH = BEFORE_PATTERN.length;

    let penalty = 0;

    const assess_segment = (segment: Module[]): number => {
        let count = 0

        for (let i = 0; i < segment.length - PATTERN_LENGTH; i++) {
            const pattern = segment.slice(i, i + PATTERN_LENGTH)

            if (pattern.every((v, i) => v.value === BEFORE_PATTERN[i])) {
                count += 1;
            }
            else if (pattern.every((v, i) => v.value === AFTER_PATTERN[i])) {
                count += 1;
            }
        }

        return count * 40;
    }

    for (let i = 0; i < grid.length; i++) {
        const row = grid[i]
        const col = grid.map(row => row[i])

        penalty += assess_segment(row)
        penalty += assess_segment(col)
    }

    return penalty
    
}

/**
 * Rule 4 is to evaluate the ratio of dark modules to light modules
 * Score is calculated as 10 points for every 5% deviation from 50%
 * 
 * @param matrix QR code matrix
 */
function evaluate_rule_four(grid: Module[][]): number {
    const total_modules = grid.length * grid.length;
    const dark_modules = grid.flat().reduce((acc, val) => acc + val.value, 0);
    const ratio = dark_modules / total_modules;
    const deviation = Math.abs(ratio - 0.5) * 2;

    return deviation * 10;
}


