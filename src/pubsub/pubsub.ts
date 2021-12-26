import Agenda, { DefineOptions, Job } from "agenda";
import database, { uri } from "../data-layer/database";
import os from 'os'
import logger from "../util/logger";
import processGolfers from "./jobs/process-golfers";

export const JOBS = {
  processGolfers: 'process-golfers'
}

const AGENDA_NAME = os.hostname + "-" + process.pid;
const CONCURRENCY = os.cpus().length;

interface PubSubJob {
  name: string
  pubsubjob(data: any): Promise<void>
  options: DefineOptions
}

const DEFAULT_OPTIONS = { 
  lockLimit: CONCURRENCY 
}

export const JOB_NAMES = {
  processGolfers: 'process-golfers'
}

const PUBSUBJOBS: PubSubJob[] = [
  {
    name: JOB_NAMES.processGolfers,
    pubsubjob: (data: any) => processGolfers(data),
    options: DEFAULT_OPTIONS
  }
]

const attachListeners = (agenda: Agenda) => {

  for (const { name, pubsubjob, options } of PUBSUBJOBS) {
    agenda.define(name, options || DEFAULT_OPTIONS, async (job: Job) => {
      try {
        const data = job.attrs.data;
        await pubsubjob(data)
        await job.remove()
      } catch (e) {
        logger.error(`There was an error running the job ${name}`, e)
      } 
    });
  }


  // Log job start and completion/failure
  agenda.on('start', (job) => {
    logger.info(`${AGENDA_NAME} Job <${job.attrs.name}> starting`);
  });
  agenda.on('success', (job) => {
    logger.info(`${AGENDA_NAME} Job <${job.attrs.name}> succeeded`);
  });
  agenda.on('fail', (error, job) => {
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
