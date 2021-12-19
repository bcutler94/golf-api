import database from "./data-layer/database";
import courseModel, { getCourseCollection } from "./models/course-model";
import ghinApi from "./networking/ghin-api";
import logger from "./util/logger";
import persistCourses from "./workers/persist-courses";



  

const scriptToRun = async () => {
  await database.startDB()
  // insert here below here
  console.time('1')
  const collection = await getCourseCollection();
  const cursor = await collection.find({});
  await cursor.forEach(course => {
    const { location: { state }, id } = course;
    collection.findOneAndUpdate({ id }, { $set: { 'location.state': state.slice(3) }})
  })
  console.timeEnd('1')
}

console.time('random')
scriptToRun()
  .then(() => {
    logger.info('done running rando')
    console.timeEnd('random')
  })