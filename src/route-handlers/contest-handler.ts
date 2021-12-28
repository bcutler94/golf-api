import { v4 } from "uuid"
import contestModel, { ChildContest, ContestModelObject, ContestTypes, ContestViews, ContestViewTypes, ContestWithChildren, ParentContest, ParticipantTypes, ResultTypes, SingleContest} from "../models/contest-model"
import { Contest } from "../routers/contest-router"

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
      participants: parentContest.participants,
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
        participantType: contest.participantType,
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
      leaderboardId: null
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

export default {
  createContests,
  getContest,
  getUserContests,
  getChildContests
}