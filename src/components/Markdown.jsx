import { parseContent } from "../services/contentParser";
import styles from "./Markdown.module.css";
// Note: some styles are undefined because I've yet to find
//       problems that use them at this stage of development

export default function Markdown({ content }) {
    return (
        <>
            {(typeof content == "string" ? parseContent(content) : content).map((entry, i) => (
                <Block key={i} node={entry} />
            ))}
        </>
    );
}

function Block({ node }) {
    switch (node.type) {
        case "paragraph":
            return <span className={styles.paragraph}>{renderRuns(node.runs)}</span>;

        case "image":
            return <img className={styles.image} src={node.src} alt={node.alt} />;

        case "list": {
            const ListTag = node.ordered ? "ol" : "ul";
            return (
                <ListTag className={styles.list}>
                    {node.items.map((itemRuns, i) => (
                        <li key={i}>{renderRuns(itemRuns)}</li>
                    ))}
                </ListTag>
            );
        }

        case "table":
            return (
                <table className={styles.table}>
                    <thead>
                        <tr>
                            {node.header.map((cellRuns, i) => (
                                <th key={i} style={{ textAlign: node.align[i] || "left" }}>
                                    {renderRuns(cellRuns)}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {node.rows.map((row, i) => (
                            <tr key={i}>
                                {row.map((cellRuns, j) => (
                                    <td key={j} style={{ textAlign: node.align[j] || "left" }}>
                                        {renderRuns(cellRuns)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            );

        case "fencedCode":
            return (
                <code className={styles.fencedCode}>
                    <Markdown content={node.code} />
                </code>
            );

        default:
            return null;
    }
}

function renderRuns(runs) {
    return runs.map((run, i) => <Run key={i} run={run} />);
}

function Run({ run }) {
    let el = run.text;

    if (typeof el != "string") el = <Markdown content={el} />;

    if (run.code) el = <code className={styles.inlineCode}>{el}</code>;
    if (run.sub) el = <sub>{el}</sub>;
    if (run.sup) el = <sup>{el}</sup>;
    if (run.underline) el = <u>{el}</u>;
    if (run.italic) el = <em>{el}</em>;
    if (run.bold) el = <span className={styles.bold}>{el}</span>;
    if (run.link) el = <a href={run.link}>{el}</a>;

    return el;
}
