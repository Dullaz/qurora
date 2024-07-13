import { evaluate_matrix } from "./qr";
import { alignment_pattern, alignment_pattern_location_table, ec_bits_table, finder_pattern, format_information_table, mask_pattern, version_information_binary } from "./qr_table";
import { ECC_LEVEL, QR_VERSION } from "./types";

export type QR_LOCATION = "finder" | "alignment" | "timing" | "version" | "format" | "dark" | "data"

export class Module {
    x: number;
    y: number;
    value: number;
    location: QR_LOCATION | undefined;

    constructor(x: number, y: number, value: number, location?: QR_LOCATION) {
        this.x = x
        this.y = y
        this.value = value
        this.location = location
    }

    black(location: QR_LOCATION) {
        this.check_location(location)
        this.value = 1
        this.location = location
    }

    white(location: QR_LOCATION) {
        this.check_location(location)
        this.value = 0
        this.location = location
    }

    set(value: number, location: QR_LOCATION) {
        this.check_location(location)
        this.value = value
        this.location = location
    }

    private check_location(location: QR_LOCATION) {
        if (this.location !== location && this.location !== undefined) {

            throw new Error(`Attempting to override ${this.location} with ${location} at (${this.x}, ${this.y})`)
        }
    }

    copy() {
        return new Module(this.x, this.y, this.value, this.location)
    }
}

export class Matrix {

    size: number;
    version: QR_VERSION;
    grid: Module[][];

    mask: number;
    ec_level: ECC_LEVEL;
    format_info: number;

    constructor(version: QR_VERSION, ec_level: ECC_LEVEL) {
        this.version = version
        this.size = version * 4 + 17
        this.ec_level = ec_level
        this.mask = 0
        this.format_info = 0

        this.grid = Array.from(Array(this.size), (_, k) => {
            return Array.from(Array(this.size), (_, i) => new Module(i, k, 0))
        })

        // format information
        // we don't know the format information yet
        // so we reserve the space for it
        this.reserve_format_information()

        // dark module
        // ISO/IEC 18004:2015(E) - 7.9.1 - p56
        this.draw_dark_module()

        // finder patterns
        this.draw_finder_patterns()

        // timing patterns
        this.draw_timing_patterns()

        // place alignment patterns
        // this will override any timing patterns
        // but will avoid overlapping with finder patterns
        this.draw_alignment_pattern()

        // version information
        this.draw_version_information()

    }

    private reserve_format_information() {
        const size = this.size
        const size_minus_1 = size - 1
        const grid = this.grid

        // top left
        for (let i = 0; i <= 8; i++) {
            if (i === 6) continue
            grid[8][i].white("format")
            grid[i][8].white("format")
        }

        // top right and bottom left
        for (let i = 0; i < 8; i++) {
            grid[8][size_minus_1 - i].white("format")
            grid[size_minus_1 - i][8].white("format")
        }
    }

    private draw_dark_module() {
        const grid = this.grid
        const version = this.version
        const row = (4 * version) + 9

        // fixed dark module
        grid[row][8].location = "dark" //intentionally overwrite
        grid[row][8].black("dark")
    }

    private draw_finder_patterns() {
        const size = this.size
        const grid = this.grid
        const size_minus_1 = size - 1
        const size_minus_7 = size - 7
        const size_minus_8 = size - 8

        for (let i = 0; i < finder_pattern.length; i++) {
            for (let j = 0; j < finder_pattern.length; j++) {
                grid[i][j].set(finder_pattern[i][j], "finder")
                grid[i][size_minus_7 + j].set(finder_pattern[i][j], "finder")
                grid[size_minus_7 + i][j].set(finder_pattern[i][j], "finder")
            }
        }

        // add spacing around the finder patterns
        for(let i = 0; i < 8; i++) {
            grid[7][i].white("finder")
            grid[i][7].white("finder")

            grid[7][size_minus_8 + i].white("finder")
            grid[i][size_minus_8].white("finder")

            grid[size_minus_1 - i][7].white("finder")
            grid[size_minus_8][i].white("finder")

        }
    }

    private draw_timing_patterns() {
        const grid = this.grid

        let module = 1 // start with dark

        for (let i = 8; i < grid.length - 8; i++) {
            grid[i][6].set(module, "timing")
            grid[6][i].set(module, "timing")

            module = module === 1 ? 0 : 1
        }
    }

