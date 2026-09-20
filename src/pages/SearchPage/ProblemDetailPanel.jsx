import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Markdown from "../../components/Markdown";
import TagPill from "../../components/TagPill";

import { parseCodeContent } from "../../services/contentParser";
import { capitalize, lcmArray, trimCode } from "../../utils";
import { getCodeBlock, getWrittenProblemById } from "../../services/dbService";

import styles from "./SearchPage.module.css";

export default function ProblemDetailPanel({ id }) {
    const [data, code, LCM, items] = useMemo(() => {
        if (id == null) return [];
        const data = getWrittenProblemById(id);
        if (!data.answer_layout) return [data, data.code_block_id && data.code_block_id && trimCode(getCodeBlock(data.code_block_id).code)];
        let LCM = lcmArray(data.answer_layout);
        let items = [];
        for (const num of data.answer_layout) {
            for (let i = 0; i < num; i++) items.push(LCM / num);
        }
        return [data, data.code_block_id && trimCode(getCodeBlock(data.code_block_id).code), LCM, items];
    }, [id]);

    const ref = useRef(null);

    const [codeSize, setCodeSize] = useState(0);
    const [answerSize, setAnswerSize] = useState(0);

    useEffect(() => {
        function updateWidth() {
            if (ref.current == null) return;
            const usableWidth = ref.current.clientWidth - 5 * 4;
            setAnswerSize((13 / 350) * usableWidth);

            if (!code) {
                setCodeSize(0);
                return;
            }
            const lines = code.replace(/\r/g, "").split("\n");

            let max = 0;
            for (const line of lines) max = Math.max(line.length, max);

            setCodeSize(Math.min(24, (usableWidth - 15) / (max * 0.6)));
        }
        updateWidth();
        window.addEventListener("resize", updateWidth);
        return () => {
            window.removeEventListener("resize", updateWidth);
        };
    }, [code]);

    return (data == null || !data.question_content) ? (
        <div className={styles.sidePanelSection}>
            <div className={styles.noneSelected}>No problem selected</div>
        </div>
    ) : (
        <div className={styles.sidePanelSection} ref={ref}>
            <span className={styles.previewTitle}>
                {data.year} {capitalize(data.competition)} {capitalize(data.type)} #{data.problem_number}
            </span>
            {data.tags.length > 0 && (
                <div className={styles.previewTags}>
                    {data.tags.map((tag) => {
                        return <TagPill tagId={tag} key={tag} />;
                    })}
                </div>
            )}
            <div className={styles.previewQuestionContent}>
                <Markdown content={data?.question_content} />
            </div>

            {data.answer_choices && (
                <div
                    className={styles.previewAnswerChoices}
                    style={{
                        fontSize: answerSize + "px",
                        gridTemplateColumns: `repeat(${LCM}, 1fr)`
                    }}>
                    {data.answer_choices.map((choice, i) => {
                        return (
                            <div
                                className={styles.previewAnswerChoice}
                                key={i}
                                style={
                                    data.answer_layout && {
                                        gridColumn: `span ${items[i]}`
                                    }
                                }>
                                <span className={styles.answerLetter}>{String.fromCharCode(65 + i)})</span>
                                <div className={styles.answerContent}>
                                    <Markdown content={choice} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {data.code_block_id && (
                <div className={styles.previewCodeBlock} style={{ fontSize: codeSize + "px" }}>
                    <Markdown content={parseCodeContent(code)} />
                </div>
            )}

            <div className={styles.previewButtons}>
                <Link
                    to={{
                        pathname: `view/${data.year}/${data.competition}`,
                        search: "?q=" + id
                    }}>
                    View in Packet
                </Link>
            </div>
        </div>
    );
}
