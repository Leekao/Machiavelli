const { Client } = require('pg')
import { Types } from '/imports/api/links';

const get_dbs_query = `
  SELECT datname FROM pg_database WHERE datistemplate = false
`
const get_all_tables = (db_name) => {
  return `SELECT * 
    FROM information_schema.tables
    WHERE table_type = 'BASE TABLE'
    AND table_catalog = '${db_name}'
    AND table_schema = 'public'
   `
}
const get_fkeys = (table) => {
  return `SELECT
    tc.table_schema, 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_schema AS foreign_table_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
  FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
  WHERE 
    tc.constraint_type = 'FOREIGN KEY' AND tc.table_name='${table}';
  `
}
const get_indexs = (table) => {
  return `SELECT * 
    FROM pg_index AS i, pg_class AS c, pg_attribute AS a
    WHERE i.indexrelid = c.oid AND i.indexrelid = a.attrelid 
    AND i.indrelid = 'public.${table}'::regclass
  `
}
const get_table = (table, db) => {
  return `SELECT *
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = '${table}'
    ORDER BY ordinal_position;
  `
}

const psql_to_gql = (types_obj) => {
  for (let type_name in types_obj){
    for (field in types_obj[type_name]) {
      const {type, value} = types_obj[type_name][field].type
      switch (type) {
        case "integer":
          types_obj[type_name][field] = "Int"
          break
        case "boolean":
          types_obj[type_name][field] = "Boolean"
          break
        case "character varying":
          types_obj[type_name][field] = "String"
          break
        case "boolean":
          types_obj[type_name][field] = "Boolean"
          break
        case "index":
          types_obj[type_name][field] = value
          break
        case "ID":
          types_obj[type_name][field] = "ID"
          break
      }
    }
  }
  return types_obj
}
export default async ({user, password, host, port, database},userId) => {
  const types = {}
  const client = new Client({ user, password, host, database, port })
  await client.connect()
  const {rows: db_rows} = await client.query(get_dbs_query)
  await Promise.all(db_rows.map(async ({datname: db_name}) => {
    const {rows: tables} = await client.query(get_all_tables(db_name))
    await Promise.all(tables.map(async ({table_name})=> {
      types[table_name] = {}
      const {rows: rows} = await client.query(get_table(table_name,db_name))
      await Promise.all(rows.map(async ({column_name, data_type, ...rest})=> {
        console.log({rest})
        types[table_name][column_name] = { type: data_type }
      }))
      const {rows: indexs} = await client.query(get_indexs(table_name,db_name))
      await Promise.all(indexs.map(async ({indisprimary, attname})=> {
        if (indisprimary) types[table_name][attname].type = 'ID'
      }))
      const {rows: fkeys} = await client.query(get_fkeys(table_name))
      await Promise.all(fkeys.map(async ({column_name, foreign_table_name})=> {
        types[table_name][column_name] = {
          type: 'index',
          value: foreign_table_name
        }
      }))
    }))
  }))
  const gql_types = psql_to_gql(types)
  console.log(types, gql_types)
  await client.end()
  return gql_types
}