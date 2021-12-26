import throng from "throng";
import WORKERS from "./workers/workers";


const start = async () => {
  for (const { worker, enable, enableThreading } of WORKERS) {
    if (enable) enableThreading ? throng(worker) : worker()
  }
}


start()