import Fastify from "fastify";
import {
  deleteAliasHandler,
  getAnalyticsHandler,
  getLongUrl,
  shortenURLHandler,
  updateAliasHandler,
} from "./src/handlers.js";

const app = Fastify({
  logger: true,
});

app.post("/shorten", shortenURLHandler);

// GET long url
app.get("/:alias", getLongUrl);

// GET analytics
app.get("/analytics/:alias", getAnalyticsHandler);

// PUT update alias and TTL
app.put("/update/:alias", updateAliasHandler);

// DELETE delete alias
app.delete("/delete/:alias", deleteAliasHandler);

async function run() {
  try {
    await app.listen({ port: 3001 });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

run();
