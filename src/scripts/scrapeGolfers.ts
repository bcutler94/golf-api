import { v4 } from "uuid";
import { getCourseCollection } from "../models/course-model";
import playerModel, { PlayerModel } from "../models/player-model";
import ghinApi, { GHINGolfer } from "../networking/ghin-api";
import logger from "../util/logger";

const toPlayerModal = (ghinGolfer: GHINGolfer): PlayerModel => {
  return {
    id: v4(),
    firstName: ghinGolfer.first_name,
    lastName: ghinGolfer.last_name,
    fullName: ghinGolfer.player_name || `${ghinGolfer.first_name} ${ghinGolfer.last_name}`,
    clubName: ghinGolfer.club_name,
    currentHandicap: ghinGolfer.hi_value,
    externalId: ghinGolfer.id || null
  }
}

const scrapeGolfers = async () => {
  const collection = await getCourseCollection();
  const cursor = await collection.find({}).addCursorFlag('exhaust', true)
  while (await cursor.hasNext()) {
    const course = await cursor.next();
    if (!course) continue;
    let i = 1;
    while (true) {
      const ghinGolfers = await ghinApi.getClubGolfers(course.externalId, i);
      if (!ghinGolfers.length) break;
      const collection = await playerModel.getPlayerCollection();
      for (const g of ghinGolfers) {
        const input = toPlayerModal(g);
        await collection.findOneAndReplace({ externalId: input.externalId, lastName: input.lastName, clubName: input.clubName }, toPlayerModal(g), { upsert: true })
      }
      i++
    }
    logger.info('done scrapping golfers for ', course.courseName)
  }
}

export default scrapeGolfers;
  