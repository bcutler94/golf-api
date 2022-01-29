import contestModel from "../models/contest-model"
import scorecardModel from "../models/scorecard-model";
import scorecardHandler from "../route-handlers/scorecard-handler";

const scoreHoles = async (contestId: string, holeIndex: number) => {
  const sc = await scorecardModel.getScorecardCollection();
  const scs = await sc.find({ contestId }).toArray();
  await Promise.all(
    scs.map(card => scorecardHandler.scoreHole(card.id, 1 + Math.floor(Math.random() * 7), holeIndex))
  )
}

export default scoreHoles