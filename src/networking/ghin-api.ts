import ghinGaxios from 'gaxios';
import { logger } from '..';

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
    logger.error(e)
    throw e
  }
}

interface GetUserResponse {
  ghin: string
  first_name: string
  last_name: string
  hi_value: number
  club_name: string
}

/**
 * Hits GHIN API to retrieve information about a player by GHIN number
 * @param ghin 
 * @returns 
 */
const getUser = async (ghin: string): Promise<GetUserResponse> => {
  try {
    const token = await login();

    const { data: { first_name, last_name, hi_value, club_name } } = await ghinGaxios.request<GetUserResponse>({
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
    logger.error(e)
    throw e
  }
}

export default {
  getUser
}