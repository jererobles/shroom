import { promises as fs } from "fs";
import * as path from "path";
import { ShroomAssetBundle } from "../../assets/ShroomAssetBundle";

export async function dumpOriginsFigure(
  baseName: string,
  dumpLocation: string,
  imagePaths: string[],
  xmlPaths: string[]
) {
  const imageFiles = await Promise.all(
    imagePaths.map((filePath) =>
      fs.readFile(filePath).then((buffer) => ({ path: filePath, buffer }))
    )
  );
  
  const xmlFiles = await Promise.all(
    xmlPaths.map((filePath) =>
      fs.readFile(filePath).then((buffer) => ({ path: filePath, buffer }))
    )
  );

  const file = new ShroomAssetBundle();

  // Add image files to bundle
  imageFiles.forEach(({ path: filePath, buffer }) => {
    const fileName = path.basename(filePath);
    file.addFile(fileName, buffer);
  });

  // Add XML/bin files to bundle
  xmlFiles.forEach(({ path: filePath, buffer }) => {
    const fileName = path.basename(filePath);
    file.addFile(fileName, buffer);
  });

  // TODO: Add Origins-specific metadata processing
  // For now, we'll create a basic .shroom file compatible with existing infrastructure

  const buffer = file.toBuffer();
  await fs.writeFile(`${dumpLocation}.shroom`, buffer as any);
}

async function createOriginsMetadata(
  baseName: string,
  imagePaths: string[],
  xmlPaths: string[]
): Promise<any> {
  // Create metadata for Origins figure assets
  // This should include sprite registration points and part information
  // Based on the habbo-origins-imager structure
  
  const metadata = {
    type: "origins_figure",
    baseName,
    sprites: {},
    parts: {},
    created: new Date().toISOString(),
  };

  // Process image files to extract sprite information
  for (const imagePath of imagePaths) {
    const fileName = path.basename(imagePath, path.extname(imagePath));
    
    // Origins sprite naming convention: h_std_head_1_0_0.png
    // Format: {size}_{action}_{part}_{id}_{direction}_{frame}
    const spriteMatch = fileName.match(/^([hs]+)_([^_]+)_([^_]+)_(\d+)_(\d+)_(\d+)$/);
    if (spriteMatch) {
      const [, size, action, part, id, direction, frame] = spriteMatch;
      
      (metadata.sprites as any)[fileName] = {
        size,
        action,
        part,
        id: parseInt(id),
        direction: parseInt(direction),
        frame: parseInt(frame),
        fileName: path.basename(imagePath),
        // Default registration points - these should be extracted from the actual data
        regX: 0,
        regY: 0,
      };
    }
  }

  return metadata;
} 