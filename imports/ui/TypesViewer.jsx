
import React from 'react';
import { useQuery } from '@apollo/client';
import { gql } from 'apollo-boost';

const GET_TYPES = gql` {
  types: getTypes {
    _id
    basedOnTable
    typeName,
    fields {
      name, type
    }
  }
}`;

export const TypesViewer = () => {
  const { loading, error, data } = useQuery(GET_TYPES);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error ⁉️</p>;
  console.log({data})

  return (
    <div>
      <h2>Learn Meteor!</h2>
      <ul>{data?.types?.map(
        db => <li key={db._id}> {db.typeName} </li>
      )}</ul>
    </div>
  );
};
