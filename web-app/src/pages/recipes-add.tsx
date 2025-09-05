import RecipeEditor from "@/components/recipes-editor";
import DefaultLayout from "@/layouts/default";

export default function CreateRecipesPage() {
    return (
        <DefaultLayout>
            <RecipeEditor type="create"></RecipeEditor>
        </DefaultLayout>
    );
}