    private draw_alignment_pattern() {
        const grid = this.grid
        const version = this.version
        const locations = alignment_pattern_location_table[version]


        for (let i = 0; i < locations.length; i++) {
            alignment_loop:
            for (let j = 0; j < locations.length; j++) {

                //
                const x = locations[j] - 2
                const y = locations[i] - 2

                // check if we are going to overlap with the finder patterns
                for (let fx = x; fx < x + 5; fx++) {
                    for (let fy = y; fy < y + 5; fy++) {
                        if(grid[fy][fx].location !== undefined) {
                            continue alignment_loop
                        }
                    }
                }

                // place the pattern
                for (let row = 0; row < 5; row++) {
                    for (let col = 0; col < 5; col++) {
                        grid[y + row][x + col].set(alignment_pattern[row][col], "alignment")
                    }
                }
            }
        }
    }

    private draw_version_information() {
        const version = this.version
        if (version < 7) return

        const size = this.size
        const version_info = version_information_binary[version]
        const grid = this.grid

        for (let i = 0; i < 6; i++) {
            for (let j = 0; j < 3; j++) {
                grid[size - 11 + j][i].set(version_info[(i * 3) + j], "version")
                grid[i][size - 11 + j].set(version_info[(i * 3) + j], "version")
            }
        }
    }

    public insert_codewords(
        codewords: Uint8Array,
        mask: (x: number, y: number) => boolean = () => false
    ) {
        const temp_grid = this.grid.map(row => row.map(module => module.copy()))
        const size = this.size
        let codeword_index = 0
        let is_upwards = false

        for (let column = temp_grid.length - 1; column >= 0; column -= 2) {

            if (temp_grid[9][column].location == "timing") {
                column -= 1
            }

            is_upwards = !is_upwards
            const start = is_upwards ? size - 1 : 0
            const end = is_upwards ? 0 : size - 1
            const step = is_upwards ? -1 : 1

            const condition = (row: number) => is_upwards ? row >= end : row <= end

            for (let row = start; condition(row) && codeword_index >= 0; row += step) {

                // right column
                if (temp_grid[row][column].location === undefined) {
                    const masked_module = mask(row, column) ? codewords[codeword_index++] ^ 1 : codewords[codeword_index++]
                    temp_grid[row][column].set(masked_module, "data")
                }
                if (codeword_index === codewords.length) break

                if (column - 1 < 0) continue

                // left column
                if (temp_grid[row][column - 1].location === undefined) {
                    const masked_module = mask(row, column - 1) ? codewords[codeword_index++] ^ 1 : codewords[codeword_index++]
                    temp_grid[row][column - 1].set(masked_module, "data")
                }
                if (codeword_index === codewords.length) break

            }
        }

        if (codeword_index !== codewords.length) {
            throw new Error("Not all codewords were inserted")
        }

        return temp_grid
    }

    public add_format_information(grid: Module[][], mask: number) {

        const ec_level = this.ec_level
        const size_minus_1 = this.size - 1
        // contruct format information as <ec_level><mask>
        // i.e  L = 01
        //      mask = 010
        //      01 << 3 == 01000
        //      01000 | 010 == 01010
        const format_info_key = ec_bits_table[ec_level] << 3 | mask
        // copy format bits
        const format_bits = format_information_table[format_info_key].slice().reverse()

        // top left corner
        let bit_pos = 0;
        for (let i = 0; i < 9; i++) {
            if (i === 6) continue
            grid[i][8].set(format_bits[bit_pos++], "format")
        }
        for (let i = 7; i >= 0; i--) {
            if (i === 6) continue
            grid[8][i].set(format_bits[bit_pos++], "format")
        }

        // right and bottom
        bit_pos = 0
        for (let i = 0; i < 8; i++) {
            grid[8][size_minus_1 - i].set(format_bits[bit_pos++], "format")
        }
        for (let i = 0; i < 7; i++) {
            grid[size_minus_1 - i][8].set(format_bits[bit_pos++], "format")
        }
    }

    /**
     * Given some codewords, this will insert them, find the best mask, and add in the format information
     * 
     * @param codewords The data codewords to insert
     */
    public add_data(codewords: Uint8Array) {

        let best_grid: Module[][] = this.insert_codewords(codewords, mask_pattern[0])
        this.add_format_information(best_grid, 0)
        let best_score = evaluate_matrix(best_grid);
        let best_mask = 0;

        for (let mask_i = 1; mask_i < 8; mask_i++) {
            const masked_grid = this.insert_codewords(codewords, mask_pattern[mask_i])
            this.add_format_information(masked_grid, mask_i)
            const score = evaluate_matrix(masked_grid)

            if (score < best_score) {
                best_score = score
                best_grid = masked_grid
                best_mask = mask_i
            }
        }

        this.grid = best_grid
        this.mask = best_mask
    }
}