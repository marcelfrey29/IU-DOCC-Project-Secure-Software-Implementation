export interface Recipe {
    id?: number;
    ownerUserId?: string;
    title: string;
    description: string;
    ingredients: Ingredient[];
    steps: Step[];
}

export interface Ingredient {
    name: string;
    value: number;
    unit: Unit;
}

export type Unit = "g" | "ml" | "pieces";

export interface Step {
    description: string;
}

interface RecipeEntity {
    id?: number;
    ownerUserId?: string;
    title: string;
    description: string;
    ingredients: string[];
    steps: string[];
}

export interface UserContext {
    accessToken?: string;
}

export class RecipesService {
    protected BASE_URL = "http://localhost:3000";

    async getRecipes(context: UserContext): Promise<Recipe[]> {
        throw new Error("Not Implemented.");
    }

    async getRecipe(context: UserContext): Promise<Recipe> {
        throw new Error("Not Implemented.");
    }

    async createRecipe(recipe: Recipe, context: UserContext): Promise<Recipe> {
        const result = await fetch(`${this.BASE_URL}/recipes`, {
            method: "POST",
            body: JSON.stringify(this.transformRecipeEntity(recipe)),
            headers: this.getHeaders(context),
        });
        if (result.status !== 201) {
            throw new Error("Error while creating Recipe.");
        }
        const data = await result.json();
        return this.transformRecipe(data);
    }

    async updateRecipe(
        id: number,
        recipe: Recipe,
        context: UserContext,
    ): Promise<Recipe> {
        console.log(recipe);
        throw new Error("Not Implemented.");
    }

    async deleteRecipe(context: UserContext): Promise<void> {
        throw new Error("Not Implemented.");
    }

    private getHeaders(context: UserContext): Record<string, string> {
        const headers: Record<string, string> = {};
        if (context.accessToken) {
            headers["authorization"] = `Bearer ${context.accessToken}`;
        }
        return headers;
    }

    private transformRecipe(entity: RecipeEntity): Recipe {
        return {
            ...entity,
            ingredients: entity.ingredients.map(
                (i) => JSON.parse(i) as Ingredient,
            ),
            steps: entity.steps.map((i) => JSON.parse(i) as Step),
        };
    }

    private transformRecipeEntity(recipe: Recipe): RecipeEntity {
        return {
            ...recipe,
            ingredients: recipe.ingredients.map((i) => JSON.stringify(i)),
            steps: recipe.steps.map((i) => JSON.stringify(i)),
        };
    }
}
