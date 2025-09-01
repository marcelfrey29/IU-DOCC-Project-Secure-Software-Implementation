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

    // FIXME: Describe that we store the object without input validator or sanitization.
    // Link it with the GET Endpoint where the plain data are returned to the client which
    // then cause a XSS vulnerability (Stored XSS)
    const storedRecipe = await (await dbService.getDatabaseManager())
        .getRepository(Recipe)
        .save(recipe);

    logger.info({}, "Persisted Recipe in Database.");
    return c.json(storedRecipe, 201);
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
