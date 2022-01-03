import { AnyBulkWriteOperation, IndexSpecification } from "mongodb";
import { v4 } from "uuid"
import database from "../data-layer/database";
import contestModel, { BestBallMatchPlay, ContestModel, ContestTypes, IndividualStrokePlay, RyderCupContest, ScoringTypes, SinglesMatchPlay } from "../models/contest-model"
import { CourseModel } from "../models/course-model";
import scorecardModel, { ScorecardModel } from "../models/scorecard-model";
interface ContestCreationBase {
  type: ContestTypes
  name: string
}
interface RyderCupCreation extends ContestCreationBase {
  type: 'ryder-cup'
}
interface BestBallCreation extends ContestCreationBase {
  type: 'best-ball-match-play'
  courseId: string
  scoringType: ScoringTypes
  ryderCupContestId?: string
}
interface SinglesCreation extends ContestCreationBase {
  type: 'singles-match-play'
  courseId: string
  scoringType: ScoringTypes
  ryderCupContestId?: string
}
interface IndividualStrokeCreation extends ContestCreationBase {
  type: 'individual-stroke-play'
  courseId: string
  scoringType: ScoringTypes
  ryderCupContestId?: string
}

export type ContestCreation = RyderCupCreation | BestBallCreation | SinglesCreation | IndividualStrokeCreation

const createContests = async (userId: string, contests: ContestCreation[]) => {

  const contestModels: ContestModel[] = contests.map((contest) => {
    switch (contest.type) {
      case 'ryder-cup':
        const ryderCupContest: RyderCupContest = {
          type: 'ryder-cup',
          contestIds: [],
          teams: [],
          id: v4(),
          adminIds: [ userId ],
          name: contest.name,
          status: 'queued',
          leaderboardId: null
        }
        return ryderCupContest;
      case 'best-ball-match-play':
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
        return bestBallContest;
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
        return singlesContest
      case 'individual-stroke-play':
        const individualStrokeContest: IndividualStrokePlay = {
          type: 'individual-stroke-play',
          userIds: [],
          id: v4(),
          adminIds: [ userId ],
          name: contest.name,
          status: 'queued',
          leaderboardId: null,
          courseId: contest.courseId,
          scoringType: contest.scoringType,
          ryderCupContestId: contest.ryderCupContestId
        }
        return individualStrokeContest
    }
  })

  return await contestModel.createContests(contestModels)
}

// const createIndividualStrokePlayContest = async ()



// const createContests = async (userId: string, contests: Contest[]) => {

//   const participants: Participants = {
//     'ryder-cup': {
//       homeTeam: {
//         name: 'USA',
//         captainId: '',
//         playerIds: []
//       },
//       awayTeam: {
//         name: 'EUROPE',
//         captainId: '',
//         playerIds: []
//       }
//     },
//     'individual-stroke-play': {
//       playerIds: []
//     },
//     'best-ball-match-play': {
//       matchups: []
//     },
//     'singles-match-play': {
//       matchups: []
//     }
//   }


//   if (contests.length > 1) {

//     const [ parentContest, ...childrenContests ] = contests;

//     const parentContestId = v4();

//     const parentContestInput: ContestModel<'ryder-cup'> = {
//       type: 'parent',
//       id: parentContestId,
//       adminId: userId,
//       name: parentContest.name,
//       participantType: 'ryder-cup',
//       participants: participants['ryder-cup'],
//       childContestIds: [],
//       status: 'queued',
//       leaderboardId: null
//     }

//     const childrenContestInputs: ContestModel[] = childrenContests.map(contest => {
//       const id = v4();
//       parentContestInput.childContestIds?.push(id);
//       return {
//         type: 'child',
//         id,
//         status: 'queued',
//         adminId: userId,
//         courseId: contest.course.id,
//         name: contest.name,
//         parentContestId,
//         participantType: parentContest.participantType,
//         participants: participants[parentContest.participantType],
//         scoringType: contest.scoringType,
//         leaderboardId: null,
//       }
//     });

//     return await contestModel.createContests([ parentContestInput, ...childrenContestInputs ])

//   } else {

//     const [ singleContest ] = contests;

//     const singleContestInput: ContestModel<typeof singleContest.participantType> = {
//       type: 'single',
//       id: v4(),
//       status: 'queued',
//       adminId: userId,
//       name: singleContest.name,
//       courseId: singleContest.course.id,
//       participantType: singleContest.participantType,
//       participants: participants[singleContest.participantType],
//       scoringType: singleContest.scoringType,
//       leaderboardId: null,
//     }

//     return await contestModel.createContests([ singleContestInput ]);

//   }
// }

// const getContest = async (contestId: string): Promise<ContestModelObject<ResultTypes, ParticipantTypes>> => {
//   return await contestModel.getContest(contestId)
// }

const getUserContests = async (userId: string): Promise<ContestModel[]> => {
  return await contestModel.getUserContests(userId);
}

const getRyderCupContests = async (ryderCupContestId: string): Promise<ContestModel[]> => {
  return await contestModel.getRyderCupContests(ryderCupContestId);
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

const getCourse = async (contestId: string): Promise<CourseModel> => {
  return await contestModel.getContestCourse(contestId)
}

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
  createContests,
  // getContest,
  getUserContests,
  // getChildContests,
  // startContest,
  getScorecard,
  // createScorecard,
  getCourse,
  getRyderCupContests,
  // getUserContestsStream
  // joinContest
}