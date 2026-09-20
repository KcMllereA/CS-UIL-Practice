import { useCallback, useEffect, useMemo, useState } from "react";
import { useSelection } from "../../context/SelectionContext";
import { useSearch } from "../../context/SearchContext";

import ExportSideBar from "./ExportSideBar";
import ProblemDetailPanel from "./ProblemDetailPanel";
import SearchBar from "./SearchBar";
import TagPill from "../../components/TagPill";
import FilterPanel from "./FilterPanel";

import { collectProblemIds } from "../../services/dbService";
import { capitalize, clsx } from "../../utils";

import styles from "./SearchPage.module.css";

export default function SearchPage() {
    const { yearFilters, competitionFilters, tagFilters, typeFilters, setYearFilters, setCompetitionFilters, setTagFilters, setTypeFilters, problems } = useSearch();
    const [preview, setPreview] = useState(null);

    return (
        <>
            <div className={styles.upperPage}>
                <div className={styles.title}>UIL Problem Browser</div>
                <SearchBar />
                <FilterPanel years={yearFilters} setYear={setYearFilters} competition={competitionFilters} setCompetition={setCompetitionFilters} tags={tagFilters} setTags={setTagFilters} type={typeFilters} setType={setTypeFilters} />
            </div>
            <div className={styles.lowerPage}>
                <div className={styles.sidePanelSection}>
                    <ExportSideBar />
                </div>
                <div className={styles.problemListWrapper}>
                    <div className={styles.problemList}>
                        {/* problem list */}
                        {problems === null
                            ? "Loading problems..."
                            : Object.keys(problems).map((year) => {
                                  return (
                                      <ProblemFolder path={`${year}`} key={year} name={year} data={problems[year]} depth={0}>
                                          {Object.keys(problems[year]).map((competition) => {
                                              return (
                                                  <ProblemFolder path={`${year}/${competition}`} key={competition} name={competition} data={problems[year][competition]} depth={1}>
                                                      {Object.keys(problems[year][competition]).map((type) => {
                                                          return (
                                                              <ProblemFolder path={`${year}/${competition}/${type}`} key={type} name={type} depth={2} data={problems[year][competition][type]}>
                                                                  {problems[year][competition][type].map((problem) => {
                                                                      return <Problem key={problem.id} data={problem} onPreview={setPreview} depth={3} />;
                                                                  })}
                                                              </ProblemFolder>
                                                          );
                                                      })}
                                                  </ProblemFolder>
                                              );
                                          })}
                                      </ProblemFolder>
                                  );
                              })}
                    </div>
                </div>
                <ProblemDetailPanel id={preview} />
            </div>
        </>
    );
}

function ProblemFolder({ children, name, data, depth = 0, path }) {
    const { toggleMany, getSelectionState } = useSelection();
    const { updateOpenedFolders, openedFolders } = useSearch();
    const [open, setOpen] = useState(openedFolders.has(path));
    const ids = useMemo(() => collectProblemIds(data), [data]);
    const selectionState = getSelectionState(ids);

    const handleToggle = useCallback(
        (e) => {
            e.stopPropagation();
            toggleMany(ids, selectionState !== "all");
        },
        [ids, selectionState, toggleMany]
    );

    useEffect(() => {
        if (open) updateOpenedFolders(path, true);
        else updateOpenedFolders(path, false);
    }, [open, path, updateOpenedFolders]);

    const selected = selectionState === "all";

    return (
        <div className={styles.problemFolder} open={open}>
            <div className={clsx(styles.problemFolderName, depth > 0 && styles.hasGuides, selected && styles.selected)} style={{ "--depth": depth }} onClick={() => setOpen((o) => !o)}>
                <button onClick={handleToggle} className={styles.selectionButton}>
                    {/* {selectionState === "all" ? "X" : selectionState === "some" ? "-" : ""} */}
                </button>
                <div className={styles.truncated}>{capitalize(name)}</div>
            </div>
            <div className={styles.problemFolderContent}>{children}</div>
        </div>
    );
}

function Problem({ data: { id, year, competition, type, tags, problem_number, problem_name }, depth = 0, onPreview }) {
    const { selectedObj, toggleSelection } = useSelection();
    const selected = id in selectedObj.current;

    return (
        <div className={clsx(styles.problem, depth > 0 && styles.hasGuides, selected && styles.selected)} style={{ "--depth": depth }}>
            <button className={styles.selectionButton} onClick={() => toggleSelection(id, !selected)}>
                {/* {selected && "X"} */}
            </button>
            <span className={styles.truncated} onClick={() => onPreview(id)}>
                {year} {capitalize(competition)} {type === "written" ? `Question ${problem_number}` : `Problem ${problem_number || "X"} ${capitalize(problem_name || "")}`}
            </span>
            <div className={clsx(styles.tagList, styles.truncated)} style={{ "--numTags": tags.length }}>
                {tags.map((x) => (
                    <TagPill tagId={x} key={x} />
                ))}
            </div>
        </div>
    );
}
