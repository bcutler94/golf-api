import { AggregationCursor, Db, WithId, Document, IndexDescription } from 'mongodb';
import database from '../data-layer/database';
import logger from '../util/logger';

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

export interface CourseTeeView {
  teeInfo: { name: string, totalYardage: number, totalPar: number, gender: string }[]
  courseName: string
}

export interface CourseViews {
  'search': CourseSearchView
  'tees': CourseTeeView
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
    latitude: number | null
    longitude: number | null
    address: string | null
    city: string | null
    state: string
    zip: string | null
    country: string
  }
}

export type CourseModelObject = WithId<CourseModel>;


const getCourseCollection = async () => {
  const db = await database.getGolfDB()
  return db.collection<CourseModel>('courses');
}

const COURSE_INDEXES: IndexDescription[] = [
  {
    key: { fullName: 'text' }
  },
  {
    key: { 'location.geo': '2dsphere' }
  }
]

const addIndexes = async () => {
  try {
    const collection = await getCourseCollection()
    const result = await collection.createIndexes(COURSE_INDEXES);
    logger.info('created contest indexes', result)
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
        $text: {
            $search: "\"" + searchTerm + "\"", 
            $caseSensitive: false
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

const getTees = async (courseId: string): Promise<CourseTeeView> => {
  const collection = await getCourseCollection();
  const course = await collection.findOne({ id: courseId }, { projection: { courseName: 1, teeInfo: { totalYardage: 1, totalPar: 1, name: 1, gender: 1 } }})
  if (!course) {
    logger.error(`there was an error getting tee info for courseId ${courseId}`)
    throw new Error ("We couldn't find the tee set information for the course you are playing. Please try again later.");
  }
  return {
    teeInfo: course.teeInfo,
    courseName: course.courseName
  }
}

export default {
  createCourse,
  searchCourse,
  getTees,
  getCourseCollection
}