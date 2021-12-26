import pubsubworker from "./pubsub"

interface Worker {
  worker(): void
  enableThreading: boolean
}

const WORKERS: Worker[] = [
  {
    worker: () => pubsubworker(),
    enableThreading: true
  }
]



export default WORKERS