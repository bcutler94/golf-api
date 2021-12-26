import { v4 } from "uuid";
import database from "./data-layer/database";
import courseModel, { getCourseCollection } from "./models/course-model";
import playerModel, { PlayerModel } from "./models/player-model";
import ghinApi, { GHINGolfer } from "./networking/ghin-api";
import pubsub from "./pubsub/pubsub";
import scrapeCourses from "./scripts/scrapeCourses";
import scrapeGolfers from "./scripts/scrapeGolfers";
import logger from "./util/logger";



const scriptToRun = async () => {
  await database.startDB()
  await pubsub.startPubSub({ attachListeners: false })
  // insert here below here

  await scrapeGolfers()
  // await scrapeCourses.runV2()

}

const start = async () => {
  console.time('random')
  await scriptToRun()
  logger.info('done running rando')
  console.timeEnd('random')
}

export default start