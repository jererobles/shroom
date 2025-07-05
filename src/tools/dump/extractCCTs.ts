import Bluebird from "bluebird";
import { basename } from "path";
import { ProgressBar } from "./ProgressBar";
import { dumpCCT, OnAfterCCTCallback } from "./dumpCCT";
import { Logger } from "./Logger";

export async function extractCCTs(
  logger: Logger,
  name: string,
  ccts: string[],
  onAfter: OnAfterCCTCallback
) {
  const dumpCCTProgress = new ProgressBar(
    logger,
    ccts.length,
    (current, count, extra) => {
      if (extra != null) {
        return `Extracting ${name}: ${current} / ${count} (${extra})`;
      } else {
        return `Extracting ${name}: ${current} / ${count}`;
      }
    }
  );

  await Bluebird.map(
    ccts,
    async (path) => {
      await dumpCCT(path, onAfter);
      dumpCCTProgress.increment(basename(path));
    },
    {
      concurrency: 2, // Use lower concurrency for CCT files as they may be larger
    }
  );

  dumpCCTProgress.done();
} 