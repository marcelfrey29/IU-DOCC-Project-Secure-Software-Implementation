import { Route, Routes } from "react-router-dom";

import IndexPage from "@/pages/index";
import NotFoundPage from "./pages/404";
import ImprintPage from "./pages/imprint";
import PrivacyPage from "./pages/privacy";

function App() {
    return (
        <Routes>
            {/* Home */}
            <Route element={<IndexPage />} path="/" />

            {/* Legal */}
            <Route element={<PrivacyPage />} path="/privacy" />
            <Route element={<ImprintPage />} path="/imprint" />

            {/* 404 */}
            <Route element={<NotFoundPage />} path="*" />
        </Routes>
    );
}

export default App;
