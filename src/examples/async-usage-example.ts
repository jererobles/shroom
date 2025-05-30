import * as PIXI from "pixi.js";
import { Shroom } from "../objects/Shroom";
import { Room } from "../objects/room/Room";
import { FloorFurniture } from "../objects/furniture/FloorFurniture";
import { Avatar } from "../objects/avatar/Avatar";
import * as AsyncUtils from "../util/AsyncUtils";
import { LoadProgress } from "../interfaces/IAsyncInitializable";

/**
 * Example demonstrating async/await usage with the Shroom library
 */
async function createRoomWithAsyncAwait() {
  // Create PIXI application
  const app = new PIXI.Application({
    width: 800,
    height: 600,
    backgroundColor: 0x1099bb,
  });
  document.body.appendChild(app.view as HTMLCanvasElement);

  // Create Shroom instance asynchronously with preloaded resources
  const shroom = await Shroom.createAsync({
    application: app,
    resourcePath: "https://example.com/resources",
    preload: {
      // Preload specific furniture types
      furniture: ["throne", "club_sofa", "rare_dragonlamp"],
      // Preload avatar looks
      avatars: ["hd-180-1.hr-828-61.ch-210-66.lg-270-82.sh-290-62"],
    },
  });

  // Create room asynchronously with preloaded textures
  const room = await Room.createAsync(shroom, {
    tilemap: `
      xxxx
      x000
      x000
      x000
    `,
    wallTexture: "https://example.com/textures/wall.png",
    floorTexture: "https://example.com/textures/floor.png",
    preloadFurniture: ["table_plasto_square", "chair_plasto"],
  });

  // Add room to stage
  app.stage.addChild(room);

  // Create floor furniture asynchronously - ensures it's fully loaded before adding
  const furniture = new FloorFurniture({
    type: "throne",
    direction: 2,
    animation: "0",
    roomX: 1,
    roomY: 1,
    roomZ: 0,
  });

  // Load and add furniture
  await furniture.loadAsync();
  room.addRoomObject(furniture);

  // Alternative: Load furniture asynchronously after creation
  const sofa = new FloorFurniture({
    type: "club_sofa",
    direction: 4,
    roomX: 2,
    roomY: 1,
    roomZ: 0,
  });

  // Ensure furniture is loaded before adding to room
  await sofa.loadAsync();
  room.addRoomObject(sofa);

  // Use addRoomObjectAsync for automatic loading
  const lamp = new FloorFurniture({
    type: "rare_dragonlamp",
    direction: 2,
    roomX: 1,
    roomY: 2,
    roomZ: 0,
  });

  // This will wait for the lamp to load before adding it
  await room.addRoomObjectAsync(lamp);

  // Create and add avatar asynchronously
  const avatar = new Avatar({
    look: "hd-180-1.hr-828-61.ch-210-66.lg-270-82.sh-290-62",
    direction: 4,
    roomX: 2,
    roomY: 2,
    roomZ: 0,
  });

  // Avatar will be loaded if it implements loadAsync
  await room.addRoomObjectAsync(avatar);

  // Batch loading multiple furniture items
  const furnitureToLoad = [
    { type: "chair_plasto", x: 3, y: 1 },
    { type: "table_plasto_square", x: 3, y: 2 },
    { type: "plant_big_cactus", x: 1, y: 3 },
  ];

  const furniturePromises = furnitureToLoad.map(({ type, x, y }) => {
    const item = new FloorFurniture({
      type: type,
      direction: 0,
      roomX: x,
      roomY: y,
      roomZ: 0,
    });
    return item.loadAsync().then(() => item);
  });

  // Wait for all furniture to load
  const loadedFurniture = await Promise.all(furniturePromises);

  // Add all loaded furniture to room
  loadedFurniture.forEach((item) => room.addRoomObject(item));

  console.log("Room setup complete with all assets loaded!");
}

// Error handling example
async function createRoomWithErrorHandling() {
  try {
    const app = new PIXI.Application();
    
    const shroom = await Shroom.createAsync({
      application: app,
      resourcePath: "https://example.com/resources",
    });

    const room = await Room.createAsync(shroom, {
      tilemap: `xxxx\nx000\nx000`,
    });

    // Load furniture with error handling
    try {
      const furniture = new FloorFurniture({
        type: "non_existent_furniture",
        direction: 0,
        roomX: 1,
        roomY: 1,
        roomZ: 0,
      });
      await furniture.loadAsync();
      room.addRoomObject(furniture);
    } catch (furnitureError) {
      console.error("Failed to load furniture:", furnitureError);
      // Handle error - maybe load a placeholder or skip this furniture
    }

  } catch (error) {
    console.error("Failed to initialize room:", error);
  }
}

// Progress tracking example using AsyncUtils
async function loadRoomWithProgress() {
  const app = new PIXI.Application();
  const shroom = await Shroom.createAsync({ application: app });
  const room = await Room.createAsync(shroom, { tilemap: "xxxx\nx000" });

  const furnitureTypes = ["throne", "club_sofa", "rare_dragonlamp", "table_plasto_square"];
  
  // Use batchLoad with progress tracking
  const loadResult = await AsyncUtils.batchLoad(
    furnitureTypes,
    async (type: string) => {
      const furniture = new FloorFurniture({
        type: type,
        direction: 0,
        roomX: Math.floor(Math.random() * 3),
        roomY: Math.floor(Math.random() * 3),
        roomZ: 0,
      });
      await furniture.loadAsync();
      return furniture;
    },
    {
      onProgress: (progress: LoadProgress) => {
        console.log(`Loading progress: ${(progress.percentage * 100).toFixed(0)}%`);
        console.log(`Loaded ${progress.loaded} of ${progress.total} items`);
      },
    }
  );

  // Add successfully loaded furniture
  loadResult.loaded.forEach((furniture: FloorFurniture) => room.addRoomObject(furniture));

  // Handle failed items
  if (loadResult.failed.length > 0) {
    console.error("Failed to load some furniture:", loadResult.failed);
  }
}

// Run the example
createRoomWithAsyncAwait().catch(console.error);
