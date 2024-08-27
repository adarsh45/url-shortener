import Fastify from "fastify";

const app = Fastify({
  logger: true,
});

const DB = {};

app.post("/shorten", async (request, reply) => {
  const body = request.body;
  const {
    long_url: longURL,
    ttl_seconds: ttlSeconds = 120,
    custom_alias: customAlias,
  } = body;

  let alias = customAlias;

  if (alias && DB[alias]) {
    reply
      .code(400)
      .send({ success: false, message: "Provided alias already exists!" });
    return;
  }

  if (!alias) {
    alias = generateRandomAlias(5);
  }

  const success = createNewAlias(alias, ttlSeconds, longURL);

  if (!success) {
    reply.code(500).send({
      success: false,
      message: "Something went wrong!",
    });
    return;
  }

  reply.code(200).send({
    short_url: alias,
  });
});

function createNewAlias(alias, ttlSeconds, longURL) {
  const record = {
    createdAt: new Date(),
    ttlSeconds,
    longURL,
    analyticsData: {
      accessCount: 0,
      accessTimes: [],
    },
  };

  DB[alias] = record;

  return true;
}

function generateRandomAlias(len = 5) {
  const aliasCharLibrary = "abcdefghijklmnopqrstuvwxyz";
  let randomAlias = "";
  for (let i = 0; i < len; i++) {
    const randomIndex = Math.floor(Math.random() * aliasCharLibrary.length);
    const randomChar = aliasCharLibrary.charAt(randomIndex);
    randomAlias += randomChar;
  }

  return randomAlias;
}

// GET long url
app.get("/:alias", async (request, reply) => {
  const { alias } = request.params;

  const currentTime = new Date();

  processPassiveDeletion(alias, currentTime);

  const { code, message, data } = getLongURLForAlias(alias, currentTime);

  if (code === 302) {
    return reply.redirect(data);
  }

  reply.code(code).send({ message });
});

function getLongURLForAlias(alias, currentTime) {
  console.log(DB);

  if (!DB[alias]) {
    return { code: 404, message: "Alias does not exist or has expired" };
  }
  const record = DB[alias];

  console.log("RECORD:", record);

  const accessTimesList = record.analyticsData.accessTimes;
  accessTimesList.push(currentTime);

  const updatedRecord = {
    ...record,
    analyticsData: {
      accessCount: record.analyticsData.accessCount + 1,
      accessTimes: accessTimesList,
    },
  };

  DB[alias] = updatedRecord;

  return {
    code: 302,
    message: "Original URL found successfully!",
    data: record.longURL,
  };
}

// GET analytics
app.get("/analytics/:alias", async (request, reply) => {
  const { alias } = request.params;

  const currentTime = new Date();
  processPassiveDeletion(alias, currentTime);

  const record = DB[alias];

  if (!record) {
    return reply
      .code(404)
      .send({ success: false, message: "Alias does not exists!" });
  }

  const analytics = record.analyticsData;

  const response = {
    alias,
    long_url: record.longURL,
    access_count: analytics.accessCount,
    access_times: analytics.accessTimes,
  };

  reply.code(200).send(response);
});

const freshAnalyticsData = {
  accessCount: 0,
  accessTimes: [],
};

// PUT update alias and TTL
app.put("/update/:alias", async (request, reply) => {
  const { alias } = request.params;
  // TODO: should we accept 0 for TTL ?
  const { custom_alias: newAlias, ttl_seconds: newTTL } = request.body;

  const currentTime = new Date();
  processPassiveDeletion(alias, currentTime);

  const record = DB[alias];

  if (!record) {
    return reply
      .code(404)
      .send({ success: false, message: "Alias does not exists!" });
  }

  const updatedRecord = {
    ...record,
    ttlSeconds: newTTL ?? record.ttlSeconds,
    analyticsData: freshAnalyticsData,
  };

  if (newAlias) {
    delete DB[alias];
    DB[newAlias] = updatedRecord;
  } else {
    DB[alias] = updatedRecord;
  }

  // TODO: to reduce the payload size, should we send success-no-content response with no-content?
  reply.code(200).send({
    success: true,
    data: { ...updatedRecord, alias: newAlias ?? alias },
  });
});

// DELETE delete alias
app.delete("/delete/:alias", async (request, reply) => {
  const { alias } = request.params;
  const record = DB[alias];
  if (!record) {
    return reply
      .code(404)
      .send({ success: false, message: "Alias does not exists!" });
  }
  delete DB[alias];

  reply
    .code(200)
    .send({ success: true, message: "Alias deleted successfully!" });
});

function processPassiveDeletion(alias, currentTime = new Date()) {
  const record = DB[alias];
  if (!record) return;

  const ttlSeconds = record.ttlSeconds;
  const creationTime = record.createdAt;

  const currentTimeSeconds = currentTime.getSeconds();
  const creationTimeSeconds = creationTime.getSeconds();

  const difference = currentTimeSeconds - creationTimeSeconds;
  const isExpired = difference > ttlSeconds;

  if (!isExpired) return;

  delete DB[alias];
}

async function run() {
  try {
    await app.listen({ port: 3001 });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

run();
