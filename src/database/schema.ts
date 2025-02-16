import { db } from "./client";

export async function fetchSchemas() {
  const collections = await db.listCollections().toArray();

  const schemaMap: Record<string, any> = {};

  for (const col of collections) {
    const name = col.name;
    const sample = await db.collection(name).findOne();

    if (sample) {
      schemaMap[name] = inferSchemaFromDocument(sample);
    }
  }

  return schemaMap;
}

function inferSchemaFromDocument(doc: Record<string, any>) {
  const schema: Record<string, string> = {};
  for (const key in doc) {
    const value = doc[key];
    schema[key] = typeof value;
  }
  return schema;
}
