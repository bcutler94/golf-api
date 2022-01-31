import { v4 } from "uuid"
import contestModel, { BestBallMatchPlay, BestBallMatchPlayLeaderboard, ContestModel, ContestTypes, GetContest, IndividualStrokePlay, IndividualStrokePlayLeaderboard, RyderCupContest, RyderCupLeaderboard, ScoringTypes, SingleDayContests, SingleMatchup, SinglesMatchPlay, SinglesMatchPlayLeaderboard, TeamMatchup } from "../models/contest-model"
import logger from "../util/logger";
interface ContestCreationBase {
  type: ContestTypes
  name: string
}

interface RyderCupCreation extends ContestCreationBase {
  type: 'ryder-cup'
}
interface IndividualStrokePlayCreation extends ContestCreationBase {
  type: 'individual-stroke-play'
  courseId: string
  scoringType: ScoringTypes
  ryderCupContestId?: string
}

interface BestBallMatchPlayCreation extends ContestCreationBase  {
  type: 'best-ball-match-play'
  courseId: string
  scoringType: ScoringTypes
  ryderCupContestId?: string
}

interface SingleMatchPlayCreation extends ContestCreationBase {
  type: 'singles-match-play'
  courseId: string
  scoringType: ScoringTypes
  ryderCupContestId?: string
}

export type ContestCreation =  RyderCupCreation | IndividualStrokePlayCreation | BestBallMatchPlayCreation | SingleMatchPlayCreation

const addPlayerToChildContest = (contest: SingleDayContests, userId: string, teamId: string, otherTeamId: string): SingleDayContests => {

  const { type, userIds } = contest;
  userIds.push(userId);

  switch (type) {
    case 'individual-stroke-play':
      const { players, userIds } = contest
      players.push({ playerId: userId, teamId });
      return contest;
    case 'singles-match-play':
      const { singleMatchups } = contest;

      // try and add player to team matchup that may not have a player yet
      let addedSinglePlayer = false;
      for (const [ player1, player2 ] of Object.values(singleMatchups)) {
        if (player1.teamId === teamId) {
          if (!player1.playerId) {
            player1.playerId = userId;
            addedSinglePlayer = true
            break;
          }
        } else {
          if (!player2.playerId) {
            player2.playerId = userId;
            addedSinglePlayer = true
            break;
          }
        }
      }

      // otherwise just create new entry and add player
      if (!addedSinglePlayer) {
        singleMatchups[v4()] = [
          { playerId: userId, teamId },
          { playerId: '', teamId: otherTeamId }
        ]
      }

      return contest;

    case 'best-ball-match-play':
      const { teamMatchups } = contest;

      // try and add player to team matchup that may not have a player yet
      let addedTeamPlayer = false;
      for (const matchupId in teamMatchups) {

        const [ team1, team2 ] = teamMatchups[matchupId]

        // add to team 1
        if (team1.teamId === teamId) {

          if (!team1.player1Id) {
            team1.player1Id = userId;
            addedTeamPlayer = true
            break;
          }

          if (!team1.player2Id) {
            team1.player2Id = userId;
            addedTeamPlayer = true;
            break;
          }

        // add to team 2
        } else {

          if (!team2.player1Id) {
            team2.player1Id = userId;
            addedTeamPlayer = true;
            break;
          }

          if (!team2.player2Id) {
            team2.player2Id = userId;
            addedTeamPlayer = true;
            break;
          }

        }
      }

      // otherwise just create new entry and add player
      if (!addedTeamPlayer) {
        teamMatchups[v4()] = [
          { player1Id: userId, player2Id: '', teamId },
          { player1Id: '', player2Id: '', teamId: otherTeamId },
        ]
      }
      return contest;

  }
}

