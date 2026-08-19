import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { SearchProvider } from "./context/SearchContext.jsx";
import "./index.css";
import "./utils/index.js";

import App from "./App.jsx";
import { SelectionProvider } from "./context/SelectionContext.jsx";

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <SearchProvider>
            <SelectionProvider>
                <App />
            </SelectionProvider>
        </SearchProvider>
    </StrictMode>
);