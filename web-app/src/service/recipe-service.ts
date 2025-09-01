export interface Recipe {
    id?: number;
    ownerUserId?: string;
    title: string;
    description: string;
    isPrivate: boolean;
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
    isPrivate: boolean;
    ingredients: string;
    steps: string;
}

export interface UserContext {
    accessToken?: string;
}

export class RecipesService {
    protected BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL;

    async getRecipes(context: UserContext): Promise<Recipe[]> {
        const result = await fetch(`${this.BASE_URL}/recipes`, {
            method: "GET",
            headers: this.getHeaders(context),
        });
        if (result.status !== 200) {
            throw new Error("Error while getting all Recipes.");
        }
        const data: RecipeEntity[] = await result.json();
        return data.map((recipe) => this.transformRecipe(recipe));
    }

    async getRecipe(id: number, context: UserContext): Promise<Recipe> {
        const result = await fetch(`${this.BASE_URL}/recipes/${id}`, {
            method: "GET",
            headers: this.getHeaders(context),
        });
        if (result.status !== 200) {
            throw new Error("Error while creating Recipe.");
        }
        const data = await result.json();
        return this.transformRecipe(data);
    }

    async createRecipe(recipe: Recipe, context: UserContext): Promise<Recipe> {
        const result = await fetch(`${this.BASE_URL}/recipes`, {
            method: "POST",
            body: JSON.stringify(this.transformRecipeEntity(recipe)),
            headers: this.getHeaders(context),
        });
        if (result.status !== 201) {
            throw new Error("Error while getting Recipe.");
        }
        const data = await result.json();
        return this.transformRecipe(data);
    }

    async updateRecipe(
        id: number,
        recipe: Recipe,
        context: UserContext,
    ): Promise<Recipe> {
        const result = await fetch(`${this.BASE_URL}/recipes/${id}`, {
            method: "PUT",
            body: JSON.stringify(this.transformRecipeEntity(recipe)),
            headers: this.getHeaders(context),
        });
        if (result.status !== 200) {
            throw new Error("Error while updating Recipe.");
        }
        const data = await result.json();
        return this.transformRecipe(data);
    }

    async deleteRecipe(id: number, context: UserContext): Promise<void> {
        const result = await fetch(`${this.BASE_URL}/recipes/${id}`, {
            method: "DELETE",
            headers: this.getHeaders(context),
        });
        if (result.status !== 200) {
            throw new Error("Error while deleting Recipe.");
        }
        return undefined;
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
            ingredients: JSON.parse(entity.ingredients),
            steps: JSON.parse(entity.steps),
        };
    }

    private transformRecipeEntity(recipe: Recipe): RecipeEntity {
        return {
            ...recipe,
            ingredients: JSON.stringify(recipe.ingredients),
            steps: JSON.stringify(recipe.steps),
        };
    }
}
