// Must be the first import to make the TypeORM Decorators work
import "reflect-metadata";

// Imports
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { requestId } from "hono/request-id";
import { validator } from "hono/validator";
import * as jose from "jose";
import pino from "pino";
import { Recipe, RecipeUpdateCreateSchema } from "./model/Recipe.js";
import { CommentIdSchema, RecipeComment } from "./model/RecipeComment.js";
import { ConfigService } from "./service/ConfigService.js";
import { DatabaseService } from "./service/DatabaseService.js";

// Setup Services
const logger = pino();
logger.info({}, "Starting Server...");
const configService = new ConfigService(logger);
export const dbService = new DatabaseService(logger, configService);
const JWKS = jose.createRemoteJWKSet(new URL(`${configService.getAuthServiceUrl()}/application/o/social-recipe/jwks/`));

// Setup Hono Server
declare module "hono" {
    // Type definitions for Hono Request Context
    interface ContextVariableMap {
        isAuthenticated: boolean;
        userId: string;
    }
}
export const app = new Hono();
// Hono Error Hooks
app.onError((error, c) => {
    logger.error({ error }, "Internal Server Error.");
    /**
     * BUG: https://github.com/marcelfrey29/IU-DOCC-Project-Secure-Software-Implementation/issues/25
     *
     * # Description
     *
     * The error response includes the raw error in the body. Including the error/exveption in the
     * body can leak sensitive information to the client.
     *
     * The Update Recipe Endpoint simulates a crash when performing an database operation to demonstrate
     * this concept. In this case, the raw exception is returned which includes the raw database driver
     * error. The SQL Query is included which give threat actors information about system internals.
     * While "Security by Obscurity" is not a valid concept, we still should keep application internals
     * internal.
     *
     * Exposing internal data can lead to data braches, like the VW Data breach where location data of
     * 800.000 electric vehicles were breached. In this case the "GET /actuator/heapdump" was publically
     * reachable, used to get heapdumps. This headpdump included AWS Credentials.
     * While we're in a singly different setup, this is still a good example.
     * Source: https://www.youtube.com/watch?v=iHsz6jzjbRc
     *
     * This issue is part of OWASP Top 10 A04:2021 (Insecure Design). When sentive information is included
     * in sent data this is CWE-201 (Insertion of Sensitive Information Into Sent Data). However, in our
     * concrete case, it's CWE-209 (Generation of Error Message Containing Sensitive Information).
     *
     * # Impact
     *
     * Sensitive information could be leaked to threat actors and support them in shaping their attack
     * strategy. Confidentiality is violated.
     *
     * # Background
     *
     * https://owasp.org/Top10/A04_2021-Insecure_Design/
     * https://cwe.mitre.org/data/definitions/201.html
     * https://cwe.mitre.org/data/definitions/209.html
     *
     * # Remediation
     *
     * There should always be a global exception handler middleawre in place that doesn't return the raw
     * error to the client.
     * While this middleware itself is present, the error is not allowed to be returned and therefore must
     * be removed from the response.
     *
     * # Fix
     *
     * A global error handling middlware must be in place that catches all errors and retruns a defined error
     * response without including the raw error itself. We therefore no longer return the `error` as body.
     * Instead we only return the generic "Internal Server Error" message along the requestId which identified
     * the unique request. Users can include this ID in support tickets which enables Engineers to quickly find
     * the related logs.
     */
    return c.json(
        {
            message: "Internal Server Error",
            requestId: c.get("requestId"),
        },
        500,
    );
});
app.notFound((c) => {
    logger.warn({}, "Not Found.");
    return c.json({ message: "Not Found." }, 404);
});
// Hono Middlewares
app.use("*", requestId({ headerName: "x-request-id" }));
app.use("*", cors({ origin: "*" }));
app.use("*", async (c, next) => {
    const token: string | undefined = c.req.header().authorization;
    if (!token) {
        logger.info({}, "No Token: Anonymous user.");
        c.set("isAuthenticated", false);
    } else {
        try {
            const { payload } = await jose.jwtVerify(token.replace("Bearer ", ""), JWKS, {
                issuer: "http://auth-service.localhost/application/o/social-recipe/",
                audience: "social-recipe",
            });
            logger.info({ payload }, "JWT Token is valid.");
            const userId = payload.sub;
            if (!userId) {
                logger.warn({}, "Token without User ID (sub).");
                return c.json({}, 401);
            }
            c.set("isAuthenticated", true);
            c.set("userId", userId);
        } catch (e) {
            console.log(e);
            logger.warn({ e }, "JWT Token is not valid.");
            return c.json({}, 401);
        }
    }
    await next();
});

