import { v4 } from "uuid";
import contestModel, { BestBallMatchPlay, ContestModel, ContestTypes, RyderCupContest, SinglesMatchPlay } from "../models/contest-model";
import courseModel from "../models/course-model";
import userModel from "../models/user-model";
import contestHandler, { ContestCreation } from "../route-handlers/contest-handler";
import courseHandler from "../route-handlers/course-handler";
import scorecardHandler from "../route-handlers/scorecard-handler";
import logger from "../util/logger";


const createRyderCupContest = async (): Promise<ContestModel> => {

  const collection = await userModel.getUserCollection();
  const users = await collection.find({ ghin: {$ne: '2617288' }}, { limit: 15 }).toArray();
  const team1users = users.slice(0, 7).map(u => u.id);
  const team2users = users.slice(7, 15).map(u => u.id);
  const me = await collection.findOne({ ghin: '2617288' })
  me?.id && team1users.push(me.id);

  return await contestModel.createContest({
    type: 'ryder-cup',
    teams: [
      { id: v4(), captainId: team1users[0], userIds: team1users, name: 'USA' },
      { id: v4(), captainId: team2users[0], userIds: team2users, name: "EUROPE" }
    ],
    leaderboard: {},
    contestIds: [],
    id: v4(),
    status: 'queued',
    adminIds: [],
    name: 'Ryder Test 1'
  })
}

const createContest = async (contestParams: ContestCreation) => {
  const collection = await userModel.getUserCollection();
  const me = await collection.findOne({ ghin: '2617288' })
  return await contestHandler.createContest(me?.id || '', contestParams);
}

const createDummyContest = async (types: ContestTypes[], withRyder: boolean) => {
  if (withRyder) {
    const rc = await createRyderCupContest();
    const cc = await courseModel.getCourseCollection();
    const [ { id: courseId, teeInfo } ] = await cc.find({}, { limit: 1, skip: Math.floor(Math.random() * 15000)}).toArray()
    const contests = types.map(type => createContest({ type, courseId, scoringType: 'net', name: `${type}`, ryderCupContestId: rc.id }));
    const childContests = await Promise.all(contests);

    logger.info(rc.type)
    if (rc.type !== 'ryder-cup') return;

    const playerIds = [ ...rc.teams[0].userIds, ...rc.teams[1].userIds ];
    for (const ccc of childContests) {
      for (const playerId of playerIds) {
        logger.info(ccc.id, playerId)
        await scorecardHandler.createScorecard(playerId, ccc.id, teeInfo[0].name, teeInfo[0].gender, courseId)
      }
    }
  }
  logger.info('done creating contests')
}

export default createDummyContest