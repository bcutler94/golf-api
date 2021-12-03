import db from '../data-layer/database';

interface UserModel {
  ghin: string
  groupIds: Array<string>
  lastName: string
  firstName: string
  clubName: string
  currentHandicap: number
}

const createUser = (user: UserModel) => {

}

export default {
  createUser
}