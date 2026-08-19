import { createContext, useContext } from "react";

const SearchContext = createContext();

export function SearchProvider({ children }) {
    return <SearchContext value={{}}>{children}</SearchContext>;
}

export function useSearch() {
    const context = useContext(SearchContext);
    if (!context) throw new Error("lock in chud ts only work in search providers");
    return context;
}
