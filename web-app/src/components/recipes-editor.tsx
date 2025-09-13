import { BootstrapIcon } from "@/components/icons";
import { type Ingredient, type Recipe, RecipesService, type Step, type Unit } from "@/service/recipe-service";
import { Button } from "@heroui/button";
import { Checkbox } from "@heroui/checkbox";
import { Divider } from "@heroui/divider";
import { Input, Textarea } from "@heroui/input";
import { NumberInput } from "@heroui/number-input";
import { Select, SelectItem } from "@heroui/select";
import { useEffect, useState } from "react";
import { useAuth } from "react-oidc-context";
import { useNavigate, useParams } from "react-router-dom";

const recipeService = new RecipesService();

export default function RecipeEditor(params: { type: "create" | "update" }) {
    const { id } = useParams();
    const routeTo = useNavigate();
    const auth = useAuth();
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [isPrivate, setIsPrivate] = useState(false);
    const [ingredients, setIngredients] = useState([{ name: "", value: 0, unit: "g" }] as Ingredient[]);

    // In Update-Mode, we need to load the existing Recipe data to prefill the form
    if (params.type === "update") {
        const getRecipe = async () => {
            const recipe = await recipeService.getRecipe(parseInt(id ?? "", 10), {
                accessToken: auth.user?.access_token,
            });
            setName(recipe.title);
            setDescription(recipe.description ?? "");
            setIsPrivate(recipe.isPrivate);
            setIngredients(recipe.ingredients);
            setSteps(recipe.steps);
        };
        // biome-ignore  lint/correctness/useHookAtTopLevel: intentional
        // biome-ignore lint/correctness/useExhaustiveDependencies: intentional
        useEffect(() => {
            getRecipe();
        }, []);
    }

    const ingredientsView = ingredients.map((i) => {
        return (
            <div className="mb-4" key={i.name.replace(" ", "-")}>
                <div className="grid grid-cols-3 gap-3">
                    <Input
                        label="Ingredient"
                        value={i.name}
                        onValueChange={(val) => {
                            const updatedIngredients = [...ingredients];
                            updatedIngredients[ingredients.indexOf(i)] = {
                                ...i,
                                name: val,
                            };
                            setIngredients(updatedIngredients);
                        }}
                    />
                    <NumberInput
                        label="Amount"
                        type="number"
                        variant="flat"
                        value={i.value}
                        onValueChange={(val) => {
                            const updatedIngredients = [...ingredients];
                            updatedIngredients[ingredients.indexOf(i)] = {
                                ...i,
                                value: val,
                            };
                            setIngredients(updatedIngredients);
                        }}
                    />
                    <Select
                        label="Unit"
                        value={i.unit}
                        onSelectionChange={(val) => {
                            const updatedIngredients = [...ingredients];
                            updatedIngredients[ingredients.indexOf(i)] = {
                                ...i,
                                unit: val.currentKey as Unit,
                            };
                            setIngredients(updatedIngredients);
                        }}
                    >
                        <SelectItem key="g">g</SelectItem>
                        <SelectItem key="ml">ml</SelectItem>
                        <SelectItem key="pieces">Pieces</SelectItem>
                    </Select>
                </div>
            </div>
        );
    });
    const [steps, setSteps] = useState([{ description: "" }] as Step[]);
    const stepsView = steps.map((s, i) => {
        return (
            <div className="mb-4" key={s.description.replace(" ", "-")}>
                <div className="grid grid-cols-1 gap-3">
                    <Textarea
                        label={`Step ${i + 1}`}
                        value={s.description}
                        onValueChange={(val) => {
                            const updatedSteps = [...steps];
                            updatedSteps[steps.indexOf(s)] = {
                                ...s,
                                description: val,
                            };
                            setSteps(updatedSteps);
                        }}
                    />
                </div>
            </div>
        );
    });

    const create = async () => {
        const recipe: Recipe = {
            title: name,
            description,
            isPrivate,
            ingredients,
            steps,
        };
        const data = await recipeService.createRecipe(recipe, {
            accessToken: auth.user?.access_token,
        });
        routeTo(`/recipes/${data.id}`);
    };

    const update = async () => {
        const recipe: Recipe = {
            title: name,
            description,
            isPrivate,
            ingredients,
            steps,
        };
        const data = await recipeService.updateRecipe(parseInt(id!, 10), recipe, {
            accessToken: auth.user?.access_token,
        });
        routeTo(`/recipes/${data.id}`);
    };

    return (
        <div>
            <section>
                <div>
                    <h1 className="text-3xl text-primary font-bold">
                        {params.type === "create" ? "Create Recipie" : "Update Recipie"}
                    </h1>
                </div>
            </section>

            {/* General Details */}
            <section className="mt-4">
                <h3 className="text-xl font-semibold">Recipe Details</h3>
                <Input
                    className="mt-1"
                    label="Name"
                    description="The name of your Recipe."
                    placeholder="Apple Pie"
                    isRequired
                    isClearable
                    minLength={1}
                    value={name}
                    onValueChange={setName}
                />
                <Input
                    className="mt-1"
                    name="description"
                    label="Description"
                    description="A few more details about your Recipe."
                    placeholder="Gradma's Apple Pie"
                    isClearable
                    value={description}
                    onValueChange={setDescription}
                />
                <Checkbox className="mt-1" name="isPrivate" isSelected={isPrivate} onValueChange={setIsPrivate}>
                    <span className="text-sm">
                        Private Recipe
                        <br />
                        <span className="text-xs text-gray-400">This Recipe is only visible to you</span>
                    </span>
                </Checkbox>
            </section>

            <Divider className="mt-4 mb-4"></Divider>

            <section>
                <h3 className="text-xl font-semibold">Ingredients</h3>
                <div className="mt-1">{ingredientsView}</div>
                <div className="flex">
                    <Button
                        className="ml-auto"
                        onClick={() => {
                            setIngredients([...ingredients, { name: "", value: 0, unit: "g" }]);
                        }}
                    >
                        Add Ingredient
                    </Button>
                </div>
            </section>

            <Divider className="mt-4 mb-4"></Divider>

            <section>
                <h3 className="text-xl font-semibold">Steps</h3>
                <div className="mt-1">{stepsView}</div>
                <div className="flex">
                    <Button
                        className="ml-auto"
                        onClick={() => {
                            setSteps([...steps, { description: "" }]);
                        }}
                    >
                        Add Step
                    </Button>
                </div>
            </section>

            <Divider className="mt-4 mb-4"></Divider>

            <section>
                <div className="flex">
                    <Button color="danger" onPress={() => routeTo(`/recipes`)}>
                        <BootstrapIcon name="x-circle-fill"></BootstrapIcon>
                        Cancel
                    </Button>
                    <Button
                        className="ml-auto"
                        color="primary"
                        onPress={() => (params.type === "create" ? create() : update())}
                    >
                        <BootstrapIcon name="check-circle-fill"></BootstrapIcon>
                        {params.type === "create" ? "Create Recipe" : "Update Recipe"}
                    </Button>
                </div>
            </section>
        </div>
    );
}
