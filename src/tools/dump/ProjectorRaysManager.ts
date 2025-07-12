import { promises as fs } from "fs";
import * as path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export class ProjectorRaysManager {
  private static instance: ProjectorRaysManager;
  private projectorRaysPath: string;
  private projectorRaysExecutable: string;
  private isInitialized = false;

  private constructor() {
    this.projectorRaysPath = path.join(process.cwd(), "ProjectorRays");
    this.projectorRaysExecutable = path.join(this.projectorRaysPath, "projectorrays");
  }

  public static getInstance(): ProjectorRaysManager {
    if (!ProjectorRaysManager.instance) {
      ProjectorRaysManager.instance = new ProjectorRaysManager();
    }
    return ProjectorRaysManager.instance;
  }

  public async ensureAvailable(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Check if ProjectorRays executable exists
      await fs.access(this.projectorRaysExecutable);
      console.log("ProjectorRays found and ready to use");
      this.isInitialized = true;
      return;
    } catch (error) {
      // ProjectorRays not found, need to download and build it
      console.log("ProjectorRays not found, downloading and building...");
      
      try {
        // Check if ProjectorRays directory already exists
        try {
          await fs.access(this.projectorRaysPath);
          console.log("ProjectorRays directory exists, checking if it's a valid repository...");
          
          // Check if it's a git repository
          try {
            await execAsync(`cd "${this.projectorRaysPath}" && git status`);
            console.log("Valid git repository found, attempting to build...");
          } catch (gitError) {
            console.log("Directory exists but is not a valid git repository, removing and re-cloning...");
            await fs.rm(this.projectorRaysPath, { recursive: true, force: true });
            await execAsync(`git clone https://github.com/ProjectorRays/ProjectorRays.git "${this.projectorRaysPath}"`);
          }
        } catch (dirError) {
          // Directory doesn't exist, clone it
          console.log("Cloning ProjectorRays repository...");
          await execAsync(`git clone https://github.com/ProjectorRays/ProjectorRays.git "${this.projectorRaysPath}"`);
        }
        
        // Check if required dependencies are installed
        console.log("Checking dependencies...");
        try {
          await execAsync("brew --version");
        } catch (error) {
          throw new Error("Homebrew is required to install dependencies. Please install Homebrew first: https://brew.sh/");
        }
        
        // Install required dependencies with timeout and better error handling
        console.log("Installing dependencies (boost, mpg123, zlib)...");
        console.log("This may take a few minutes...");
        
        try {
          // Install dependencies with a timeout
          const installPromise = execAsync("brew install boost mpg123 zlib");
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Dependency installation timed out after 10 minutes")), 10 * 60 * 1000)
          );
          
          await Promise.race([installPromise, timeoutPromise]);
          console.log("Dependencies installed successfully");
        } catch (installError) {
          console.warn("Dependency installation failed or timed out:", installError);
          console.log("Attempting to continue with build (dependencies might already be installed)...");
        }
        
        // Build ProjectorRays
        console.log("Building ProjectorRays...");
        await execAsync(`cd "${this.projectorRaysPath}" && make`);
        
        // Verify the build was successful
        await fs.access(this.projectorRaysExecutable);
        console.log("ProjectorRays built successfully!");
        this.isInitialized = true;
        
      } catch (buildError) {
        console.error("Failed to download and build ProjectorRays:", buildError);
        throw new Error(`ProjectorRays setup failed: ${buildError instanceof Error ? buildError.message : String(buildError)}`);
      }
    }
  }

  public async extractFile(inputPath: string, outputDir: string): Promise<{ success: boolean; extractedFiles: string[] }> {
    await this.ensureAvailable();

    try {
      // Use absolute paths to ensure ProjectorRays can find the files
      const absoluteInputPath = path.resolve(inputPath);
      const absoluteOutputDir = path.resolve(outputDir);
      
      // Use the -o option to specify output directory
      const command = `cd "${this.projectorRaysPath}" && ./projectorrays decompile "${absoluteInputPath}" -o "${absoluteOutputDir}"`;
      
      console.log(`Extracting with ProjectorRays: ${inputPath}`);
      console.log(`Command: ${command}`);
      
      const { stdout, stderr } = await execAsync(command);
      
      if (stdout) {
        console.log(`ProjectorRays stdout: ${stdout}`);
      }
      
      if (stderr) {
        console.warn(`ProjectorRays stderr: ${stderr}`);
      }

      // ProjectorRays should now create output files directly in our output directory
      const extractedFiles: string[] = [];

      console.log(`Looking for extracted files in: ${absoluteOutputDir}`);

      // Check what's in the output directory after extraction
      try {
        const outputDirFiles = await fs.readdir(absoluteOutputDir, { withFileTypes: true });
        console.log(`Files in output directory after extraction: ${outputDirFiles.map(f => f.name).join(', ')}`);
        
        // Add all files in the output directory to the extracted files list
        for (const file of outputDirFiles) {
          if (file.isFile()) {
            const filePath = path.join(absoluteOutputDir, file.name);
            extractedFiles.push(filePath);
            console.log(`Found extracted file: ${filePath}`);
          }
        }
      } catch (dirError) {
        console.warn(`Failed to read output directory: ${dirError}`);
      }

      if (extractedFiles.length > 0) {
        console.log(`Successfully extracted ${extractedFiles.length} files from: ${inputPath}`);
        return { success: true, extractedFiles };
      } else {
        console.warn(`No files were extracted from: ${inputPath}`);
        console.warn(`This might indicate that ProjectorRays failed to extract the graphics from the CCT/DCR file`);
        return { success: false, extractedFiles: [] };
      }
      
    } catch (error) {
      console.error(`ProjectorRays extraction failed for ${inputPath}:`, error);
      return { success: false, extractedFiles: [] };
    }
  }
} 