app.get("/", async (c) => {
    console.log("Handler Called.");

    const recipies = await (await dbService.getDatabaseManager()).find(Recipe);
    console.log(`Found ${recipies.length} recipies.`);

    return c.text(`Hello Hono! 🔥 (${recipies.length} Recipes)`);
});

app.post(
    "/recipes",
    // Input Validation and Sanitization
    // See the `model/Recipe.ts` file anb comment below for details.
    validator("json", (value, c) => {
        logger.info({ v: value, b: c.req.json() }, "x");
        const parsed = RecipeUpdateCreateSchema.safeParse(value);
        if (!parsed.success) {
            logger.warn(
                {
                    validationError: parsed.error.message,
                    validationIssues: parsed.error.issues,
                },
                "Schema Validation failed.",
            );
            return c.json({ message: "Bad Request." }, 400);
        }
        return parsed.data;
    }),
    async (c) => {
        if (c.get("isAuthenticated") === false) {
            logger.warn({}, "Denying recipe creation for anonymous user.");
            return c.json({}, 401);
        }

        // We need to add the userId of the requesting user as owner of the recipe.
        // This is required to ensure only the owner of the recipe can perform actions
        // on this recipe like updating or deleting it. In addition, when private
        // recipes are implemented, we must ensure a user can see his private recipes
        // in addition to the public ones, but no other users can see this private
        // recipe.
        const userId = c.get("userId");
        // Important: Originally we accessed the request body directly via `c.req.json<Recipe>()`.
        // However, this value still contains the raw request. While for schema validation this is not a
        // problem, it's huge problem for sanitization. Sanitization is applied as part of schema validation,
        // so we must use the sanitized value.
        // Therefore, we must now access the body with `c.req.valid("json")` which returns the validated
        // and sanitized value.
        // See https://hono.dev/docs/guides/validation#with-zod for details.
        const recipeData = c.req.valid("json");
        // We can (must) omit `id` here as it's generated by the database.
        const recipe: Omit<Recipe, "id"> = {
            ...recipeData,
            ownerUserId: userId,
        };
        logger.info({ userId }, "Creating new Recipe for User.");

        /**
         * BUG: https://github.com/marcelfrey29/IU-DOCC-Project-Secure-Software-Implementation/issues/20
         *
         * # Description
         *
         * Improper input sanitization allows Stored XSS.
         *
         * The `Recipe` taken from the request is directly persisted in the database without any
         * validation or sanitization of the data. Malicious input is therfore persisted and later
         * returned to users when the Recipe is requested.
         *
         * Depending on the use case, certain HTML might be allowed. For example bold text should be
         * supported, so `<b></b>` tags are allowed. `<script></script>` tags should not be allowed.
         * In this case an explicit blocklist is required. In case an element is missing there, this
         * could be classified as CWE-184 (Incomplete List of Disallowed Inputs).
         *
         * However, in our case we only want to support plain text, so all special characters need to
         * be sanitized.
         *
         * An alternative fix would be to excape data before they are sent to the client (when they
         * leave the application). An flaw in this implementation would relate to CWE-116 (Improper
         * Encoding or Escaping of Output).
         *
         * However, we want to work with safe data from the beginning, so we need to sanitize the
         * user input as early as possible.
         *
         * Out flaw is part of CWE-96 (Improper Neutralization of Directives in Statically Saved Code
         * ('Static Code Injection')) at the end, because the malicious code is injeced in the Web
         * Applications HTML code ultimately leading to CWE-79 (Improper Neutralization of Input
         * During Web Page Generation ('Cross-site Scripting')) which is caused by CWE-80 (Improper
         * Neutralization of Script-Related HTML Tags in a Web Page (Basic XSS)) in the browser.
         *
         * The concrete sanitization error in this case is CWE-157 (Failure to Sanitize Paired Delimiters)
         * because the HTML tag angle backet pairs `<` and `>` are not properly escaped.
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
         * https://cwe.mitre.org/data/definitions/96.html
         * https://cwe.mitre.org/data/definitions/157.html
         * https://cwe.mitre.org/data/definitions/184.html
         * https://cwe.mitre.org/data/definitions/116.html
         *
         * # Remediation
         *
         * Validate and sanitize the user input before persisting it in the database.
         *
         * # Fix
         *
         * Use Input validation and sanitization, see the validator() parameter above.
         * With Zod, a leading schema validation library for TypeScript, we define the model for the request body.
         * The input validation ensures the request body matches the expected format. Here we define which properties
         * exist and which schema they have. For example, we define that the `description` is a string with a maximum
         * of 2048 characters.
         * To prevent the Stored XSS, this is not enough. We also must sanitize the input. Here, we don't care about
         * the schema, but replace certain characters in a string. We use the `sanitize-html` library to remove all HTML
         * tags from the string. This libarary is Open Source and and has many downloads, so it is trusted by many
         * developers and can be validated.
         * Because we want to work with safe data from the beginning, we perform sanitization as part of the schema
         * validation. Zod has a `transform()` method that allows us to transform the input data. We use this method
         * to sanitize the strings.
         * With this approach the application only receives validated and sanitized data. In addition because we do
         * sanitization as part of the schema validation, the risk to forget sanitization is reduced and the
         * implementation is in a central place.
         * Hono has direct support for Zod Schemas, as you can see above - so we rely on native functionality.
         * It's important that all endpoints that receive user data validate and sanitize the input, so the PUT
         * Endpoint for updating a recipe must also use the same approach.
         */
        const storedRecipe: Recipe = await (await dbService.getDatabaseManager()).getRepository(Recipe).save(recipe);

        logger.info({}, "Persisted Recipe in Database.");
        return c.json(storedRecipe, 201);
    },
);

