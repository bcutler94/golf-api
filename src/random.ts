import database from "./data-layer/database";
import courseModel from "./models/course-model";
import ghinApi from "./networking/ghin-api";
import logger from "./util/logger";
import persistCourses from "./workers/persist-courses";



  

const scriptToRun = async () => {
  await database.startDB()
  // insert here below here
  // await persistCourses.run()
  const docs = await courseModel.searchCourse('a', 'search');
  await docs.forEach((doc) => logger.info(doc))
}

console.time('random')
scriptToRun()
  .then(() => {
    logger.info('done running rando')
    console.timeEnd('random')
  })