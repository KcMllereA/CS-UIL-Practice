import initSqlJs from "sql.js";

const data = await fetch(import.meta.env.BASE_URL + "database.sqlite")
    .then((x) => x.arrayBuffer())
    .then((x) => new Uint8Array(x));
const SQL = await initSqlJs({ locateFile: (file) => import.meta.env.BASE_URL + "sql-wasm.wasm" });
const db = new SQL.Database(data);

export function getTags() {
    const tags = db.exec("SELECT name FROM tags ORDER BY id");

    return tags.length ? tags[0].values.map((x) => x[0]) : [];
}

export function searchProblems({ year = [], competition = [], tags = [] }) {
    const conditions = [];
    const params = [];

    if (year.length) {
        conditions.push(`p.year IN (${year.map(() => "?").join(", ")})`);
        params.push(...year);
    }

    if (competition.length) {
        conditions.push(`p.competition IN (${competition.map(() => "?").join(", ")})`);
        params.push(...competition);
    }

    if (tags.length) {
        conditions.push(`
            p.id IN (
                SELECT pt.problem_id
                FROM problem_tags pt
                WHERE pt.tag_id IN (${tags.map(() => "?").join(", ")})
                GROUP BY pt.problem_id
                HAVING COUNT(DISTINCT pt.tag_id) = ?
            )
        `);

        params.push(...tags, tags.length);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const stmt = db.prepare(`
        SELECT
            p.id,
            p.year,
            p.competition,
            p.type,
            (
                SELECT COALESCE(json_group_array(tag_id), '[]')
                FROM problem_tags
                WHERE problem_id = p.id
            ) AS tags
        FROM problems p
        ${where}
        ORDER BY p.year DESC, p.id
    `);

    stmt.bind(params);

    const problems = [];

    while (stmt.step()) {
        const row = stmt.getAsObject();

        problems.push({
            id: row.id,
            year: row.year,
            competition: row.competition,
            type: row.type,
            tags: JSON.parse(row.tags)
        });
    }

    stmt.free();

    return problems;
}

export function getAllProblems() {
    return searchProblems({});
}

export function getWrittenProblemById(query) {
    const stmt = db.prepare(`
        SELECT
            p.id,
            p.year,
            p.competition,
            p.type,
            wp.problem_number,
            wp.question_content,
            wp.code_block_id,
            wp.answer_size,
            (
                SELECT COALESCE(json_group_array(tag_id), '[]')
                FROM problem_tags
                WHERE problem_id = p.id
            ) AS tags,
            (
                SELECT COALESCE(json_group_array(choice_content), '[]')
                FROM (
                    SELECT choice_content
                    FROM answer_choices
                    WHERE written_problem_id = p.id
                    ORDER BY order_index
                )
            ) AS answer_choices
        FROM problems p
        LEFT JOIN written_problems wp
            ON wp.problem_id = p.id
        WHERE p.id = ?
    `);

    stmt.bind([query]);

    let result = null;
    if (stmt.step()) {
        const row = stmt.getAsObject();
        result = {
            id: row.id,
            year: row.year,
            competition: row.competition,
            type: row.type,
            problem_number: row.problem_number,
            question_content: row.question_content,
            code_block_id: row.code_block_id,
            answer_size: row.answer_size,
            tags: JSON.parse(row.tags),
            answer_choices: JSON.parse(row.answer_choices)
        };
    }

    stmt.free();
    return result;
}

export function getProgrammingProblemById(query) {
    const stmt = db.prepare(`
        SELECT
            p.id,
            p.year,
            p.competition,
            p.type,
            pp.problem_number,
            pp.problem_name,
            pp.description_content,
            pp.input_description_content,
            pp.output_description_content,
            pp.sample_input,
            pp.sample_output,
            pp.explanation_content,
            (
                SELECT COALESCE(json_group_array(tag_id), '[]')
                FROM problem_tags
                WHERE problem_id = p.id
            ) AS tags,
            (
                SELECT COALESCE(
                    json_group_array(
                        json_object(
                            'code_block_id', code_block_id, 
                            'order_index', order_index
                        )
                    ), 
                    '[]'
                )
                FROM programming_problem_code_blocks
                WHERE programming_problem_id = p.id
            ) AS code_blocks,
            (
                SELECT COALESCE(
                    json_group_array(
                        json_object('input', input, 'expected_output', expected_output)
                    ), 
                    '[]'
                )
                FROM sample_tests
                WHERE programming_problem_id = p.id
            ) AS sample_tests
        FROM problems p
        LEFT JOIN programming_problems pp
            ON pp.problem_id = p.id
        WHERE p.id = ?
    `);

    stmt.bind([query]);

    let result = null;
    if (stmt.step()) {
        const row = stmt.getAsObject();
        result = {
            id: row.id,
            year: row.year,
            competition: row.competition,
            type: row.type,
            problem_number: row.problem_number,
            problem_name: row.problem_name,
            description_content: row.description_content,
            input_description_content: row.input_description_content,
            output_description_content: row.output_description_content,
            sample_input: row.sample_input,
            sample_output: row.sample_output,
            explanation_content: row.explanation_content,
            tags: JSON.parse(row.tags),
            code_blocks: JSON.parse(row.code_blocks),
            sample_tests: JSON.parse(row.sample_tests)
        };
    }

    stmt.free();
    return result;
}
