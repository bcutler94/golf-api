import { v4 } from "uuid"
import database from "../data-layer/database";
import contestModel, { ChildContest, ContestModelObject, ContestTypes, ContestViews, ContestViewTypes, ContestWithChildren, ParentContest, ParticipantTypes, ResultTypes, SingleContest} from "../models/contest-model"
import { CourseModel } from "../models/course-model";
import scorecardModel, { ScorecardModel } from "../models/scorecard-model";
import { Contest } from "../routers/contest-router"
import logger from "../util/logger";

const createContests = async (userId: string, contests: Contest[]) => {

  if (contests.length > 1) {

    const [ parentContest, ...childrenContests ] = contests;

    const parentContestId = v4();

    const parentContestInput: ParentContest = {
      type: 'parent',
      id: parentContestId,
      adminId: userId,
      name: parentContest.name,
      participantType: parentContest.participantType,
      teams: parentContest.teams,
      players: parentContest.players,
      childContestIds: [],
      status: 'queued',
      leaderboardId: null
    }

    const childrenContestInputs: ChildContest[] = childrenContests.map(contest => {
      const id = v4();
      parentContestInput.childContestIds.push(id);
      return {
        type: 'child',
        id,
        status: 'queued',
        adminId: userId,
        courseId: contest.course.id,
        name: contest.name,
        parentContestId,
        resultType: contest.resultType,
        scoringType: contest.scoringType,
        leaderboardId: null,
      }
    });

    return await contestModel.createContests([ parentContestInput, ...childrenContestInputs ])

  } else {

    const [ singleContest ] = contests;

    const singleContestInput: SingleContest = {
      type: 'single',
      id: v4(),
      status: 'queued',
      adminId: userId,
      name: singleContest.name,
      courseId: singleContest.course.id,
      participantType: singleContest.participantType,
      resultType: singleContest.resultType,
      scoringType: singleContest.scoringType,
      leaderboardId: null,
      teams: singleContest.teams,
      players: singleContest.players,
    }

    return await contestModel.createContests([ singleContestInput ]);

  }
}

const getContest = async (contestId: string): Promise<ContestModelObject<ResultTypes, ParticipantTypes>> => {
  return await contestModel.getContest(contestId)
}

const getUserContests = async <T extends ContestViewTypes>(userId: string, contestTypes: ContestTypes[], view: T): Promise<ContestViews[T][]> => {
  const cursor = await contestModel.getUserContests(userId, contestTypes, view);
  return cursor.toArray()
}

const getChildContests = async (contestId: string): Promise<ContestWithChildren> => {
  const cursor = await contestModel.getChildContests(contestId);
  const [ contestWithChildren ] = await cursor.toArray();
  return contestWithChildren
}

const startContest = async (contestId: string): Promise<void> => {
  const client = await database.getClient();
  const session = client.startSession();
  try {
    // this doesn't need to be transaction but i thought it might have to be so im just leaving this for now
    await session.withTransaction( async () => {

      const contestCollection = await contestModel.getContestCollection();

      // get contest status to make sure we can do shit with it
      const contest = await contestCollection.findOne({ id: contestId }, { session })
      if (!contest) {
        logger.error(`this contest [${contestId}] doesn't exist`)
        await session.abortTransaction()
        return null;
      }
      if (contest.status !== 'queued') {
        logger.error(`this contest [${contestId}] doesnt't have a status of queued so we can't start it`)
        await session.abortTransaction()
        return null;
      }
      if (contest.type === 'parent') {
        logger.error(`this contest [${contestId}] can't start because it's a parent contest`)
        await session.abortTransaction()
        return null;
      }

      
      if (contest.type === 'child') {

        // TODO make sure that no other children contests are active

        // make parent contest active
        const { modifiedCount } = await contestCollection.updateOne({ id: contest.parentContestId }, { $set: { status: 'active' } }, { session });
        if (!modifiedCount) {
          await session.abortTransaction();
          logger.info(`this contest [${contestId}] error when updating the status`)
          return null
        }
      }
      // make contest active
      const { modifiedCount } = await contestCollection.updateOne({ id: contestId }, { $set: { status: 'active' } }, { session });
      if (!modifiedCount) {
        await session.abortTransaction();
        logger.info(`this contest [${contestId}] error when updating the status`)
        return null
      }

    });
  } catch (e) {
    logger.error('there was an error committing session to create contest', e);
    throw e
  } finally {
    await session.endSession()
  }
}

const getScorecard = async (contestId: string, userId: string): Promise<ScorecardModel | null> => {
  return await scorecardModel.getScorecard(contestId, userId)
}

const createScorecard = async (contestId: string, userId: string): Promise<ScorecardModel> => {
  const courseId = await contestModel.getCourseId(contestId);
  const scorecardInput: ScorecardModel = {
    id: v4(),
    participantId: userId,
    type: 'individual',
    contestId,
    scores: [],
    tees: null,
    courseHandicap: null,
    gender: null,
    courseId
  }
  return await scorecardModel.createScorecard(scorecardInput)
}

const getCourse = async (contestId: string): Promise<CourseModel> => {
  return await contestModel.getContestCourse(contestId)
}

export default {
  createContests,
  getContest,
  getUserContests,
  getChildContests,
  startContest,
  getScorecard,
  createScorecard,
  getCourse
}