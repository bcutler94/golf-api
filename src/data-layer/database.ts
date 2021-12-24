import { Db, MongoClient } from "mongodb";
import logger from "../util/logger";

// Replace the uri string with your MongoDB deployment's connection string.
const uri = process.env.DATABASE_URL || 'mongodb://127.0.0.1:27017';

let db: Db;

const connect = async (): Promise<MongoClient> => { 
  const client = new MongoClient(uri);
  try {
    await client.connect();
    return client
  } catch (e) {
    logger.error('failed to connect to db', e)
    await client.close();
    throw e;
  }
}

const GOLF_DB = process.env.GOLF_DB || 'golf-db';

const getGolfDB = async (): Promise<Db> => {
  if (db) return db;
  const client = await connect()
  logger.info('connected to db')
  db = client.db(GOLF_DB);
  return db
}

const startDB = async () => {
  return await connect();
}

export default {
  startDB,
  getGolfDB
}