// TODO clean this fucking method up jesus
const createContest = async (userId: string, contest: ContestCreation) => {

  let contestInput: ContestModel;
  switch (contest.type) {
    case 'ryder-cup':
      const ryderCupContest: RyderCupContest = {
        type: 'ryder-cup',
        contestIds: [],
        teams: [
          { id: v4(), name: 'USA', captainId: '', userIds: [] },
          { id: v4(), name: 'EUROPE', captainId: '', userIds: [] }
        ],
        id: v4(),
        adminIds: [ userId ],
        name: contest.name,
        status: 'queued',
        leaderboard: {},
        userIds: [ userId ]
      }
      contestInput = ryderCupContest;
      break;
    case 'best-ball-match-play': {
      const bestBallContest: BestBallMatchPlay = {
        type: 'best-ball-match-play',
        teamMatchups: {},
        id: v4(),
        adminIds: [ userId ],
        name: contest.name,
        status: 'queued',
        leaderboard: {},
        courseId: contest.courseId,
        scoringType: contest.scoringType,
        ryderCupContestId: contest.ryderCupContestId,
        userIds: [ userId ]
      }

      // pull ryder contest info if it exists
      if (contest.ryderCupContestId) {
        const contestData = await contestModel.getContest(contest.ryderCupContestId);
        switch (contestData.type) {
          case 'multi-day':


            const { 
              contest: { teams: [ team1, team2 ], userIds }, 
              childContests 
            } = contestData;

            // pull over userIds
            bestBallContest.userIds = userIds

            // add contestId to parent
            contestData.contest.contestIds.push(bestBallContest.id)
            await contestModel.replaceContests([contestData.contest])

            // add name
            bestBallContest.name = `Session ${childContests.length + 1}`;

            // build teams
            const team1userIds = [ ...team1.userIds ];
            const team2userIds = [ ...team2.userIds ];
            const teamMatchups: { [key: string]: TeamMatchup } = {}
            while (team1userIds.length || team2userIds.length) {

              // get players for team 1
              const team1player1Idx = Math.floor(Math.random() * team1userIds.length);
              const team1player1 = team1userIds[team1player1Idx];
              team1userIds.splice(team1player1Idx, 1);
              const team1player2Idx = Math.floor(Math.random() * team1userIds.length);
              const team1player2 = team1userIds[team1player2Idx];
              team1userIds.splice(team1player2Idx, 1);

              // get players for team 2
              const team2player1Idx = Math.floor(Math.random() * team2userIds.length);
              const team2player1 = team2userIds[team2player1Idx];
              team2userIds.splice(team2player1Idx, 1);
              const team2player2Idx = Math.floor(Math.random() * team2userIds.length);
              const team2player2 = team2userIds[team2player2Idx];
              team2userIds.splice(team2player2Idx, 1);

              const teamMatchup: TeamMatchup = [
                { player1Id: team1player1, player2Id: team1player2, teamId: team1.id },
                { player1Id: team2player1, player2Id: team2player2, teamId: team2.id }
              ];

              teamMatchups[v4()] = teamMatchup
            }
            bestBallContest.teamMatchups = teamMatchups;

            break;
          
        }

      }
      contestInput = bestBallContest;
      break;
    }
    case 'singles-match-play':
      const singlesContest: SinglesMatchPlay = {
        type: 'singles-match-play',
        singleMatchups: {},
        id: v4(),
        adminIds: [ userId ],
        name: contest.name,
        status: 'queued',
        leaderboard: {},
        courseId: contest.courseId,
        scoringType: contest.scoringType,
        ryderCupContestId: contest.ryderCupContestId,
        userIds: [ userId ]
      }

      // pull ryder contest info if it exists
      if (contest.ryderCupContestId) {
        const contestData = await contestModel.getContest(contest.ryderCupContestId);
        switch (contestData.type) {
          case 'multi-day':
            const { 
              contest: { teams: [ team1, team2 ], userIds }, 
              childContests 
            } = contestData;

            // add userIds
            singlesContest.userIds = userIds;

            // add contestId to parent
            contestData.contest.contestIds.push(singlesContest.id)
            await contestModel.replaceContests([contestData.contest])

            // add name
            singlesContest.name = `Session ${childContests.length + 1}`;

            // build teams
            const team1userIds = [ ...team1.userIds ];
            const team2userIds = [ ...team2.userIds ];
            const singleMatchups: { [key: string]: SingleMatchup } = {}
            while (team1userIds.length || team2userIds.length) {

              // get players for team 1
              const team1player1Idx = Math.floor(Math.random() * team1userIds.length);
              const team1player1 = team1userIds[team1player1Idx];
              team1userIds.splice(team1player1Idx, 1);

              // get players for team 2
              const team2player1Idx = Math.floor(Math.random() * team2userIds.length);
              const team2player1 = team2userIds[team2player1Idx];
              team2userIds.splice(team2player1Idx, 1);


              const singleMatchup: SingleMatchup = [
                { playerId: team1player1, teamId: team1.id },
                { playerId: team2player1, teamId: team2.id },
              ];

              singleMatchups[v4()] = singleMatchup
            }
            singlesContest.singleMatchups = singleMatchups;

            break;
          
        }

      }
      contestInput = singlesContest;
      break;
    case 'individual-stroke-play':
      const individualStrokeContest: IndividualStrokePlay = {
        type: 'individual-stroke-play',
        players: [],
        id: v4(),
        adminIds: [ userId ],
        name: contest.name,
        status: 'queued',
        leaderboard: [],
        courseId: contest.courseId,
        scoringType: contest.scoringType,
        ryderCupContestId: contest.ryderCupContestId,
        userIds: [ userId ]
      }
      // pull ryder contest info if it exists
      if (contest.ryderCupContestId) {
        const contestData = await contestModel.getContest(contest.ryderCupContestId);
        switch (contestData.type) {
          case 'multi-day':
            const { 
              contest: { teams: [ team1, team2 ], userIds }, 
              childContests 
            } = contestData;

            individualStrokeContest.userIds = userIds

            // add contestId to parent
            contestData.contest.contestIds.push(individualStrokeContest.id)
            await contestModel.replaceContests([contestData.contest])

            // add name
            individualStrokeContest.name = `Session ${childContests.length + 1}`;

            // build players
            const team1players = team1.userIds.map((playerId) => ({ playerId, teamId: team1.id }))
            const team2players = team2.userIds.map((playerId) => ({ playerId, teamId: team2.id }))
            individualStrokeContest.players = [ ...team1players, ...team2players ]

            break;
        }
      }
      contestInput = individualStrokeContest;
    break;
  }

  return await contestModel.createContest(contestInput)
}

