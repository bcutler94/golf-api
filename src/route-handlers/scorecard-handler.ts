import scorecardModel, { ScorecardModel } from "../models/scorecard-model";

const setTees = async (scorecardId: string, tees: string, gender: string): Promise<ScorecardModel> => {
  return await scorecardModel.setTees(scorecardId, tees, gender)
}

export default {
  setTees
}