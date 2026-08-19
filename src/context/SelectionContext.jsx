import { createContext, useContext } from "react";

const SelectionContext = createContext();

export function SelectionProvider({ children }) {
    return <SelectionContext value={{}}>{children}</SelectionContext>;
}

export function useSelection() {
    const context = useContext(SelectionContext);
    if (!context) throw new Error("lock in chud ts only work in selection providers");
    return context;
}
