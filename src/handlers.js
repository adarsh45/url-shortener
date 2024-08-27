import DB from "./db.js";
import { BASE_URL, DEFAULT_TTL, FRESH_ANALYTICS_DATA } from "./static.js";
import {
  createNewAlias,
  generateRandomAlias,
  getLongURLForAlias,
  processPassiveDeletion,
} from "./utils.js";

async function shortenURLHandler(request, reply) {
  const body = request.body;
  const {
    long_url: longURL,
    ttl_seconds: ttlSeconds = DEFAULT_TTL,
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
    alias = generateRandomAlias();
  }

  const success = createNewAlias(alias, ttlSeconds, longURL);

  if (!success) {
    reply.code(500).send({
      success: false,
      message: "Something went wrong!",
    });
    return;
  }

  const shortURL = `${BASE_URL}/${alias}`;

  reply.code(200).send({
    short_url: shortURL,
  });
}

async function getLongUrl(request, reply) {
  const { alias } = request.params;

  const currentTime = new Date();

  processPassiveDeletion(alias, currentTime);

  const { code, message, data } = getLongURLForAlias(alias, currentTime);

  if (code === 302) {
    return reply.redirect(data);
  }

  reply.code(code).send({ message });
}

async function getAnalyticsHandler(request, reply) {
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
}

async function updateAliasHandler(request, reply) {
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
    analyticsData: FRESH_ANALYTICS_DATA,
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
    data: { ttlSeconds: updatedRecord.ttlSeconds, alias: newAlias ?? alias },
  });
}

async function deleteAliasHandler(request, reply) {
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
}

export {
  shortenURLHandler,
  getLongUrl,
  getAnalyticsHandler,
  updateAliasHandler,
  deleteAliasHandler,
};
