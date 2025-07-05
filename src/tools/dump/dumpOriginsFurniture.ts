import { promises as fs } from "fs";
import * as path from "path";
import { createSpritesheet } from "./createSpritesheet";
import { ShroomAssetBundle } from "../../assets/ShroomAssetBundle";

export async function dumpOriginsFurniture(
  baseName: string,
  dumpLocation: string,
  imagePaths: string[]
) {
  // Create spritesheet from Origins images
  const { json, image } = await createSpritesheet(imagePaths, {
    outputFormat: "png",
  });

  // For Origins furniture, we need to create simplified data structures
  // since the DCR format doesn't have the same bin files as SWF
  const data = {
    spritesheet: json,
    type: "origins_furniture",
    baseName,
    created: new Date().toISOString(),
    // TODO: Add Origins-specific furniture metadata
    visualization: createDefaultVisualization(baseName),
    index: createDefaultIndex(baseName),
    assets: createDefaultAssets(baseName),
  };

  const jsonString = JSON.stringify(data);
  const encoder = new TextEncoder();

  const furnitureFile = new ShroomAssetBundle();
  furnitureFile.addFile("index.json", Buffer.from(encoder.encode(jsonString)));
  furnitureFile.addFile("spritesheet.png", image);

  // Write the .shroom file (simplified to avoid TypeScript errors for now)
  const buffer = furnitureFile.toBuffer();
  await fs.writeFile(`${dumpLocation}.shroom`, buffer as any);
}

function createDefaultVisualization(baseName: string) {
  // Create a basic visualization structure for Origins furniture
  return {
    type: "origins",
    visualizations: {
      "1": {
        layerCount: 1,
        angle: 45,
        layers: {
          "0": {
            z: 0,
            alpha: 255,
          },
        },
      },
    },
  };
}

function createDefaultIndex(baseName: string) {
  // Create a basic index structure for Origins furniture
  return {
    type: "origins",
    logic: "furniture_basic",
    visualization: "furniture_basic",
    name: baseName,
  };
}

function createDefaultAssets(baseName: string) {
  // Create a basic assets structure for Origins furniture
  return {
    type: "origins",
    name: baseName,
    assets: {},
  };
} 