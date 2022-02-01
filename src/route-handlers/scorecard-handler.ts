import { v4 } from "uuid";
import contestModel, { BestBallMatchPlay, ContestModel, RyderCupContest, RyderCupLeaderboard, SinglesMatchPlay } from "../models/contest-model";
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

  const { teeInfo } = await courseModel.getCourseById(courseId, { externalId: 1, teeInfo: 1 })
  const courseTeeInfo = teeInfo.find(tee => tee.name === tees && tee.gender === gender);
  if (!courseTeeInfo) {
    logger.error('cant find tee info for course', userId, contestId, tees, gender, courseId)
    throw new Error()
  }

  const ratingInfo = courseTeeInfo.ratingInfo.find(ri => ri.type === 'Total');
  if (!ratingInfo) {
    logger.error('cant find rating info for course', userId, contestId, tees, gender, courseId)
    throw new Error()
  }

  // Course Handicap = Handicap Index × (Slope Rating ÷ 113) + (Course Rating – Par)
  // const { hi_value } = await ghinApi.getUser(user.ghin);

  const courseHandicap = Math.ceil(user.currentHandicap * (ratingInfo.slopeRating / 133) + (ratingInfo.courseRating - courseTeeInfo.totalPar))

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
    const { handicap } = courseTeeInfo.holeInfo[idx];
    if (userCourseHandicap > 0 && handicap <= userCourseHandicap) {
      scores[idx].shotsGiven = scores[idx].shotsGiven + 1
      userCH--
    } else if (userCourseHandicap < 0 && handicap <= Math.abs(userCourseHandicap)) {
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
    scores,
    playerId: userId,
    contestId,
    courseHandicap: courseHandicap ?? user.currentHandicap
  })  
}

const getContestScorecard = async (contestId: string, playerId: string): Promise<ScorecardModel | null> => {
  return await scorecardModel.getContestScorecard(contestId, playerId)
}

const scoreHole = async (scorecardId: string, score: number, holeIndex: number) => {
  const scorecard = await scorecardModel.scoreHole(scorecardId, score, holeIndex);
  const contest = await scoreContestForPlayer(scorecard.contestId, scorecard.playerId);
  return { 
    scorecard,
    contest
  }
}

const scoreContestForPlayer = async (contestId: string, playerId: string): Promise<ContestModel> => {
  let contest = await contestModel.getContestById(contestId);

  switch (contest.type) {
    case 'best-ball-match-play':
      await scoreBestBallContest(contest, playerId)
      break;
    case 'singles-match-play':
      await scoreSinglesMatchPlayContest(contest, playerId)
      break;
    case 'individual-stroke-play':
      // TODO
      break;
  }

  return await contestModel.getContestById(contestId)
}

/**
 * - find the matchup
 * - get all the scorecards
 * @param contest 
 * @param playerId 
 */
const scoreSinglesMatchPlayContest = async (contest: SinglesMatchPlay, playerId: string) => {

  const {
    singleMatchups
  } = contest;

  const matchup = contest.singleMatchups.find(sm => sm.teams.EUROPE.playerId === playerId || sm.teams.USA.playerId === playerId );
  if (!matchup) {
    logger.error('couldnt find players matchup on best ball contest', contest, playerId);
    throw new Error ()
  }

  const {
    teams: { 
      USA: { playerId: usaPlayerId }, 
      EUROPE: { playerId: europePlayerId } 
    }
  } = matchup
  const { id } = contest;
  const playerIds = [ usaPlayerId, matchup.teams.EUROPE.playerId ];

  const collection = await scorecardModel.getScorecardCollection();
  const scorecardCursor = await collection.find({ 
    contestId: id, 
    playerId: { $in: playerIds }
  })

  const playerIdToScorecard: { [key: string]: ScorecardModel } = {}
  await scorecardCursor.forEach(scorecard => {
    playerIdToScorecard[scorecard.playerId] = scorecard
  });


  let thru = 0;
  let usaholesUp = 0;
  let europeholesUp = 0;
  let isFinal = false;
  let isDormi = false;
  while (thru <= 17) {

    const canScoreHole = playerIds.every(playerId => playerIdToScorecard[playerId].scores[thru].grossStrokes > 0);

    if (!canScoreHole) break;

    // get player1score
    const usaScore = playerIdToScorecard[usaPlayerId].scores[thru].netStrokes;

    // get player2score
    const europeScore = playerIdToScorecard[europePlayerId].scores[thru].netStrokes;

    if (usaScore < europeScore) {
      usaholesUp++;
    } else if (europeScore < usaScore) {
      europeholesUp++;
    }

    // check if match is over
    const netHoles = Math.abs(usaholesUp - europeholesUp);
    const holesLeft = 17 - thru;
    if (netHoles > holesLeft) {
      isFinal = true;
    } else if (netHoles === holesLeft) {
      isDormi = true;
    }

    // increment hole
    thru++
  }

  let { leaderboard } = matchup;
  let winningPlayerId = '';
  let losingPlayerId = '';
  if (usaholesUp > europeholesUp) {
    winningPlayerId = usaPlayerId
    losingPlayerId = europePlayerId
  } else if (europeholesUp > usaholesUp) {
    winningPlayerId = europePlayerId
    losingPlayerId = usaPlayerId
  }

  leaderboard = {
    thru,
    winningPlayerId,
    losingPlayerId,
    holesUp: Math.abs(usaholesUp - europeholesUp),
    isFinal,
    isDormi
  }

  const newContests: ContestModel[] = [ contest ]

  // check if contest is over
  const isContestOver = singleMatchups.every(({ leaderboard: { isFinal } }) => isFinal);
  if (isContestOver) {
    contest.status = 'closed';
  }

  // check if part of ryder cup contest and score
  const { ryderCupContestId } = contest;
  if (ryderCupContestId) {
    const ryderContest = await contestModel.getContestById(ryderCupContestId);
    if (ryderContest.type !== 'ryder-cup') {
      logger.error('trying to score ryder cup contest by its not a ryder cup contest', ryderContest)
      throw new Error()
    }
    const ryderCupContestLeaderboard: RyderCupLeaderboard = {
      USA: 0,
      EUROPE: 0
    }

    const usaPlayerIds = new Set<string>(ryderContest.teams.USA.players.map(p => p.playerId))

    for (const { leaderboard } of singleMatchups) {
      const { winningPlayerId, isFinal } = leaderboard;
      if (isFinal) {
        if (usaPlayerIds.has(winningPlayerId)) {
          ryderCupContestLeaderboard.USA++
        } else {
          ryderCupContestLeaderboard.EUROPE++
        }

      }
    }
    newContests.push(ryderContest)

    // todo mark ryder cup contest as done?
  }
  
  await contestModel.replaceContests(newContests)
}



