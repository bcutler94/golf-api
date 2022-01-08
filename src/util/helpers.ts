import { FastifyRequest } from "fastify"
import logger from "./logger"

const arrayToRegex = (arr: Array<string>) => {
  return new RegExp(arr.join("|"), 'gi').source
}

const safeHandler = (handler: () => any) => async (req: FastifyRequest) => {
  try {
    const res = await handler();
    logger.info(`SUCCESS ${req.routerPath}`);
    return res;
  } catch (e) {
    logger.error(`ERROR ${req.routerPath}`, e)
  }
}


export default {
  arrayToRegex,
  safeHandler
}