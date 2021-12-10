import { MongoClient } from "mongodb";
import courseModel from "../models/course-model";
import logger from "../util/logger";

// Replace the uri string with your MongoDB deployment's connection string.
const uri = process.env.DATABASE_URL || 'mongodb://127.0.0.1:27017';

const client = new MongoClient(uri);

const connect = async () => { 
  try {
    await client.connect();
    logger.info('connected to db')
  } catch (e) {
    logger.error('failed to connect to db', e)
    await client.close();
  }
}

const addAllIndexes = async () => {
  return Promise.all([
    courseModel.addIndexes()
  ])
}

const startDB = async () => {
  await connect();
  await addAllIndexes()
}

startDB();

export default client.db('golf-db');