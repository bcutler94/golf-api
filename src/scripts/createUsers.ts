import { v4 } from "uuid"
import userModel, { UserModel } from "../models/user-model"
import logger from "../util/logger"

const createUsers = async (count: number) => {
  const users: UserModel[] = []
  while (count >= 0) {
    users.push({
      id: v4(),
      ghin: '',
      lastName: `lastName` + count,
      firstName: `firstName` + count,
      clubName: 'Pine Valley',
      currentHandicap: Math.floor(Math.random() * 36),
      phoneNumber: '',
      referralInfo: {}
    })
    count--
  }
  const collection = await userModel.getUserCollection()
  await collection.insertMany(users)
  logger.info(`inserted ${count} users`)
}

export default createUsers