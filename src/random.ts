import database from "./data-layer/database";
import ghinApi from "./networking/ghin-api";
import logger from "./util/logger";
import persistCourses from "./workers/persist-courses";



  

const scriptToRun = async () => {
  await database.startDB()
  // insert here below here
  await persistCourses.run()
}

scriptToRun()
  .then(() => logger.info('done running rando'))