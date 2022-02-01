import { v4 } from "uuid";
import database from "./data-layer/database";
import courseModel from "./models/course-model";
import playerModel, { PlayerModel } from "./models/player-model";
import userModel from "./models/user-model";
import ghinApi, { GHINGolfer } from "./networking/ghin-api";
import processGolfers from "./pubsub/jobs/process-golfers";
import pubsub from "./pubsub/pubsub";
import contestHandler from "./route-handlers/contest-handler";
// import createContests from "./scripts/createContests";
import createUsers from "./scripts/createUsers";
import scoreHoles from "./scripts/scoreHole";
import scrapeCourses from "./scripts/scrapeCourses";
import scrapeGolfers from "./scripts/scrapeGolfers";
import logger from "./util/logger";




const scriptToRun = async () => {
  await database.startDB()
  await pubsub.startPubSub({ attachListeners: false })
  // insert here below here
  // const cc = await courseModel.getCourseCollection();
  // const cursor = await cc.aggregate([
  //   {
  //     '$group': {
  //       '_id': '$externalId', 
  //       'count': {
  //         '$sum': 1
  //       }
  //     }
  //   }, {
  //     '$sort': {
  //       'count': -1
  //     }
  //   }
  // ])
  // const externalIds = new Set<string> ()
  // await cursor.forEach(doc => {
  //   if (doc.count > 1) {
  //     externalIds.add(doc._id)
  //   }
  // })
  // for (const i of externalIds) {
  //   await cc.deleteOne({ externalId: i })
  // }


  // await createContests(['best-ball-match-play', 'singles-match-play'], true)
  // await scoreHoles('59cb1aa1-6cbc-4869-a475-74457bd41773', 0)
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