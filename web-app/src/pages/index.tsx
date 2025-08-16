import { HighlightCard } from "@/components/highlight-card";
import DefaultLayout from "@/layouts/default";
import { Image } from "@heroui/image";

export default function IndexPage() {
    const highlightCards = [
        {
            icon: "receipt",
            title: "Find Recipes",
            description:
                "Get inspired by recipes from others. Search for recipes by ingredients, cuisine, or dietary preferences.",
        },
        {
            icon: "heart-fill",
            title: "Vote & Comment",
            description:
                "Show that you like a recipe by voting for it. Share your thoughts and feedback by commenting on recipes.",
        },
        {
            icon: "file-lock2-fill",
            title: "Private Recipes",
            description:
                "Recipes just for you. Gradma's top secret apple pie recipe is just for you.",
        },
    ].map((highlight) => {
        return <HighlightCard key={highlight.title} data={highlight} />;
    });

    return (
        <DefaultLayout>
            <section className="mt-0 md:mt-12 mb-0 md:mb-12 pt-0 md:pt-12 pb-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-1 z-10 relative">
                        <div className="absolute inset-0 bg-background dark:bg-background -z-10 -ml-10 md:-ml-4 -mr-10 md:-mr-4 md:-mt-10 md:-mb-10" />
                        <p className="text-4xl md:text-5xl font-bold tracking-tight leading-10">
                            <span className="text-primary-500">
                                <b className="tracking-tighter">
                                    Social Recipe
                                </b>
                            </span>{" "}
                        </p>

                        <p className="text-3xl font-bold tracking-normal leading-10 mt-6">
                            With Social Recipe, you can{" "}
                            <span className="">
                                <b className="tracking-tight">
                                    create, share, and view
                                </b>
                            </span>{" "}
                            recipes. Engage with others by{" "}
                            <span className="">
                                <b className="tracking-tight">
                                    voting and commenting
                                </b>
                            </span>{" "}
                            their recipes.
                        </p>
                    </div>
                    <div className="pt-16 md:pt-2 pb-16 md:pb-2 flex justify-center items-center">
                        <div className="relative flex justify-center items-center">
                            <Image src="logo.png" height={200} />
                        </div>
                    </div>
                </div>
            </section>

            <section className="flex flex-col gap-4 pt-12 pb-16 relative">
                <div className="absolute inset-0 bg-background dark:bg-background z-10 pb-16 -ml-10 md:-ml-4 -mr-10 md:-mr-4" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 z-10">
                    {highlightCards}
                </div>
            </section>
        </DefaultLayout>
    );
}