app.get("/recipes", async (c) => {
    const userId = c.get("userId");
    const isAuthenticated = c.get("isAuthenticated");
    /**
     * BUG: https://github.com/marcelfrey29/IU-DOCC-Project-Secure-Software-Implementation/issues/22
     *
     * # Description
     *
     * The logs include the users access token. Everyone with access to the logs can perform actions
     * on behalf of the users (while the token is valid).
     *
     * Errors related to logging and monitoring are part of OWASP Top 10 A09:2021 (Security Logging
     * and Monitoring Failures). In this concrete case, the logs include sensitive information which
     * belongs to the CWE Category CWE-532 Insertion of Sensitive Information into Log File).
     *
     * # Impact
     *
     * When tokens are logged and there is the change that others use it, it violates the principle of
     * non-repudation. The user can now deny that he has performed a certain action (regardless
     * whether he performed it or not). An important goal is non-repduation so that we can clearly say
     * who has performed what and when.
     *
     * In addition, threat actors can perform actions on behalf of the user and access their private
     * information which violates confidentiality and integrity.
     *
     * Only users with access to the logs can perform this attack. However, as security must be implemented
     * into every layer, we must patch this issue. It's not enough to declear that the log storage and
     * system needs to be protected against unauthorized access. This is especially true in case of an
     * internal attacker.
     *
     * # Background
     *
     * https://owasp.org/Top10/A09_2021-Security_Logging_and_Monitoring_Failures/
     * https://cwe.mitre.org/data/definitions/532.html
     *
     * # Remediation
     *
     * Remove the affected element from the log contect and only log context-relevant non-personal data
     * like the userId (`sub`) or authentication state (`isAuthenticated`).
     *
     * # Fix
     *
     * Instead of logging the raw `Authorization` header, we only log the values derived from the token, like
     * the ID of the user and its authentication state.
     *
     * Bearer CLI (SAST for Code) reports all additional logging information with severity LOW. For this reason,
     * the rule was disabled because we want to make use of structured logging, see `bearer.yml` in the project
     * root for more details. Without disabling the logger rule, Bearer CLI informs us about the logger leak
     * which is classified as CWE-532 (as we already defined above):
     * ```
     * LOW: Leakage of information in logger message [CWE-532]
     * https://docs.bearer.com/reference/rules/javascript_lang_logger_leak
     * ```
     */
    logger.info(
        {
            isAuthenticated,
            userId,
        },
        "User requested all Recipes.",
    );

    // Get all Recipes from the Database: We need to get all public recipes (`recipe.isPrivate = false`) and
    // all for authenticated users their private recipes too (`recipe.ownerUserId = :ownerUserId`). With this
    // approach, proper access control is in place.
    const recipes = await (await dbService.getDatabaseManager())
        .getRepository(Recipe)
        .createQueryBuilder("recipe")
        .where("recipe.ownerUserId = :ownerUserId OR recipe.isPrivate = false", {
            ownerUserId: userId,
        })
        .getMany();
    logger.info({ count: recipes.length }, "Got Recipes for User.");

    return c.json(recipes, 200);
});

