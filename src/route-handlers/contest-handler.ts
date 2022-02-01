import { v4 } from "uuid"
import contestModel, { BestBallMatchPlay, BestBallMatchPlayLeaderboard, ContestModel, ContestTypes, GetContest, IndividualStrokePlay, IndividualStrokePlayLeaderboard, Player, RyderCupContest, RyderCupLeaderboard, ScoringTypes, SingleDayContests, SingleMatchup, SinglesMatchPlay, SinglesMatchPlayLeaderboard, TeamMatchup } from "../models/contest-model"
import userModel, { UserModel } from "../models/user-model";
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

// const addPlayerToChildContest = (contest: SingleDayContests, userId: string, teamName: string, otherteamName: string): SingleDayContests => {

//   const { type, userIds } = contest;
//   userIds.push(userId);

//   switch (type) {
//     case 'individual-stroke-play':
//       const { players, userIds } = contest
//       players.push({ playerId: userId, teamName });
//       return contest;
//     case 'singles-match-play':
//       const { singleMatchups } = contest;

//       // try and add player to team matchup that may not have a player yet
//       let addedSinglePlayer = false;

//       for (const sm of singleMatchups) {

//         if (player1.teamName === teamName) {
//           if (!player1.playerId) {
//             player1.playerId = userId;
//             addedSinglePlayer = true
//             break;
//           }
//         } else {
//           if (!player2.playerId) {
//             player2.playerId = userId;
//             addedSinglePlayer = true
//             break;
//           }
//         }
//       }

//       // otherwise just create new entry and add player
//       if (!addedSinglePlayer) {
//         singleMatchups[v4()] = [
//           { playerId: userId, teamName },
//           { playerId: '', teamName: otherteamName }
//         ]
//       }

//       return contest;

//     case 'best-ball-match-play':
//       const { teamMatchups } = contest;

//       // try and add player to team matchup that may not have a player yet
//       let addedTeamPlayer = false;
//       for (const matchupId in teamMatchups) {

//         const [ team1, team2 ] = teamMatchups[matchupId]

//         // add to team 1
//         if (team1.teamName === teamName) {

//           if (!team1.player1Id) {
//             team1.player1Id = userId;
//             addedTeamPlayer = true
//             break;
//           }

//           if (!team1.player2Id) {
//             team1.player2Id = userId;
//             addedTeamPlayer = true;
//             break;
//           }

//         // add to team 2
//         } else {

//           if (!team2.player1Id) {
//             team2.player1Id = userId;
//             addedTeamPlayer = true;
//             break;
//           }

//           if (!team2.player2Id) {
//             team2.player2Id = userId;
//             addedTeamPlayer = true;
//             break;
//           }

//         }
//       }

//       // otherwise just create new entry and add player
//       if (!addedTeamPlayer) {
//         teamMatchups[v4()] = [
//           { player1Id: userId, player2Id: '', teamName },
//           { player1Id: '', player2Id: '', teamName: otherteamName },
//         ]
//       }
//       return contest;

//   }
// }

