import { Routes, Route } from "react-router-dom";

import App from "../App";
import ShowcasePage from "../components/ShowcasePage";
import UsernameRedirect from "./UsernameRedirect";

export default function AppRouter() {
    return (
        <Routes>
            {/* Direct showcase access using Firebase UID */}
            <Route
                path="/showcase/:userId"
                element={<ShowcasePage />}
            />

            {/* Public username-based showcase access */}
            <Route
                path="/u/:username"
                element={<UsernameRedirect />}
            />

            {/* Main application */}
            <Route
                path="/*"
                element={<App />}
            />
        </Routes>
    );
}