app.get("/recipes/:id", async (c) => {
    const userId = c.get("userId");
    const isAuthenticated = c.get("isAuthenticated");

    // Get Recipe ID from Path Parameter
    let id: number;
    try {
        id = Number.parseInt(c.req.param("id"), 10);
    } catch (_e) {
        logger.warn({}, "The provided ID is not a number.");
        return c.json({}, 400);
    }

    // Get the Recipe by ID from the Databse
    const recipe = await (await dbService.getDatabaseManager()).getRepository(Recipe).findOneBy({ id });

    // Return 404 Not Found if there is no Recipe with the given ID in the Database.
    if (recipe === null) {
        logger.warn({ id }, "No Recipe for the ID found.");
        return c.json({}, 404);
    }

    /**
     * BUG: https://github.com/marcelfrey29/IU-DOCC-Project-Secure-Software-Implementation/issues/18
     *
     * # Description
     *
     * Private recipes are exposed to unauthorized users. This includes both anonymous users, and logged-in users
     * that don't own the recipe.
     * The ID can also be easily guessed as it's an integer counter ( `1`, `2`, `3`, ...).
     *
     * CWE-566 (Authorization Bypass Through User-Controlled SQL Primary Key) contributes to this issue but is not the
     * root cause. In our case Recipes are requested by their ID which is sent to the backend in a path parameter. This
     * ID is directly passed to the `findOneBy()` method, so the Primary Key is controlled by the user.
     * CWE 566 is part of CWE-639 (Authorization Bypass Through User-Controlled Key) but as already mentioned that's not
     * the root cause of the vulnerability.
     *
     * In our case it's also possible to guess the IDs of other recipies as we're using a number as Primary Key which is
     * increased for every new record. A threat actor can therefore easily scrape recipies by increasing a counter and
     * perform the request. To prevent guessing of IDs, a UUID should be used as identifier (and primary key).
     *
     * The root cause of this vulnerability is CWE-862 (Missing Authorization) because ther is no check that compares the
     * `ownerUserId` of the `Recipe` to the `sub` (User ID) of the requesting user. All these CWEs are part of OWASP
     * Top 10 A2021:01 (Broken Access Control).
     *
     * # Impact
     *
     * Sensitive data are exposed which violates the confidentiality of the data.
     *
     * # Background
     *
     * https://owasp.org/Top10/A01_2021-Broken_Access_Control/
     * https://cwe.mitre.org/data/definitions/566.html
     * https://cwe.mitre.org/data/definitions/639.html
     * https://cwe.mitre.org/data/definitions/862.html
     *
     * # Remediation
     *
     * Add an explicit ownership check for private recipes by comparing the `ownerUserId` of the `Recipe` entity
     * to the `sub` from the access token of the requesting user.
     * Consider using UUIDs as identifier that can't be easily guessed.
     *
     * # Fix
     *
     * Check the Recipes `isPrivate` field. If the recipe is private, only the owner of the recipe is allowed to see it.
     * We therefore must check the `ownerUserId` of the recipe against the `userId` (which is the `sub` from the access token).
     * It the user doesn't match the owner, we return `403 Forbidden`.
     */
    if (recipe.isPrivate && recipe.ownerUserId !== userId) {
        logger.warn({ id, isAuthenticated, userId }, "Deny: User is not the owner of the private Recipe.");
        return c.json({ message: "Forbidden" }, 403);
    }

    // Return the Recipe to the Client
    return c.json(recipe, 200);
});

