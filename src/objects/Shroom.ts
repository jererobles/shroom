import * as PIXI from "pixi.js";
import { AnimationTicker } from "./animation/AnimationTicker";
import { AvatarLoader } from "./avatar/AvatarLoader";
import { FurnitureLoader } from "./furniture/FurnitureLoader";
import { FurnitureData } from "./furniture/FurnitureData";
import { Dependencies } from "./room/Room";

export class Shroom {
  constructor(public readonly dependencies: Dependencies) {}

  /**
   * Create a shroom instance
   */
  static create(
    options: {
      resourcePath?: string;
      application: PIXI.Application;
    } & Partial<Dependencies>
  ) {
    return this.createShared(options).for(options.application);
  }

  /**
   * Create a shroom instance asynchronously with all resources preloaded
   */
  static async createAsync(
    options: {
      resourcePath?: string;
      application: PIXI.Application;
      preload?: {
        furniture?: string[];
        avatars?: string[];
      };
    } & Partial<Dependencies>
  ): Promise<Shroom> {
    const shroom = this.create(options);
    
    // Preload furniture data if not provided
    if (!options.furnitureData && options.resourcePath) {
      await shroom.dependencies.furnitureData?.getInfos();
    }

    // Preload specific furniture if requested
    if (options.preload?.furniture) {
      await Promise.all(
        options.preload.furniture.map(type =>
          shroom.dependencies.furnitureLoader.loadFurni({ kind: "type", type })
        )
      );
    }

    // Preload avatar looks if requested
    if (options.preload?.avatars) {
      await Promise.all(
        options.preload.avatars.map(look =>
          shroom.dependencies.avatarLoader.getAvatarDrawDefinition({
            look,
            direction: 0,
            headDirection: 0,
            actions: new Set()
          })
        )
      );
    }

    return shroom;
  }

  /**
   * Create a shared shroom instance. This is useful if you have multiple
   * `PIXI.Application` which all share the same shroom dependencies.
   */
  static createShared({
    resourcePath,
    configuration,
    animationTicker,
    avatarLoader,
    furnitureData,
    furnitureLoader,
  }: {
    resourcePath?: string;
  } & Partial<Dependencies>) {
    const _furnitureData = furnitureData ?? FurnitureData.create(resourcePath);
    const _avatarLoader =
      avatarLoader ?? AvatarLoader.createForAssetBundle(resourcePath);
    const _furnitureLoader =
      furnitureLoader ??
      FurnitureLoader.createForJson(_furnitureData, resourcePath);
    const _configuration = configuration ?? {};

    return {
      for: (application: PIXI.Application) => {
        const _animationTicker =
          animationTicker ?? AnimationTicker.create(application);

        const realDependencies: Dependencies = {
          animationTicker: _animationTicker,
          avatarLoader: _avatarLoader,
          furnitureLoader: _furnitureLoader,
          configuration: _configuration,
          furnitureData: _furnitureData,
          application,
        };

        return new Shroom(realDependencies);
      },
    };
  }
}
