import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import graphqlUploadExpress from 'graphql-upload/graphqlUploadExpress.mjs';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer'
import express from 'express';
import http from 'http';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';

const typeDefs = `
  scalar Upload
  type File {
    url: String!
  }
  type Query {
    hello: String!
  }
  type Mutation {
    uploadFile(file: Upload!): File!
  }
`;

const resolvers = {
  // Upload : GraphQLUpload,
  Query: {
    hello: () => 'Hello World'
  },
  Mutation: {
      uploadFile: async (parent, { file }) => {
      const { file: { createReadStream, filename } } = await file[0];
      const stream = createReadStream();
      const __dirname = path.resolve();
      const pathName = path.join(__dirname,`public/images/${filename}`)
      await stream.pipe(fs.createWriteStream(pathName))
      // 1. Validate file metadata.
      // 2. Stream file contents into cloud storage:
      // https://nodejs.org/api/stream.html
      // 3. Record the file upload in your DB.
      // const id = await recordFile( … )

      return { url: `http://localhost:4000/images/${filename}`};
    },
  },
};

const app = express();
app.use(graphqlUploadExpress());
const httpServer = http.createServer(app);

// Set up Apollo Server
const server = new ApolloServer({
  typeDefs,
  resolvers,
  csrfPrevention: false,
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
});
await server.start();

app.use(
  cors(),
  bodyParser.json(),
  expressMiddleware(server),
);

await new Promise((resolve) => httpServer.listen({ port: 4000 }, resolve));
console.log(`🚀 Server ready at http://localhost:4000`);