app.put(
    "/recipes/:id",
    // Validate and sanitize input.
    // See POST Endpoint for details
    validator("json", (value, c) => {
        const parsed = RecipeUpdateCreateSchema.safeParse(value);
        if (!parsed.success) {
            logger.warn(
                {
                    validationError: parsed.error.message,
                    validationIssues: parsed.error.issues,
                },
                "Schema Validation failed.",
            );
            return c.json({ message: "Bad Request." }, 400);
        }
        return parsed.data;
    }),
    async (c) => {
        const isAuthenticated = c.get("isAuthenticated");
        if (isAuthenticated === false) {
            logger.warn({}, "Deny: User is not authenticated.");
            return c.json({}, 401);
        }
        const userId = c.get("userId");

        // Get Recipe ID from Path Parameter
        let id: number;
        try {
            id = Number.parseInt(c.req.param("id"), 10);
        } catch (_e) {
            logger.warn({}, "The provided ID is not a number.");
            return c.json({}, 400);
        }
        logger.info({ id, userId }, "User requests to update Recipe.");

        // Get the Recipe by ID from the Databse
        const recipe = await (await dbService.getDatabaseManager()).getRepository(Recipe).findOneBy({ id });

        // Return 404 Not Found if there is no Recipe with the given ID in the Database.
        if (recipe === null) {
            logger.warn({ id }, "No Recipe for the ID found.");
            return c.json({}, 404);
        }

        // Only the owner of the Recipe is allowed to update it, so we need to check the
        // ownerUserId of the Recipe against the userId from the access token (sub).
        if (recipe.ownerUserId !== userId) {
            logger.warn({ id, recipeOwner: recipe.ownerUserId, userId }, "Deny: User is not the owner of the Recipe.");
            return c.json({}, 403);
        }

        // Update the Recipe with the data from the Request Body. Here, we must use the validated and
        // sanitized data from `c.req.valid("json")`. See POST Endpoint for details.
        const updatedRecipe = c.req.valid("json");
        recipe.title = updatedRecipe.title;
        recipe.description = updatedRecipe.description;
        recipe.isPrivate = updatedRecipe.isPrivate;
        recipe.ingredients = updatedRecipe.ingredients;
        recipe.steps = updatedRecipe.steps;

        // Save the updated Recipe in the Database
        const savedRecipe = await (await dbService.getDatabaseManager()).getRepository(Recipe).save(recipe);
        logger.info({ id, userId }, "Updated Recipe.");

        // Simulate a crash for even recipe IDs between 0 and 10 so that an DB Exception is thrown.
        // Such an exception should not find a way to the client as it could contain sensitive information.
        // See "app.onError()" error hook for details.
        if (id >= 0 && id % 2 === 0 && id <= 10) {
            logger.warn("Simulating Crash.");
            await (await dbService.getDatabaseManager()).query("SELECT * FROM NON_EXISTING_TABLE");
        }

        // Return the updated Recipe to the Client
        return c.json(savedRecipe, 200);
    },
);