const addRyderCupContestInfo = async (singleDayContest: SingleDayContests): Promise<SingleDayContests> => {

  const { ryderCupContestId } = singleDayContest;
  if (!ryderCupContestId) return singleDayContest;

  const ryderCup = await contestModel.getContestById(ryderCupContestId);
  if (ryderCup.type !== 'ryder-cup') {
    logger.error('trying to add rryder cup contest info but contest isnt ryder cup', ryderCupContestId);
    throw new Error ()
  }

  // pull single contest data over to ryder cup
  ryderCup.contestIds.push(singleDayContest.id)
  ryderCup.leaderboard[singleDayContest.id] = {
    USA: 0,
    EUROPE: 0
  }

  const { 
    userIds,
    contestIds,
    teams: {
      USA,
      EUROPE
    },
  } = ryderCup;

  const userCollection = await userModel.getUserCollection();
  const userCursor = userCollection.find({ id: { $in: userIds }}, { projection: { firstName: 1, lastName: 1, id: 1 }});
  const userIdToDisplayName: { [id: string]: string } = {}
  await userCursor.forEach(u => {
    userIdToDisplayName[u.id] = `${u.firstName.slice(0, 1).toUpperCase()}. ${u.lastName.slice(0, 1).toUpperCase().concat(u.lastName.slice(1))}`
  })

  // pull userIds and change name to session
  singleDayContest.userIds = userIds;
  singleDayContest.name = `Session ${contestIds.length + 1}`;

  switch (singleDayContest.type) {
    case 'best-ball-match-play': {

      const teamMatchups: TeamMatchup[] = []
      const USAplayers = [ ...USA.players ];
      const EUROPEplayers = [ ...EUROPE.players ];

      while (USAplayers.length || EUROPEplayers.length) {
        teamMatchups.push({
          teams: {
            USA: {
              players: USAplayers.splice(0, 2)
            },
            EUROPE: {
              players: EUROPEplayers.splice(0, 2)
            },
          },
          leaderboard: {
            thru: 0,
            holesUp: 0,
            winningTeamName: '',
            losingTeamName: '',
            isDormi: false,
            isFinal: false
          }
        })
      }

      singleDayContest.teamMatchups = teamMatchups
      break;
    }
    case 'singles-match-play': {

      const singlesMatchups: SingleMatchup[] = [];
      const USAplayers = [ ...USA.players ];
      const EUROPEplayers = [ ...EUROPE.players ];

      while (USAplayers.length || EUROPEplayers.length) {
        singlesMatchups.push({
          teams: {
            USA: USAplayers[0],
            EUROPE: EUROPEplayers[0],
          },
          leaderboard: {
            thru: 0,
            holesUp: 0,
            winningPlayerId: '',
            losingPlayerId: '',
            isDormi: false,
            isFinal: false
          }
        })
        USAplayers.splice(0, 1)
        EUROPEplayers.splice(0, 1)
      }

      singleDayContest.singleMatchups = singlesMatchups
      break;
    }
    case 'individual-stroke-play': {    
      singleDayContest.players = [ ...USA.players, ...EUROPE.players ].map(player => {
        return {
          ...player,
          score: 0,
          thru: 0,
        }
      })
      break;
    }

    
  }
  await contestModel.replaceContests([ ryderCup ]);

  return singleDayContest;

}

// TODO clean this fucking method up jesus
const createContest = async (userId: string, contest: ContestCreation) => {

  let contestInput: ContestModel;
  switch (contest.type) {
    case 'ryder-cup':
      const ryderCupContest: RyderCupContest = {
        type: 'ryder-cup',
        contestIds: [],
        teams: {
          USA: {
            players: [],
            captain: {
              playerId: '',
              displayName: ''
            }
          },
          EUROPE: {
            players: [],
            captain: {
              playerId: '',
              displayName: ''
            }
          }
        },
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
        teamMatchups: [],
        id: v4(),
        adminIds: [ userId ],
        name: contest.name,
        status: 'queued',
        courseId: contest.courseId,
        scoringType: contest.scoringType,
        ryderCupContestId: contest.ryderCupContestId,
        userIds: [ userId ]
      }
      contestInput = await addRyderCupContestInfo(bestBallContest);
      break;
    }
    case 'singles-match-play':
      const singlesContest: SinglesMatchPlay = {
        type: 'singles-match-play',
        singleMatchups: [],
        id: v4(),
        adminIds: [ userId ],
        name: contest.name,
        status: 'queued',
        courseId: contest.courseId,
        scoringType: contest.scoringType,
        ryderCupContestId: contest.ryderCupContestId,
        userIds: [ userId ]
      }
      contestInput = await addRyderCupContestInfo(singlesContest)
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
      contestInput = await addRyderCupContestInfo(individualStrokeContest)
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
      const { 
        teams: { USA, EUROPE }, 
        userIds 
      } = contest;

      // add user to userIds
      userIds.push(userId)

      // make sure not in any teams
      if (userIds.includes(userId)) {
        logger.error('this user is already in a team', contestId, userId)
        throw new Error ()
      }

      const userCollection = await userModel.getUserCollection();
      const u = await userCollection.findOne({ id: userId }, { projection: { firstName: 1, lastName: 1 }});
      const displayName = `${u!.firstName.slice(0, 1).toUpperCase()}. ${u!.lastName.slice(0, 1).toUpperCase().concat(u!.lastName.slice(1))}`

      // add player to team and make captain if needed
      if (EUROPE.players.length < USA.players.length) {
        EUROPE.players.push({
          playerId: userId,
          teamName: 'EUROPE',
          displayName
        });
        if (!EUROPE.captain.playerId) EUROPE.captain = {
          playerId: userId,
          displayName
        }
      } else {
        USA.players.push({
          playerId: userId,
          teamName: 'USA',
          displayName
        });
        if (!USA.captain.playerId) USA.captain = {
          playerId: userId,
          displayName
        }
      } 

      const newChildContests: SingleDayContests[] = [];
      for (const cc of childContests) {
        newChildContests.push(await addRyderCupContestInfo(cc))
      }

      await contestModel.replaceContests(newChildContests)
      break;
    case 'single-day':
      // TODO
      break;
    }
  return await contestModel.getContest(contestId);
}

