import { promises as fs } from "fs";
import * as path from "path";
import { ProjectorRaysManager } from "./ProjectorRaysManager";

export type OnAfterCCTCallback = (
  baseName: string,
  dumpLocation: string,
  imagePaths: string[],
  xmlPaths: string[]
) => Promise<void>;

export async function dumpCCT(cctPath: string, onAfter: OnAfterCCTCallback) {
  const dirName = path.dirname(cctPath);
  const baseName = path.basename(cctPath, ".cct");
  const dumpLocation = path.join(dirName, baseName);

  await fs.mkdir(dumpLocation, { recursive: true });

  try {
    // Extract CCT assets using ProjectorRays
    const manager = ProjectorRaysManager.getInstance();
    const { success, extractedFiles } = await manager.extractFile(cctPath, dumpLocation);

    if (!success) {
      // Create a manifest file indicating the extraction failed
      await fs.writeFile(
        path.join(dumpLocation, "extraction_failed.txt"),
        `CCT file extraction failed.\nSource: ${cctPath}\nProjectorRays: https://github.com/ProjectorRays/ProjectorRays`
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
    console.error(`Failed to extract CCT ${cctPath}:`, error);
    throw error;
  }
} 