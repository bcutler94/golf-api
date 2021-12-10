import { WithId } from 'mongodb';
import db from '../data-layer/database';
import logger from '../util/logger';
// interface GetCourseInfoResponse {
//   Season: {
//     SeasonName: string
//     SeasonStartDate: string
//     SeasonEndDate: string
//     IsAllYear: string
//   }
//   TeeSets: Array<{
//     Ratings: Array<{
//       RatingType:	string
//       CourseRating:	number
//       SlopeRating:	number
//     }>
//     Holes: Array<{
//       Number:	number
//       HoleId:	number
//       Length:	number
//       Par:	number
//       Allocation:	number
//     }>
//     TeeSetRatingId:	number
//     TeeSetRatingName:	string
//     Gender:	string
//     HolesNumber:	number
//     TotalYardage:	number
//     TotalMeters:	number
//     LegacyCRPTeeId:	number
//     StrokeAllocation:	boolean
//     TotalPar:	number
//   }>
// }

export interface HoleInfo {
  number: number
  length: number
  par: number
  handicap: number
}

export interface TeeInfo {
  name: string
  numHoles: number
  totalYardage: number
  totalMeters: number
  totalPar: number
  gender: string
  holeInfo: Array<HoleInfo>
}

export interface CourseModel {
  id: string
  externalId: string
  courseName: string
  fullName: string
  phoneNumber: string
  email: string
  teeInfo: Array<TeeInfo>
  season: {
    start: Date
    end: Date
    allYear: boolean
  }
  location: {
    latitude: number
    longitude: number
    address: string
    city: string
    state: string
    zip: string
    country: string
  }

}

export type CourseModelObject = WithId<CourseModel>;

const getCourseCollection = db.collection<CourseModel>('courses');

const addIndexes = async () => {
  try {
    const result = await getCourseCollection.createIndex({ fullName: "text" }, { default_language: "english" });
    logger.info('created index', result)
  } catch (e) {
    logger.error(`error adding index to course model`, e)
  }
}


const createCourse = async (course: CourseModel): Promise<CourseModel> => {
  const { acknowledged } = await getCourseCollection.insertOne(course);
  if (acknowledged) return course;
  throw new Error ('There was an error saving course Info ')
}

// const 

// const searchCourse = async (searchTerm: string): Promise<Array<CourseModel>> => {
//   await getCourseCollection.aggregate([
//     {
//       $search
//     }
//   ])
// }

export default {
  addIndexes,
  createCourse
}