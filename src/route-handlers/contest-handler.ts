import { AnyBulkWriteOperation, IndexSpecification } from "mongodb";
import { v4 } from "uuid"
import database from "../data-layer/database";
import contestModel, { BestBallMatchPlay, ContestModel, ContestTypes, GetContest, IndividualStrokePlay, RyderCupContest, ScoringTypes, SingleDayContests, SingleMatchup, SinglesMatchPlay, TeamMatchup } from "../models/contest-model"
import { CourseModel } from "../models/course-model";
import scorecardModel, { ScorecardModel } from "../models/scorecard-model";
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

  const { type } = contest;
  switch (type) {
    case 'individual-stroke-play':
      const { players } = contest
      players.push({ player: userId, teamId });
      return contest;
    case 'singles-match-play':
      const { singleMatchups } = contest;

      // try and add player to team matchup that may not have a player yet
      let addedSinglePlayer = false;
      for (const [ player1, player2 ] of singleMatchups) {
        if (player1.teamId === teamId) {
          if (!player1.player) {
            player1.player = userId;
            addedSinglePlayer = true
            break;
          }
        } else {
          if (!player2.player) {
            player2.player = userId;
            addedSinglePlayer = true
            break;
          }
        }
      }

      // otherwise just create new entry and add player
      if (!addedSinglePlayer) {
        singleMatchups[singleMatchups.length] = [
          { player: userId, teamId },
          { player: '', teamId: otherTeamId }
        ]
      }

      return contest;

    case 'best-ball-match-play':
      const { teamMatchups } = contest;

      // try and add player to team matchup that may not have a player yet
      let addedTeamPlayer = false;
      for (const [ team1, team2 ] of teamMatchups) {
        if (team1.teamId === teamId) {
          if (!team1.player1) {
            team1.player1 = userId;
            addedTeamPlayer = true
            break;
          }
          if (!team2.player1) {
            team2.player1 = userId;
            addedTeamPlayer = true;
            break;
          }
        } else {
          if (!team1.player1) {
            team1.player1 = userId;
            addedTeamPlayer = true;
            break;
          }
          if (!team2.player1) {
            team2.player1 = userId;
            addedTeamPlayer = true;
            break;
          }
        }
      }

      // otherwise just create new entry and add player
      if (!addedTeamPlayer) {
        teamMatchups[teamMatchups.length] = [
          { player1: userId, player2: '', teamId },
          { player1: '', player2: '', teamId: otherTeamId },
        ]
      }
      return contest;

  }
}


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
        leaderboardId: null
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
        leaderboardId: null,
        courseId: contest.courseId,
        scoringType: contest.scoringType,
        ryderCupContestId: contest.ryderCupContestId
      }

      // pull ryder contest info if it exists
      if (contest.ryderCupContestId) {
        const contestData = await contestModel.getContest(contest.ryderCupContestId);
        switch (contestData.type) {
          case 'multi-day':
            const { 
              contest: { teams: [ team1, team2 ] }, 
              childContests 
            } = contestData;

            // add name
            bestBallContest.name = `Session ${childContests.length + 1}`;

            // build teams
            const team1userIds = [ ...team1.userIds ];
            const team2userIds = [ ...team2.userIds ];
            const teamMatchups: TeamMatchup[] = []
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
                { player1: team1player1, player2: team1player2, teamId: team1.id },
                { player1: team2player1, player2: team2player2, teamId: team2.id }
              ];

              teamMatchups.push(teamMatchup)
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
        singleMatchups: [],
        id: v4(),
        adminIds: [ userId ],
        name: contest.name,
        status: 'queued',
        leaderboardId: null,
        courseId: contest.courseId,
        scoringType: contest.scoringType,
        ryderCupContestId: contest.ryderCupContestId
      }

      // pull ryder contest info if it exists
      if (contest.ryderCupContestId) {
        const contestData = await contestModel.getContest(contest.ryderCupContestId);
        switch (contestData.type) {
          case 'multi-day':
            const { 
              contest: { teams: [ team1, team2 ] }, 
              childContests 
            } = contestData;

            // add name
            singlesContest.name = `Session ${childContests.length + 1}`;

            // build teams
            const team1userIds = [ ...team1.userIds ];
            const team2userIds = [ ...team2.userIds ];
            const singleMatchups: SingleMatchup[] = []
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
                { player: team1player1, teamId: team1.id },
                { player: team2player1, teamId: team2.id },
              ];

              singleMatchups.push(singleMatchup)
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
        leaderboardId: null,
        courseId: contest.courseId,
        scoringType: contest.scoringType,
        ryderCupContestId: contest.ryderCupContestId
      }
      // pull ryder contest info if it exists
      if (contest.ryderCupContestId) {
        const contestData = await contestModel.getContest(contest.ryderCupContestId);
        switch (contestData.type) {
          case 'multi-day':
            const { 
              contest: { teams: [ team1, team2 ] }, 
              childContests 
            } = contestData;

            // add name
            individualStrokeContest.name = `Session ${childContests.length + 1}`;

            // build players
            const team1players = team1.userIds.map((player) => ({ player, teamId: team1.id }))
            const team2players = team2.userIds.map((player) => ({ player, teamId: team2.id }))
            console.log('THIS IS THE TEAM', team1, team2)
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
      const { teams } = contest;

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





// const startContest = async (contestId: string): Promise<void> => {
//   const client = await database.getClient();
//   const session = client.startSession();
//   try {
//     // this doesn't need to be transaction but i thought it might have to be so im just leaving this for now
//     await session.withTransaction( async () => {

//       const contestCollection = await contestModel.getContestCollection();

//       // get contest status to make sure we can do shit with it
//       const contest = await contestCollection.findOne({ id: contestId }, { session })
//       if (!contest) {
//         logger.error(`this contest [${contestId}] doesn't exist`)
//         await session.abortTransaction()
//         return null;
//       }
//       if (contest.status !== 'queued') {
//         logger.error(`this contest [${contestId}] doesnt't have a status of queued so we can't start it`)
//         await session.abortTransaction()
//         return null;
//       }
//       if (contest.type === 'parent') {
//         logger.error(`this contest [${contestId}] can't start because it's a parent contest`)
//         await session.abortTransaction()
//         return null;
//       }

      
//       if (contest.type === 'child') {

//         // TODO make sure that no other children contests are active

//         // make parent contest active
//         const { modifiedCount } = await contestCollection.updateOne({ id: contest.parentContestId }, { $set: { status: 'active' } }, { session });
//         if (!modifiedCount) {
//           await session.abortTransaction();
//           logger.info(`this contest [${contestId}] error when updating the status`)
//           return null
//         }
//       }
//       // make contest active
//       const { modifiedCount } = await contestCollection.updateOne({ id: contestId }, { $set: { status: 'active' } }, { session });
//       if (!modifiedCount) {
//         await session.abortTransaction();
//         logger.info(`this contest [${contestId}] error when updating the status`)
//         return null
//       }

//     });
//   } catch (e) {
//     logger.error('there was an error committing session to create contest', e);
//     throw e
//   } finally {
//     await session.endSession()
//   }
// }

const getScorecard = async (contestId: string, userId: string): Promise<ScorecardModel | null> => {
  return await scorecardModel.getScorecard(contestId, userId)
}

// const createScorecard = async (contestId: string, userId: string): Promise<ScorecardModel> => {
//   const courseId = await contestModel.getCourseId(contestId);
//   const scorecardInput: ScorecardModel = {
//     id: v4(),
//     participantId: userId,
//     type: 'player',
//     contestId,
//     scores: [],
//     tees: null,
//     courseHandicap: null,
//     gender: null,
//     courseId
//   }
//   return await scorecardModel.createScorecard(scorecardInput)
// }

// const getCourse = async (contestId: string): Promise<CourseModel> => {
//   return await contestModel.getContestCourse(contestId)
// }

// const joinContest = async (contestId: string, userId: string, teamName: string): Promise<ContestWithChildren> => {

//   const { 
//     participants: { 
//       awayTeam: { name: awayTeam, playerIds: awayIds }, 
//       homeTeam: { name: homeTeam, playerIds: homeIds } 
//     },
//     childContests
//   } = await getChildContests(contestId)

//   const collection = await contestModel.getContestCollection();

//   const batchUpdates: AnyBulkWriteOperation<ContestModel>[] = [];
//   switch (teamName) {
//     case awayTeam:
//       batchUpdates.push({ updateOne: { filter: { id: contestId }, update: { $push: { 'participants.homeTeam.playerIds': userId }}}});
//       childContests.forEach(contest => {
//         switch(contest.participantType) {
//           case 'best-ball-match-play':
//             contest.participants
//             break;
//         }
//       })
//       break;
//     case homeTeam:
//       await collection.updateOne({ id: contestId }, { $push: { 'participants.homeTeam.playerIds': userId } })
//       break;
//     default:
//       logger.error(`the teamName can't be found on contestId [${contestId}] for userId [${userId}] for teamName [${teamName}]`)
//       throw new Error ('Something went wrong joining a team. Please try again later.')
//   }

//   return await getChildContests(contestId)
// }

export default {
  createContest,
  getContest,
  getUserContests,
  joinTeam,
  // getChildContests,
  // startContest,
  // getScorecard,
  // createScorecard,
  // getCourse,
  // getRyderCupContests,
  // getUserContestsStream

}