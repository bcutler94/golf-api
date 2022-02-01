import { v4 } from "uuid";
import contestModel, { BestBallMatchPlay, ContestModel, ContestTypes, RyderCupContest, SinglesMatchPlay } from "../models/contest-model";
import courseModel from "../models/course-model";
import userModel from "../models/user-model";
import contestHandler, { ContestCreation } from "../route-handlers/contest-handler";
import courseHandler from "../route-handlers/course-handler";
import scorecardHandler from "../route-handlers/scorecard-handler";
import logger from "../util/logger";


// const createRyderCupContest = async (): Promise<RyderCupContest> => {

//   // const collection = await userModel.getUserCollection();
//   // const users = await collection.find({ ghin: {$ne: '2617288' }}, { limit: 15 }).toArray();
//   // const team1users = users.slice(0, 7).map(u => u.id);
//   // const team2users = users.slice(7, 15).map(u => u.id);
//   // const me = await collection.findOne({ ghin: '2617288' })
//   // me?.id && team1users.push(me.id);

//   // return await contestModel.createContest({
//   //   type: 'ryder-cup',
//   //   teams: [
//   //     { id: v4(), captainId: '', userIds: [], name: 'USA' },
//   //     { id: v4(), captainId: '', userIds: [], name: "EUROPE" }
//   //   ],
//   //   leaderboard: {},
//   //   contestIds: [],
//   //   id: v4(),
//   //   status: 'queued',
//   //   adminIds: [],
//   //   name: 'Ryder Test 1',
//   //   userIds: []
//   // }) as RyderCupContest
// }

const createContest = async (contestParams: ContestCreation) => {
  const collection = await userModel.getUserCollection();
  const me = await collection.findOne({ ghin: '2617288' })
  return await contestHandler.createContest(me?.id || '', contestParams);
}

// const createDummyContest = async (types: ContestTypes[], withRyder: boolean) => {

//   // create ryder cup contest
//   const rc = await createRyderCupContest();

//   // get random course
//   const cc = await courseModel.getCourseCollection();
//   const [ { id: courseId, teeInfo } ] = await cc.find({}, { limit: 1, skip: Math.floor(Math.random() * 15000)}).toArray()

//   // create child contests
//   let childContests = [];
//   for (const type of types) {
//     childContests.push(
//       await createContest({ type, courseId, scoringType: 'net', name: `${type}`, ryderCupContestId: rc.id })
//     )
//   }

//   // get users for contest
//   const collection = await userModel.getUserCollection();
//   const users = await collection.find({ ghin: { $ne: '2617288' } }, { limit: 15 }).toArray();
//   const me = await collection.findOne({ ghin: '2617288' });

//   // joini those users into contest
//   for (const u of [ me, ...users ]) {
//     await contestHandler.joinTeam(rc.id, u!.id)
//   }

//   // start contests
//   for (const child of childContests) {
//     await contestHandler.startContest(child.id)
//   }


//   // create scorecards
//   const p = await Promise.all(
//     childContests
//       .map(c => Promise.all(
//         [ me, ...users ].map( u=> scorecardHandler.createScorecard(u!.id, c.id, teeInfo[0].name, teeInfo[0].gender, courseId))
//       )
//     )
//   )


//   logger.info('done creating contests')
// }

// export default createDummyContest