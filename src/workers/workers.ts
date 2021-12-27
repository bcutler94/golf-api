import start from "../random"
import pubsubworker from "./pubsub"

interface Worker {
  worker(): void
  enable: boolean
  enableThreading: boolean
}

const WORKERS: Worker[] = [
  {
    worker: () => start(),
    enable: false,
    enableThreading: false
  },
  {
    worker: () => pubsubworker(),
    enable: true,
    enableThreading: true
  }
]



export default WORKERS