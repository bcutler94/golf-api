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

const addRyderCupContestInfo = async (singleDayContest: SingleDayContests): Promise<SingleDayContests> => {

  const { ryderCupContestId } = singleDayContest;
  if (!ryderCupContestId) return singleDayContest;

  const ryderCup = await contestModel.getContestById(ryderCupContestId);
  if (ryderCup.type !== 'ryder-cup') {
    logger.error('trying to add rryder cup contest info but contest isnt ryder cup', ryderCupContestId);
    throw new Error ()
  }

  // pull single contest data over to ryder cup
  !ryderCup.contestIds.includes(singleDayContest.id) && ryderCup.contestIds.push(singleDayContest.id)
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
  singleDayContest.name = `Session ${contestIds.length}`;

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
        userIds: [  ]
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
        userIds: [ ]
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
        userIds: [ ]
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
        userIds: [ ]
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

      // make sure not in any teams
      if (userIds.includes(userId)) {
        logger.error('this user is already in a team', contestId, userId)
        throw new Error ()
      }

      // add user to userIds
      userIds.push(userId)

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

      await contestModel.replaceContests([ contest ])

      const newContests: ContestModel[] = [];
      for (const cc of childContests) {
        newContests.push(await addRyderCupContestInfo(cc))
      }

      await contestModel.replaceContests(newContests)
      break;
    case 'single-day':
      // TODO
      break;
    }
  return await contestModel.getContest(contestId);
}


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