import { ALPHANUMERIC_COL, BYTE_COL, KANJI_COL, NUMERIC_COL } from "./qr_table";

export type ECC_LEVEL = "L" | "M" | "Q" | "H";

export type QR_VERSION = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30 | 31 | 32 | 33 | 34 | 35 | 36 | 37 | 38 | 39 | 40;

export type DATA_MODE_NAME = "NUMERIC" | "ALPHANUMERIC" | "BYTE" | "KANJI" | "ECI";

export interface DATA_TYPE {
    name: DATA_MODE_NAME;
    regex: RegExp;
    table_column: number;
    encoding_mode: number;
}

export const NUMERIC: DATA_TYPE = {
    name: "NUMERIC",
    regex: /^\d*$/,
    table_column: NUMERIC_COL,
    encoding_mode: 0b0001
}

export const ALPHANUMERIC: DATA_TYPE = {
    name: "ALPHANUMERIC",
    regex: /^[\dA-Z $%*+\-./:]*$/,
    table_column: ALPHANUMERIC_COL,
    encoding_mode: 0b0010
}

export const BYTE: DATA_TYPE = {
    name: "BYTE",
    regex: /^[\x00-\xff]*$/,
    table_column: BYTE_COL,
    encoding_mode: 0b0100
}

export const KANJI: DATA_TYPE = {
    name: "KANJI",
    regex: /^[\p{Script_Extensions=Han}\p{Script_Extensions=Hiragana}\p{Script_Extensions=Katakana}]*$/u,
    table_column: KANJI_COL,
    encoding_mode: 0b1000
}

export const ECI: DATA_TYPE = {
    name: "ECI",
    regex: /^.*$/,
    table_column: BYTE_COL, // ECI is encoded as byte data? Needs work
    encoding_mode: 0b0111
}

export interface QR_CONTEXT {
    data: string;
    error_correction_level: ECC_LEVEL;
    version: QR_VERSION;
    data_type: DATA_TYPE;
    codeword_capacity: number;
    ec_block_len: number;
    group_1: [number, number];
    group_2: [number, number];
}