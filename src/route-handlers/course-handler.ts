import courseModel, {  CourseTeeView, CourseViews, CourseViewTypes } from "../models/course-model"

const getCourse = async <T extends CourseViewTypes>(searchTerm: string, view: CourseViewTypes): Promise<Array<CourseViews[T]>> => {
  const cursor = await courseModel.searchCourse(searchTerm, view);
  return cursor.toArray()
}

const getTees = async (courseId: string): Promise<CourseTeeView> => {
  return await courseModel.getTees(courseId)
}

export default {
  getCourse,
  getTees
}