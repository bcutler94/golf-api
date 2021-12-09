import ghinGaxios from 'gaxios';
import logger from '../util/logger';

const GHIN_URL = 'https://api.ghin.com/api/v1';
const GHIN_EMAIL = 'bcutler94@gmail.com';
const GHIN_PASSWORD = 'Liverpool13'

ghinGaxios.instance.defaults = {
  baseURL: GHIN_URL,
  retry: true,
  responseType: 'json'
}

interface LoginResponse {
  token: string
}

/**
 * Logins into GHIN API and retrieves the token needed to hit other endpoints
 * @returns 
 */
const login = async (): Promise<string> => {
  try {
    const { data: { token } } = await ghinGaxios.request<LoginResponse>({
      method: 'POST',
      url: '/users/login.json',
      data: {
        user: {
          email: GHIN_EMAIL,
          password: GHIN_PASSWORD
        }
      }
    });
    return token;
  } catch (e) {
    logger.error('there was an error logging into GHIN API', e)
    throw e
  }
}

interface GHINGolfer {
  ghin: string
  first_name: string
  last_name: string
  hi_value: number
  club_name: string
}
interface GetUserResponse {
  golfers: Array<GHINGolfer>
}

/**
 * Hits GHIN API to retrieve information about a player by GHIN number
 * @param ghin 
 * @returns 
 */
const getUser = async (ghin: string): Promise<GHINGolfer> => {
  try {
    const token = await login();

    const { data: { golfers: [ { first_name, last_name, hi_value, club_name } ] } } = await ghinGaxios.request<GetUserResponse>({
      method: 'GET',
      url: `/golfers.json?global_search=true&search=${ghin}&per_page=1&page=1`,
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!Number.isFinite(hi_value)) throw new Error ('There was an error looking up your GHIN Number.')

    return { 
      ghin,
      first_name, 
      last_name,
      hi_value, 
      club_name 
    }
  } catch (e) {
    logger.error('there was an error getting user from GHIN API', e)
    throw e
  }
}

export interface GHINCourse {
    CourseID:	number
    CourseStatus:	string
    CourseName:	string
    GeoLocationLatitude:	number
    GeoLocationLongitude:	number
    FacilityID:	number
    FacilityStatus:	string
    FacilityName:	string
    FullName:	string
    Address1:	string
    Address2:	string
    City:	string
    State:	string
    Zip:	string
    Country:	string
    EntCountryCode:	number
    EntStateCode:	number
    LegacyCRPCourseId:	number
    Telephone:	string
    Email:	string
    UpdatedOn:	string
}

interface GetCoursesResponse {
  courses: Array<GHINCourse>
}

const getCourses = async (state: string): Promise<Array<GHINCourse>> => {
  try {
    const token = await login();
    const { data: { courses } } = await ghinGaxios.request<GetCoursesResponse>({
      method: 'GET',
      url: `/courses/search.json?country=USA&state=US-${state.toUpperCase()}`,
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return courses
  } catch (e) {
    logger.error('there was an error getting user from GHIN API', e)
    throw e
  }
}

export interface GHINHole {
  Number:	number
  HoleId:	number
  Length:	number
  Par:	number
  Allocation:	number
}

export interface GetCourseInfoResponse {
  Season: {
    SeasonName: string
    SeasonStartDate: string
    SeasonEndDate: string
    IsAllYear: boolean
  }
  TeeSets: Array<{
    Ratings: Array<{
      RatingType:	string
      CourseRating:	number
      SlopeRating:	number
    }>
    Holes: Array<GHINHole>
    TeeSetRatingId:	number
    TeeSetRatingName:	string
    Gender:	string
    HolesNumber:	number
    TotalYardage:	number
    TotalMeters:	number
    LegacyCRPTeeId:	number
    StrokeAllocation:	boolean
    TotalPar:	number
  }>
}

const getCourseInfo = async (courseId: string): Promise<GetCourseInfoResponse> => {
  try {
    const token = await login();
    const { data } = await ghinGaxios.request<GetCourseInfoResponse>({
      method: 'GET',
      url: `/courses/${courseId}.json`,
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return data
  } catch (e) {
    logger.error('there was an error getting user from GHIN API', e)
    throw e
  }
}

export default {
  getUser,
  getCourses,
  getCourseInfo
}