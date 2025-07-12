import path from "path";
import { downloadFileWithMessage } from "./downloadFileWithMessage";
import { downloadOriginsClient } from "./downloadOriginsClient";
import { getOriginsClientUrls, getLatestClientInfo } from "./getOriginsClientUrls";
import { OriginsExternalVariables } from "./parseOriginsExternalVariables";
import { Logger } from "./Logger";

export async function downloadOriginsFiles(
  downloadPath: string,
  variables: OriginsExternalVariables,
  logger: Logger
): Promise<string> {
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

  // Download and extract Origins client
  logger.log("Fetching Origins client information...");
  const clientUrls = await getOriginsClientUrls();
  const clientInfo = getLatestClientInfo(clientUrls);
  
  logger.log(`Latest Origins client version: ${clientInfo.version}`);
  const clientDir = await downloadOriginsClient(clientInfo, downloadPath, logger);
  
  return clientDir ;
} 