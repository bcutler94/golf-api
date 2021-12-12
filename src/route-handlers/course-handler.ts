import courseModel, {  CourseViews, CourseViewTypes } from "../models/course-model"

const getCourse = async <T extends CourseViewTypes>(searchTerm: string, view: CourseViewTypes): Promise<Array<CourseViews[T]>> => {
  const cursor = await courseModel.searchCourse(searchTerm, view);
  return cursor.toArray()
}

export default {
  getCourse
}