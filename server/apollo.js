import { ApolloServer } from 'apollo-server-express';
import { WebApp } from 'meteor/webapp';
import { getUser } from 'meteor/apollo';
import { Databases,Types } from '/imports/api/links';
import typeDefs from '/imports/apollo/schema.graphql';

const resolvers = {
  Query: {
    getType: (obj, { id }) => Types.findOne(id),
    getTypes: () => Types.find().fetch(),
    getDb: (obj, { id }) => Databases.findOne(id),
    getDbs: () => Databases.find().fetch()
  }
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({ req }) => ({
    user: await getUser(req.headers.authorization)
  })
});

server.applyMiddleware({
  app: WebApp.connectHandlers,
  cors: true
});
