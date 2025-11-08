import clipboardy from 'clipboardy';

let result = "";
const characters = [24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36];
const chapters = [1, 2, 3, 4, 5, 6, 99];

function getLine(line) {
    return [
        `Text("${line}")`,
        line,
        ""
    ].join("\n")
}

// let result = "";
// for (let ch = 0; ch < characters.length; ch++) {
//     for (let c = 0; c < chapters.length; c++) {
//         result += getLine(`Voice(${characters[ch]}, ${chapters[c]}, 1, 100)`)
//     }
// }

// const nums = [
//     6477 - 6476 + 1,
//     6480 - 6476 + 1,
//     6481 - 6476 + 1,
//     6482 - 6476 + 1,
//     6485 - 6476 + 1,
//     6493 - 6476 + 1,
//     6499 - 6476 + 1,
//     6506 - 6476 + 1,
//     6514 - 6476 + 1,
//     6515 - 6476 + 1,
//     6518 - 6476 + 1,
//     6519 - 6476 + 1,
//     6522 - 6476 + 1,
//     6526 - 6476 + 1,
//     6543 - 6476 + 1,
//     6544 - 6476 + 1,
// ]

// let result = "";
// for (let s = 0; s < nums.length; s++) {
//     result += [
//         `${nums[s]}`,
//         ""
//     ].join("\n");
// }

for (let i = 0; i < 1; i++) {
    result += getLine(`ScreenFade(101, 1, 24)`)
    result += getLine(`ScreenFade(1, ${i}, 60)`)
    result += getLine(`ScreenFade(0, ${i}, 60)`)
    result += getLine(`ScreenFade(101, 1, 24)`)
    result += getLine(`ScreenFade(0, ${i}, 60)`)
    result += getLine(`ScreenFade(1, ${i}, 60)`)
}

clipboardy.write(result.trimEnd())
    .then(() => console.log("Copied " + result.length + " characters"));

