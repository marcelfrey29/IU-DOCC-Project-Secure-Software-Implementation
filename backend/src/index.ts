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
    new URL("http://auth-service.localhost/application/o/social-recipe/jwks/"),
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
