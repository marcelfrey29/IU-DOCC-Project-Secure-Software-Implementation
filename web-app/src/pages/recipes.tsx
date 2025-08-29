import { BootstrapIcon } from "@/components/icons";
import DefaultLayout from "@/layouts/default";
import { Button } from "@heroui/button";
import { useAuth } from "react-oidc-context";
import { useNavigate } from "react-router-dom";

export default function RecipesPage() {
    const routeTo = useNavigate();
    const auth = useAuth();

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
            </section>
        </DefaultLayout>
    );
}
