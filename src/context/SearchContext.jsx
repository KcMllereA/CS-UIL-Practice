import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { initializeDB, searchProblems } from "../services/dbService";
import { sessionStorageX } from "../utils";

const SearchContext = createContext();

export function SearchProvider({ children }) {
    const [query, setQuery] = useState("");

    const [yearFilters, setYearFilters] = useState(sessionStorageX.getItem("yearFilters") || []);
    const [competitionFilters, setCompetitionFilters] = useState(sessionStorageX.getItem("competitionFilters") || []);
    const [tagFilters, setTagFilters] = useState(sessionStorageX.getItem("tagFilters") || []);
    const [typeFilters, setTypeFilters] = useState(sessionStorageX.getItem("typeFilters") || []);

    const [yearQuery, setYearQuery] = useState(sessionStorageX.getItem("yearQuery") || "");
    const [competitionQuery, setCompetitionQuery] = useState(sessionStorageX.getItem("competitionQuery") || "");
    const [tagQuery, setTagQuery] = useState(sessionStorageX.getItem("tagQuery") || "");
    const [typeQuery, setTypeQuery] = useState(sessionStorageX.getItem("typeQuery") || "");

    const [loadingDb, setLoadingDb] = useState(true);

    const [problems, setProblems] = useState(null);

    const openedFolders = useRef(new Set(sessionStorageX.getItem("openedFolders") || []));

    useEffect(() => {
        if (!loadingDb)
            setProblems(
                searchProblems({
                    grouping: ["year", "competition", "type"],
                    filter: {
                        year: yearFilters,
                        competition: competitionFilters,
                        tag: tagFilters,
                        type: typeFilters
                    },
                    queries: {
                        year: yearQuery,
                        competition: competitionQuery,
                        tag: tagQuery,
                        type: typeQuery
                    }
                })
            );
    }, [loadingDb, yearFilters, competitionFilters, tagFilters, typeFilters, yearQuery, competitionQuery, tagQuery, typeQuery]);

    const updateOpenedFolders = useCallback((folderId, isOpen) => {
        if (isOpen) {
            openedFolders.current.add(folderId);
        } else {
            openedFolders.current.delete(folderId);
        }
    }, []);

    useEffect(() => {
        initializeDB().then(() => setLoadingDb(false));
    }, []);

    useEffect(() => {
        function cleanup() {
            sessionStorageX.setItem("query", query);
            sessionStorageX.setItem("yearFilters", yearFilters);
            sessionStorageX.setItem("competitionFilters", competitionFilters);
            sessionStorageX.setItem("tagFilters", tagFilters);
            sessionStorageX.setItem("typeFilters", typeFilters);
            sessionStorageX.setItem("yearQuery", yearQuery);
            sessionStorageX.setItem("competitionQuery", competitionQuery);
            sessionStorageX.setItem("tagQuery", tagQuery);
            sessionStorageX.setItem("typeQuery", typeQuery);
            sessionStorageX.setItem("openedFolders", Array.from(openedFolders.current));
        }
        window.addEventListener("beforeunload", cleanup);
        return () => {
            window.removeEventListener("beforeunload", cleanup);
        };
    }, [query, yearFilters, competitionFilters, tagFilters, typeFilters, yearQuery, competitionQuery, tagQuery, typeQuery]);

    return (
        <SearchContext
            value={{
                query,
                setQuery,
                yearFilters,
                competitionFilters,
                tagFilters,
                typeFilters,
                setYearFilters,
                setCompetitionFilters,
                setTagFilters,
                setTypeFilters,
                yearQuery,
                competitionQuery,
                tagQuery,
                typeQuery,
                setYearQuery,
                setCompetitionQuery,
                setTagQuery,
                setTypeQuery,
                problems,
                openedFolders: openedFolders.current,
                updateOpenedFolders
            }}>
            {loadingDb ? "loading" : children}
        </SearchContext>
    );
}

export function useSearch() {
    const context = useContext(SearchContext);
    if (!context) throw new Error("only works in search providers");
    return context;
}
