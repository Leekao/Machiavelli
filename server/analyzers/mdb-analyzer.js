//const MongoClient = require('mongodb').MongoClient
//const fs = require('fs')

const get_type_name = (collection_name) => {
  let type = ''
  if (collection_name.charAt(collection_name.length-1) === "s") {
    type = collection_name.substr(0, collection_name.length-1)
  }
  type = type[0].toUpperCase() + type.substr(1)
  console.log({type})
  return type
}

const get_type = (self, value, name) => {
  let type = typeof(value)
  console.log({type, value})
  if (type === "boolean") {
    return "Boolean"
  }
  if (type === "number") {
    return "Int"
  }
  if (type === "string") {
    return "String"
  }
  if (type === "object") {
    if (value.length!=undefined) {
      if (value.length == 0) return false
      const sub_name = get_type_name(name)
      const sub_type = typeof(value[0])
      if (sub_type==="number") {
        return "[Int]"
      }
      if (sub_type==="string") {
        return "[String]"
      }
      if (sub_type==="object") {
        self(self, value[0], sub_name)
        return `[${sub_name}]`
      }
      return
    }
    if (value.getDate) {
      return
      return "Date"
    }
  }
}

const get_all_props = (self, obj) => {
  const properties = {_id: "ID!"}
  for (let x in obj) {
    if (x === "_id") continue
    const t = get_type(self, obj[x], x)
    if (t) properties[x] = get_type(self, obj[x], x)
  }
  return properties
}

export default async function ({
  _id,
  database,
  username,
  password,
  host,
  port,
}, userId) {
  const url = `mongodb://${username}:${password}@${host}:${port}/${database}`
  const client = new MongoClient(url,{
    useUnifiedTopology: true
  })
  await client.connect()
  const types = []
  const add_to_types = (self, name, props) => {types[get_type_name(name)] = get_all_props(self, props)}
  const db = client.db("test")
  const names = (await db.listCollections().toArray()).map(c => c.name)
  await promise.all(names.map(async (n) => {
    const d = await db.collection(n).findOne()
    if (!d) return
    add_to_types(add_to_types,n,d)
  })
  )
  return types
  await construct_schema(types)
}

const construct_schema = async (types) => {
  const ws = fs.createWriteStream('./schema.graphql', {flags: "w"})
  for (let name in types) {
    ws.write(`type ${name} { \n`)
    for (let prop_name in types[name]) {
      ws.write(`\t ${prop_name}: ${types[name][prop_name]} \n`)
    }
    ws.write(`}\n`)
  }
  ws.write(`type Query { \n`)
  for (let name in types) {
    ws.write(`\t get${name} (id: ID!): ${name}\n`)
    ws.write(`\t get${name}s: [${name}]\n`)
  }
  ws.write(`}`)
  ws.close()
}