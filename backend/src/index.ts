// Must be the first import to make the TypeORM Decorators work
import "reflect-metadata";

// Imports
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { requestId } from "hono/request-id";
import * as jose from "jose";
import pino from "pino";
import { Recipe } from "./model/Recipe.js";
import { RecipeComment } from "./model/RecipeComment.js";
import { ConfigService } from "./service/ConfigService.js";
import { DatabaseService } from "./service/DatabaseService.js";

// Setup Services
const logger = pino();
logger.info({}, "Starting Server...");
const configService = new ConfigService(logger);
const dbService = new DatabaseService(logger, configService);
const JWKS = jose.createRemoteJWKSet(
    new URL(
        `${configService.getAuthServiceUrl()}/application/o/social-recipe/jwks/`,
    ),
);

// Setup Hono Server
declare module "hono" {
    // Type definitions for Hono Request Context
    interface ContextVariableMap {
        isAuthenticated: boolean;
        userId: string;
    }
}
const app = new Hono();
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
     */
    return c.json({ error }, 500);
});
app.notFound((c) => {
    logger.warn({}, "Not Found.");
    return c.json({ message: "Not Found." }, 404);
});
// Hono Middlewares
app.use("*", requestId({ headerName: "x-request-id" }));
app.use("*", cors({ origin: "*" }));
app.use("*", async (c, next) => {
    const token: string | undefined = c.req.header()["authorization"];
    if (!token) {
        logger.info({}, "No Token: Anonymous user.");
        c.set("isAuthenticated", false);
    } else {
        try {
            const { payload } = await jose.jwtVerify(
                token.replace("Bearer ", ""),
                JWKS,
                {
                    issuer: "http://auth-service.localhost/application/o/social-recipe/",
                    audience: "social-recipe",
                },
            );
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

app.post("/recipes", async (c) => {
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
    const recipe = await c.req.json<Recipe>();
    logger.info({}, "Creating new Recipe for User.");
    recipe.ownerUserId = userId;

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
     */
    const storedRecipe = await (await dbService.getDatabaseManager())
        .getRepository(Recipe)
        .save(recipe);

    logger.info({}, "Persisted Recipe in Database.");
    return c.json(storedRecipe, 201);
});

app.get("/recipes", async (c) => {
    const userId = c.get("userId");

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
     */
    logger.info(
        {
            user: c.req.header("Authorization"),
        },
        "User requested all Recipes.",
    );

    // Get all Recipes from the Database: We need to get all public recipes (`recipe.isPrivate = false`) and
    // all for authenticated users their private recipes too (`recipe.ownerUserId = :ownerUserId`). With this
    // approach, proper access control is in place.
    const recipes = await (await dbService.getDatabaseManager())
        .getRepository(Recipe)
        .createQueryBuilder("recipe")
        .where(
            "recipe.ownerUserId = :ownerUserId OR recipe.isPrivate = false",
            { ownerUserId: userId },
        )
        .getMany();
    logger.info({ count: recipes.length }, "Got Recipes for User.");

    return c.json(recipes, 200);
});

app.get("/recipes/:id", async (c) => {
    // Get Recipe ID from Path Parameter
    let id: number;
    try {
        id = parseInt(c.req.param("id"));
    } catch (e) {
        logger.warn({}, "The provided ID is not a number.");
        return c.json({}, 400);
    }

    // Get the Recipe by ID from the Databse
    const recipe = await (await dbService.getDatabaseManager())
        .getRepository(Recipe)
        .findOneBy({ id });

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
     */

    // Return the Recipe to the Client
    return c.json(recipe, 200);
});

app.put("/recipes/:id", async (c) => {
    const isAuthenticated = c.get("isAuthenticated");
    if (isAuthenticated === false) {
        logger.warn({}, "Deny: User is not authenticated.");
        return c.json({}, 401);
    }
    const userId = c.get("userId");

    // Get Recipe ID from Path Parameter
    let id: number;
    try {
        id = parseInt(c.req.param("id"));
    } catch (e) {
        logger.warn({}, "The provided ID is not a number.");
        return c.json({}, 400);
    }
    logger.info({ id, userId }, "User requests to update Recipe.");

    // Get the Recipe by ID from the Databse
    const recipe = await (await dbService.getDatabaseManager())
        .getRepository(Recipe)
        .findOneBy({ id });

    // Return 404 Not Found if there is no Recipe with the given ID in the Database.
    if (recipe === null) {
        logger.warn({ id }, "No Recipe for the ID found.");
        return c.json({}, 404);
    }

    // Only the owner of the Recipe is allowed to update it, so we need to check the
    // ownerUserId of the Recipe against the userId from the access token (sub).
    if (recipe.ownerUserId !== userId) {
        logger.warn(
            { id, recipeOwner: recipe.ownerUserId, userId },
            "Deny: User is not the owner of the Recipe.",
        );
        return c.json({}, 403);
    }

    // Update the Recipe with the data from the Request Body
    const updatedRecipe = await c.req.json<Recipe>();
    recipe.title = updatedRecipe.title;
    recipe.description = updatedRecipe.description;
    recipe.isPrivate = updatedRecipe.isPrivate;
    recipe.ingredients = updatedRecipe.ingredients;
    recipe.steps = updatedRecipe.steps;

    // Save the updated Recipe in the Database
    const savedRecipe = await (await dbService.getDatabaseManager())
        .getRepository(Recipe)
        .save(recipe);
    logger.info({ id, userId }, "Updated Recipe.");

    // Simulate a crash for even recipe IDs between 0 and 10 so that an DB Exception is thrown.
    // Such an exception should not find a way to the client as it could contain sensitive information.
    // See "app.onError()" error hook for details.
    if (id >= 0 && id % 2 === 0 && id <= 10) {
        logger.warn("Simulating Crash.");
        await (await dbService.getDatabaseManager()).query(
            "SELECT * FROM NON_EXISTING_TABLE",
        );
    }

    // Return the updated Recipe to the Client
    return c.json(savedRecipe, 200);
});

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
        id = parseInt(c.req.param("id"));
    } catch (e) {
        logger.warn({}, "The provided ID is not a number.");
        return c.json({}, 400);
    }
    logger.info({ id, userId }, "User requests to delete Recipe.");

    // Get the Recipe by ID from the Databse
    const recipe = await (await dbService.getDatabaseManager())
        .getRepository(Recipe)
        .findOneBy({ id });

    // Return 404 Not Found if there is no Recipe with the given ID in the Database.
    if (recipe === null) {
        logger.warn({ id }, "No Recipe for the ID found.");
        return c.json({}, 404);
    }

    // Only the owner of the Recipe is allowed to delete it, so we need to check the
    // ownerUserId of the Recipe against the userId from the access token (sub).
    if (recipe.ownerUserId !== userId) {
        logger.warn(
            { id, recipeOwner: recipe.ownerUserId, userId },
            "Deny: User is not the owner of the Recipe.",
        );
        return c.json({}, 403);
    }

    // Delete the Recipe
    await (await dbService.getDatabaseManager())
        .getRepository(Recipe)
        .remove(recipe);
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
    comment.recipeId = parseInt(recipeId);
    comment.ownerUserId = userId;

    const storedComment = await (await dbService.getDatabaseManager())
        .getRepository(RecipeComment)
        .save(comment);

    logger.info({}, "Persisted Recipe Comment in Database.");
    return c.json(storedComment, 201);
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
