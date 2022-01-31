import contestModel from "../models/contest-model"
import scorecardModel from "../models/scorecard-model";
import scorecardHandler from "../route-handlers/scorecard-handler";
import logger from "../util/logger";

const scoreHoles = async (contestId: string, holeIndex: number) => {
  const sc = await scorecardModel.getScorecardCollection();
  const scs = await sc.find({ contestId }).toArray();
  for (const s of scs) {
    await scorecardHandler.scoreHole(s.id, 1 + Math.floor(Math.random() * 7), holeIndex)
  }
  logger.info('done scoring hole')
}

export default scoreHoles