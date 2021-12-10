import { MongoClient } from "mongodb";
import logger from "../util/logger";

// Replace the uri string with your MongoDB deployment's connection string.
const uri = process.env.DATABASE_URL || 'mongodb://127.0.0.1:27017';

const client = new MongoClient(uri);

async function run() { 
  try {
    await client.connect();
    logger.info('connected to db')
  } catch (e) {
    logger.error('failed to connect to db', e)
    await client.close();
  }
}
run()
  .catch(e => logger.error('there was an error connecting to DB', e));

export default client.db('golf-db');