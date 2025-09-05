import RecipeEditor from "@/components/recipes-editor";
import DefaultLayout from "@/layouts/default";

export default function UpdateRecipesPage() {
    return (
        <DefaultLayout>
            <RecipeEditor type="update"></RecipeEditor>
        </DefaultLayout>
    );
}
