import { configDotenv } from "dotenv";
configDotenv();

const BASE_URL = process.env.BASE_URL;

const FRESH_ANALYTICS_DATA = {
  accessCount: 0,
  accessTimes: [],
};

const DEFAULT_ALIAS_LENGTH = 5;

const DEFAULT_TTL = 120;

export { BASE_URL, FRESH_ANALYTICS_DATA, DEFAULT_ALIAS_LENGTH, DEFAULT_TTL };
