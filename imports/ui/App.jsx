import React from 'react';
import { InMemoryCache, ApolloProvider, ApolloClient, ApolloLink } from '@apollo/client';
import { BatchHttpLink } from '@apollo/client/link/batch-http'
// import { MeteorAccountsLink } from 'meteor/apollo'
import { TypesViewer } from './TypesViewer.jsx';
import { DataSources } from './DataSources.jsx';

const cache = new InMemoryCache().restore(window.__APOLLO_STATE__);

const link = ApolloLink.from([
  // MeteorAccountsLink(),
  new BatchHttpLink({
    uri: '/graphql'
  })
]);

const client = new ApolloClient({
  uri: '/graphql',
  cache,
  link,
});

export const App = () => (
  <ApolloProvider client={client}>
    <div>
      <DataSources/>
      <hr></hr>
      <TypesViewer/>
    </div>
  </ApolloProvider>
);
