import { promises as fs } from "fs";
import * as path from "path";
import { ProjectorRaysManager } from "./ProjectorRaysManager";

export type OnAfterCallback = (
  baseName: string,
  dumpLocation: string,
  imagePaths: string[],
  xmlPaths: string[]
) => Promise<void>;

export async function dumpDCR(dcrPath: string, onAfter: OnAfterCallback) {
  const dirName = path.dirname(dcrPath);
  const baseName = path.basename(dcrPath, ".dcr");
  const dumpLocation = path.join(dirName, baseName);

  await fs.mkdir(dumpLocation, { recursive: true });

  try {
    // Extract DCR assets using ProjectorRays
    const manager = ProjectorRaysManager.getInstance();
    const { success, extractedFiles } = await manager.extractFile(dcrPath, dumpLocation);

    if (!success) {
      // Create a manifest file indicating the extraction failed
      await fs.writeFile(
        path.join(dumpLocation, "extraction_failed.txt"),
        `DCR file extraction failed.\nSource: ${dcrPath}\nProjectorRays: https://github.com/ProjectorRays/ProjectorRays`
      );
    }

    // Find extracted images and XML files
    const allFiles = await fs.readdir(dumpLocation, { withFileTypes: true });
    const imagePaths: string[] = [];
    const xmlPaths: string[] = [];

    for (const file of allFiles) {
      if (file.isFile()) {
        const filePath = path.join(dumpLocation, file.name);
        const ext = path.extname(file.name).toLowerCase();
        
        if (['.png', '.jpg', '.jpeg', '.gif', '.bmp'].includes(ext)) {
          imagePaths.push(filePath);
        } else if (['.xml', '.bin'].includes(ext)) {
          xmlPaths.push(filePath);
        }
      }
    }

    await onAfter(baseName, dumpLocation, imagePaths, xmlPaths);
  } catch (error) {
    console.error(`Failed to extract DCR ${dcrPath}:`, error);
    throw error;
  }
} 