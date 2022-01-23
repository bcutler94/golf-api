import courseModel, { CourseByTees, CourseModel, CourseSearchView, CourseTees } from "../models/course-model"

const getCourse = async (searchTerm: string): Promise<CourseSearchView[]> => {
  return await courseModel.searchCourse(searchTerm);
}

const geolocateCourses = async (lat: number, long: number) => {
  return await courseModel.geolocateCourses(lat, long);
}

const getTees = async (courseId: string): Promise<CourseTees> => {
  return await courseModel.getTees(courseId)
}

const getCourseByTees = async (courseId: string, tees: string, gender: string): Promise<CourseByTees> => {
  return await courseModel.getCourseByTees(courseId, tees, gender)
}



export default {
  getCourse,
  geolocateCourses,
  getTees,
  getCourseByTees
}