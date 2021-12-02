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

const login = async (): Promise<string> => {
  try {
    const res = await ghinGaxios.request<LoginResponse>({
      method: 'POST',
      url: '/users/login.json',
      data: {
        user: {
          email: GHIN_EMAIL,
          password: GHIN_PASSWORD
        }
      }
    });
    return res.data.token;
  } catch (e) {
    logger.error(e)
    throw e
  }
}

interface GetUserResponse {
}

const getUser = async (ghin: string) => {
  try {
    const token = await login()
    const res = await ghinGaxios.request<LoginResponse>({
      method: 'GET',
      url: `/golfers.json?golfer_id=${ghin}&from_ghin=true`,
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    logger.info(res.data)
    return res.data
  } catch (e) {
    logger.error(e)
    // throw e
  }
}

export default {
  getUser
}