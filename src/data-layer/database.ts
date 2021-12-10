import { Db, MongoClient } from "mongodb";
import courseModel from "../models/course-model";
import logger from "../util/logger";

// Replace the uri string with your MongoDB deployment's connection string.
const uri = process.env.DATABASE_URL || 'mongodb://127.0.0.1:27017';

const client = new MongoClient(uri);
let db = client.db('golf-db');

const connect = async () => { 
  try {
    await client.connect();
    logger.info('connected to db')
  } catch (e) {
    logger.error('failed to connect to db', e)
    await client.close();
  }
}

const startDB = async () => {
  return await connect();
}

export default {
  startDB,
  db
}