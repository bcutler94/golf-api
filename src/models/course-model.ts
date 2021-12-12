import { AggregationCursor, Db, WithId, Document } from 'mongodb';
import database from '../data-layer/database';
import logger from '../util/logger';
import { DeepPick } from "ts-deep-pick";


export const COURSE_VIEWS = [
  'search'
] as const;

export type CourseViewTypes = typeof COURSE_VIEWS[number];

export interface CourseSearchView {
  id: string
  fullName: string
  city: string
  state: string
}

export interface CourseViews {
  'search': CourseSearchView
}

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


const getCourseCollection = async () => {
  const db = await database.getGolfDB()
  return db.collection<CourseModel>('courses');
}

const addIndexes = async () => {
  try {
    const collection = await getCourseCollection()
    const result = await collection.createIndex({ fullName: 1 });
    logger.info('created index', result)
  } catch (e) {
    logger.error(`error adding index to course model`, e)
  }
}

addIndexes()


const createCourse = async (course: CourseModel): Promise<CourseModel> => {
  const collection = await getCourseCollection()
  const { ok } = await collection.findOneAndUpdate({ externalId: course.externalId }, { $set: course }, { upsert: true });
  if (ok) return course;
  throw new Error ('There was an error saving course Info ')
}


const searchCourse = async <T extends CourseViewTypes>(searchTerm: string, viewType: T): Promise<AggregationCursor<CourseViews[T]>> => {

  const collection = await getCourseCollection();

  const pipeline: Array<Document> = [
    { 
      $match: {
        fullName: {
          $regex: searchTerm, $options: 'i'
        }
      }
    }
  ]

  switch (viewType) {
    case 'search':
      pipeline.push({
        $project: {
          _id: 0,
          id: 1,
          fullName: 1,
          city: '$location.city',
          state: '$location.state'
        }
      })
      break;
  }

  pipeline.push({
    $limit: 10
  })

  const courses = await collection.aggregate<CourseViews[T]>(pipeline)
  return courses;
}

export default {
  createCourse,
  searchCourse
}