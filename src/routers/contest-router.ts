import { FastifyPluginCallback } from "fastify";
import { ContestModel, GetContest } from "../models/contest-model";
import contestHandler, { ContestCreation } from "../route-handlers/contest-handler";
import middleware from "../util/middleware";
import contestSchema from "../schemas/contest-schema";
import { APIResponse } from "../server";
import logger from "../util/logger";

/**
 * POST create contests
 */
interface POSTContest {
  Body: {
    contest: ContestCreation
  }
  Reply: APIResponse<{ contest: ContestModel }>
}

/**
 * GET user contests
 */
interface GETUserContests {
  Reply: APIResponse<{ contests: ContestModel[] }>
}

/**
 * GET contest
 */

interface GETContest {
  Params: { contestId: string }
  Reply: APIResponse<GetContest>
}

/**
 * PATCH join a team on contest
 */

 interface PATCHContestTeam {
  Params: {
    contestId: string
    teamId: string
  }
  Reply: APIResponse<GetContest>
}

/**
 * PATCH start contest
 */

interface PATCHStartContest {
  Params: {
    contestId: string
  },
  Reply: APIResponse<GetContest>
}


/**
 * GET ryder cup contests
 */

// interface GetRyderCupContests { 
//   contest: ContestModel[] 
// }
// interface GETRyderCupContests {
//   Params: {
//     ryderCupContestId: string
//   },
//   Reply: APIResponse<GetRyderCupContests>
// }



/**
 * GET contest scorecards
 */

// interface GetScorecardReply {
//   scorecard: ScorecardModel | null
// }
// interface GETContestScorecard {
//   Params: {
//     contestId: string
//   },
//   Reply: APIResponse<GetScorecardReply>
// }

/**
 * POST create contest scorecard
 */
// interface PostScorecardReply {
//   scorecard: ScorecardModel
// }

// interface POSTContestScorecard {
//   Params: {
//     contestId: string
//   },
//   Reply: APIResponse<PostScorecardReply>
// }

/**
 * GET contest course
 */
// interface GetContestCourseReply {
//   course: CourseModel
// }

// interface GETContestCourse {
//   Params: {
//     contestId: string
//   },
//   Reply: APIResponse<GetContestCourseReply>
// }




