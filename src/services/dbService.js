import initSqlJs from "sql.js";

let db, dbLoading;

export function initializeDB() {
    if (dbLoading) return dbLoading;
    return (dbLoading = (async () => {
        try {
            const data = await fetch(import.meta.env.BASE_URL + "database.sqlite")
                .then((x) => x.arrayBuffer())
                .then((x) => new Uint8Array(x));
            const SQL = await initSqlJs({ locateFile: () => import.meta.env.BASE_URL + "sql-wasm.wasm" });
            db = new SQL.Database(data);
            getTags();
            return db;
        } catch {
            return null;
        }
    })());
}

let TAGS = null;

export function getTags() {
    if (TAGS?.length > 0) return TAGS;

    const tags = db.exec("SELECT name FROM tags ORDER BY id");

    return (TAGS = tags.length ? tags[0].values.map((x) => x[0]) : []);
}

export function searchProblems({ filter = {}, grouping = ["year", "competition", "type"] }) {
    const conditions = [];
    const params = [];

    filter.year ??= [];
    filter.competition ??= [];
    filter.tag ??= [];
    filter.type ??= [];

    if (filter.year.length) {
        conditions.push(`p.year IN (${filter.year.map(() => "?").join(", ")})`);
        params.push(...filter.year);
    }

    if (filter.competition.length) {
        conditions.push(`p.competition IN (${filter.competition.map(() => "?").join(", ")})`);
        params.push(...filter.competition);
    }

    if (filter.type.length) {
        conditions.push(`p.type IN (${filter.type.map(() => "?").join(", ")})`);
        params.push(...filter.type);
    }

    if (filter.tag.length) {
        conditions.push(`
            p.id IN (
                SELECT pt.problem_id
                FROM problem_tags pt
                WHERE pt.tag_id IN (${filter.tag.map(() => "?").join(", ")})
                GROUP BY pt.problem_id
                HAVING COUNT(DISTINCT pt.tag_id) = ?
            )
        `);
        params.push(...filter.tag, filter.tag.length);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const stmt = db.prepare(`
        SELECT
            p.id,
            p.year,
            p.competition,
            p.type,
            COALESCE(wp.problem_number, pp.problem_number) AS problem_number,
            pp.problem_name,
            COALESCE(pt.tags, '[]') AS tags
        FROM problems p
        LEFT JOIN written_problems wp
            ON wp.problem_id = p.id
        LEFT JOIN programming_problems pp
            ON pp.problem_id = p.id
        LEFT JOIN (
            SELECT problem_id, json_group_array(tag_id) AS tags
            FROM problem_tags
            GROUP BY problem_id
        ) pt
            ON pt.problem_id = p.id
        ${where}
        ORDER BY p.year DESC, p.id
    `);

    stmt.bind(params);

    const problems = {};

    let temp;

    while (stmt.step()) {
        const row = stmt.getAsObject();

        temp = problems;
        for (let i = 0; i < 3; i++) {
            if (row[grouping[i]] in temp == false) temp[row[grouping[i]]] = i == 2 ? [] : {};
            temp = temp[row[grouping[i]]];
        }

        temp.push({
            id: row.id,
            year: row.year,
            competition: row.competition,
            type: row.type,
            problem_number: row.problem_number,
            problem_name: row.problem_name,
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
            wp.answer_layout,
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
            answer_layout: row.answer_layout?.split(",").map((x) => parseInt(x)),
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

export { TAGS };

export function collectProblemIds(node) {
    if (Array.isArray(node)) return node.map((p) => p.id);
    return Object.values(node).flatMap(collectProblemIds);
}

export function getWrittenTest(year, competition) {
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
            wp.answer_layout,
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
        INNER JOIN written_problems wp
            ON wp.problem_id = p.id
        WHERE
            p.year = ?
            AND p.competition = ?
            AND p.type = 'written'
        ORDER BY wp.problem_number
    `);

    stmt.bind([year, competition]);

    const problems = [];

    while (stmt.step()) {
        const row = stmt.getAsObject();

        problems.push({
            id: row.id,
            year: row.year,
            competition: row.competition,
            type: row.type,
            problem_number: row.problem_number,
            question_content: row.question_content,
            code_block_id: row.code_block_id,
            answer_size: row.answer_size,
            answer_layout: row.answer_layout?.split(",").map((x) => parseInt(x)),
            tags: JSON.parse(row.tags),
            answer_choices: JSON.parse(row.answer_choices)
        });
    }

    stmt.free();

    return problems;
}

export function getProgrammingPacket(year, competition) {
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
                        json_object(
                            'input', input,
                            'expected_output', expected_output
                        )
                    ),
                    '[]'
                )
                FROM sample_tests
                WHERE programming_problem_id = p.id
            ) AS sample_tests
        FROM problems p
        INNER JOIN programming_problems pp
            ON pp.problem_id = p.id
        WHERE
            p.year = ?
            AND p.competition = ?
            AND p.type = 'programming'
        ORDER BY pp.problem_number
    `);

    stmt.bind([year, competition]);

    const problems = [];

    while (stmt.step()) {
        const row = stmt.getAsObject();

        problems.push({
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
        });
    }

    stmt.free();

    return problems;
}

export function groupWrittenProblems(problems) {
    const output = [];
    const groups = {};

    for (const problem of problems) {
        if (problem.code_block_id == null) {
            output.push(problem);
            continue;
        }
        if (problem.code_block_id in groups) {
            groups[problem.code_block_id].problems.push(problem);
        } else {
            groups[problem.code_block_id] = {
                problems: [problem],
                code_block_id: problem.code_block_id
            };
            output.push(groups[problem.code_block_id]);
        }
    }

    const code_blocks = getCodeBlocks(Object.keys(groups));

    for (let i = 0; i < output.length; i++) {
        if ("problems" in output[i]) {
            output[i].code_block = code_blocks[output[i].code_block_id];
        }
    }

    return output;
}

export function getCodeBlocks(codeBlockIds) {
    if (!codeBlockIds || codeBlockIds.length === 0) return {};

    const stmt = db.prepare(`
        SELECT
            cb.id,
            cb.layout_type,
            cb.page_count,
            cb.is_image,
            cb.code,
            img.file_path AS image_path,
            img.alt_text AS image_alt,
            img.width AS image_width,
            img.height AS image_height
        FROM code_blocks cb
        LEFT JOIN images img ON img.id = cb.image_id
        WHERE cb.id IN (${codeBlockIds.map(() => "?").join(", ")})
    `);

    stmt.bind(codeBlockIds);

    const codeBlocks = {};

    while (stmt.step()) {
        const row = stmt.getAsObject();

        codeBlocks[row.id] = {
            id: row.id,
            layout_type: row.layout_type,
            page_count: row.page_count,
            is_image: row.is_image,
            code: row.code,
            image: row.is_image
                ? {
                      file_path: row.image_path,
                      alt_text: row.image_alt,
                      width: row.image_width,
                      height: row.image_height
                  }
                : null
        };
    }

    stmt.free();
    return codeBlocks;
}

export function getCodeBlock(codeBlockId) {
    return getCodeBlocks([codeBlockId])?.[codeBlockId];
}
