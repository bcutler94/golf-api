import database from "./data-layer/database";
import courseModel, { getCourseCollection } from "./models/course-model";
import ghinApi from "./networking/ghin-api";
import logger from "./util/logger";
import persistCourses from "./workers/persist-courses";



  

const scriptToRun = async () => {
  await database.startDB()
  // insert here below here

  const data = await ghinApi.searchPlayers('ben cutler')

  console.log(data)

}

console.time('random')
scriptToRun()
  .then(() => {
    logger.info('done running rando')
    console.timeEnd('random')
  })