import { promises as fs } from "fs";
import * as path from "path";
import { Logger } from "./Logger";

export interface OriginsAssetInfo {
  path: string;
  baseName: string;
  type: "figure" | "furniture" | "room" | "other";
  fileType: "dcr" | "cct";
}

// Legacy interface for backward compatibility
export interface OriginsDCRInfo {
  path: string;
  baseName: string;
  type: "figure" | "furniture" | "room" | "other";
}

export async function findOriginsAssets(
  clientDir: string,
  logger: Logger
): Promise<OriginsAssetInfo[]> {
  const assetFiles: OriginsAssetInfo[] = [];
  
  try {
    await recursivelyFindAssets(clientDir, assetFiles, logger);
  } catch (error) {
    logger.log(`Error searching for Origins asset files: ${error instanceof Error ? error.message : String(error)}`);
  }
  
  const dcrCount = assetFiles.filter(f => f.fileType === 'dcr').length;
  const cctCount = assetFiles.filter(f => f.fileType === 'cct').length;
  logger.log(`Found ${assetFiles.length} Origins asset files in client directory (${dcrCount} DCR files, ${cctCount} CCT files)`);
  return assetFiles;
}

// Legacy function for backward compatibility
export async function findOriginsDCRs(
  clientDir: string,
  logger: Logger
): Promise<OriginsDCRInfo[]> {
  const assets = await findOriginsAssets(clientDir, logger);
  return assets.map(asset => ({
    path: asset.path,
    baseName: asset.baseName,
    type: asset.type,
  }));
}

async function recursivelyFindAssets(
  dir: string,
  assetFiles: OriginsAssetInfo[],
  logger: Logger,
  depth = 0
): Promise<void> {
  // Limit recursion depth to avoid infinite loops
  if (depth > 10) {
    return;
  }
  
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        await recursivelyFindAssets(fullPath, assetFiles, logger, depth + 1);
      } else if (entry.isFile()) {
        const lowerFileName = entry.name.toLowerCase();
        
        // Check for DCR files
        if (lowerFileName.endsWith('.dcr')) {
          const baseName = path.basename(entry.name, '.dcr');
          const type = determineAssetType(baseName, fullPath);
          
          assetFiles.push({
            path: fullPath,
            baseName,
            type,
            fileType: 'dcr',
          });
        }
        // Check for CCT files (Cast External files containing actual assets)
        else if (lowerFileName.endsWith('.cct')) {
          const baseName = path.basename(entry.name, '.cct');
          const type = determineAssetType(baseName, fullPath);
          
          assetFiles.push({
            path: fullPath,
            baseName,
            type,
            fileType: 'cct',
          });
        }
      }
    }
  } catch (error) {
    logger.log(`Error reading directory ${dir}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Legacy function for backward compatibility
async function recursivelyFindDCRs(
  dir: string,
  dcrFiles: OriginsDCRInfo[],
  logger: Logger,
  depth = 0
): Promise<void> {
  const assetFiles: OriginsAssetInfo[] = [];
  await recursivelyFindAssets(dir, assetFiles, logger, depth);
  
  // Filter to only DCR files for legacy compatibility
  const dcrAssets = assetFiles.filter(asset => asset.fileType === 'dcr');
  dcrFiles.push(...dcrAssets.map(asset => ({
    path: asset.path,
    baseName: asset.baseName,
    type: asset.type,
  })));
}

function determineAssetType(baseName: string, fullPath: string): "figure" | "furniture" | "room" | "other" {
  const lowerBaseName = baseName.toLowerCase();
  const lowerPath = fullPath.toLowerCase();
  
  // Check for figure-related assets
  if (lowerBaseName.includes('figure') || 
      lowerBaseName.includes('avatar') || 
      lowerBaseName.includes('head') || 
      lowerBaseName.includes('body') ||
      lowerPath.includes('figure') ||
      lowerPath.includes('avatar')) {
    return "figure";
  }
  
  // Check for furniture-related assets (including CCT files with furniture content)
  if (lowerBaseName.includes('furni') || 
      lowerBaseName.includes('furniture') ||
      lowerPath.includes('furni') ||
      lowerPath.includes('furniture') ||
      lowerBaseName.includes('hh_furni') ||
      lowerBaseName.includes('hh_cat_gfx')) {
    return "furniture";
  }
  
  // Check for room-related assets
  if (lowerBaseName.includes('room') || 
      lowerBaseName.includes('tile') ||
      lowerPath.includes('room') ||
      lowerPath.includes('tile')) {
    return "room";
  }
  
  // Default to other
  return "other";
}

// Legacy function for backward compatibility
function determineDCRType(baseName: string, fullPath: string): "figure" | "furniture" | "room" | "other" {
  return determineAssetType(baseName, fullPath);
} 