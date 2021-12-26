import Agenda, { Job } from "agenda";
import database, { uri } from "../data-layer/database";
import os from 'os'
import logger from "../util/logger";
import jobs from "./jobs";

export const JOBS = {
  processGolfers: 'process-golfers'
}

const AGENDA_NAME = os.hostname + "-" + process.pid;
const CONCURRENCY = os.cpus().length;

const attachListeners = (agenda: Agenda) => {

  agenda.define(JOBS.processGolfers, { concurrency: CONCURRENCY, lockLimit: CONCURRENCY }, async (job: Job) => {
    const data = job.attrs.data;
    if (!data) throw new Error ('no course data')
    await jobs.processGolfers(data.course)
    await job.remove()
  });

  // Log job start and completion/failure
  agenda.on('start:process-golfers', (job) => {
    logger.info(`${AGENDA_NAME} Job <${job.attrs.name}> starting`);
  });
  agenda.on('success:process-golfers', (job) => {
    logger.info(`${AGENDA_NAME} Job <${job.attrs.name}> succeeded`);
  });
  agenda.on('fail:process-golfers', (error, job) => {
    logger.error(`${AGENDA_NAME} Job <${job.attrs.name}> failed:`, error);
  });


}

interface Connect {
  attachListeners: boolean
}

const connect = async (options: Connect) => {

  const mongo = await database.getGolfDB();

  const agenda = new Agenda({ 
    mongo, 
    defaultConcurrency: CONCURRENCY, 
    maxConcurrency: CONCURRENCY,
    processEvery: '1 second',
    name: AGENDA_NAME
  });
  await agenda.start();
  options.attachListeners && attachListeners(agenda)
  logger.info(`${AGENDA_NAME} connected to pub sub`)
  return agenda;
}



const startPubSub = async (options: Connect) => {
  return await connect(options);
}

let agenda: Agenda | undefined;

const getPubSub = async () => {
  if (agenda) return agenda;
  agenda = await connect({ attachListeners: false })
  logger.info('started pub sub')
  return agenda
}

export default {
  startPubSub,
  getPubSub
}