const getContest = async (contestId: string): Promise<GetContest> => {
  return await contestModel.getContest(contestId);
}

const getUserContests = async (userId: string): Promise<ContestModel[]> => {
  return await contestModel.getUserContests(userId);
}

const joinTeam = async (contestId: string, userId: string): Promise<GetContest> => {
  const contestData = await contestModel.getContest(contestId);
  switch (contestData.type) {
    case 'multi-day':
      const { contest, childContests } = contestData
      const { teams, userIds } = contest;

      // add user to userIds
      userIds.push(userId)

      // make sure not in any teams
      for (const team of teams) {
        if (team.userIds.includes(userId)) {
          logger.error('this user is already in a team', contestId, userId)
          throw new Error ()
        }
      }

      // find min length
      const smallestTeamInfo = teams.reduce((obj, team, index) => {
        const min = Math.min(obj.min, team.userIds.length);
        return {
          min,
          idx: min === team.userIds.length ? index : obj.idx
        }
      }, { min: Infinity, idx: -1 });

      // add user to team
      teams[smallestTeamInfo.idx].userIds.push(userId);

      // if no captain, make captain
      if (!teams[smallestTeamInfo.idx].captainId) {
        teams[smallestTeamInfo.idx].captainId = userId
      }

      const teamId = teams[smallestTeamInfo.idx].id;
      const otherTeamId = teams[smallestTeamInfo.idx === 0 ? 1 : 0].id;

      const newChildContests = childContests.map(contest => addPlayerToChildContest(contest, userId, teamId, otherTeamId))

      await contestModel.replaceContests([ contest, ...newChildContests ])
      break;
    case 'single-day':
      // TODO
      break;
    }
  return await contestModel.getContest(contestId);
}

