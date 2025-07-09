import { promises as fs } from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import { ShroomAssetBundle } from '../../assets/ShroomAssetBundle';

const SOURCE_DIR = path.join('public', 'habbo_assets', 'cst', 'client_163', 'dump-target');
const OUTPUT_DIR = path.join('public', 'habbo_assets', 'cst-output');

// Parse PNG filename to extract part information
interface PartInfo {
  number: string;
  dunno: string;
  action: string;
  partType: string;
  partId: string;
  direction: string;
  frame: string;
  effect: string;
}

function parsePngFilename(filename: string): PartInfo | null {
  // Pattern: ${size}_${action}_${partType}_${partId}_${direction}_${frame}.png
  const match = filename.match(/^(\d+)_([^_]+)_([^_]+)_([^_]+)_(\d+)_(\d+)_(\d+)_*(\d+)*\.png$/);
  
  if (!match) {
    return null;
  }
  
  return {
    number: match[1],
    dunno: match[2],
    action: match[3],
    partType: match[4],
    partId: match[5],
    direction: match[6],
    frame: match[7],
    effect: match[8]
  };
}

// Get readable part type name
function getPartTypeName(partType: string): string {
  const partTypeMap: Record<string, string> = {
    'hr': 'hair',
    'hd': 'head',
    'bd': 'body',
    'ch': 'shirt',
    'lg': 'leg',
    'sh': 'shoe',
    'ha': 'hats',
    'he': 'head_accessory',
    'ea': 'eye_accessory',
    'fa': 'face_accessory',
    'ca': 'chest_accessory',
    'wa': 'waist_accessory',
    'fc': 'face',
    'ey': 'eyes',
    'ri': 'item',
    'li': 'left_item',
    'lh': 'left_hand',
    'rh': 'right_hand',
    'ls': 'left_sleeve',
    'rs': 'right_sleeve',
    'cc': 'chest_print',
    'cp': 'chest_patch',
    'fx': 'effects',
  };
  
  return partTypeMap[partType] || partType;
}

// Discover figure part directories
async function discoverFigurePartDirectories(): Promise<string[]> {
  try {
    const entries = await fs.readdir(SOURCE_DIR, { withFileTypes: true });
    
    return entries
      .filter(entry => entry.isDirectory() && 
        (entry.name.startsWith('hh_human_')))
      .map(entry => entry.name);
  } catch (error) {
    console.error('Error discovering figure part directories:', error);
    return [];
  }
}

