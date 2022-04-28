
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

const Field = ({name, type, gql_type}) => {
	let clss = gql_type
  console.log({name, type, gql_type})
	if (gql_type.startsWith('_')) {
		gql_type = gql_type.substr(1)
		clss = `isType ${gql_type}`
    return <div>
      <span>{gql_type}</span>
      <span>:&nbsp;</span>
      <span className={clss}>{gql_type}</span>
    </div>
	}
  return <div>
    <span>{name}</span>
    <span>:&nbsp;</span>
    <span className={clss}>{gql_type}</span>
  </div>
}

const Type = ({_id, typeName, basedOnTable, fields}) => {
  const needNewObject = fields.reduce((pv, f) => { 
    if (f.gql_type=='ID!') return true
    return pv
  }, false)
  if (basedOnTable.includes('.')) {
    return (<div key={_id}>
      <h4 className={`isType main_${typeName}`}>ENUM {typeName} {`{`}</h4>
      <ul>{fields.map(f => <div key={f.name}>{f.name}</div>)} </ul>
      <h4>{`}`}</h4>
    </div>)
  }
  return (<div key={_id}>
    <h4 className={`isType main_${typeName}`}>{typeName} {`{`}</h4>
		<ul>{fields.map(f => <Field key={f.name} {...f} />)} </ul>
    <h4>{`}`}</h4>
    {needNewObject && <div>
      <h4 className={`isType new_${typeName}`}>New{typeName}Object {`{`}</h4>
      <ul>{fields.filter(f => f.gql_type!='ID!').map(f => <Field key={f.name} {...f} />)} </ul>
      <h4>{`}`}</h4>
      </div>
    }
  </div>
  )
}

export const TypesViewer = () => {
  const { loading, error, data } = useQuery(GET_TYPES);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error ⁉️</p>;
  console.log({data})

  return (
    <div className='fg1 TypeViewer'>
      <ul>{data?.types?.map(t => <Type key={t._id} {...t} />)} </ul>
    </div>
  );
};
