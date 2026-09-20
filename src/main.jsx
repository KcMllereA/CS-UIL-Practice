import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { SearchProvider } from "./context/SearchContext.jsx";
import { SelectionProvider } from "./context/SelectionContext.jsx";
import { HashRouter } from "react-router-dom";
import App from "./App.jsx";

import "./index.css";
import "./utils/index.js";

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <HashRouter>
            <SearchProvider>
                <SelectionProvider>
                    <App />
                </SelectionProvider>
            </SearchProvider>
        </HashRouter>
    </StrictMode>
);