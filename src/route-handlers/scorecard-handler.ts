import { v4 } from "uuid";
import contestModel from "../models/contest-model";
import courseModel from "../models/course-model";
import scorecardModel, { HoleScore, ScorecardModel } from "../models/scorecard-model";
import userModel from "../models/user-model";
import ghinApi from "../networking/ghin-api";
import logger from "../util/logger";

const createScorecard = async (userId: string, contestId: string, tees: string, gender: string, courseId: string): Promise<ScorecardModel> => {

  const user = await userModel.getUser(userId);
  if (!user) {
    logger.error('we couldnt find user when creating scorecard', userId)
    throw new Error ()
  }

  const { externalId, teeInfo } = await courseModel.getCourseById(courseId, { externalId: 1, teeInfo: 1 })
  const courseTees = await ghinApi.getPlayerCourseHandicap(user.ghin, externalId);
  logger.info('coursetees', courseTees)
  const courseTee = courseTees?.find(tee => tee.name === tees && tee.gender === gender);
  const courseRatingInfo = courseTee?.ratings.find(rating => rating.tee_set_side.includes('18'));
  const courseHandicap = courseRatingInfo?.course_handicap;
  if (courseHandicap === undefined) {
    logger.warn('we couldnt find the courseHandicap for the user so we are defaulting to current', userId)
  }

  const courseTeeInfo = teeInfo.find(tee => tee.name === tees && tee.gender === gender);
  if (!courseTeeInfo) {
    logger.error('cant find tee info for course', userId, contestId, tees, gender, courseId)
    throw new Error()
  }

  // Course Handicap = Handicap Index × (Slope Rating ÷ 113) + (Course Rating – Par)

  logger.info('coursetee info', courseTeeInfo)

  // calculate shots given per hole
  const userCourseHandicap = (courseHandicap ?? Math.ceil(user.currentHandicap)) || 0
  let userCH = userCourseHandicap;
  const scores: HoleScore[] = courseTeeInfo.holeInfo.map(() => {
    return {
      netStrokes: 0,
      grossStrokes: 0,
      shotsGiven: 0
    }
  })
  let idx = 0;
  while (userCH !== 0) {
    logger.info('userch', userCH, idx)
    const { handicap } = courseTeeInfo.holeInfo[idx];
    if (userCourseHandicap > 0 && handicap <= userCourseHandicap) {
      scores[idx].shotsGiven = scores[idx].shotsGiven + 1
      userCH--
    } else if (userCourseHandicap > 0 && handicap <= Math.abs(userCourseHandicap)) {
      scores[idx].shotsGiven = scores[idx].shotsGiven - 1
      userCH++
    }
    idx = idx % 17 + 1
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

const scoreHole = async (scorecardId: string, score: number, holeIndex: number) => {
  return await scorecardModel.scoreHole(scorecardId, score, holeIndex)
}

export default {
  createScorecard,
  getContestScorecard,
  scoreHole
}