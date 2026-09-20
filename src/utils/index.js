import clsx from "./clsx.js";
import * as sessionStorageX from "./sessionStorageHelpers.js";

export { clsx, sessionStorageX };

export function capitalize(str) {
    return str
        .split(" ")
        .map((x) => x.charAt(0).toUpperCase() + x.slice(1))
        .join(" ");
}
export function gcd(a, b) {
    if (b == 0) return a;
    return gcd(b, a % b);
}
export function lcm(a, b) {
    return Math.abs(a * b) / gcd(a, b);
}

export function lcmArray(arr) {
    return arr.reduce((acc, n) => lcm(acc, n));
}

export function trimCode(text) {
    const lines = text.split("\n");
    let minIndent = Infinity;
    for (const line of lines) {
        minIndent = Math.min(minIndent, line.match(/^\s*/)[0].length);
        if (minIndent == 0) break;
    }
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        lines[i] = line.slice(minIndent).trimRight();
    }
    return lines.join("\n");
}
