import DB from "./db.js";
import { DEFAULT_ALIAS_LENGTH, FRESH_ANALYTICS_DATA } from "./static.js";

function createNewAlias(alias, ttlSeconds, longURL) {
  const record = {
    createdAt: new Date(),
    ttlSeconds,
    longURL,
    analyticsData: FRESH_ANALYTICS_DATA,
  };

  DB[alias] = record;

  return true;
}

function generateRandomAlias(len = DEFAULT_ALIAS_LENGTH) {
  const aliasCharLibrary = "abcdefghijklmnopqrstuvwxyz";
  let randomAlias = "";
  for (let i = 0; i < len; i++) {
    const randomIndex = Math.floor(Math.random() * aliasCharLibrary.length);
    const randomChar = aliasCharLibrary.charAt(randomIndex);
    randomAlias += randomChar;
  }

  return randomAlias;
}

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

function getLongURLForAlias(alias, currentTime) {
  if (!DB[alias]) {
    return { code: 404, message: "Alias does not exist or has expired" };
  }
  const record = DB[alias];

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

export {
  createNewAlias,
  generateRandomAlias,
  processPassiveDeletion,
  getLongURLForAlias,
};
