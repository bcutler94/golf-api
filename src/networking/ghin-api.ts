import ghinGaxios from 'gaxios';
import logger from '../util/logger';

const GHIN_URL = 'https://api.ghin.com/api/v1';
const GHIN_EMAIL = 'bcutler94@gmail.com';
const GHIN_PASSWORD = 'Liverpool13'

ghinGaxios.instance.defaults = {
  baseURL: GHIN_URL,
  retry: true,
  retryConfig: {
    // retryDelay: 10,
    onRetryAttempt: (err) => logger.warn(`Error retrying message [${err.message}], code ${err.code}`),
    // shouldRetry: () => true
  },
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
    logger.error('there was an error logging into GHIN API')
    throw e
  }
}

export interface GHINGolfer {
  id: number | null
  first_name:	string
  last_name:	string
  gender:	string
  email:	string
  suffix:	string | null
  prefix:	string | null
  middle_name:	string | null
  status:	string
  ghin:	string
  handicap_index:	string
  association_id:	number
  association_name:	string
  club_name:	string
  club_id:	number
  state:	string | null
  country:	string | null
  low_hi:	string
  soft_cap:	string
  hard_cap:	string
  entitlement:	boolean
  club_affiliation_id:	number
  is_home_club:	boolean
  rev_date:	string | null
  hi_value:	number
  hi_display:	string
  message_club_authorized:	string | null
  low_hi_value:	number
  low_hi_display:	string
  low_hi_date:	string | null
  nullable: true
  has_digital_profile:	string
  player_name: string | null
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

    const { data: { golfers: [ ghinGolfer ] } } = await ghinGaxios.request<GetUserResponse>({
      method: 'GET',
      url: `/golfers.json?global_search=true&search=${ghin}&per_page=1&page=1`,
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!Number.isFinite(ghinGolfer.hi_value)) throw new Error ('There was an error looking up your GHIN Number.')

    return ghinGolfer
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
      url: `/crsCourseMethods.asmx/SearchCourses.json?state=US-${state.toUpperCase()}&country=USA&source=GHINcom`,
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

const getCourseInfo = async (courseId: number): Promise<GetCourseInfoResponse> => {
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
interface SearchPlayersResponse {
  golfers: GHINGolfer[]
}

const searchPlayers = async (fullName: string): Promise<GHINGolfer[]> => {
  try {
    const token = await login();
    const { data: { golfers } } = await ghinGaxios.request<SearchPlayersResponse>({
      method: 'GET',
      url: `/golfers.json?per_page=100&page=1&global_search=true&search=${fullName}`,
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return golfers;
  } catch (e) {
    logger.error('there was an error getting user from GHIN API', e)
    throw new Error ('There was an error searching for players, please try again later.')
  }
}

interface GetClubGolfersResponse {
  golfers: GHINGolfer[]
}

const getClubGolfers = async (clubId: string, page: number): Promise<GHINGolfer[] | null> => {
  try {
    const token = await login();
    const { data: { golfers } } = await ghinGaxios.request<GetClubGolfersResponse>({
      method: 'GET',
      url: `/clubs/${clubId}/golfers.json?status=Active&per_page=100&page=${page}`,
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return golfers;
  } catch (e) {
    logger.warn('there was an error getting golfers from GHIN API', e)
    return null;
    // throw new Error ('There was an error searching for players, please try again later.')
  }
}

interface GHINAssociation {
  id: number
}
interface GetAssociationsResponse {
  associations: GHINAssociation[]
}

const getAssociations = async (): Promise<GHINAssociation[]> => {
  try {
    const token = await login();
    const { data: { associations } } = await ghinGaxios.request<GetAssociationsResponse>({
      method: 'GET',
      url: `/associations.json`,
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return associations;
  } catch (e) {
    logger.warn('there was an error getting associatons from GHIN API', e)
    throw e
  }
}

export interface GHINAssociationCourse {
  golf_association_id:	number
  club_number:	number
  club_name:	string
  phone:	string
  is_dac:	boolean
  technology_provider:	string
  email:	string
  authorized:	boolean
  is_test:	boolean
  status:	string
  club_category:	string
  short_name:	string
  website:	string
  usga_version:	string
  handicap_chairperson:	string
  handicap_chairperson_ghin_number:	number | null
  date:	string
  created_at:	string
  updated_at:	string
  logo:	string
  club_type:	string
  id:	number
  city:	string
  state:	string
  active_golfers_count:	number
}

interface GetAssociationCoursesResponse {
  courses: GHINAssociationCourse[]
}

const getAssociationCourses = async (associationId: number): Promise<GHINAssociationCourse[]> => {
  try {
    const token = await login();
    const { data: { courses } } = await ghinGaxios.request<GetAssociationCoursesResponse>({
      method: 'GET',
      url: `/associations/${associationId}/clubs.json`,
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return courses;
  } catch (e) {
    logger.warn('there was an error getting associatons from GHIN API')
    throw e
  }
}

type TeeSets = {
  tee_set_id: string,
  name: string
  gender: string
  ratings: {
    tee_set_side: string,
    course_rating: number,
    slope_rating: number,
    course_handicap: number,
    course_handicap_display: number,
    par: number
  }[]
}[]

interface GetPlayerCourseHandicapResponse {
  tee_sets?: TeeSets
}

const getPlayerCourseHandicap = async (ghin: string, courseId: string) => {
  try {
    const token = await login();
    const { data: { tee_sets } } = await ghinGaxios.request<GetPlayerCourseHandicapResponse>({
      method: 'GET',
      url: `/course_handicaps.json?golfer_id=${ghin}&course_id=${courseId}`,
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return tee_sets;
  } catch (e) {
    logger.warn('there was an error getting associatons from GHIN API')
    throw e
  }
}



export default {
  getUser,
  getCourses,
  getCourseInfo,
  searchPlayers,
  getClubGolfers,
  getAssociations,
  getAssociationCourses,
  getPlayerCourseHandicap
}