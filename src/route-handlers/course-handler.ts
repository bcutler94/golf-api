import courseModel, { CourseModel } from "../models/course-model"

const getCourse = async (searchTerm: string): Promise<Array<CourseModel>> => {
  const cursor = await courseModel.searchCourse(searchTerm);
  return cursor.toArray()
}

export default {
  getCourse
}