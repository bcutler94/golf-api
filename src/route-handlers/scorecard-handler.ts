import { v4 } from "uuid";
import contestModel from "../models/contest-model";
import courseModel from "../models/course-model";
import scorecardModel, { ScorecardModel } from "../models/scorecard-model";
import userModel from "../models/user-model";
import ghinApi from "../networking/ghin-api";
import logger from "../util/logger";

const createScorecard = async (userId: string, contestId: string, tees: string, gender: string, courseId: string): Promise<ScorecardModel> => {

  const user = await userModel.getUser(userId);
  if (!user) {
    logger.error('we couldnt find user when creating scorecard', userId)
    throw new Error ()
  }

  const { externalId } = await courseModel.getCourseById(courseId, { externalId: 1 })
  const courseTees = await ghinApi.getPlayerCourseHandicap(user.ghin, externalId);
  const courseTee = courseTees.find(tee => tee.name === tees && tee.gender === gender);
  const courseRatingInfo = courseTee?.ratings.find(rating => rating.tee_set_side.includes('18'));
  const courseHandicap = courseRatingInfo?.course_handicap;
  if (courseHandicap === undefined) {
    logger.warn('we couldnt find the courseHandicap for the user so we are defaulting to current', userId)
  }

  return await scorecardModel.createScorecard({
    id: v4(),
    type: 'player',
    tees,
    gender,
    courseId,
    scores: [],
    playerId: userId,
    contestId,
    courseHandicap: courseHandicap ?? user.currentHandicap
  })  
}

const getContestScorecard = async (contestId: string, playerId: string): Promise<ScorecardModel | null> => {
  return await scorecardModel.getContestScorecard(contestId, playerId)
}

export default {
  createScorecard,
  getContestScorecard
}