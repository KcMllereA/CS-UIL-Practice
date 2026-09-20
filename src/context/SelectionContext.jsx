import { createContext, useCallback, useContext, useRef, useState } from "react";

const SelectionContext = createContext();

export function SelectionProvider({ children }) {
    const [selectedArray, setSelectedProblems] = useState([]);
    const selectedObj = useRef({});

    const toggleSelection = useCallback((id, state) => {
        if (state === id in selectedObj.current) return;
        if (id in selectedObj.current) {
            delete selectedObj.current[id];
            setSelectedProblems((arr) => {
                let ind = arr.indexOf(id);
                return arr.slice(0, ind).concat(arr.slice(ind + 1));
            });
        } else {
            selectedObj.current[id] = true;
            setSelectedProblems((arr) => arr.concat(id));
        }
    }, []);
    const toggleMany = useCallback((ids, state) => {
        if (state) {
            const toAdd = ids.filter((id) => !(id in selectedObj.current));
            if (toAdd.length === 0) return;
            toAdd.forEach((id) => {
                selectedObj.current[id] = true;
            });
            setSelectedProblems((arr) => arr.concat(toAdd));
        } else {
            const idsSet = new Set(ids);
            let changed = false;
            ids.forEach((id) => {
                if (id in selectedObj.current) {
                    delete selectedObj.current[id];
                    changed = true;
                }
            });
            if (!changed) return;
            setSelectedProblems((arr) => arr.filter((id) => !idsSet.has(id)));
        }
    }, []);

    const getSelectionState = useCallback((ids) => {
        if (ids.length === 0) return "none";
        let count = 0;
        for (const id of ids) {
            if (id in selectedObj.current) count++;
        }
        if (count === 0) return "none";
        if (count === ids.length) return "all";
        return "some";
    }, []);
    return (
        <SelectionContext
            value={{
                selectedArray,
                selectedObj,
                toggleSelection,
                toggleMany,
                getSelectionState
            }}>
            {children}
        </SelectionContext>
    );
}

export function useSelection() {
    const context = useContext(SelectionContext);
    if (!context) throw new Error("only works in selection providers");
    return context;
}
