import pubsub from "../pubsub/pubsub"

const pubsubworker = async () => {
  await pubsub.startPubSub({ attachListeners: true })
}

export default pubsubworker