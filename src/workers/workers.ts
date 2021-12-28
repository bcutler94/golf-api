import pubsubworker from "./pubsub"

interface Worker {
  worker(): void
  enable: boolean
  enableThreading: boolean
}

const WORKERS: Worker[] = [
  {
    worker: () => pubsubworker(),
    enable: true,
    enableThreading: true
  }
]



export default WORKERS