import courseModel, { CourseSearchView } from "../models/course-model"

const getCourse = async (searchTerm: string): Promise<CourseSearchView[]> => {
  return await courseModel.searchCourse(searchTerm);
}

const geolocateCourses = async (lat: number, long: number) => {
  return await courseModel.geolocateCourses(lat, long);
}

// const getTees = async (courseId: string): Promise<CourseTeeView> => {
//   return await courseModel.getTees(courseId)
// }



export default {
  getCourse,
  geolocateCourses
  // getTees
}