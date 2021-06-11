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
      const {type, value, udt_name, is_nullable} = types_obj[type_name][field]
      let gql_type = ''
      switch (type) {
        case "integer":
          gql_type = "Int"
          break
        case "boolean":
          gql_type = "Boolean"
          break
        case "character varying":
          gql_type = "String"
          break
        case "ARRAY":
          if (udt_name==='_int4') gql_type = "[Int]"
          break
        case "timestamp":
          gql_type = "DATETIME"
          break
        case "INDEX":
          gql_type = value
          break
        case "ID":
          gql_type = "ID!"
          break
      }
      if (is_nullable==='YES') gql_type+="?"
      types_obj[type_name][field].gql_type = gql_type
    }
  }
  return types_obj
}

export default async ({_id, username, password, host, port, database},userId) => {
  const types = {}
  const client = new Client({ user: username, password, host, database, port })
  await client.connect()
  const {rows: db_rows} = await client.query(get_dbs_query)
  await Promise.all(db_rows.map(async ({datname: db_name}) => {
    const {rows: tables} = await client.query(get_all_tables(db_name))
    await Promise.all(tables.map(async ({table_name})=> {
      types[table_name] = {}
      const {rows: rows} = await client.query(get_table(table_name,db_name))
      await Promise.all(rows.map(async ({column_name, data_type: type, is_nullable,udt_name})=> {
        // get every row type
        types[table_name][column_name] = { type, is_nullable, udt_name }
      }))
      const {rows: indexs} = await client.query(get_indexs(table_name,db_name))
      await Promise.all(indexs.map(async ({indisprimary, attname})=> {
        // if primary index label as ID
        if (indisprimary) types[table_name][attname].type = 'ID'
      }))
      const {rows: fkeys} = await client.query(get_fkeys(table_name))
      await Promise.all(fkeys.map(async ({column_name, foreign_table_name})=> {
        // if foreign key label as such
        types[table_name][column_name] = {
          type: 'INDEX',
          value: foreign_table_name
        }
      }))
    }))
  }))
  const gql_types = psql_to_gql(types)
  for (let table_name in gql_types) {
    let fields = []
    for (let f of Object.keys(gql_types[table_name])) {
      fields.push({ name:f, ...gql_types[table_name][f] })
    }
    Types.upsert(
      {
        db: _id,
        basedOnTable: table_name
      },
      {
        $set: {
          db: _id,
          basedOnTable: table_name,
          typeName: table_name,
          fields
        }
      }
    )
  }
  await client.end()
  return gql_types
}