import { useParams, useSearchParams } from "react-router-dom";
import { getWrittenTest, groupWrittenProblems } from "../../services/dbService";
import { useEffect, useMemo } from "react";
import { parseContent } from "../../services/contentParser";
import Markdown from "../../components/Markdown";

import styles from "./WrittenPage.module.css";
import { lcmArray } from "../../utils";

export default function WrittenPage() {
    const { testYear, testComp } = useParams();
    const [searchParams] = useSearchParams();

    const questions = useMemo(() => groupWrittenProblems(getWrittenTest(testYear, testComp.toLowerCase())), [testYear, testComp]);

    useEffect(() => {
        if (!searchParams.has("q")) return;

        requestAnimationFrame(async () => {
            let element = document.getElementById(searchParams.get("q"));
            if (element != null) {
                element.scrollIntoView();
            }
        });
    }, [questions, searchParams]);

    return (
        <div className={styles.writtenPage}>
            {questions?.length &&
                questions.map((question, i) => {
                    return (
                        <div key={i} className={styles.rowContainer}>
                            {question.problems ? <GroupedQuestions data={question}></GroupedQuestions> : <Question key={i} data={question}></Question>}
                        </div>
                    );
                })}
        </div>
    );
}

function GroupedQuestions({ data }) {
    const fontSize = useMemo(() => {
        const lines = data.code_block.code.replace(/\r/g, "").split("\n");

        let max = 0;
        for (const line of lines) max = Math.max(line.length, max);

        return Math.min(16, (360 - 5 * 2) / (max * 0.6));
    }, [data.code_block.code]);

    return (
        <>
            <div className={styles.groupedQuestions}>
                {data.problems.map((data, i) => (
                    <Question key={i} data={data} />
                ))}
            </div>
            <div className={styles.codeBlock} style={{ fontSize }}>
                <Markdown content={parseContent("```\n" + data.code_block.code)} />
            </div>
        </>
    );
}

function Question({ data }) {
    return (
        <div id={data.id} number={data.problem_number} className={styles.questionContainer}>
            <Markdown content={parseContent(data.question_content)} />

            {data.answer_choices?.length > 0 && <AnswerChoices choices={data.answer_choices} layout={data.answer_layout} />}
        </div>
    );
}

function AnswerChoices({ choices, layout }) {
    const [lcm, items] = useMemo(() => {
        let LCM = lcmArray(layout);
        let items = [];
        for (const num of layout) {
            for (let i = 0; i < num; i++) items.push(LCM / num);
        }
        return [LCM, items];
    }, [layout]);
    return (
        <div
            className={styles.answerChoices}
            style={
                layout && {
                    gridTemplateColumns: `repeat(${lcm}, 1fr)`
                }
            }>
            {choices.map((choice, i) => (
                <div
                    className={styles.answerChoice}
                    key={i}
                    style={
                        layout && {
                            gridColumn: `span ${items[i]}`
                        }
                    }>
                    <span className={styles.answerLetter}>{String.fromCharCode(65 + i)})</span>
                    <div className={styles.answerContent}>
                        <Markdown content={choice} />
                    </div>
                </div>
            ))}
        </div>
    );
}
