const mysql = require('mysql2/promise'); 

import { Types } from '/imports/api/links';

const mysql_intrnal_databases = ['information_schema','mysql','performance_schema','sys']

const get_dbs_query = `
  SHOW DATABASES;
`
const get_all_tables = (db_name) => {
  return ` SELECT 
    table_name 
  FROM 
    information_schema.tables
  WHERE 
    table_schema = '${db_name}';
   `
}
const get_table = (table, db) => {
  return `SHOW CREATE TABLE ${db}.${table} `
}

const DEBUG_LEVEL = 1

const mysql_to_gql = (types_obj) => {
  for (let type_name in types_obj){
    for (field in types_obj[type_name]) {
      const {type, value, is_nullable} = types_obj[type_name][field]
      if (!type) continue
      let gql_type = ''
      switch (true) {
        case type.includes("int"):
          gql_type = "Int"
          break
        case type.includes("char"):
          gql_type = "String"
          break
        case type.includes("date"):
          gql_type = "DATETIME"
          break
        case type=="INDEX":
          gql_type = `_${value}`
          break
        case type.includes("KEY"):
          gql_type = "ID!"
          break
      }
      if (is_nullable!=undefined && !is_nullable) gql_type+="!"
      if (DEBUG_LEVEL > 1) console.log({field, type, gql_type, value, is_nullable})
      types_obj[type_name][field].gql_type = gql_type
    }
  }
  return types_obj
}

const to_type = (str) => {
  const str_len = str.endsWith('s') 
  ? str.length - 2
  : str.length - 1
  const type_name = str.charAt(0).toUpperCase() + str.substr(1,str_len)
  if (type_name.endsWith('ie')) return type_name.slice(0,-2)+'y'
  return type_name
}

export default async ({_id, username, password, host, port, database},userId) => {
  const types = {}
  const client = await mysql.createConnection({ host, user: username, password, port });

  const [db_rows] = await client.execute(get_dbs_query)
  const user_tables = db_rows.filter(({Database}) => !mysql_intrnal_databases.includes(Database))
  await Promise.all(user_tables.map(async ({Database: db_name}) => {
    const [tables] = await client.execute(get_all_tables(db_name))
    await Promise.all(tables.map(async ({table_name})=> {
      const [table_data] = await client.execute(get_table(table_name,db_name))
      if (!table_data[0]['View']) {
        if (DEBUG_LEVEL > 1) console.log({table_name})
        types[table_name] = {
          basedOnTable: table_name,
          typeName: to_type(table_name)
        }
        const creation_lines = table_data[0]['Create Table'].split('\n')
        creation_lines.forEach((create_line,index) => {
          switch(true) {
            case index==0:
            case (index==creation_lines.length-1):
              return
            case create_line.includes('CONSTRAINT'):
              const fkey = create_line.split(' ')
              const key_name = fkey[6].slice(2,-2)
              const f_table = fkey[8].slice(1,-1)
              const f_key = fkey[9].slice(2,-2)
              types[table_name][key_name] = {
                type: 'INDEX',
                value: to_type(f_table)
              }
              break
            case create_line.includes('UNIQUE'):
              if (DEBUG_LEVEL > 1) console.log({create_line})
              break
            case create_line.includes('PRIMARY KEY'):
              const keystring = create_line.substring(
                create_line.indexOf('(')+1,
                create_line.indexOf(')')
              ).split(',').map(v => v.slice(1,-1))
              if (DEBUG_LEVEL > 1) console.log(keystring)
              if (DEBUG_LEVEL > 1) console.log('----------->',{table_name, create_line})
              types[table_name].index = keystring
              break
            default:
              const line_array = create_line.split(' ')
              if (line_array[2] == 'KEY') {
                break
              }
              const column_name = line_array[2].slice(1,-1)
              const type = line_array[3]
              const is_nullable = !create_line.includes('NOT NULL')
              if (DEBUG_LEVEL > 1) console.log({column_name, type, is_nullable})
              if (type.includes('enum')) {
                types[table_name][column_name] = {
                  type: 'INDEX',
                  value: to_type(column_name)
                }
                const c =  type.substring(type.indexOf('(')+1, type.indexOf(')')).split(',').map(v => v.slice(1,-1))
                console.log({c, type})
                types[column_name] = {
                  basedOnTable: `${table_name}.${column_name}`,
                  typeName: to_type(column_name),
                  enum_values: type.substring(type.indexOf('(')+1, type.indexOf(')')).split(',').map(v => v.slice(1,-1))
                }
                break
              }
              if (types[table_name][column_name]?.type == 'INDEX') return
              types[table_name][column_name] = { type, is_nullable, udt_name:column_name }
          }
          return
        })
      }
    }))
  }))
  const gql_types = mysql_to_gql(types)
  for (let table_name in gql_types) {
    const { typeName, enum_values, basedOnTable, index, ...x} = gql_types[table_name]
    let fields = []
    if (enum_values) {
      fields = enum_values.map(e => {return {name: e}})
      if (DEBUG_LEVEL > 0) console.log({typeName, basedOnTable, index, fields: enum_values})
    } else {
      for (let f of Object.keys(x)) {
        fields.push({ name:f, ...gql_types[table_name][f] })
      }
      if (DEBUG_LEVEL > 0) console.log({typeName, basedOnTable, index, fields: Object.keys(x)})
    }
    Types.upsert(
      {
        db: _id,
        basedOnTable: table_name
      },
      {
        $set: {
          db: _id,
					index,
          basedOnTable,
          typeName,
          fields
        }
      }
    )
  }
  await client.end()
  return gql_types
}