const attachLeaderboardToContest = (contest: ContestModel): void => {
  switch (contest.type) {
    case 'ryder-cup':
      const { contestIds, teams: [ team1Id, team2Id ] } = contest;
      const ryderCupLeaderboard: { [contestId: string]: RyderCupLeaderboard } = {}
      contestIds.forEach(contestId => {
        ryderCupLeaderboard[contestId] = {
          [team1Id.id]: 0,
          [team2Id.id]: 0,
        }
      });
      contest.leaderboard = ryderCupLeaderboard;
      return;
    case 'best-ball-match-play':
      const { teamMatchups } = contest
      const bestBallleaderboard: { [key: string]: BestBallMatchPlayLeaderboard } = {}
      for (const matchupId in teamMatchups) {
        bestBallleaderboard[matchupId] = {
          thru: 0,
          holesUp: 0,
          winningTeamId: '',
          losingTeamId: '',
          isFinal: false,
          isDormi: false
        }
      }
      contest.leaderboard = bestBallleaderboard;
      return;
    case 'singles-match-play':
      const { singleMatchups } = contest;
      const singlesMatchPlayLeaderboard: { [key: string]: SinglesMatchPlayLeaderboard } = {}
      for (const matchupId in singleMatchups) {
        singlesMatchPlayLeaderboard[matchupId] = {
          thru: 0,
          holesUp: 0,
          winningPlayerId: '',
          losingPlayerId: '',
          isFinal: false,
          isDormi: false
        }
      }
      contest.leaderboard = singlesMatchPlayLeaderboard;
      return
    case 'individual-stroke-play':
      const { players } = contest
      const individualStrokePlayLeaderboard: IndividualStrokePlayLeaderboard = players.map(player => {
        return {
          ...player,
          score: 0
        }
      })
      contest.leaderboard = individualStrokePlayLeaderboard
      return;
  }
}

const attachLeaderboardToContestData = (contestData: GetContest): void => {
  switch (contestData.type) {
    case 'single-day':
      attachLeaderboardToContest(contestData.contest);
      break;
    case 'multi-day':
      attachLeaderboardToContest(contestData.contest);
      break;
    default:
      logger.error('dont know how to start contest type', contestData)
      throw new Error ()
  }
}

/**
 * Mark contest as active if it isn't already, create scorecards, create leaderboards for contest + parent contest
 * @param contestId 
 */
const startContest = async (contestId: string): Promise<GetContest> => {

  // check contest status
  const contestData = await contestModel.getContest(contestId);
  if (contestData.contest.status !== 'queued') {
    logger.error('trying to start a contest that is not queued', contestId)
    throw new Error()
  }

  // do some validation here?

  attachLeaderboardToContestData(contestData);
  if (contestData.type === 'single-day' && contestData.contest.ryderCupContestId) {
    const ryderCupContestData = await contestModel.getContest(contestData.contest.ryderCupContestId);
    attachLeaderboardToContestData(ryderCupContestData);
    await contestModel.replaceContests([{...contestData.contest, status: 'active' }, { ...ryderCupContestData.contest, status: 'active' }])
  } else {
    await contestModel.replaceContests([{...contestData.contest, status: 'active' }])
  }

  return await contestModel.getContest(contestId);

}


export default {
  createContest,
  getContest,
  getUserContests,
  joinTeam,
  startContest,
}