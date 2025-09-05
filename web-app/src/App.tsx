import { Route, Routes } from "react-router-dom";

import IndexPage from "@/pages/index";
import NotFoundPage from "./pages/404";
import ImprintPage from "./pages/imprint";
import PrivacyPage from "./pages/privacy";
import ProfilePage from "./pages/profile";
import RecipeDetailPage from "./pages/recipe-details";
import RecipesPage from "./pages/recipes";
import CreateRecipesPage from "./pages/recipes-add";
import UpdateRecipesPage from "./pages/recipes-update";

function App() {
    return (
        <Routes>
            {/* Home */}
            <Route element={<IndexPage />} path="/" />
            <Route element={<ProfilePage />} path="/profile" />

            {/* Recipes */}
            <Route element={<RecipesPage />} path="/recipes" />
            <Route element={<CreateRecipesPage />} path="/recipes/add" />
            <Route element={<RecipeDetailPage />} path="/recipes/:id" />
            <Route element={<UpdateRecipesPage />} path="/recipes/:id/edit" />

            {/* Legal */}
            <Route element={<PrivacyPage />} path="/privacy" />
            <Route element={<ImprintPage />} path="/imprint" />

            {/* 404 */}
            <Route element={<NotFoundPage />} path="*" />
        </Routes>
    );
}

export default App;
