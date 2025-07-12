import { getExternalVariableUrls } from "./getExternalVariableUrls";
import { getOriginsExternalVariableUrls } from "./getOriginsExternalVariableUrls";
import { downloadAllFiles } from "./downloadAllFiles";
import { downloadOriginsFiles } from "./downloadOriginsFiles";
import { Logger } from "./Logger";
import { promisify } from "util";
import g from "glob";
import { extractSwfs } from "./extractSwfs";
import { dumpFigure } from "./dumpFigure";
import { dumpFurniture } from "./dumpFurniture";

export const glob = promisify(g);

const separator = "=========================================";

const logger: Logger = console;

export async function dump({ externalVariables, downloadPath, isOrigins }: Options) {
  console.log(separator);
  console.log(`Shroom Asset Dumper${isOrigins ? " (Origins Mode)" : ""}`);
  console.log(separator);

  let stepCounter = 0;
  const step = async (text: string, callback: () => Promise<void>) => {
    stepCounter++;
    console.log(`${stepCounter}. Step: ${text}`);
    console.log();
    await callback();
    console.log(separator);
  };

  if (externalVariables != null) {
    if (isOrigins) {
      // Handle Origins (Shockwave) assets
      const variables = await getOriginsExternalVariableUrls(externalVariables);

      await step("Download from Origins Server", async () => {
        console.log("Found following URLs in the Origins external variables:");
        console.log("- Figure Data:", variables.externalFigurepartlistUrl);
        console.log("- External Texts:", variables.externalTextsUrl);
        console.log("- Flash Dynamic Download:", variables.flashDynamicDownloadUrl);
        console.log("- Cast Entries:", variables.castEntries.size);
        console.log("- Room Casts:", variables.roomCasts.size);
        console.log("");

        const clientDir = await downloadOriginsFiles(downloadPath, variables, logger);
        
        console.log(`Successfully downloaded Origins files into ${clientDir}`);
      });
    } else {
      // Handle modern SWF assets
      const variables = await getExternalVariableUrls(externalVariables);

      await step("Download from Server", async () => {
        console.log("Found following urls in the external variables:");
        console.log("- Figure Data:", variables.figureDataUrl);
        console.log("- Figure Map:", variables.figureMapUrl);
        console.log("- Furni Data", variables.furniDataUrl);
        console.log("- Furniture:", variables.hofFurniUrl);
        console.log("- Effect Map:", variables.effectMapUrl);
        console.log("");

        await downloadAllFiles(downloadPath, variables, logger);
        console.log(`Successfully downloaded files into ${downloadPath}`);
      });

      await step("Extract SWFs", async () => {
        const furnitureSwfs = await glob(`${downloadPath}/hof_furni/**/*.swf`);
        console.log(
          `Found ${furnitureSwfs.length} furniture swfs. Starting the extraction process.`
        );

        await extractSwfs(logger, "Furniture", furnitureSwfs, dumpFurniture);

        const figureSwfs = await glob(`${downloadPath}/figure/**/*.swf`);
        console.log(
          `Found ${figureSwfs.length} figure swfs. Starting the extraction process.`
        );

        await extractSwfs(logger, "Figure", figureSwfs, dumpFigure);

        const effectsSwf = await glob(`${downloadPath}/effects/**/*.swf`);
        console.log(
          `Found ${figureSwfs.length} effect swfs. Starting the extraction process.`
        );

        await extractSwfs(logger, "Effects", effectsSwf, dumpFigure);
      });
    }
  } else if (isOrigins) {
    // Default Origins mode without URL
    console.log("Origins mode enabled. Use --url to specify external variables URL.");
    console.log("Default Origins URL: https://origins-gamedata.habbo.com/external_variables/1");
  }
}

interface Options {
  externalVariables?: string;
  downloadPath: string;
  isOrigins?: boolean;
}
