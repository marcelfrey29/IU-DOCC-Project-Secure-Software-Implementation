import { BaseAPIService, UserContext } from "./base-service";

export interface RecipeComment {
    id?: number;
    recipeId?: number;
    ownerUserId?: string;
    comment: string;
}

export class CommentService extends BaseAPIService {
    async getCommentsForRecipe(
        recipeId: number,
        context: UserContext,
    ): Promise<RecipeComment[]> {
        const result = await fetch(
            `${this.BASE_URL}/recipes/${recipeId}/comments`,
            {
                method: "GET",
                headers: this.getHeaders(context),
            },
        );
        if (result.status !== 200) {
            throw new Error("Error while getting all Comments.");
        }
        const data: RecipeComment[] = await result.json();
        return data;
    }

    async createRecipeComment(
        recipeId: number,
        comment: RecipeComment,
        context: UserContext,
    ): Promise<RecipeComment> {
        const result = await fetch(
            `${this.BASE_URL}/recipes/${recipeId}/comments`,
            {
                method: "POST",
                body: JSON.stringify(comment),
                headers: this.getHeaders(context),
            },
        );
        if (result.status !== 201) {
            throw new Error("Error while creating Comment.");
        }
        const data: RecipeComment = await result.json();
        return data;
    }

    async deleteRecipeComment(
        recipeId: number,
        id: number,
        context: UserContext,
    ): Promise<void> {
        const result = await fetch(
            `${this.BASE_URL}/recipes/${recipeId}/comments/${id}`,
            {
                method: "DELETE",
                headers: this.getHeaders(context),
            },
        );
        if (result.status !== 200) {
            throw new Error("Error while deleting Comment.");
        }
        return undefined;
    }
}