app.delete("/recipes/:id", async (c) => {
    const isAuthenticated = c.get("isAuthenticated");
    if (isAuthenticated === false) {
        logger.warn({}, "Deny: User is not authenticated.");
        return c.json({}, 401);
    }
    const userId = c.get("userId");

    // Get Recipe ID from Path Parameter
    let id: number;
    try {
        id = Number.parseInt(c.req.param("id"), 10);
    } catch (_e) {
        logger.warn({}, "The provided ID is not a number.");
        return c.json({}, 400);
    }
    logger.info({ id, userId }, "User requests to delete Recipe.");

    // Get the Recipe by ID from the Databse
    const recipe = await (await dbService.getDatabaseManager()).getRepository(Recipe).findOneBy({ id });

    // Return 404 Not Found if there is no Recipe with the given ID in the Database.
    if (recipe === null) {
        logger.warn({ id }, "No Recipe for the ID found.");
        return c.json({}, 404);
    }

    // Only the owner of the Recipe is allowed to delete it, so we need to check the
    // ownerUserId of the Recipe against the userId from the access token (sub).
    if (recipe.ownerUserId !== userId) {
        logger.warn({ id, recipeOwner: recipe.ownerUserId, userId }, "Deny: User is not the owner of the Recipe.");
        return c.json({}, 403);
    }

    // Delete the Recipe
    await (await dbService.getDatabaseManager()).getRepository(Recipe).remove(recipe);
    logger.info({ id, userId }, "Deleted Recipe.");

    // Return success
    return c.json({}, 200);
});

app.post("/recipes/:recipeId/comments", async (c) => {
    if (c.get("isAuthenticated") === false) {
        logger.warn({}, "Denying recipe comment creation for anonymous user.");
        return c.json({}, 401);
    }

    const userId = c.get("userId");
    const recipeId = c.req.param("recipeId");
    const comment = await c.req.json<RecipeComment>();
    logger.info({ userId, recipeId }, "Creating new Recipe Comment for User.");
    comment.recipeId = Number.parseInt(recipeId, 10);
    comment.ownerUserId = userId;

    const storedComment = await (await dbService.getDatabaseManager()).getRepository(RecipeComment).save(comment);

    logger.info({}, "Persisted Recipe Comment in Database.");
    return c.json(storedComment, 201);
});

