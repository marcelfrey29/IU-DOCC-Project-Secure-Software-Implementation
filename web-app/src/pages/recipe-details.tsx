import { BootstrapIcon } from "@/components/icons";
import DefaultLayout from "@/layouts/default";
import { CommentService, type RecipeComment } from "@/service/comment-service";
import { type Recipe, RecipesService } from "@/service/recipe-service";
import { Accordion, AccordionItem } from "@heroui/accordion";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { Input } from "@heroui/input";
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/table";
import { useEffect, useState } from "react";
import { useAuth } from "react-oidc-context";
import { useParams } from "react-router-dom";

const recipeService = new RecipesService();
const commentService = new CommentService();

export default function RecipeDetailPage() {
    const { id } = useParams();
    const auth = useAuth();

    const [recipe, setRecipe] = useState({} as Recipe);
    const getRecipe = async () => {
        setRecipe(
            await recipeService.getRecipe(parseInt(id ?? "", 10), {
                accessToken: auth.user?.access_token,
            }),
        );
    };

    const [comments, setComments] = useState([] as RecipeComment[]);
    const getComments = async () => {
        setComments(
            await commentService.getCommentsForRecipe(parseInt(id ?? "", 10), {
                accessToken: auth.user?.access_token,
            }),
        );
    };

    const [newComment, setNewComment] = useState("");

    // biome-ignore lint/correctness/useExhaustiveDependencies: intentional
    useEffect(() => {
        getRecipe();
        getComments();
    }, []);

    const createComment = async () => {
        const comment: RecipeComment = {
            comment: newComment,
        };
        await commentService.createRecipeComment(parseInt(id!, 10), comment, {
            accessToken: auth.user?.access_token,
        });
        getComments();
        setNewComment(""); // Clear Input Field
    };

    const deleteComment = async (recipeId: number, commentId: number) => {
        await commentService.deleteRecipeComment(recipeId, commentId, {
            accessToken: auth.user?.access_token,
        });
        await getComments();
    };

    return (
        <DefaultLayout>
            <section className="mt-12″ mb-12">
                {/* Title and Details */}
                <div>
                    <h1 className="text-3xl text-primary font-bold">{recipe.title}</h1>
                    <p className="text-sm">Recipe ID: #{id}</p>
                    <p className="text-sm">Created by {recipe.ownerUserId}</p>

                    {recipe.isPrivate && (
                        <p className="mt-2">
                            <BootstrapIcon name="lock-fill" className="mr-1 text-danger" /> This Recipe is Private and
                            only visible to you.
                        </p>
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
                        // biome-ignore lint/security/noDangerouslySetInnerHtml: intentional for now
                        dangerouslySetInnerHTML={{
                            __html: recipe.description,
                        }}
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
                            {(column) => <TableColumn key={column.key}>{column.label}</TableColumn>}
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
                                defaultExpandedKeys={recipe?.steps?.map((_, index) => index.toString())}
                            >
                                {recipe?.steps?.map((step, idx) => (
                                    <>
                                        <AccordionItem
                                            key={step.description.replace(" ", "-")}
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

            <Divider className="mt-4 mb-4"></Divider>

            <section>
                <div>
                    <h3 className="text-xl mb-2">Comments</h3>
                </div>

                <div>
                    {comments.length === 0 && (
                        <p className="text-sm">There are no comments yet. Be the first to add one.</p>
                    )}
                </div>
                <div>
                    {comments.map((comment) => (
                        <>
                            <Card className="mb-2">
                                <CardBody>
                                    <div className="flex">
                                        <div>
                                            <p className="text-xs">{comment.ownerUserId} said: </p>
                                            <p>{comment.comment}</p>
                                        </div>
                                        <div className="ml-auto">
                                            {comment.ownerUserId === auth.user?.profile.sub ? (
                                                <Button
                                                    color="danger"
                                                    onPress={() => deleteComment(recipe.id!, comment.id!)}
                                                >
                                                    <BootstrapIcon name="trash-fill" />
                                                </Button>
                                            ) : (
                                                <></>
                                            )}
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        </>
                    ))}
                </div>

                <div className="mt-6 mb-8">
                    <div className="flex">
                        <Input
                            className="mr-8"
                            label="Your Comment"
                            placeholder="Your feedback, experiences, or suggestions for others..."
                            variant="faded"
                            isClearable
                            value={newComment}
                            onValueChange={setNewComment}
                        />
                        <Button className="ml-auto h-auto" onClick={() => createComment()}>
                            <BootstrapIcon name="chat-left-dots-fill" />
                            Add Comment
                        </Button>
                    </div>
                </div>
            </section>
        </DefaultLayout>
    );
}
