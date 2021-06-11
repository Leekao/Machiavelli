import React from 'react';
import { useQuery } from '@apollo/client';
import { gql } from 'apollo-boost';

const GET_DBS = gql`
    {
        dbs: getDbs {
            _id
            name
            host
        }
    }
`;

export const DataSources = () => {
  const { loading, error, data } = useQuery(GET_DBS);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error ⁉️</p>;

  return (
    <div>
      <h3>Data Sources:</h3>
      <ul>{data?.dbs?.map(
        db => <li onClick={() => {
          Meteor.call('analyze',db._id)
        }} key={db._id}> {db.name} </li>
      )}</ul>
    </div>
  );
};
