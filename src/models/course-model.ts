import { Db, WithId } from 'mongodb';
import database from '../data-layer/database';
import logger from '../util/logger';

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

const getCourseCollection = database.db.collection<CourseModel>('courses');

const addIndexes = async () => {
  try {
    const result = await getCourseCollection.createIndex({ fullName: "text" }, { default_language: "english" });
    logger.info('created index', result)
  } catch (e) {
    logger.error(`error adding index to course model`, e)
  }
}


const createCourse = async (course: CourseModel): Promise<CourseModel> => {
  const { ok } = await getCourseCollection.findOneAndUpdate({ externalId: course.externalId }, { $set: course }, { upsert: true });
  if (ok) return course;
  throw new Error ('There was an error saving course Info ')
}


export default {
  addIndexes,
  createCourse
}