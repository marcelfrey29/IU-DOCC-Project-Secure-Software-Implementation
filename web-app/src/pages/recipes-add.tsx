import { BootstrapIcon } from "@/components/icons";
import DefaultLayout from "@/layouts/default";
import {
    Ingredient,
    Recipe,
    RecipesService,
    Step,
    Unit,
} from "@/service/recipe-service";
import { Button } from "@heroui/button";
import { Checkbox } from "@heroui/checkbox";
import { Input, Textarea } from "@heroui/input";
import { NumberInput } from "@heroui/number-input";
import { Select, SelectItem } from "@heroui/select";
import { useState } from "react";
import { useAuth } from "react-oidc-context";
import { useNavigate } from "react-router-dom";

const recipeService = new RecipesService();

export default function CreateRecipesPage() {
    const routeTo = useNavigate();
    const auth = useAuth();
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [isPrivate, setIsPrivate] = useState(false);
    const [ingredients, setIngredients] = useState([
        { name: "", value: 0, unit: "g" },
    ] as Ingredient[]);
    const ingredientsView = ingredients.map((i) => {
        return (
            <>
                <div className="mb-4">
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
            </>
        );
    });
    const [steps, setSteps] = useState([{ description: "" }] as Step[]);
    const stepsView = steps.map((s) => {
        return (
            <>
                <div className="mb-4">
                    <div className="grid grid-cols-1 gap-3">
                        <Textarea
                            label="Ingredient"
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
            </>
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

    return (
        <DefaultLayout>
            <section>
                <div>
                    <h1 className="text-3xl text-primary font-bold">
                        Create Recipies
                    </h1>
                </div>
            </section>

            {/* General Details */}
            <section className="mt-4">
                <h3 className="text-xl">Recipe Details</h3>
                <Input
                    className="mt-2"
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
                    className="mt-2"
                    name="description"
                    label="Description"
                    description="A few more details about your Recipe."
                    placeholder="Gradma's Apple Pie"
                    isClearable
                    value={description}
                    onValueChange={setDescription}
                />
                <Checkbox
                    className="mt-2"
                    name="isPrivate"
                    isSelected={isPrivate}
                    onValueChange={setIsPrivate}
                >
                    Private Recipe (This Recipe is only visible to you)
                </Checkbox>
            </section>

            <section className="mt-4">
                <h3 className="text-xl">Ingredients</h3>
                <div>{ingredientsView}</div>
                <div className="flex">
                    <Button
                        className="ml-auto"
                        onClick={() => {
                            setIngredients([
                                ...ingredients,
                                { name: "", value: 0, unit: "g" },
                            ]);
                        }}
                    >
                        Add Ingredient
                    </Button>
                </div>
            </section>

            <section className="mt-4">
                <h3 className="text-xl">Steps</h3>
                <div>{stepsView}</div>
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

            <section className="mt-4"></section>
            {/** iterate list; on change update elem at idx */}
            <section>
                <div className="flex">
                    <Button
                        className="mt-3"
                        color="danger"
                        onPress={() => routeTo(`/recipes`)}
                    >
                        <BootstrapIcon name="x-circle-fill"></BootstrapIcon>
                        Cancel
                    </Button>
                    <Button
                        className="mt-3 ml-auto"
                        color="primary"
                        onPress={() => create()}
                    >
                        <BootstrapIcon name="check-circle-fill"></BootstrapIcon>
                        Create Recipe
                    </Button>
                </div>
            </section>
        </DefaultLayout>
    );
}
