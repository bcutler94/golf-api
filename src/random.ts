import { v4 } from "uuid";
import database from "./data-layer/database";
import courseModel from "./models/course-model";
import playerModel, { PlayerModel } from "./models/player-model";
import userModel from "./models/user-model";
import ghinApi, { GHINGolfer } from "./networking/ghin-api";
import processGolfers from "./pubsub/jobs/process-golfers";
import pubsub from "./pubsub/pubsub";
import contestHandler from "./route-handlers/contest-handler";
import createContests from "./scripts/createContests";
import createUsers from "./scripts/createUsers";
import scoreHoles from "./scripts/scoreHole";
import scrapeCourses from "./scripts/scrapeCourses";
import scrapeGolfers from "./scripts/scrapeGolfers";
import logger from "./util/logger";




const scriptToRun = async () => {
  await database.startDB()
  await pubsub.startPubSub({ attachListeners: false })


  // await createUsers(100)

  // await createContests(['best-ball-match-play', 'singles-match-play'], true)
  await scoreHoles('92663166-c857-48a6-a55a-f1a0077c7ec9', 0)
}

const start = async () => {
  console.time('random')
  await scriptToRun()
  logger.info('done running rando')
  console.timeEnd('random')
}

start()
  .then(() => process.exit(1))

export default start