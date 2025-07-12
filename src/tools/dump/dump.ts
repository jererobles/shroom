import { getExternalVariableUrls } from "./getExternalVariableUrls";
import { getOriginsExternalVariableUrls } from "./getOriginsExternalVariableUrls";
import { downloadAllFiles } from "./downloadAllFiles";
import { downloadOriginsFiles } from "./downloadOriginsFiles";
import { OriginsAssetInfo } from "./findOriginsDCRs";
import { Logger } from "./Logger";
import { promisify } from "util";
import g from "glob";
import { extractSwfs } from "./extractSwfs";
import { extractDCRs } from "./extractDCRs";
import { extractCCTs } from "./extractCCTs";
import { promises as fs } from "fs";
import { FigureMapData } from "../../objects/avatar/data/FigureMapData";
import { createOffsetFile } from "./createOffsetFile";
import { dumpFigure } from "./dumpFigure";
import { dumpFurniture } from "./dumpFurniture";
import { dumpOriginsFigure } from "./dumpOriginsFigure";
import { dumpOriginsFurniture } from "./dumpOriginsFurniture";

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

      let assetFiles: OriginsAssetInfo[] = [];
      let clientDir: string = "";

      await step("Download from Origins Server", async () => {
        console.log("Found following URLs in the Origins external variables:");
        console.log("- Figure Data:", variables.externalFigurepartlistUrl);
        console.log("- External Texts:", variables.externalTextsUrl);
        console.log("- Flash Dynamic Download:", variables.flashDynamicDownloadUrl);
        console.log("- Cast Entries:", variables.castEntries.size);
        console.log("- Room Casts:", variables.roomCasts.size);
        console.log("");

        const result = await downloadOriginsFiles(downloadPath, variables, logger);
        assetFiles = result.assetFiles;
        clientDir = result.clientDir;
        
        console.log(`Successfully downloaded Origins files into ${downloadPath}`);
        const dcrCount = assetFiles.filter(f => f.fileType === 'dcr').length;
        const cctCount = assetFiles.filter(f => f.fileType === 'cct').length;
        console.log(`Found ${assetFiles.length} Origins asset files in client (${dcrCount} DCR, ${cctCount} CCT)`);
      });

      await step("Extract Origins Assets", async () => {
        // Filter and separate different types of assets
        const furnitureAssets = [];//assetFiles.filter(asset => asset.type === 'furniture');
        const figureAssets = assetFiles.filter(asset => asset.type === 'figure');
        
        const furnitureDCRs = furnitureAssets.filter(asset => asset.fileType === 'dcr').map(asset => asset.path);
        const furnitureCCTs = furnitureAssets.filter(asset => asset.fileType === 'cct').map(asset => asset.path);
        const figureDCRs = figureAssets.filter(asset => asset.fileType === 'dcr').map(asset => asset.path);
        const figureCCTs = figureAssets.filter(asset => asset.fileType === 'cct').map(asset => asset.path);
        
        console.log(
          `Found ${furnitureAssets.length} furniture assets (${furnitureDCRs.length} DCR, ${furnitureCCTs.length} CCT) and ${figureAssets.length} figure assets (${figureDCRs.length} DCR, ${figureCCTs.length} CCT). Starting the extraction process.`
        );

        // Extract DCR files (these contain logic/metadata)
        if (furnitureDCRs.length > 0) {
          await extractDCRs(logger, "Origins Furniture (DCR)", furnitureDCRs, dumpOriginsFurniture);
        }
        
        if (figureDCRs.length > 0) {
          await extractDCRs(logger, "Origins Figures (DCR)", figureDCRs, dumpOriginsFigure);
        }

        // Extract CCT files (these contain actual graphics/assets)
        // CCT files need a different extraction approach than DCR files
        if (furnitureCCTs.length > 0) {
          await extractCCTs(logger, "Origins Furniture (CCT)", furnitureCCTs, dumpOriginsFurniture);
        }
        
        if (figureCCTs.length > 0) {
          await extractCCTs(logger, "Origins Figures (CCT)", figureCCTs, dumpOriginsFigure);
        }
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
