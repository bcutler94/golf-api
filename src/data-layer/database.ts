import { Db, MongoClient } from "mongodb";
import logger from "../util/logger";

// Replace the uri string with your MongoDB deployment's connection string.
export const uri = process.env.DATABASE_URL || 'mongodb://localhost:27017?replicaSet=rs0';

let client: MongoClient;

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
  const client = await getClient()
  return client.db(GOLF_DB)
}

const getClient = async (): Promise<MongoClient> => {
  if (client) return client;
  client = await connect()
  logger.info('connected to db')
  return client;
}

const startDB = async () => {
  return await connect();
}

export default {
  startDB,
  getGolfDB,
  getClient
}