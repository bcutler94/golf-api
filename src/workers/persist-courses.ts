import { v4 } from "uuid";
import courseModel, { CourseModel, HoleInfo, TeeInfo } from "../models/course-model";
import ghinApi, { GetCourseInfoResponse, GHINCourse, GHINHole } from "../networking/ghin-api"
import logger from "../util/logger";

const stateAbbreviations = [
  'AL','AK','AS','AZ','AR','CA','CO','CT','DE','DC','FM','FL','GA',
  'GU','HI','ID','IL','IN','IA','KS','KY','LA','ME','MH','MD','MA',
  'MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND',
  'MP','OH','OK','OR','PW','PA','PR','RI','SC','SD','TN','TX','UT',
  'VT','VI','VA','WA','WV','WI','WY'
 ];

const toHoleInfo = (ghinHoles: Array<GHINHole>): Array<HoleInfo> =>  {
  return ghinHoles.map(hole => {
    return {
      number: hole.Number,
      length: hole.Number,
      par: hole.Par,
      handicap: hole.Allocation
    }
  })

}

const toTeeInfo = (courseInfo: GetCourseInfoResponse): Array<TeeInfo> => {
  const { TeeSets } = courseInfo;
  return TeeSets.map(set => {
    return {
      name: set.TeeSetRatingName,
      numHoles: set.HolesNumber,
      totalYardage: set.TotalYardage,
      totalMeters: set.TotalMeters,
      totalPar: set.TotalPar,
      gender: set.Gender,
      holeInfo: toHoleInfo(set.Holes)
    }
  })
}

const toCourseModel = (course: GHINCourse, courseInfo: GetCourseInfoResponse): CourseModel => {
  return {
    id: v4(),
    externalId: course.CourseID.toString(),
    courseName: course.CourseName,
    fullName: course.FullName,
    phoneNumber: course.Telephone,
    email: course.Email,
    teeInfo: toTeeInfo(courseInfo),
    season: {
      start: new Date (courseInfo.Season.SeasonStartDate),
      end: new Date (courseInfo.Season.SeasonEndDate),
      allYear: !!courseInfo.Season.IsAllYear
    },
    location: {
      latitude: course.GeoLocationLatitude,
      longitude: course.GeoLocationLongitude,
      address: course.Address1,
      state: course.State,
      zip: course.Zip,
      country: course.Country,
      city: course.City
    }
  }
}

const run = async () => {
  let successCount = 0;
  let errorCount = 0;
  for (const state of stateAbbreviations) {
    const courses = await ghinApi.getCourses(state);
    for (const course of courses) {
      try {
        const courseInfo = await ghinApi.getCourseInfo(course.CourseID.toString())
        await courseModel.createCourse(toCourseModel(course, courseInfo))
        // logger.info(`succesfully persisted course ${course.CourseID} ${course.CourseName}`)
        successCount++
      } catch (e) {
        // logger.error(`failed to persist course ${course.CourseID} ${course.CourseName}`)
        errorCount++
      }
    }
  }
  logger.info(`DONE, persisted ${successCount} out of ${successCount + errorCount} at ${(successCount / (successCount + errorCount)) * 100}%`)
}

export default {
  run
}