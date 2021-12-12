import { v4 } from "uuid"
import contestModel, { ContestModel, ContestModelObject, ContestTypes, Individual, MatchPlayResults, Participants, ParticipantTypes, Results, ResultTypes, Team } from "../models/contest-model"
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
        playerIds: participantIds
      }
    case 'team':
      return {
        participantType: 'team',
        teamIds: participantIds
      }
    default:
        throw new Error ('There was an error creating contest [participantType]')
  }
}

const createContest = async (contest: POSTContestRoute['Body']): Promise<ContestModel<ResultTypes, ParticipantTypes>> => {

  const { adminId, contestType, scoringType, teeTime, courseId, resultType, participantType, participantIds, payoutId, name } = contest

  return await contestModel.createContest({
    adminId,
    name,
    contestType,
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

export default {
  createContest,
  getContest
}