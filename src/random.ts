import { v4 } from "uuid";
import database from "./data-layer/database";
import courseModel, { getCourseCollection } from "./models/course-model";
import playerModel, { PlayerModel } from "./models/player-model";
import ghinApi, { GHINGolfer } from "./networking/ghin-api";
import logger from "./util/logger";

const toPlayerModal = (ghinGolfer: GHINGolfer): PlayerModel => {
  return {
    id: v4(),
    firstName: ghinGolfer.first_name,
    lastName: ghinGolfer.last_name,
    fullName: ghinGolfer.player_name || `${ghinGolfer.first_name} ${ghinGolfer.last_name}`,
    clubName: ghinGolfer.club_name,
    currentHandicap: ghinGolfer.hi_value
  }
}

const scrapeGolfers = async () => {
  const collection = await getCourseCollection();
  const cursor = await collection.find({});
  while (await cursor.hasNext()) {
    const course = await cursor.next();
    if (!course) continue;
    let i = 1;
    while (true) {
      const ghinGolfers = await ghinApi.getClubGolfers(course.externalId, i);
      if (!ghinGolfers.length) break;
      const collection = await playerModel.getPlayerCollection();
      await collection.insertMany(ghinGolfers.map(g => toPlayerModal(g)))
      i++
    }
    logger.info('done scrapping golfers for ', course.courseName)
  }
}
  




const scriptToRun = async () => {
  await database.startDB()
  // insert here below here


  await scrapeGolfers()

}

console.time('random')
scriptToRun()
  .then(() => {
    logger.info('done running rando')
    console.timeEnd('random')
  })