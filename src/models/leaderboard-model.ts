import { IndexDescription } from "mongodb";
import database from "../data-layer/database";
import logger from "../util/logger";
import { ContestTypes } from "./contest-model";
interface BaseLeaderboard {
  id: string
  contestId: string
  contestType: ContestTypes
}

type ContestScore = {
  [key: string]: {
    [key: string]: number
  }
}
interface RyderCupLeaderboard extends BaseLeaderboard {
  contestType: 'ryder-cup'
  scores: ContestScore
}


type SingleMatchupScores = {
  isFinal: boolean
  thru: number
  holesUp: number
  winner: {
    player: string
    teamId?: string
  }
  loser: {
    player: string
    teamId?: string
  }
}

interface SinglesMatchPlayLeaderboard extends BaseLeaderboard {
  contestType: 'singles-match-play'
  scores: SingleMatchupScores[]
}


type TeamMatchupScores = {
  isFinal: boolean
  thru: number
  holesUp: number
  winner: {
    player1: string
    player2: string
    teamId: string
  }
  loser: {
    player1: string
    player2: string
    teamId: string
  }
}

interface BestBallMatchPlayLeaderboard extends BaseLeaderboard {
  contestType: 'best-ball-match-play'
  scores: TeamMatchupScores[]
}

type IndividualStrokePlayScores = {
  player: string
  teamId: string
  score: number
}

interface IndividualStrokePlayLeaderboard extends BaseLeaderboard {
  contestType: 'individual-stroke-play'
  scores: IndividualStrokePlayScores[]
}


export type LeaderboardModel = RyderCupLeaderboard | SinglesMatchPlayLeaderboard | BestBallMatchPlayLeaderboard | IndividualStrokePlayLeaderboard


const getLeaderboardCollection = async () => {
  const db = await database.getGolfDB()
  return db.collection<LeaderboardModel>('contests');
}

const LEADERBOARD_INDEXES: IndexDescription[] = [
  {
    key: { contestId: 1 },
    unique: true
  }
]

const addIndexes = async () => {
  try {
    const collection = await getLeaderboardCollection()
    const result = await collection.createIndexes(LEADERBOARD_INDEXES);
    logger.info('created leaderboard indexes', result)
  } catch (e) {
    logger.error(`error adding index to leaderboard`, e)
  }
}

addIndexes()


const createLeaderboard = async (model: LeaderboardModel): Promise<LeaderboardModel> => {
  const collection = await getLeaderboardCollection();
  const { acknowledged } = await collection.insertOne(model);
  if (!acknowledged) {
    logger.error('there was an error inserting the leaderboard', model);
    throw new Error ()
  }
  return model;
}

export default {
  createLeaderboard
}