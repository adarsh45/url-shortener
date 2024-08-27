import Fastify from "fastify";
import {
  deleteAliasHandler,
  getAnalyticsHandler,
  getLongUrl,
  shortenURLHandler,
  updateAliasHandler,
} from "./src/handlers.js";
import {
  deleteAliasSchema,
  getAnalyticsSchema,
  getLongURLSchema,
  shortenURLRequestSchema,
  updateAliasSchema,
} from "./src/request-schemas.js";

const app = Fastify({
  logger: true,
});

app.post("/shorten", {
  handler: shortenURLHandler,
  schema: shortenURLRequestSchema,
});

// GET long url
app.get("/:alias", { handler: getLongUrl, schema: getLongURLSchema });

// GET analytics
app.get("/analytics/:alias", {
  handler: getAnalyticsHandler,
  schema: getAnalyticsSchema,
});

// PUT update alias and TTL
app.put("/update/:alias", {
  handler: updateAliasHandler,
  schema: updateAliasSchema,
});

// DELETE delete alias
app.delete("/delete/:alias", {
  handler: deleteAliasHandler,
  schema: deleteAliasSchema,
});

async function run() {
  try {
    await app.listen({ port: process.env.PORT || 3001 });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

run();
