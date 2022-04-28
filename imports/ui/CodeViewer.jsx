import React from 'react';
import { useQuery } from '@apollo/client';
import { gql } from 'apollo-boost';

const GET_TYPES = gql` {
  types: getTypes {
    _id
    basedOnTable
    typeName,
		index,
    fields {
      name, type, gql_type
    }
  }
}`;

const MdbResolver = ({_id, typeName, fields,index, basedOnTable}) => {
  return <div key={_id}>
    <div>{`get${typeName}s: (obj, {id}) =>  { Client.query("SELECT * FROM ${basedOnTable}; ") },`}</div>
    <div>{`get${typeName}: (obj, {id}) =>  { Client.query("SELECT * FROM ${basedOnTable} WHERE ${index}='\${id}'; ") },`}</div>
    <div>{`set${typeName}: (obj, {id}) =>  { Client.query("SELECT * FROM ${basedOnTable} WHERE ${index}='\${id}'; ") },`}</div>
    <div>{`del${typeName}: (obj, {id}) =>  { Client.query("DELETE FROM ${basedOnTable} WHERE ${index}='\${id}'; ") },`}</div>
  </div>
}
const PgResolver = ({_id, typeName, fields,index, basedOnTable}) => {
  if (basedOnTable.includes('.')) {
    return <div></div>
  }
  const where_condition = () => {
    return `WHERE `+ index.map(i_name => `${i_name}='\${${i_name}}'`).join(',')
  }
  const argsuments_object = () => {
    return "{"+index.join(',')+"}"
  }
  const values = () => {
    return "${"+index.join(',')+"}"
  }
  if (index.length) {
    console.log(
      where_condition(),
      argsuments_object()
    )
  }
  return <div key={_id}>
    <div>{`get${typeName}s: (obj) =>  { Client.query(\`SELECT * FROM ${basedOnTable}; \`) },`}</div>
    <div>{`get${typeName}: (obj, ${argsuments_object()}) =>  { Client.query(\`SELECT * FROM ${basedOnTable} ${where_condition()};\`)},`}</div>
    <div>{`set${typeName}: (obj, ${argsuments_object()}) =>  { Client.query(\`SELECT * FROM ${basedOnTable} ${where_condition()};\`)},`}</div>
    <div>{`del${typeName}: (obj, ${argsuments_object()}) =>  { Client.query(\`DELETE FROM ${basedOnTable} ${where_condition()};\`)},`}</div>
    <div>{`add${typeName}: (obj, ${argsuments_object()}) =>  { Client.query(\`INSERT INTO  ${basedOnTable} VALUES (${values()});\`)}`}</div>
  </div>
}

export const CodeViewer = () => {
  const { loading, error, data } = useQuery(GET_TYPES);

  if (loading) return <p>Loading...</p>;
  if (error) {
    console.error(error)
    return <p>Error ⁉️</p>
  }
  console.log({data})

  return (
    <div className='fg1 CodeViewer'>
			<div>{`const { Client } = require('pg')`}</div>
      <div>{`const resolvers = {`}</div>
      <div>&nbsp;Query: {`{`} </div>
      <ul>{data?.types?.map(t => <PgResolver key={t._id} {...t} />)} </ul>
      <div>&nbsp;{`}`}</div>
      <div>{`}`}</div>
    </div>
  );
};
