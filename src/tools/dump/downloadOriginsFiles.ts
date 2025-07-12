import path from "path";
import { downloadFileWithMessage } from "./downloadFileWithMessage";
import { downloadOriginsClient } from "./downloadOriginsClient";
import { getOriginsClientUrls, getLatestClientInfo } from "./getOriginsClientUrls";
import { findOriginsAssets, OriginsAssetInfo } from "./findOriginsDCRs";
import { OriginsExternalVariables } from "./parseOriginsExternalVariables";
import { Logger } from "./Logger";

export async function downloadOriginsFiles(
  downloadPath: string,
  variables: OriginsExternalVariables,
  logger: Logger
): Promise<{ assetFiles: OriginsAssetInfo[]; clientDir: string }> {
  // Download figure data XML
  if (variables.externalFigurepartlistUrl) {
    await downloadFileWithMessage(
      {
        url: variables.externalFigurepartlistUrl,
        savePath: path.join(downloadPath, "figuredata.xml"),
      },
      logger
    );
  }

  // Download external texts if available
  if (variables.externalTextsUrl) {
    await downloadFileWithMessage(
      {
        url: variables.externalTextsUrl,
        savePath: path.join(downloadPath, "external_texts.txt"),
      },
      logger
    );
  }

  // Download override texts if available
  if (variables.externalOverrideTextsUrl) {
    await downloadFileWithMessage(
      {
        url: variables.externalOverrideTextsUrl,
        savePath: path.join(downloadPath, "external_override_texts.txt"),
      },
      logger
    );
  }

  // Download and extract Origins client
  logger.log("Fetching Origins client information...");
  const clientUrls = await getOriginsClientUrls();
  const clientInfo = getLatestClientInfo(clientUrls);
  
  logger.log(`Latest Origins client version: ${clientInfo.version}`);
  const clientDir = await downloadOriginsClient(clientInfo, downloadPath, logger);
  
  // Find all Origins asset files (DCR and CCT files) in the client
  const assetFiles = await findOriginsAssets(clientDir, logger);
  
  return { assetFiles, clientDir };
} 