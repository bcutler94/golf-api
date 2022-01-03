import { v4 } from "uuid";
import contestModel, { BestBallMatchPlay, ContestModel, RyderCupContest, SinglesMatchPlay } from "../models/contest-model";


let amount = 100;
const myUserId = 'ec083151-e8bb-49a8-abb4-6b93bf000854'
const courseId = '4a33b3e8-fb52-499f-a7b5-a19f34444cd3'

const createContests = async () => {

  const ryderCupContests: RyderCupContest[] = [];

  for (let i = 0; i < amount; i++) {
    const ryder: RyderCupContest = {
      type: 'ryder-cup',
      id: v4(),
      contestIds: [],
      adminIds: [myUserId],
      name: 'Test Ryder' + i,
      status: 'queued',
      leaderboardId: null,
      teams: []
    }
    ryderCupContests.push(ryder)
  }

  const contests: ContestModel[] = [ ...ryderCupContests ];

  for (const ryder of ryderCupContests) {
    const bestBall: BestBallMatchPlay = {
      type: 'best-ball-match-play',
      id: v4(),
      adminIds: [myUserId],
      name: 'Test Best Ball',
      status: 'queued',
      leaderboardId: null,
      ryderCupContestId: ryder.id,
      courseId,
      scoringType: Math.random() < 0.5 ? 'gross' : 'net',
      teamMatchups: []
    }
    const singleMatch: SinglesMatchPlay = {
      type: 'singles-match-play',
      id: v4(),
      adminIds: [myUserId],
      name: 'Test Singles',
      status: 'queued',
      leaderboardId: null,
      ryderCupContestId: ryder.id,
      courseId,
      scoringType: Math.random() < 0.5 ? 'gross' : 'net',
      singleMatchups: []
    }
    contests.push(bestBall)
    contests.push(singleMatch)
  }

  const c = await contestModel.getContestCollection()
  await c.insertMany(contests)
}

export default createContests