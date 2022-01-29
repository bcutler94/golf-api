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
  const { hi_value } = await ghinApi.getUser(user.ghin)
  const courseHandicap = Math.ceil(hi_value * (ratingInfo.slopeRating / 133) + (ratingInfo.courseRating - courseTeeInfo.totalPar))

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
    } else if (userCourseHandicap > 0 && handicap <= Math.abs(userCourseHandicap)) {
      scores[idx].shotsGiven = scores[idx].shotsGiven - 1
      userCH++
    }
    idx = idx % 17 + 1
  }

  // // do we need to create team scorecard?
  // const contest = await contestModel.getContestById(contestId);
  // if (contest.type === 'best-ball-match-play') {
  //   contest.teamMatchups.find(matchup => )
  //   return await scorecardModel.createScorecard({
  //     id: v4(),
  //     type: 'team',
  //     teamId: '',
  //     courseId,
  //     scores,
  //     contestId,
  //   })  
  // }

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
  await scoreContestForPlayer(scorecard.contestId, scorecard.playerId);

}

const scoreContestForPlayer = async (contestId: string, playerId: string) => {
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
}

// const scoreRyderCupContest = async (ryderCupContestId: string): Promise<RyderCupContest> => {
//   const ryderContest = await contestModel.getContestById(ryderCupContestId);
//   if (ryderContest.type !== 'ryder-cup') {
//     logger.error('trying to score ryder cup contest by its not a ryder cup contest', ryderContest)
//     throw new Error()
//   }
//   const ryderCupContestLeaderboard: RyderCupLeaderboard = {
//     [ryderContest.teams[0].id]: 0,
//     [ryderContest.teams[1].id]: 0
//   }
//   for (const matchupId in ryderContest.leaderboard) {
//     const { winningTeamId, isFinal } = ryderContest.leaderboard[matchupId];
//     if (isFinal) {
//       ryderCupContestLeaderboard[winningTeamId]++
//     }
//   }
//   return ryderContest
// }

/**
 * - find the matchup
 * - get all the scorecards
 * @param contest 
 * @param playerId 
 */
