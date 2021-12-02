import db from '../mongo/database';

interface UserModel {
  ghin: string
  groupIds: Array<string>
  
}


const createUser = (user: UserModel) => {
}
