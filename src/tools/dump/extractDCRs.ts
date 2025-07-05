import Bluebird from "bluebird";
import { basename } from "path";
import { ProgressBar } from "./ProgressBar";
import { dumpDCR, OnAfterCallback } from "./dumpDCR";
import { Logger } from "./Logger";

export async function extractDCRs(
  logger: Logger,
  name: string,
  dcrs: string[],
  onAfter: OnAfterCallback
) {
  const dumpDCRProgress = new ProgressBar(
    logger,
    dcrs.length,
    (current, count, extra) => {
      if (extra != null) {
        return `Extracting ${name}: ${current} / ${count} (${extra})`;
      } else {
        return `Extracting ${name}: ${current} / ${count}`;
      }
    }
  );

  await Bluebird.map(
    dcrs,
    async (path) => {
      await dumpDCR(path, onAfter);
      dumpDCRProgress.increment(basename(path));
    },
    {
      concurrency: 4,
    }
  );

  dumpDCRProgress.done();
} 