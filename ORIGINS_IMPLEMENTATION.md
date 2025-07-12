# Habbo Origins (Shockwave) Asset Support

This implementation adds support for extracting and processing Habbo Origins assets, which use the Director Cast (.dcr) format instead of the modern SWF format.

## Features

- ✅ **Origins External Variables Parser**: Parses the Origins-specific external variables format
- ✅ **Origins Client Download**: Downloads the latest Origins client containing DCR assets  
- ✅ **ProjectorRays Integration**: Wraps the ProjectorRays tool for DCR decompilation
- ✅ **Origins Asset Processing**: Creates Shroom-compatible resources from extracted DCR assets
- ✅ **CLI Integration**: Adds `--origins` flag to the dump command

## Usage

### Basic Origins Asset Dumping

```bash
# Using the convenient npm script
npm run dump:origins -- --location ./origins_assets

# Or using the CLI directly
bun run src/cli/index.tsx dump --origins --url https://origins-gamedata.habbo.com/external_variables/1 --location ./origins_assets

# Using a different Origins server region
bun run src/cli/index.tsx dump --origins --url https://origins-gamedata.habbo.com.br/external_variables/1 --location ./origins_assets_br
```

### Local External Variables File

```bash
# Use a local external variables file
bun run src/cli/index.tsx dump --origins --url file://./local_external_variables.txt --location ./origins_assets
```

## Implementation Details

### File Structure

```
src/tools/dump/
├── parseOriginsExternalVariables.ts    # Parses Origins external variables format
├── getOriginsExternalVariableUrls.ts   # Fetches and processes Origins URLs
├── getOriginsClientUrls.ts             # Fetches client URLs and version info
├── downloadOriginsClient.ts            # Downloads and extracts Origins client
├── downloadOriginsFiles.ts             # Downloads Origins data files and client
├── findOriginsDCRs.ts                  # Finds DCR files in extracted client
├── extractDCRs.ts                       # Extracts DCR files using ProjectorRays
├── dumpDCR.ts                          # Core DCR decompilation wrapper
├── dumpOriginsFigure.ts                # Processes Origins figure assets
└── dumpOriginsFurniture.ts             # Processes Origins furniture assets
```

### Origins vs Modern Assets

| Feature | Modern (SWF) | Origins (DCR) |
|---------|-------------|---------------|
| Asset Format | SWF (Flash) | DCR (Director Cast) |
| External Variables | Standard key=value with ${var} substitution | Same format, different keys |
| Asset Organization | hof_furni, figure, effects directories | DCR files within client zip |
| Extraction Tool | swf-extract | ProjectorRays |
| Metadata | XML visualization/assets files | Embedded in DCR or missing |

### Origins External Variables Format

Origins uses the same key=value format but with different variable names:

```
# Cast entries - main asset libraries
cast.entry.1=hh_interface
cast.entry.2=hh_patch_uk
cast.entry.14=hh_human_acc_face
# ... etc

# Room-specific casts
room.cast.1=hh_soundmachine
room.cast.4=hh_furni_items
# ... etc

# Asset URLs
flash.dynamic.download.url=//images.habbo.com//dcr/hof_furni/
external.figurepartlist.txt=http://origins-gamedata.habbo.com/figuredata_xml/1
external.texts.txt=http://origins-gamedata.habbo.com/external_texts/1
```

## ProjectorRays Integration

The implementation wraps [ProjectorRays](https://github.com/ProjectorRays/ProjectorRays) to decompile DCR files:

```typescript
// Basic DCR decompilation command
./projectorrays decompile "path/to/file.dcr"
```

**Note**: ProjectorRays will be automatically downloaded and built if not present in the current directory. The system requires Homebrew to install dependencies (boost, mpg123, zlib).

### ProjectorRays Auto-Setup

The system will automatically:

1. Check if ProjectorRays is available in the current directory
2. If not found, clone the repository from GitHub
3. Install required dependencies via Homebrew (boost, mpg123, zlib)
4. Build ProjectorRays using the provided Makefile
5. Verify the build was successful

Prerequisites for auto-setup:
- macOS with Homebrew installed
- Git available in PATH
- Build tools (Xcode Command Line Tools)

If ProjectorRays setup fails, you can manually install it:

1. Install Homebrew: https://brew.sh/
2. Install dependencies: `brew install boost mpg123 zlib`
3. Clone ProjectorRays: `git clone https://github.com/ProjectorRays/ProjectorRays.git`
4. Build: `cd ProjectorRays && make`

## Asset Processing Differences

### Figure Assets

Origins figure assets follow a different naming convention:
- **Modern**: `{part}_{id}_{direction}_{frame}.png`
- **Origins**: `{size}_{action}_{part}_{id}_{direction}_{frame}.png`

Example: `h_std_head_1_0_0.png` (Origins) vs `head_1_0_0.png` (Modern)

### Furniture Assets

Origins furniture assets are simpler:
- No separate visualization.bin, assets.bin, index.bin files
- Metadata is embedded in the DCR or reconstructed
- Default visualization structures are created for compatibility

## Future Improvements

- [ ] **Enhanced Metadata Extraction**: Better extraction of sprite registration points and part information
- [ ] **Figure Animation Support**: Support for animated Origins avatars  
- [ ] **FX Rendering**: Support for Origins effects rendering
- [ ] **Swimwear Support**: Handle Origins-specific swimwear assets
- [ ] **Better DCR Integration**: More robust ProjectorRays integration with error handling
- [ ] **Asset Validation**: Validate extracted assets for completeness

## Troubleshooting

### ProjectorRays Setup Issues

If you encounter issues with ProjectorRays auto-setup:

1. **Homebrew Not Found**: Install Homebrew from https://brew.sh/
2. **Build Dependencies**: Ensure Xcode Command Line Tools are installed: `xcode-select --install`
3. **Git Not Available**: Install Git via Homebrew: `brew install git`
4. **Build Failures**: Check that all dependencies are properly installed

### Manual ProjectorRays Installation

If auto-setup fails, manually install ProjectorRays:

```bash
# Install dependencies
brew install boost mpg123 zlib

# Clone and build ProjectorRays
git clone https://github.com/ProjectorRays/ProjectorRays.git
cd ProjectorRays
make

# Test the build
./projectorrays --help
```

### Extract All Origins Assets

```bash
npm run dump:origins -- --location ./origins_complete
```

This will:
1. Download external variables from origins-gamedata.habbo.com
2. Fetch the latest Origins client version information
3. Download and extract the Origins client zip file
4. Find all DCR files within the client
5. Auto-setup ProjectorRays if not present (download, build dependencies, compile)
6. Decompile DCR contents using ProjectorRays
7. Generate .shroom files compatible with the existing infrastructure

### Extract from Multiple Regions

```bash
# US/International
npm run dump:origins -- --location ./origins_us

# Brazil
bun run src/cli/index.tsx dump --origins --url https://origins-gamedata.habbo.com.br/external_variables/1 --location ./origins_br

# Spain  
bun run src/cli/index.tsx dump --origins --url https://origins-gamedata.habbo.es/external_variables/1 --location ./origins_es
``` 