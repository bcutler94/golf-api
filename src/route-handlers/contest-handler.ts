import { v4 } from "uuid"
import contestModel, { ContestModel, ContestModelObject, ContestViews, ContestViewTypes, Individual, MatchPlayResults, Participants, ParticipantTypes, Results, ResultTypes, Team } from "../models/contest-model"
import { POSTContestRoute } from "../routers/contest-router"

const getResults = (resultType: ResultTypes): Results[ResultTypes] => {
  switch (resultType) {
    case 'match-play':
      return {
        resultType,
        winningScorecardId: '',
        holesPlayed: 0,
        score: 'AS'
      }
    default:
      throw new Error ('There was an error creating contest [resultType]')
  }
}


const getParticipants = (participantType: ParticipantTypes, participantIds: Array<string>): Participants[ParticipantTypes] => {
  switch (participantType) {
    case 'individual':
      return {
        participantType: 'individual',
        homePlayerId: null,
        userIds: participantIds
      }
    case 'team':
      return {
        participantType: 'team',
        homeTeamId: null,
        teamIds: participantIds
      }
    default:
        throw new Error ('There was an error creating contest [participantType]')
  }
}

const createContest = async (userId: string, contest: POSTContestRoute['Body']): Promise<string> => {

  const { scoringType, teeTime, courseId, resultType, participantType, participantIds, payoutId, name } = contest

  return await contestModel.createContest({
    adminId: userId,
    name,
    scoringType,
    status: 'queued',
    id: v4(),
    teeTime,
    courseId,
    scorecardIds: [],
    results: getResults(resultType),
    participants: getParticipants(participantType, participantIds),
    parentContestId: null,
    payoutId
  })
}

const getContest = async (contestId: string): Promise<ContestModelObject<ResultTypes, ParticipantTypes>> => {
  return await contestModel.getContest(contestId)
}

const getUserContests = async <T extends ContestViewTypes>(userId: string, view: T): Promise<ContestViews[T][]> => {
  const cursor = await contestModel.getUserContests(userId, view);
  return cursor.toArray()
}

export default {
  createContest,
  getContest,
  getUserContests
}