/**
 * - find the matchup
 * - get all the scorecards
 * @param contest 
 * @param playerId 
 */
const scoreBestBallContest = async (contest: BestBallMatchPlay, playerId: string): Promise<void> => {

  // find the matchup
  const { teamMatchups } = contest;

  const matchup = teamMatchups.find(({ teams: { USA, EUROPE } }) => {
    const playerIds = new Set<string>([ ...USA.players.map(p => p.playerId), ...EUROPE.players.map(p => p.playerId)]);
    return playerIds.has(playerId)
  })

  if (!matchup) {
    logger.error('couldnt find players matchup on best ball contest', contest, playerId);
    throw new Error ()
  }


  const { id } = contest;
  const {
    teams: {
      USA: { players: usaPlayers },
      EUROPE: { players: europePlayers }
    }
  } = matchup;

  const playerIds = [ ...usaPlayers.map(p => p.playerId), ...europePlayers.map(p => p.playerId) ];

  const collection = await scorecardModel.getScorecardCollection();
  const scorecardCursor = await collection.find({ 
    contestId: id, 
    playerId: { $in: playerIds }
  })
  const playerIdToScorecard: { [key: string]: ScorecardModel } = {}
  await scorecardCursor.forEach(scorecard => {
    playerIdToScorecard[scorecard.playerId] = scorecard
  });


  let thru = 0;
  let usaholes = 0;
  let europeholes = 0;
  let isFinal = false;
  let isDormi = false;
  while (thru <= 17) {
    // can we score the hole?
    const canScoreHole = playerIds.every(playerId => playerIdToScorecard[playerId].scores[thru].grossStrokes > 0);
    if (!canScoreHole) break;

    // get team1 best score
    const usaScore = Math.min(
      ...usaPlayers.map(u => playerIdToScorecard[u.playerId].scores[thru].netStrokes)
    );

    // get team 2 best score
    const europeScore = Math.min(
      ...europePlayers.map(u => playerIdToScorecard[u.playerId].scores[thru].netStrokes)
    );

    // figure out who won the hole
    if (usaScore < europeScore) {
      usaholes++
    } else if (europeScore < usaScore) {
      europeholes++
    }

    // check if match is over
    const netHoles = Math.abs(europeholes - usaholes);
    const holesLeft = 17 - thru;
    if (netHoles > holesLeft) {
      isFinal = true;
    } else if (netHoles === holesLeft) {
      isDormi = true;
    }
    thru++
  }


  let winningTeamName = '';
  let losingTeamName = '';
  if (usaholes > europeholes) {
    winningTeamName = 'USA'
    losingTeamName = 'EUROPE'
  } else if (europeholes > usaholes) {
    winningTeamName = 'EUROPE'
    losingTeamName = 'USA'
  }

  // change match leaderboard
  matchup.leaderboard = {
    thru,
    winningTeamName,
    losingTeamName,
    holesUp: Math.abs(europeholes - usaholes),
    isFinal,
    isDormi
  }

  const newContests: ContestModel[] = [ contest ];

  // check if contest is over
  const isContestOver = teamMatchups.every(({ leaderboard: { isFinal } }) => isFinal);
  if (isContestOver) {
    contest.status = 'closed';
  }

  // check if part of ryder cup contest and score
  const { ryderCupContestId } = contest;
  if (ryderCupContestId) {
    const ryderContest = await contestModel.getContestById(ryderCupContestId);
    if (ryderContest.type !== 'ryder-cup') {
      logger.error('trying to score ryder cup contest by its not a ryder cup contest', ryderContest)
      throw new Error()
    }
    const ryderCupContestLeaderboard: RyderCupLeaderboard = {
      USA: 0,
      EUROPE: 0
    }
    for (const { leaderboard } of teamMatchups) {
      const { winningTeamName, isFinal } = leaderboard;
      if (isFinal) {
        ryderCupContestLeaderboard[winningTeamName]++
      }
    }
    newContests.push(ryderContest)

    // todo mark ryder cup contest as done?
  }

  await contestModel.replaceContests(newContests)

}


export default {
  createScorecard,
  getContestScorecard,
  scoreHole
}