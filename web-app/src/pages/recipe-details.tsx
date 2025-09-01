import { BootstrapIcon } from "@/components/icons";
import DefaultLayout from "@/layouts/default";
import { Recipe, RecipesService } from "@/service/recipe-service";
import { Accordion, AccordionItem } from "@heroui/accordion";
import { Card, CardBody } from "@heroui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableColumn,
    TableHeader,
    TableRow,
} from "@heroui/table";
import { useEffect, useState } from "react";
import { useAuth } from "react-oidc-context";
import { useParams } from "react-router-dom";

const recipeService = new RecipesService();

export default function RecipeDetailPage() {
    let { id } = useParams();
    const auth = useAuth();

    const [recipe, setRecipe] = useState({} as Recipe);
    const getRecipe = async () => {
        setRecipe(
            await recipeService.getRecipe(parseInt(id ?? ""), {
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
                {/* Title and Details */}
                <div>
                    <h1 className="text-3xl text-primary font-bold">
                        {recipe.title}
                    </h1>
                    <p className="text-sm">Recipe ID: #{id}</p>
                    <p className="text-sm">Created by {recipe.ownerUserId}</p>

                    {recipe.isPrivate ? (
                        <>
                            <p className="mt-2">
                                <BootstrapIcon
                                    name="lock-fill"
                                    className="mr-1 text-danger"
                                />{" "}
                                This Recipe is Private and only visible to you.
                            </p>
                        </>
                    ) : (
                        <></>
                    )}

                    {/*
                     * BUG: https://github.com/marcelfrey29/IU-DOCC-Project-Secure-Software-Implementation/issues/19
                     *
                     * # Description
                     *
                     * Cross-site Scripting (XSS) is possible because the data from the backend are placed
                     * directly in the DOM of the web page.
                     *
                     * Because this page shows the Recipe data that are persisted in the PostgreSQL database, this
                     * XSS vulnerability is a Stored XSS vulnerability that also needs to be patched in the backend.
                     * However, security should be implemented into every layer, so the web app needs to patches too.
                     * Technically fixing one of the problematic areas (sanitization in backend and rendering in frontend)
                     * should be enough to prevent the XSS attack, but that's not enough to meet the security goal
                     * of this application.
                     *
                     * Injection vulnerabilies are categorized in OWASP Top 10 A02:2021 (Injection). XSS is described in
                     * CWE-79 (Improper Neutralization of Input During Web Page Generation ('Cross-site Scripting')).
                     * The concrete problem is CWE-80 (CWE-80: Improper Neutralization of Script-Related HTML Tags in a
                     * Web Page (Basic XSS)) because the tags are not properly sanitized.
                     *
                     * # Impact
                     *
                     * Run malicious code in the browser of other users. Violates the integrity (script could run things
                     * on behalf of the user) and availability (script can break the web app).
                     *
                     * # Background
                     *
                     * https://owasp.org/Top10/A03_2021-Injection/
                     * https://cwe.mitre.org/data/definitions/79.html
                     * https://cwe.mitre.org/data/definitions/80.html
                     * https://developer.mozilla.org/en-US/docs/Web/Security/Attacks/XSS
                     * https://learn.snyk.io/lesson/xss/?ecosystem=javascript
                     *
                     * # Remediation
                     *
                     * Don't modify the DOM directly and use the React Template Engine instead.
                     * React Templates do sanitize the input by default, so to display text a standard
                     * template element should be used.
                     */}
                    <p
                        className="mt-2"
                        dangerouslySetInnerHTML={{ __html: recipe.description }}
                    ></p>
                </div>

                {/* Ingredients */}
                <div className="mt-4">
                    <h3 className="text-xl mb-2">Ingredients</h3>
                    <Table>
                        <TableHeader
                            columns={[
                                { key: "name", label: "Ingredient" },
                                { key: "value", label: "Amount" },
                                { key: "unit", label: "Unit" },
                            ]}
                        >
                            {(column) => (
                                <TableColumn key={column.key}>
                                    {column.label}
                                </TableColumn>
                            )}
                        </TableHeader>
                        <TableBody items={recipe.ingredients ?? []}>
                            {(item) => (
                                <TableRow key={item.name}>
                                    <TableCell>{item.name}</TableCell>
                                    <TableCell>{item.value}</TableCell>
                                    <TableCell>{item.unit}</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Steps */}
                <div className="mt-4">
                    <h3 className="text-xl mb-2">Steps</h3>
                    <Card>
                        <CardBody>
                            <Accordion
                                selectionMode="multiple"
                                isCompact
                                defaultExpandedKeys={recipe?.steps?.map(
                                    (_, index) => index.toString(),
                                )}
                            >
                                {recipe?.steps?.map((step, idx) => (
                                    <>
                                        <AccordionItem
                                            key={idx}
                                            title={`Step ${idx + 1}`}
                                        >
                                            {step.description}
                                        </AccordionItem>
                                    </>
                                ))}
                            </Accordion>
                        </CardBody>
                    </Card>
                </div>
            </section>
        </DefaultLayout>
    );
}