const scoreSinglesMatchPlayContest = async (contest: SinglesMatchPlay, playerId: string) => {

  // find the matchup
  const { singleMatchups } = contest;
  let singleMatchupId: string = '';

  for (const matchupId in singleMatchups) {
    const [ team1, team2 ] = singleMatchups[matchupId];
    if (team1.playerId === playerId || team2.playerId === playerId) {
      singleMatchupId = matchupId;
      break;
    }
  }

  if (!singleMatchupId) {
    logger.error('couldnt find players matchup on best ball contest', contest, playerId);
    throw new Error ()
  }


  // get the players scorecards
  const { id } = contest;
  const [ team1, team2 ] = singleMatchups[singleMatchupId];
  const playerIds = [ team1.playerId, team2.playerId ];

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
  let player1holesUp = 0;
  let player2holesUp = 0;
  let isFinal = false;
  let isDormi = false;
  while (thru <= 17) {
    const canScoreHole = playerIds.every(playerId => Number.isInteger(playerIdToScorecard[playerId].scores[thru].netStrokes));
    if (!canScoreHole) break;

    // get player1score
    const player1score = playerIdToScorecard[team1.playerId].scores[thru].netStrokes;

    // get player2score
    const player2score = playerIdToScorecard[team2.playerId].scores[thru].netStrokes;

    if (player1score < player2score) {
      player1holesUp++;
    } else if (player2score < player1score) {
      player2holesUp++;
    }

    // check if match is over
    const netHoles = Math.abs(player1holesUp - player2holesUp);
    const holesLeft = 17 - thru;
    if (netHoles > holesLeft) {
      isFinal = true;
      break;
    } else if (netHoles === holesLeft) {
      isDormi = true;
      break;
    }
    thru++
  }

  const { leaderboard } = contest;
  let winningPlayerId = '';
  let losingPlayerId = '';
  if (player1holesUp > player2holesUp) {
    winningPlayerId = team1.teamId
    losingPlayerId = team2.teamId
  } else if (player2holesUp > player1holesUp) {
    winningPlayerId = team2.teamId
    losingPlayerId = team1.teamId
  }

  leaderboard[singleMatchupId] = {
    thru,
    winningPlayerId,
    losingPlayerId,
    holesUp: Math.abs(player2holesUp - player1holesUp),
    isFinal,
    isDormi
  }

  const newContests: ContestModel[] = []

  // check if part of ryder cup contest and score
  const { ryderCupContestId } = contest;
  if (ryderCupContestId) {
    const ryderContest = await contestModel.getContestById(ryderCupContestId);
    if (ryderContest.type !== 'ryder-cup') {
      logger.error('trying to score ryder cup contest by its not a ryder cup contest', ryderContest)
      throw new Error()
    }
    const ryderCupContestLeaderboard: RyderCupLeaderboard = {
      [ryderContest.teams[0].id]: 0,
      [ryderContest.teams[1].id]: 0
    }
    for (const matchupId in leaderboard) {
      const { winningPlayerId, isFinal } = leaderboard[matchupId];
      if (isFinal) {
        if (ryderContest.teams[0].userIds.includes(winningPlayerId)) {
          ryderCupContestLeaderboard[ryderContest.teams[0].id]++
        } else {
          ryderCupContestLeaderboard[ryderContest.teams[1].id]++
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
  let teamMatchupId: string = '';
  for (const matchupId in teamMatchups) {
    const [ team1, team2 ] = teamMatchups[matchupId];
    if (team1.player1Id === playerId || team1.player2Id === playerId || team2.player1Id === playerId || team2.player2Id) {
      teamMatchupId = matchupId;
      break;
    }
  }
  if (!teamMatchupId) {
    logger.error('couldnt find players matchup on best ball contest', contest, playerId);
    throw new Error ()
  }


  const { id } = contest;
  const [ team1, team2 ] = teamMatchups[teamMatchupId];
  const playerIds = [ team1.player1Id, team1.player2Id, team2.player1Id, team2.player2Id ];

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
  let team1holes = 0;
  let team2holes = 0;
  let isFinal = false;
  let isDormi = false;
  while (thru <= 17) {
    // can we score the hole?
    const canScoreHole = playerIds.every(playerId => Number.isInteger(playerIdToScorecard[playerId].scores[thru].netStrokes));
    if (!canScoreHole) break;

    // get team1 best score
    const team1Score = Math.min(
      playerIdToScorecard[team1.player1Id].scores[thru].netStrokes,
      playerIdToScorecard[team1.player2Id].scores[thru].netStrokes
    );

    // get team 2 best score
    const team2Score = Math.min(
      playerIdToScorecard[team2.player1Id].scores[thru].netStrokes,
      playerIdToScorecard[team2.player2Id].scores[thru].netStrokes
    );

    // figure out who won the hole
    if (team1Score < team2Score) {
      team1holes++
    } else if (team2Score < team1Score) {
      team2holes++
    }

    // check if match is over
    const netHoles = Math.abs(team2holes - team1holes);
    const holesLeft = 17 - thru;
    if (netHoles > holesLeft) {
      isFinal = true;
      break;
    } else if (netHoles === holesLeft) {
      isDormi = true;
      break;
    }
    thru++
  }


  const { leaderboard } = contest;
  let winningTeamId = '';
  let losingTeamId = '';
  if (team1holes > team2holes) {
    winningTeamId = team1.teamId
    losingTeamId = team2.teamId
  } else if (team2holes > team1holes) {
    winningTeamId = team2.teamId
    losingTeamId = team1.teamId
  }

  // change match leaderboard
  leaderboard[teamMatchupId] = {
    thru,
    winningTeamId,
    losingTeamId,
    holesUp: Math.abs(team2holes - team1holes),
    isFinal,
    isDormi
  }

  const newContests: ContestModel[] = [];
  newContests.push(contest)

  // check if contest is over
  const isContestOver = Object.values(leaderboard).every(({ isFinal }) => isFinal);
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
      [ryderContest.teams[0].id]: 0,
      [ryderContest.teams[1].id]: 0
    }
    for (const matchupId in leaderboard) {
      const { winningTeamId, isFinal } = leaderboard[matchupId];
      if (isFinal) {
        ryderCupContestLeaderboard[winningTeamId]++
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