function r(e) {
    var o,
        t,
        f = "";
    if ("string" == typeof e || "number" == typeof e) f += e;
    else if ("object" == typeof e)
        if (Array.isArray(e)) {
            var n = e.length;
            for (o = 0; o < n; o++) {
                if (e[o] && (t = r(e[o]))) {
                    if (f) f += " ";
                    f += t;
                }
            }
        } else for (t in e) e[t] && (f && (f += " "), (f += t));
    return f;
}
function clsx() {
    let args,
        classes,
        f = "",
        n = arguments.length;
    for (let i = 0; i < n; i++) {
        if ((args = arguments[i]) && (classes = r(args))) {
            if (f) f += " ";
            f += classes;
        }
    }
    return f;
}
export default clsx;
export { clsx };
