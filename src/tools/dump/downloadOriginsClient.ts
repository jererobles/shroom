import { promises as fs } from "fs";
import * as path from "path";
import { downloadFile } from "./downloadFile";
import { Logger } from "./Logger";

export interface ClientDownloadInfo {
  version: string;
  downloadUrl: string;
  platform: string;
}

export async function downloadOriginsClient(
  clientInfo: ClientDownloadInfo,
  downloadPath: string,
  logger: Logger
): Promise<string> {
  const clientDir = path.join(downloadPath, `client_${clientInfo.version}`);
  const zipPath = path.join(downloadPath, `origins_client_${clientInfo.version}.zip`);
  
  // Check if client directory already exists
  try {
    await fs.access(clientDir);
    logger.log(`Origins client ${clientInfo.version} already exists at ${clientDir}, skipping download`);
    return clientDir;
  } catch (error) {
    // Client directory doesn't exist, proceed with download
  }
  
  logger.log(`Downloading Origins client ${clientInfo.version}...`);
  
  // Download the client zip file
  const result = await downloadFile({
    url: clientInfo.downloadUrl,
    savePath: zipPath,
  });

  if (result.type !== "SUCCESS") {
    throw new Error(`Failed to download Origins client: ${result.type}`);
  }

  logger.log(`Extracting Origins client to ${clientDir}...`);
  
  // Create extraction directory
  await fs.mkdir(clientDir, { recursive: true });
  
  // Extract the zip file
  await extractZipFile(zipPath, clientDir);
  
  // Clean up the zip file
  await fs.unlink(zipPath);
  
  logger.log(`Origins client extracted successfully to ${clientDir}`);
  return clientDir;
}

async function extractZipFile(zipPath: string, extractPath: string): Promise<void> {
  try {
    const { exec } = await import("child_process");
    const { promisify } = await import("util");
    const execAsync = promisify(exec);
    
    // Use system unzip command to extract the zip file
    await execAsync(`unzip -o -q "${zipPath}" -d "${extractPath}"`);
  } catch (error) {
    throw new Error(
      `Failed to extract zip file. Please install 'unzip' command on your system. ` +
      `Error: ${error instanceof Error ? error.message : String(error)}`
    );
  }
} 