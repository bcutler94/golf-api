import { v4 } from "uuid"
import contestModel, { ChildContest, ContestModelObject, ContestStatuses, ContestViews, ContestViewTypes, ParentContest, ParticipantTypes, ResultTypes, ScoringTypes, SingleContest} from "../models/contest-model"
import { Contest, ContestPlayer, POSTContestRoute } from "../routers/contest-router"

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

const getUserContests = async <T extends ContestViewTypes>(userId: string, view: T): Promise<ContestViews[T][]> => {
  const cursor = await contestModel.getUserContests(userId, view);
  return cursor.toArray()
}

export default {
  createContests,
  getContest,
  getUserContests
}