import "dotenv/config";
import express from "express";
import cors from "cors";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { typeDefs } from "./schema/typeDefs";
import { resolvers } from "./resolvers";
import { getAuthContext } from "./middleware/auth";

async function main() {
  const app = express();
  const port = Number(process.env.PORT) || 4000;

  // Apollo Server
  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });

  await server.start();

  // Middleware
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN || "*",
      credentials: true,
    })
  );

  // Health check
  app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // GraphQL endpoint
  app.use(
    "/graphql",
    express.json(),
    expressMiddleware(server, {
      context: async ({ req }) => ({
        auth: getAuthContext(req),
      }),
    })
  );

  app.listen(port, () => {
    console.log(`🚀 GTI API running at http://localhost:${port}/graphql`);
    console.log(`❤️  Health check at http://localhost:${port}/health`);
  });
}

main().catch(console.error);
