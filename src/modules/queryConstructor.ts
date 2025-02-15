export function constructMongoQuery(parsed: any) {
  const query: any = {};
  parsed.conditions?.forEach((cond: any) => {
    query[cond.field] = { [cond.operator]: cond.value };
  });

  return { collection: parsed.collection, query };
}
