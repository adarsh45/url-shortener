const shortenURLRequestSchema = {
  body: {
    $id: "shortenURLRequestSchemaBody",
    type: "object",
    required: ["long_url"],
    properties: {
      custom_alias: { type: "string" },
      ttl_seconds: { type: "number" },
      long_url: { type: "string" },
    },
  },
};

const aliasInParamsSchema = {
  $id: "aliasInParamsSchema",
  type: "object",
  required: ["alias"],
  properties: {
    alias: { type: "string" },
  },
};

const getLongURLSchema = {
  params: aliasInParamsSchema,
};

const getAnalyticsSchema = {
  params: aliasInParamsSchema,
};

const updateAliasSchema = {
  params: aliasInParamsSchema,
};

const deleteAliasSchema = {
  params: aliasInParamsSchema,
};

export {
  shortenURLRequestSchema,
  getLongURLSchema,
  updateAliasSchema,
  getAnalyticsSchema,
  deleteAliasSchema,
};