const contestRouter: FastifyPluginCallback = async (server) => {

  server.route<POSTContest>({
    method: 'POST',
    url: '/contest',
    preValidation: [middleware.verifyUser],
    schema: contestSchema.postContest.schema,
    handler: async (req) => {
      try {
        const { body: { contest }, user: { userId } } = req;
        const contestModel = await contestHandler.createContest(userId, contest);
        logger.info('success POST /contest', userId)
        return { data: { contest: contestModel }, success: true }
      } catch (e) {
        logger.error('error POST /contest', e)
        return { success: false, errorMessage: e instanceof Error ? e.message : 'An error occurred' }
      }
    }
  });

  server.route<GETUserContests>({
    method: 'GET',
    url: '/contests',
    preValidation: [middleware.verifyUser],
    schema: contestSchema.getUserContests.schema,
    handler: async (req) => {
      try {
        const { user: { userId } } = req;
        const contests = await contestHandler.getUserContests(userId)
        logger.info('success GET /contests')
        return { 
          success: true, 
          data: { contests } 
        }
      } catch (e) {
        logger.error('error POST /contest', e)
        return { 
          success: false, 
          errorMessage: e instanceof Error ? e.message : 'An error occurred' 
        }
      }
    }
  })

  server.route<GETContest>({
    method: 'GET',
    url: '/contests/:contestId',
    preValidation: [middleware.verifyUser],
    schema: contestSchema.getContest.schema,
    handler: async (req) => {
      try {
        const { params: { contestId } } = req;
        const data = await contestHandler.getContest(contestId)
        logger.info('success GET /contests/:contestId')
        return { 
          success: true, 
          data 
        }
      } catch (e) {
        logger.error('error GET /contests/:contestId', e)
        return { 
          success: false, 
          errorMessage: e instanceof Error ? e.message : 'An error occurred' 
        }
      }
    }
  })


  server.route<PATCHContestTeam>({
    method: 'PATCH',
    url: '/contests/:contestId/team',
    preValidation: [middleware.verifyUser],
    schema: contestSchema.patchContestTeam.schema,
    handler: async (req) => {
      try {
        const { params: { contestId }, user: { userId } } = req;
        const data = await contestHandler.joinTeam(contestId, userId);
        logger.info('success PATCH /contests/:contestId/team', contestId)
        return { data, success: true }
      } catch (e) {
        logger.error('error success PATCH /contests/:contestId/team', e)
        return { success: false, errorMessage: e instanceof Error ? e.message : 'An error occurred' }
      }
    }
  });

  server.route<PATCHStartContest>({
    method: 'PATCH',
    url: '/contests/:contestId/start',
    preValidation: [middleware.verifyUser],
    schema: contestSchema.patchStartContest.schema,
    handler: async (req) => {
      try {
        const { params: { contestId } } = req;
        const data = await contestHandler.startContest(contestId);
        logger.info('success POST /contest/:contestId/start', contestId)
        return { data, success: true }
      } catch (e) {
        logger.error('error POST /contest', e)
        return { success: false, errorMessage: e instanceof Error ? e.message : 'An error occurred' }
      }
    }
  });

  // server.route({
  //   method: 'GET',
  //   url: '/contests/stream',
  //   preValidation: [middleware.verifyUser],
  //   schema: contestSchema.getUserContests.schema,
  //   handler: async (req, rep) => {
  //     try {
  //       const { user: { userId } } = req;
  //       const contests = await contestHandler.getUserContestsStream(userId)
  //       logger.info('success GET /contests')
  //       contests.stream().on('data', (d) => {
  //         rep.raw()
  //       })

  //       return { 
  //         success: true, 
  //         data: { contests } 
  //       }
  //     } catch (e) {
  //       logger.error('error POST /contest', e)
  //       return { 
  //         success: false, 
  //         errorMessage: e instanceof Error ? e.message : 'An error occurred' 
  //       }
  //     }
  //   }
  // })

  // server.route<GETRyderCupContests>({
  //   method: 'GET',
  //   url: '/contests/:ryderCupContestId/ryderCup',
  //   preValidation: [middleware.verifyUser],
  //   schema: contestSchema.getChildContests.schema,
  //   handler: async (req, rep) => {
  //     try {
  //       const { params: { ryderCupContestId } } = req;
  //       const contest = await contestHandler.getRyderCupContests(ryderCupContestId);
  //       logger.info('success GET /contests/:contestId/children', ryderCupContestId)
  //       return {
  //         success: true,
  //         data: {
  //           contest
  //         }
  //       }
  //     } catch (e) {
  //       logger.error('error POST /contests/:contestId/children', e)
  //       return {
  //         success: false,
  //         errorMessage: e instanceof Error ? e.message : 'An error occurred' 
  //       }
  //     }
  //   }
  // })



  // server.route<GETContestScorecard>({
  //   method: 'GET',
  //   url: '/contests/:contestId/scorecard',
  //   preValidation: [middleware.verifyUser],
  //   schema: contestSchema.getContestScorecard.schema,
  //   handler: async (req) => {
  //     try {
  //       const { params: { contestId }, user: { userId } } = req;
  //       const scorecard = await contestHandler.getScorecard(contestId, userId)
  //       logger.info('success GET /contests/:contestId/scorecard', contestId, userId)
  //       return {
  //         success: true,
  //         data: {
  //           scorecard
  //         }
  //       }
  //     } catch (e) {
  //       logger.error('error GET /contests/:contestId/scorecard', e)
  //       return {
  //         success: false,
  //         errorMessage: e instanceof Error ? e.message : 'An error occurred' 
  //       }
  //     }
  //   }
  // })

  // server.route<POSTContestScorecard>({
  //   method: 'POST',
  //   url: '/contests/:contestId/scorecard',
  //   preValidation: [middleware.verifyUser],
  //   schema: contestSchema.postContestScorecard.schema,
  //   handler: async (req) => {
  //     try {
  //       const { params: { contestId }, user: { userId } } = req;
  //       const scorecard = await contestHandler.createScorecard(contestId, userId)
  //       logger.info('success POST /contests/:contestId/scorecard', contestId, userId, scorecard)
  //       return {
  //         success: true,
  //         data: {
  //           scorecard
  //         }
  //       }
  //     } catch (e) {
  //       logger.error('error POST /contests/:contestId/scorecard', e)
  //       return {
  //         success: false,
  //         errorMessage: e instanceof Error ? e.message : 'An error occurred' 
  //       }
  //     }
  //   }
  // })

  // server.route<GETContestCourse>({
  //   method: 'GET',
  //   url: '/contests/:contestId/course',
  //   preValidation: [middleware.verifyUser],
  //   schema: contestSchema.getContestScorecard.schema,
  //   handler: async (req) => {
  //     try {
  //       const { params: { contestId } } = req;
  //       const course = await contestHandler.getCourse(contestId)
  //       logger.info('success GET /contests/:contestId/course', contestId)
  //       return {
  //         success: true,
  //         data: {
  //           course
  //         }
  //       }
  //     } catch (e) {
  //       logger.error('success GET /contests/:contestId/course', e)
  //       return {
  //         success: false,
  //         errorMessage: e instanceof Error ? e.message : 'An error occurred' 
  //       }
  //     }
  //   }
  // })

}

export default contestRouter;