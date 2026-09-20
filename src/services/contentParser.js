import MarkdownIt from "markdown-it";
import sub from "markdown-it-sub";
import sup from "markdown-it-sup";
import ins from "markdown-it-ins";

const md = new MarkdownIt({ html: false, linkify: false, typographer: false }).use(sub).use(sup).use(ins);

const mdCode = new MarkdownIt({ html: false, linkify: false, typographer: false, breaks: true }).use(sub).use(sup).use(ins);
mdCode.inline.ruler.disable(["newline", "escape", "entity"]);

const ESCAPABLE = new Set([..."!\"#$%&'()*+,-./:;<=>?@[]^_`{|}~"]);
const SHIELD_OPEN = "\uE000";
const SHIELD_CLOSE = "\uE001";

function shieldEscapes(text) {
    let result = "";
    for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (ch === "\\" && i + 1 < text.length && ESCAPABLE.has(text[i + 1])) {
            result += SHIELD_OPEN + text.charCodeAt(i + 1) + SHIELD_CLOSE;
            i++;
        } else {
            result += ch;
        }
    }
    return result;
}

function unshieldEscapes(text) {
    return text.replace(new RegExp(`${SHIELD_OPEN}(\\d+)${SHIELD_CLOSE}`, "g"), (_, code) => String.fromCharCode(Number(code)));
}

export function parseContent(markdownText) {
    const tokens = md.parse(markdownText, {});
    return tokensToNodes(tokens);
}

export function parseCodeContent(text) {
    const shielded = shieldEscapes(text);
    const inlineTokens = mdCode.parseInline(shielded, {});
    const segments = convertInline(inlineTokens[0].children);
    const runs = segments.flatMap((s) => (s.kind === "runs" ? s.runs : [])).map((run) => (typeof run.text === "string" ? { ...run, text: unshieldEscapes(run.text) } : run));
    return [{ type: "paragraph", runs }];
}

function tokensToNodes(tokens) {
    const nodes = [];
    let i = 0;

    while (i < tokens.length) {
        const token = tokens[i];

        switch (token.type) {
            case "paragraph_open": {
                for (const seg of convertInline(tokens[i + 1].children)) {
                    nodes.push(seg.kind === "image" ? { type: "image", alt: seg.alt, src: seg.src } : { type: "paragraph", runs: seg.runs });
                }
                i += 3;
                break;
            }

            case "heading_open": {
                for (const seg of convertInline(tokens[i + 1].children)) {
                    nodes.push(seg.kind === "image" ? { type: "image", alt: seg.alt, src: seg.src } : { type: "paragraph", runs: seg.runs.map((r) => ({ ...r, bold: true })) });
                }
                i += 3;
                break;
            }

            case "fence":
            case "code_block": {
                nodes.push({ type: "fencedCode", code: parseCodeContent(token.content.replace(/\n$/, "")), lang: token.info?.trim() || null });
                i += 1;
                break;
            }

            case "bullet_list_open":
            case "ordered_list_open": {
                const ordered = token.type === "ordered_list_open";
                const closeType = ordered ? "ordered_list_close" : "bullet_list_close";
                const items = [];
                i += 1;

                while (tokens[i].type !== closeType) {
                    if (tokens[i].type === "list_item_open") {
                        i += 1;
                        let itemRuns = [];
                        while (tokens[i].type !== "list_item_close") {
                            if (tokens[i].type === "inline") {
                                for (const seg of convertInline(tokens[i].children)) {
                                    if (seg.kind === "runs") itemRuns = itemRuns.concat(seg.runs);
                                }
                            }
                            i += 1;
                        }
                        items.push(itemRuns);
                        i += 1;
                    } else {
                        i += 1;
                    }
                }

                nodes.push({ type: "list", ordered, items });
                i += 1;
                break;
            }

            case "table_open": {
                const header = [];
                const align = [];
                const rows = [];
                i += 1;

                while (tokens[i].type !== "table_close") {
                    if (tokens[i].type === "thead_open") {
                        i += 1;
                        while (tokens[i].type !== "thead_close") {
                            if (tokens[i].type === "th_open") {
                                align.push(alignFromToken(tokens[i]));
                                header.push(flattenRuns(convertInline(tokens[i + 1].children)));
                                i += 3;
                            } else i += 1;
                        }
                        i += 1;
                    } else if (tokens[i].type === "tbody_open") {
                        i += 1;
                        while (tokens[i].type !== "tbody_close") {
                            if (tokens[i].type === "tr_open") {
                                const row = [];
                                i += 1;
                                while (tokens[i].type !== "tr_close") {
                                    if (tokens[i].type === "td_open") {
                                        row.push(flattenRuns(convertInline(tokens[i + 1].children)));
                                        i += 3;
                                    } else i += 1;
                                }
                                rows.push(row);
                                i += 1;
                            } else i += 1;
                        }
                        i += 1;
                    } else {
                        i += 1;
                    }
                }

                nodes.push({ type: "table", header, align, rows });
                i += 1;
                break;
            }

            default:
                i += 1;
        }
    }

    return nodes;
}

function flattenRuns(segments) {
    return segments.flatMap((s) => (s.kind === "runs" ? s.runs : []));
}

function alignFromToken(token) {
    const style = token.attrGet ? token.attrGet("style") : null;
    if (!style) return null;
    if (style.includes("right")) return "right";
    if (style.includes("center")) return "center";
    if (style.includes("left")) return "left";
    return null;
}

function convertInline(children) {
    const segments = [];
    let currentRuns = [];
    const styleStack = [];

    const flushRuns = () => {
        if (currentRuns.length) {
            segments.push({ kind: "runs", runs: currentRuns });
            currentRuns = [];
        }
    };

    const activeStyles = () => {
        const styles = {};
        for (const s of styleStack) {
            if (s.startsWith("link:")) styles.link = s.slice(5);
            else styles[s] = true;
        }
        return styles;
    };

    for (const token of children) {
        switch (token.type) {
            case "text":
                currentRuns.push({ text: token.content, ...activeStyles() });
                break;
            case "softbreak":
                currentRuns.push({ text: "\n", ...activeStyles() });
                break;
            case "hardbreak":
                currentRuns.push({ text: "\n", ...activeStyles() });
                break;
            case "strong_open":
                styleStack.push("bold");
                break;
            case "strong_close":
                styleStack.splice(styleStack.lastIndexOf("bold"), 1);
                break;
            case "em_open":
                styleStack.push("italic");
                break;
            case "em_close":
                styleStack.splice(styleStack.lastIndexOf("italic"), 1);
                break;
            case "ins_open":
                styleStack.push("underline");
                break;
            case "ins_close":
                styleStack.splice(styleStack.lastIndexOf("underline"), 1);
                break;
            case "sub_open":
                styleStack.push("sub");
                break;
            case "sub_close":
                styleStack.splice(styleStack.lastIndexOf("sub"), 1);
                break;
            case "sup_open":
                styleStack.push("sup");
                break;
            case "sup_close":
                styleStack.splice(styleStack.lastIndexOf("sup"), 1);
                break;
            case "code_inline":
                currentRuns.push({ text: parseCodeContent(token.content), ...activeStyles(), code: true });
                break;
            case "link_open":
                styleStack.push("link:" + token.attrGet("href"));
                break;
            case "link_close":
                styleStack.splice(
                    styleStack.findIndex((s) => s.startsWith("link:")),
                    1
                );
                break;
            case "image":
                flushRuns();
                segments.push({ kind: "image", alt: token.content, src: token.attrGet("src") });
                break;
            default:
                break;
        }
    }

    flushRuns();
    return segments;
}
