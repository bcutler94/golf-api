import { v4 } from "uuid";
import database from "./data-layer/database";
import playerModel, { PlayerModel } from "./models/player-model";
import ghinApi, { GHINGolfer } from "./networking/ghin-api";
import processGolfers from "./pubsub/jobs/process-golfers";
import pubsub from "./pubsub/pubsub";
import createContests from "./scripts/createContests";
import scrapeCourses from "./scripts/scrapeCourses";
import scrapeGolfers from "./scripts/scrapeGolfers";
import logger from "./util/logger";



const scriptToRun = async () => {
  await database.startDB()
  await pubsub.startPubSub({ attachListeners: false })
  // insert here below here
  // await processGolfers({ course: { externalId: '3137', courseName: 'Waynesborough' }})

  await ghinApi.getClubGolfers('3137', 1)

}

const start = async () => {
  console.time('random')
  await scriptToRun()
  logger.info('done running rando')
  console.timeEnd('random')
}

start()

export default start