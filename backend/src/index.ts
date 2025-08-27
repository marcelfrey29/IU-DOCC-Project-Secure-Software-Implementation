// Must be the first import to make the TypeORM Decorators work
import "reflect-metadata";

// Imports
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { DatabaseDataSource } from "./config/database.js";
import { Recipe } from "./model/Recipe.js";

// Setup Database
const database = await DatabaseDataSource.initialize();
const dbService = database.manager;
console.log("DB Ready.");

// Setup Hono
const app = new Hono();

app.get("/", async (c) => {
    console.log("Handler Called.");

    const recipies = await dbService.find(Recipe);
    console.log(`Found ${recipies.length} recipies.`);

    return c.text(`Hello Hono! 🔥 (${recipies.length} Recipes)`);
});

// Run Server
serve(
    {
        fetch: app.fetch,
        port: 3000,
    },
    (info) => {
        console.log(`Server is running on http://localhost:${info.port}`);
    },
);
