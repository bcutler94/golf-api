import throng from "throng";
import WORKERS from "./workers/workers";


const start = async () => {
  for (const { worker, enableThreading } of WORKERS) {
    enableThreading ? throng(worker) : worker()
  }
}


start()