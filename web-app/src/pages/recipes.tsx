import { BootstrapIcon } from "@/components/icons";
import DefaultLayout from "@/layouts/default";
import { Recipe, RecipesService } from "@/service/recipe-service";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Image } from "@heroui/image";
import { useEffect, useState } from "react";
import { useAuth } from "react-oidc-context";
import { useNavigate } from "react-router-dom";

const recipeService = new RecipesService();

export default function RecipesPage() {
    const routeTo = useNavigate();
    const auth = useAuth();

    const [recipes, setRecipes] = useState([] as Recipe[]);
    const getRecipe = async () => {
        setRecipes(
            await recipeService.getRecipes({
                accessToken: auth.user?.access_token,
            }),
        );
    };
    useEffect(() => {
        getRecipe();
    }, []);

    return (
        <DefaultLayout>
            <section className="mt-12″ mb-12">
                <div>
                    <h1 className="text-3xl text-primary font-bold">
                        Recipies
                    </h1>
                    <p className="mt-1">
                        <b>Find new and tasty recipes.</b>
                    </p>
                </div>
                <div className="mt-6">
                    <p>
                        You can also share your favourite recipe with others or
                        create a private recipe just for you.
                    </p>
                    <div>
                        {auth.isAuthenticated ? (
                            <>
                                <Button
                                    className="mt-3"
                                    color="primary"
                                    onPress={() => routeTo(`/recipes/add`)}
                                >
                                    <BootstrapIcon name="plus-circle-fill"></BootstrapIcon>
                                    Create Recipe
                                </Button>
                            </>
                        ) : (
                            <>
                                <div>
                                    <p>
                                        To create or update recipes and interact
                                        with others, you need to be logged-in.
                                    </p>
                                    <Button
                                        onClick={async () =>
                                            void (await auth.signinRedirect())
                                        }
                                    >
                                        <BootstrapIcon name="person" /> Login
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
                <div className="mt-8">
                    <div>
                        {recipes.map((recipe) => {
                            return (
                                <>
                                    <Card className="mt-5" shadow="md">
                                        <CardBody>
                                            <div className="flex">
                                                <div className="flex mr-4">
                                                    <div className="mt-auto mb-auto">
                                                        <Image
                                                            height={150}
                                                            src="/public/logo.png"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex">
                                                    <div className="mt-auto mb-auto">
                                                        {recipe.isPrivate ? (
                                                            <>
                                                                <Chip
                                                                    variant="bordered"
                                                                    color="danger"
                                                                >
                                                                    <BootstrapIcon name="lock-fill" />{" "}
                                                                    Private
                                                                    Recipe
                                                                </Chip>
                                                            </>
                                                        ) : (
                                                            <></>
                                                        )}
                                                        <h4 className="font-bold text-xl">
                                                            {recipe.title}
                                                        </h4>
                                                        <p className="text-large">
                                                            {recipe.description}
                                                        </p>
                                                        <p className="text-small text-foreground/80 mt-3">
                                                            {
                                                                recipe
                                                                    .ingredients
                                                                    .length
                                                            }{" "}
                                                            Ingredients -{" "}
                                                            {
                                                                recipe.steps
                                                                    .length
                                                            }{" "}
                                                            Steps
                                                        </p>
                                                        <p className="text-small text-foreground/80 mt-1">
                                                            {" "}
                                                            By{" "}
                                                            {recipe.ownerUserId}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="ml-auto flex">
                                                    <div className="mt-auto mb-auto">
                                                        <div>
                                                            <Button
                                                                fullWidth
                                                                color="primary"
                                                                onClick={() =>
                                                                    routeTo(
                                                                        `/recipes/${recipe.id}`,
                                                                    )
                                                                }
                                                            >
                                                                View Recipe{" "}
                                                                <BootstrapIcon name="chevron-right" />
                                                            </Button>
                                                        </div>
                                                        {recipe.ownerUserId ===
                                                        auth.user?.profile
                                                            .sub ? (
                                                            <>
                                                                <div className="mt-2 hidden">
                                                                    <Button
                                                                        fullWidth
                                                                        color="warning"
                                                                    >
                                                                        Edit
                                                                        Recipe{" "}
                                                                        <BootstrapIcon name="pencil-fill" />
                                                                    </Button>
                                                                </div>
                                                                <div className="mt-2 hidden">
                                                                    <Button
                                                                        fullWidth
                                                                        color="danger"
                                                                    >
                                                                        Delete
                                                                        Recipe{" "}
                                                                        <BootstrapIcon name="trash-fill" />
                                                                    </Button>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <></>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </CardBody>
                                    </Card>
                                </>
                            );
                        })}
                    </div>
                </div>
            </section>
        </DefaultLayout>
    );
}
