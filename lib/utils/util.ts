import { Module } from "../qr/matrix";

export function split_into_groups(data: string, group_size: number) {
    const groups: string[] = [];
    for (let i = 0; i < data.length; i += group_size) {
        groups.push(data.slice(i, i + group_size));
    }
    return groups;
}

export function divide_into_groups(data: string, group_size: number) {
    const result: string[] = [];
    const blockSize = Math.floor(data.length / group_size);
    let remainder = data.length % group_size;

    for (let i = 0; i < group_size; i++) {
        let end = (i + 1) * blockSize + Math.min(i + 1, remainder);
        let start = i * blockSize + Math.min(i, remainder);
        result.push(data.slice(start, end));
    }

    return result;
}

export function intArrayToBitString(arr: Uint8Array): string[] {
    return Array.from(arr, byte => byte.toString(2).padStart(8, '0'))
}

export function bitStringToIntArray(str: string): Uint8Array {
    return Uint8Array.from(str.split('').map(bit => parseInt(bit, 2)))
}   

export async function pretty_print_matrix(grid: Module[][]) {
    for (let i = 0; i < grid.length; i++) {
        for (let j = 0; j < grid[i].length; j++) {

            switch (grid[i][j].location) {
                case "finder":
                    process.stdout.write('f ')
                    break;
                case "timing":
                    process.stdout.write('t ')
                    break;
                case "alignment":
                    process.stdout.write('a ')
                    break;
                case "dark":
                    process.stdout.write('q ')
                    break;
                case "format":
                    process.stdout.write('x ')
                    break;
                case "version":
                    process.stdout.write('v ')
                    break;
                case "data":
                    process.stdout.write('d ')
                    break;
                default:
                    process.stdout.write('᛭ ')
                    break;
            }
        }
        process.stdout.write('\n')
    }
}

export function matrixToSvg(matrix: Module[][]) {
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${matrix.length * 10}" height="${matrix.length * 10}">`
    const scale = 10
    for (let i = 0; i < matrix.length; i++) {
        for (let j = 0; j < matrix[i].length; j++) {
            if(matrix[i][j].value === 1) {
                svg += `<rect x="${j*scale}" y="${i*scale}" width="${scale}" height="${scale}" fill="black"/>`
            } else if(matrix[i][j].value === 0) {
                svg += `<rect x="${j*scale}" y="${i*scale}" width="${scale}" height="${scale}" fill="white"/>`
            }
        }
    }
    svg += `</svg>`
    return svg
}