// const attachLeaderboardToContest = (contest: ContestModel): void => {
//   switch (contest.type) {
//     case 'ryder-cup':
//       const { contestIds, teams: [ team1Id, team2Id ] } = contest;
//       const ryderCupLeaderboard: { [contestId: string]: RyderCupLeaderboard } = {}
//       contestIds.forEach(contestId => {
//         ryderCupLeaderboard[contestId] = {
//           [team1Id.id]: 0,
//           [team2Id.id]: 0,
//         }
//       });
//       contest.leaderboard = ryderCupLeaderboard;
//       return;
//     case 'best-ball-match-play':
//       const { teamMatchups } = contest
//       const bestBallleaderboard: { [key: string]: BestBallMatchPlayLeaderboard } = {}
//       for (const matchupId in teamMatchups) {
//         bestBallleaderboard[matchupId] = {
//           thru: 0,
//           holesUp: 0,
//           winningteamName: '',
//           losingteamName: '',
//           isFinal: false,
//           isDormi: false
//         }
//       }
//       contest.leaderboard = bestBallleaderboard;
//       return;
//     case 'singles-match-play':
//       const { singleMatchups } = contest;
//       const singlesMatchPlayLeaderboard: { [key: string]: SinglesMatchPlayLeaderboard } = {}
//       for (const matchupId in singleMatchups) {
//         singlesMatchPlayLeaderboard[matchupId] = {
//           thru: 0,
//           holesUp: 0,
//           winningPlayerId: '',
//           losingPlayerId: '',
//           isFinal: false,
//           isDormi: false
//         }
//       }
//       contest.leaderboard = singlesMatchPlayLeaderboard;
//       return
//     case 'individual-stroke-play':
//       const { players } = contest
//       const individualStrokePlayLeaderboard: IndividualStrokePlayLeaderboard = players.map(player => {
//         return {
//           ...player,
//           score: 0
//         }
//       })
//       contest.leaderboard = individualStrokePlayLeaderboard
//       return;
//   }
// }

// const attachLeaderboardToContestData = (contestData: GetContest): void => {
//   switch (contestData.type) {
//     case 'single-day':
//       attachLeaderboardToContest(contestData.contest);
//       break;
//     case 'multi-day':
//       attachLeaderboardToContest(contestData.contest);
//       break;
//     default:
//       logger.error('dont know how to start contest type', contestData)
//       throw new Error ()
//   }
// }

const startContest = async (contestId: string): Promise<GetContest> => {

  // check contest status
  const contestData = await contestModel.getContest(contestId);
  if (contestData.contest.status !== 'queued') {
    logger.error('trying to start a contest that is not queued', contestId)
    throw new Error()
  }

  // do some validation here?


  if (contestData.type === 'single-day' && contestData.contest.ryderCupContestId) {
    const ryderCupContestData = await contestModel.getContest(contestData.contest.ryderCupContestId);
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