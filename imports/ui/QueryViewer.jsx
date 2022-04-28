import React from 'react';
import { useQuery } from '@apollo/client';
import { gql } from 'apollo-boost';

const GET_TYPES = gql` {
  types: getTypes {
    _id
    basedOnTable
    typeName,
    fields {
      name, type, gql_type
    }
  }
}`;

const Query = ({_id, typeName, fields}) => {
  return <div key={_id}>
    <div>get{typeName}s: [{typeName}]</div>
    <div>get{typeName} (id: ID!): {typeName}</div>
    <div>set{typeName} (id: ID!): Boolean</div>
    <div>del{typeName} (id: ID!): Boolean</div>
    <div>add{typeName} ({typeName}Object: New{typeName}Object!): Boolean</div>
  </div>
}

export const QueryViewer = () => {
  const { loading, error, data } = useQuery(GET_TYPES);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error ⁉️</p>;
  console.log({data})

  return (
    <div className='fg1 QueryViewer'>
      <h4>Type Query {`{`} </h4>
      <ul>{data?.types?.map(t => <Query key={t._id} {...t} />)} </ul>
      <h4>{`}`}</h4>
    </div>
  );
};