// Process a single directory and create one shroom file
async function processDirectory(dirName: string): Promise<{
  success: boolean;
  partType?: string;
  fileCount?: number;
  outputFile?: string;
  error?: string;
}> {
  console.log(`\n🔄 Processing directory: ${dirName}`);
  
  const sourceDir = path.join(SOURCE_DIR, dirName);
  const outputDir = path.join(OUTPUT_DIR, 'figure');
  
  try {
    // Ensure source directory exists
    await fs.access(sourceDir);
  } catch (error) {
    return {
      success: false,
      error: `Directory not found: ${sourceDir}`
    };
  }

  try {
    // Read all PNG files in the directory
    const entries = await fs.readdir(sourceDir, { withFileTypes: true });
    const pngFiles = entries
      .filter(entry => entry.isFile() && entry.name.endsWith('.png'))
      .map(entry => entry.name);

    if (pngFiles.length === 0) {
      return {
        success: false,
        error: 'No PNG files found in directory'
      };
    }

    // Parse first PNG to determine part type
    const firstPngInfo = parsePngFilename(pngFiles[0]);
    if (!firstPngInfo) {
      return {
        success: false,
        error: `Invalid PNG filename format: ${pngFiles[0]}`
      };
    }

    const partType = firstPngInfo.partType;
    const partTypeName = getPartTypeName(partType);
    const outputFile = path.join(outputDir, `${dirName}.shroom`);

    console.log(`  📁 Part type: ${partType} (${partTypeName})`);
    console.log(`  📊 Found ${pngFiles.length} PNG files`);

    // Create bundle
    const bundle = new ShroomAssetBundle();
    let processedCount = 0;

    // Process each PNG file
    for (const pngFile of pngFiles) {
      const pngInfo = parsePngFilename(pngFile);
      if (!pngInfo) {
        console.warn(`⚠️  Skipping invalid filename: ${pngFile}`);
        continue;
      }

      try {
        const pngPath = path.join(sourceDir, pngFile);
        const buffer = await fs.readFile(pngPath);
        const processedBuffer = await removeWhiteBackground(buffer);
        bundle.addFile(pngFile.substring(pngFile.indexOf('_') + 1), processedBuffer);
        processedCount++;
      } catch (error) {
        console.warn(`⚠️  Failed to read PNG: ${pngFile} - ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    if (processedCount === 0) {
      return {
        success: false,
        error: 'No PNG files could be processed'
      };
    }

    // Generate manifest
    const manifest = await generateManifest(dirName, pngFiles);
    bundle.addFile('manifest.bin', Buffer.from(manifest, 'utf-8'));

    // Write shroom file
    await fs.mkdir(outputDir, { recursive: true });
    const bundleBuffer = bundle.toBuffer();
    await fs.writeFile(outputFile, bundleBuffer);

    console.log(`  ✅ Generated: ${outputFile} (${processedCount} files)`);

    return {
      success: true,
      partType,
      fileCount: processedCount,
      outputFile
    };

  } catch (error) {
    return {
      success: false,
      error: `Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

// Parse Members.csv to get registration points
async function parseMembersCsv(dirName: string): Promise<Map<string, { x: number; y: number }>> {
  const csvPath = path.join(SOURCE_DIR, dirName, 'Members.csv');
  const registrationPoints = new Map<string, { x: number; y: number }>();
  
  try {
    const csvContent = await fs.readFile(csvPath, 'utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    const dataLines = lines.slice(1); // skip header
    
    for (const line of dataLines) {
      // Robust CSV parse (handle commas in quotes)
      const parts: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') inQuotes = !inQuotes;
        else if (char === ',' && !inQuotes) { parts.push(current.trim()); current = ''; }
        else current += char;
      }
      parts.push(current.trim());
      
      const [number, type, name, registrationPoint, filename] = parts;
      
      if (type === 'bitmap' && registrationPoint) {
        // Parse registration point format: "(x, y)"
        const match = registrationPoint.match(/\(([^,]+),\s*([^)]+)\)/);
        if (match) {
          const x = parseInt(match[1].trim());
          const y = parseInt(match[2].trim());
          const pngFilename = filename || `${name}`;
          registrationPoints.set(pngFilename, { x, y });
        }
      }
    }
  } catch (error) {
    console.warn(`⚠️  Failed to read Members.csv for ${dirName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  
  return registrationPoints;
}

// Generate manifest XML for the bundle
async function generateManifest(dirName: string, pngFiles: string[]): Promise<string> {
  let manifest = '<?xml version="1.0" encoding="ISO-8859-1" ?>\n';
  manifest += `  <library name="${dirName}" version="0.1">\n`;
  manifest += '    <assets>\n';
  
  // Get registration points from Members.csv
  const registrationPoints = await parseMembersCsv(dirName);
  
  for (const pngFile of pngFiles) {
    const pngInfo = parsePngFilename(pngFile);
    if (pngInfo) {
      const pngFilename = pngFile.replace('.png', '').substring(pngFile.indexOf('_') + 1);
      // Get registration point from CSV or default to (0, 0)
      const regPoint = registrationPoints.get(pngFilename) || { x: 0, y: 0 };
      manifest += `      <asset name="${pngFilename}" mimeType="image/png">\n`;
      manifest += `        <param key="offset" value="${regPoint.x},${regPoint.y}"/>\n`;
      manifest += '      </asset>\n';
    }
  }
  
  manifest += '    </assets>\n';
  manifest += '  </library>\n';
  manifest += '</manifest>';
  
  return manifest;
}

// Generate figuremap.xml from processed directories
async function generateFigureMap(processedDirectories: Array<{
  dirName: string;
  partType: string;
  success: boolean;
}>): Promise<void> {
  console.log('\n📝 Generating figuremap.xml...');
  
  let figuremap = '<?xml version="1.0"?>\n';
  figuremap += '<map>\n';
  
  // Generate separate lib entry for each directory
  for (const dir of processedDirectories) {
    if (!dir.success) continue;
    
    const { dirName, partType } = dir;
    figuremap += `  <lib id="${dirName}" revision="1">\n`;
    
    // Collect unique part IDs from this specific directory
    const partIds = new Set<string>();
    const sourceDir = path.join(SOURCE_DIR, dirName);
    
    try {
      const entries = await fs.readdir(sourceDir, { withFileTypes: true });
      const pngFiles = entries
        .filter(entry => entry.isFile() && entry.name.endsWith('.png'))
        .map(entry => entry.name);
      
      for (const pngFile of pngFiles) {
        const pngInfo = parsePngFilename(pngFile);
        if (pngInfo) {
          partIds.add(pngInfo.partId);
        }
      }
    } catch (error) {
      console.warn(`⚠️  Failed to read directory for figuremap: ${dirName}`);
    }
    
    // Add part entries for this directory
    for (const partId of partIds) {
      figuremap += `    <part id="${partId}" type="${partType}"/>\n`;
    }
    
    figuremap += '  </lib>\n';
  }
  
  figuremap += '</map>';
  
  const figuremapPath = path.join(OUTPUT_DIR, 'figuremap.xml');
  await fs.writeFile(figuremapPath, figuremap);
  console.log(`✅ Generated: ${figuremapPath}`);
}

// Remove white background from PNG using flood fill algorithm
async function removeWhiteBackground(buffer: Buffer): Promise<Buffer> {
  try {
    // Load image with sharp
    const image = sharp(buffer);
    const { data, info } = await image
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const { width, height, channels } = info;
    const pixelData = new Uint8Array(data);

    // Create a visited array to track processed pixels
    const visited = new Array(width * height).fill(false);

    // White color threshold (allowing for slight variations)
    const isWhite = (r: number, g: number, b: number): boolean => {
      return r >= 255 && g >= 255 && b >= 255;
    };

    // Get pixel index
    const getPixelIndex = (x: number, y: number): number => {
      return (y * width + x) * channels;
    };

    // Flood fill algorithm starting from edges
    const floodFill = (startX: number, startY: number): void => {
      const stack: Array<[number, number]> = [[startX, startY]];

      while (stack.length > 0) {
        const [x, y] = stack.pop()!;

        if (x < 0 || x >= width || y < 0 || y >= height) continue;

        const pixelIndex = getPixelIndex(x, y);
        const visitedIndex = y * width + x;

        if (visited[visitedIndex]) continue;

        const r = pixelData[pixelIndex];
        const g = pixelData[pixelIndex + 1];
        const b = pixelData[pixelIndex + 2];

        if (!isWhite(r, g, b)) continue;

        // Mark as visited and make transparent
        visited[visitedIndex] = true;
        pixelData[pixelIndex + 3] = 0; // Set alpha to 0 (transparent)

        // Add neighboring pixels to stack
        stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
      }
    };

    // Start flood fill from all edge pixels
    // Top and bottom edges
    for (let x = 0; x < width; x++) {
      floodFill(x, 0); // Top edge
      floodFill(x, height - 1); // Bottom edge
    }

    // Left and right edges
    for (let y = 0; y < height; y++) {
      floodFill(0, y); // Left edge
      floodFill(width - 1, y); // Right edge
    }

    // Convert back to PNG
    return await sharp(pixelData, {
      raw: {
        width,
        height,
        channels
      }
    })
    .png()
    .toBuffer();

  } catch (error) {
    console.warn(`⚠️  Failed to remove white background: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return buffer; // Return original buffer if processing fails
  }
}

// Main function
async function main(): Promise<void> {
  const separator = '=========================================';
  console.log(separator);
  console.log('Origins Figure to Shroom Converter (Improved)');
  console.log(separator);

  try {
    // Discover directories
    console.log('🔍 Discovering figure part directories...');
    const directories = await discoverFigurePartDirectories();
    
    if (directories.length === 0) {
      console.log('❌ No figure part directories found');
      return;
    }
    
    console.log(`Found ${directories.length} directories: ${directories.join(', ')}`);

    // Process each directory
    const results: Array<{
      dirName: string;
      partType: string;
      success: boolean;
      fileCount?: number;
      outputFile?: string;
      error?: string;
    }> = [];

    for (const dirName of directories) {
      const result = await processDirectory(dirName);
      results.push({
        dirName,
        partType: result.partType || 'unknown',
        success: result.success,
        fileCount: result.fileCount,
        outputFile: result.outputFile,
        error: result.error
      });
    }

    // Generate summary
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    console.log('\n📊 Processing Summary:');
    console.log(`✅ Successful: ${successful.length}`);
    console.log(`❌ Failed: ${failed.length}`);

    if (successful.length > 0) {
      console.log('\n✅ Successfully processed:');
      for (const result of successful) {
        console.log(`   • ${result.dirName}: ${result.fileCount} files → ${result.outputFile}`);
      }
    }

    if (failed.length > 0) {
      console.log('\n❌ Failed to process:');
      for (const result of failed) {
        console.log(`   • ${result.dirName}: ${result.error}`);
      }
    }

    // Generate figuremap.xml and copy figuredata.xml
    if (successful.length > 0) {
      await generateFigureMap(results);
      await fs.copyFile(path.join(SOURCE_DIR, '../../figuredata.xml'), path.join(OUTPUT_DIR, 'figuredata.xml'));
    }

    console.log('\n🎉 Conversion completed!');
    console.log(`📁 Output directory: ${path.resolve(OUTPUT_DIR)}`);

  } catch (error) {
    console.error('❌ Fatal error:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

// Run the converter
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  });
}

export { ShroomAssetBundle, parsePngFilename, getPartTypeName }; 