app.get(
    "/recipes/:recipeId/comments",
    // Validate and sanitize input.
    // See POST Endpoint for details
    validator("param", (value, c) => {
        const recipeId = value.recipeId;
        const parsed = CommentIdSchema.safeParse(recipeId);
        if (!parsed.success) {
            logger.warn(
                {
                    validationError: parsed.error.message,
                    validationIssues: parsed.error.issues,
                },
                "Schema Validation failed.",
            );
            return c.json({ message: "Bad Request." }, 400);
        }
        return { recipeId };
    }),
    async (c) => {
        const { recipeId } = c.req.valid("param");
        logger.info({ recipeId }, "All comments for Recipe requested.");

        /**
         * BUG: https://github.com/marcelfrey29/IU-DOCC-Project-Secure-Software-Implementation/issues/27
         *
         * # Description
         *
         * The `recipeId` parameter is used directly in the SQL query which allows SQL Injections.
         *
         * Direct usage allows the injection of additional SQL commands which changes the query result.
         * When the API is used as intended, the integer ID (e.g. `7`) is inserted into the query which
         * results in the SQL command `comment.recipeId = 7`. As this is used in a `WHERE` statement, this query will only
         * return comments that belong to the Recipe with the ID `7`.
         * A threat actor now can manipulate the API call and change the ID to a non-integer value, e.g. `7 OR 1=1`. If this
         * is done, the resulting SQL statement is `comment.recipeId = 7 OR 1=1` which makes the `WHERE` statement completely
         * useless because the malicious part `OR 1=1` will cause the `WHERE` to always evaluate to `true`. As result, all
         * comments stored in the database will be returned to the client.
         *
         * Injection vulnerabilities are part of OWASP Top 10 A03:2021 (Injection). The related CWE entry is CWE-89 (Improper
         * Neutralization of Special Elements used in an SQL Command ('SQL Injection')). The specialized element in this case
         * is `OR`, which is a SQL command.
         *
         * # Impact
         *
         * Data can be exfiltrated or manipulated which violates the confidentiality, integrity, and availability
         * of data.
         *
         * # Background
         *
         * https://owasp.org/Top10/A03_2021-Injection/
         * https://cwe.mitre.org/data/definitions/89.html
         *
         * # Remediation
         *
         * First, all input should be validated against a schema. As our IDs are numbers (integers) we have to ensure that
         * the provided input really is a number. Even with just this, no SQL Injection would be possible as no SQL Command
         * or other control character (like `;`) would be accepted.
         * As security must be implemented in all layers, we also must change the way how we pass data to the query processor.
         * Input should never be directly used in the SQL command. Instead, variables (parameters) have to be used. Libraries
         * and SQL engines can then automatically escape the input.
         * To resolve the issue, we must switch to a parameterized query.
         *
         * # Fix
         *
         * Add Schema Validation as first layer of defense against SQL Injections. See the `validator()` middleware above.
         * We ensure that only valid IDs (integers) are accepted.
         * In addition, we switch to a parameterized query by using `:recipeId` in the query and passing the value for it.
         * The SQL Library takes care of proper escaping of the value. With this, we have two layers of defense against
         * SQL Injections in place.
         */
        const recipeComments = await (await dbService.getDatabaseManager())
            .getRepository(RecipeComment)
            .createQueryBuilder("comment")
            // Use a parameterized query instead of directly inserting the value. The provided value `recipeId` is used for the
            // parameter `:recipeId` in the  `WHERE` clause. The SQL library takes care of proper escaping of the value.
            .where(`comment.recipeId = :recipeId`, { recipeId })
            .getMany();

        logger.info({ recipeId, count: recipeComments.length }, "Got all comments for the Recipe.");
        return c.json(recipeComments, 200);
    },
);

app.delete("/recipes/:recipeId/comments/:commentId", async (c) => {
    if (c.get("isAuthenticated") === false) {
        logger.warn({}, "Deny: Unauthenticated user can't delete comments.");
    }
    const userId = c.get("userId");
    const recipeId = c.req.param("recipeId");
    const commentId = c.req.param("commentId");
    logger.info({ userId, recipeId, commentId }, "User wants to delete a comment.");

    const comment = await (await dbService.getDatabaseManager())
        .getRepository(RecipeComment)
        .findOneBy({ id: Number.parseInt(commentId, 10) });
    if (!comment) {
        logger.warn({ commentId }, "There is no comment with the given ID.");
        return c.json({}, 404);
    }
    if (comment.ownerUserId !== userId) {
        logger.warn({ userId, commentId }, "Deny: The requesting user is not the owener of the comment.");
        return c.json({}, 403);
    }

    await (await dbService.getDatabaseManager())
        .getRepository(RecipeComment)
        .delete({ id: Number.parseInt(commentId, 10) });

    logger.info({ commentId, userId }, "Deleted comment.");
    return c.json({}, 200);
});

// Run Server
serve(
    {
        fetch: app.fetch,
        port: 3000,
    },
    (info) => {
        logger.info({ port: info.port }, "Server is ready.");
    },
);
