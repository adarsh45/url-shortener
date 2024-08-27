let db;

function getDB() {
  if (!db) {
    db = {};
  }
  return db;
}

const DB = getDB();

export default DB;
