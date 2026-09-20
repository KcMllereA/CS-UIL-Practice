import { Routes, Route } from "react-router-dom";
import SearchPage from "./pages/SearchPage/SearchPage.jsx";
import ProgrammingPage from "./pages/ProgrammingPage/ProgrammingPage.jsx";
import WrittenPage from "./pages/WrittenPage/WrittenPage.jsx";

export default function App() {
    return (
        <Routes>
            <Route path="/" element={<SearchPage />} />
            <Route path="/practice/:problemId" element={<ProgrammingPage />} />
            <Route path="/view/:testYear/:testComp" element={<WrittenPage />} />
            <Route path="/view/:testYear/:testComp/:problemId?" element={<WrittenPage />} />
        </Routes>
    );
}
