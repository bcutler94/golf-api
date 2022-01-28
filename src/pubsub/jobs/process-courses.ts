import { v4 } from "uuid";
import courseModel, { CourseModel, HoleInfo, RatingInfo, TeeInfo } from "../../models/course-model";
import ghinApi, { GetCourseInfoResponse, GHINCourse, GHINHole, GHINRating } from "../../networking/ghin-api";
import logger from "../../util/logger";

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

const processCourses = async (data: any) => {
  const { state } = data
  if (!state) throw new Error ('Must pass state to processCourses')
  const courses = await ghinApi.getCourses(state);
  const promises = courses.map( async (course) => {
    try {
      const courseInfo = await ghinApi.getCourseInfo(course.CourseID)
      await courseModel.createCourse(toCourseModel(course, courseInfo))
      logger.info(`succesfully persisted course ${course.CourseID} ${course.CourseName}`)
    } catch (e) {
      logger.error(`failed to persist course ${course.CourseID} ${course.CourseName}`)
    }
  })
  await Promise.all(promises)
}

export default processCourses