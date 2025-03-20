import { Collection, ObjectId } from "mongodb";

export interface MongoFieldSchema {
  field: string;
  type: string;
  subFields?: MongoFieldSchema[];
}

export interface MongoCollectionSchema {
  collection: string;
  fields: MongoFieldSchema[];
  count: number;
  indexes?: unknown[];
}

export function inferSchemaFromValue(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  if (value instanceof Date) return "date";
  if (value instanceof ObjectId) return "objectId"; // Detects MongoDB ObjectId
  if (typeof value === "object") return "object";
  return typeof value; //string, int, boolean
}

export function inferSchemaFromDocument(
  doc: Record<string, unknown>,
  parentPath = ""
): MongoFieldSchema[] {
  const schema: MongoFieldSchema[] = [];

  for (const [key, value] of Object.entries(doc)) {
    const fieldPath = parentPath ? `${parentPath}.${key}` : key;
    const fieldType = inferSchemaFromValue(value);
    const field: MongoFieldSchema = {
      field: fieldPath,
      type: fieldType,
    };

    if (fieldType === "object" && value !== null) {
      field.subFields = inferSchemaFromDocument(
        value as Record<string, unknown>,
        fieldPath
      );
    } else if (
      fieldType === "array" &&
      Array.isArray(value) &&
      value.length > 0
    ) {
      const arrayType = inferSchemaFromValue(value[0]);

      if (arrayType === "object") {
        field.subFields = inferSchemaFromDocument(
          value[0] as Record<string, unknown>,
          `${fieldPath}[]`
        );
      }
    }

    schema.push(field);
  }

  return schema;
}

export async function buildCollectionSchema(
  collection: Collection,
  sampleSize = 100
): Promise<MongoCollectionSchema> {
  const docs = (await collection
    .find({})
    .limit(sampleSize)
    .toArray()) as Record<string, unknown>[];

  const count = await collection.countDocuments();
  const indexes = await collection.indexes();

  const fieldSchemas = new Map<string, Set<string>>();
  const requiredFields = new Set<string>();

  docs.forEach((doc) => {
    const docSchema = inferSchemaFromDocument(doc);

    docSchema.forEach((field) => {
      if (!fieldSchemas.has(field.field)) {
        fieldSchemas.set(field.field, new Set());
      }

      fieldSchemas.get(field.field)!.add(field.type);
      requiredFields.add(field.field);
    });
  });

  docs.forEach((doc) => {
    const docFields = new Set(Object.keys(doc));

    for (const field of requiredFields) {
      if (!docFields.has(field)) {
        requiredFields.delete(field);
      }
    }
  });

  const fields: MongoFieldSchema[] = Array.from(fieldSchemas.entries()).map(
    ([field, types]) => ({
      field,
      type:
        types.size === 1
          ? types.values().next().value ?? "unknown"
          : Array.from(types).join("|"),
      isRequired: requiredFields.has(field),
    })
  );

  return {
    collection: collection.collectionName,
    fields,
    count,
    indexes,
  };
}
