import { v4 } from "uuid";
import courseModel, { CourseModel, HoleInfo, RatingInfo, TeeInfo } from "../models/course-model";
import ghinApi, { GetCourseInfoResponse, GHINAssociationCourse, GHINCourse, GHINHole, GHINRating } from "../networking/ghin-api"
import pubsub, { JOB_NAMES } from "../pubsub/pubsub";
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
      length: hole.Length,
      par: hole.Par,
      handicap: hole.Allocation
    }
  })
}

const toRatingInfo = (ghinRating: Array<GHINRating>): Array<RatingInfo> =>  {
  // @ts-ignore
  return ghinRating.map(rating => {
    return {
      type: rating.RatingType,
      courseRating: rating.CourseRating,
      slopeRating: rating.SlopeRating,
      bogeyRating: rating.BogeyRating
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
      holeInfo: toHoleInfo(set.Holes),
      ratingInfo: toRatingInfo(set.Ratings)
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

const toCourseModelV2 = (course: GHINAssociationCourse, courseInfo: GetCourseInfoResponse): CourseModel => {
  return {
    id: v4(),
    externalId: course.id.toString(),
    courseName: course.short_name,
    fullName: course.short_name,
    phoneNumber: course.phone,
    email: course.email,
    teeInfo: toTeeInfo(courseInfo),
    season: {
      start: new Date (courseInfo.Season.SeasonStartDate),
      end: new Date (courseInfo.Season.SeasonEndDate),
      allYear: !!courseInfo.Season.IsAllYear
    },
    location: {
      latitude: null,
      longitude: null,
      address: null,
      state: course.state,
      zip: null,
      country: 'USA',
      city: course.city
    }
  }
}

const run = async () => {
  let successCount = 0;
  let errorCount = 0;
  for (const state of stateAbbreviations) {
    const courses = await ghinApi.getCourses(state);
    const promises = courses.map( async (course) => {
      try {
        const courseInfo = await ghinApi.getCourseInfo(course.CourseID)
        await courseModel.createCourse(toCourseModel(course, courseInfo))
        logger.info(`succesfully persisted course ${course.CourseID} ${course.CourseName}`)
        successCount++
      } catch (e) {
        logger.error(`failed to persist course ${course.CourseID} ${course.CourseName}`)
        errorCount++
      }
    })
    await Promise.all(promises)
  }
  logger.info(`DONE, persisted ${successCount} out of ${successCount + errorCount} at ${(successCount / (successCount + errorCount)) * 100}%`)
}

const runV2 = async () => {
  const associations = await ghinApi.getAssociations();
  for (const { id } of associations) {
    const courses = await ghinApi.getAssociationCourses(id);
    for (const course of courses) {
      const courseInfo = await ghinApi.getCourseInfo(id)
      await courseModel.createCourse(toCourseModelV2(course, courseInfo))
      logger.info(`succesfully persisted course ${course.id} ${course.short_name}`)
    }
  }
}

const runV3 = async () => {
  const agenda = await pubsub.getPubSub();
  console.log(stateAbbreviations.length)
  for (const state of stateAbbreviations) {
    await agenda.now(JOB_NAMES.processCourses, { state })
  }
}

export default {
  runV2,
  run,
  runV3 
}