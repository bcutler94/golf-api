import { AnyBulkWriteOperation, UpdateOneModel } from "mongodb";
import { v4 } from "uuid";
import { CourseModelObject } from "../models/course-model";
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


const processGolfers = async (course: CourseModelObject) => {
  let i = 1;
  const commands: AnyBulkWriteOperation<PlayerModel>[] = [];
  const collection = await playerModel.getPlayerCollection();
  while (true) {
    const ghinGolfers = await ghinApi.getClubGolfers(course.externalId, i);
    if (!ghinGolfers.length) break;
    for (const g of ghinGolfers) {
      const input = toPlayerModal(g);
      const command: UpdateOneModel<PlayerModel> = {
        filter: { externalId: input.externalId, lastName: input.lastName, clubName: input.clubName },
        update: { $set:toPlayerModal(g) },
        upsert: true
      }
      commands.push({ updateOne: command });      
    }
    i++
  }
  commands.length && await collection.bulkWrite(commands)
  logger.info(`successfully saved golfers for ${course.courseName}`)
}

export default {
  processGolfers
}