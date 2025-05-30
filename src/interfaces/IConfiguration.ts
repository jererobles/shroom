import * as PIXI from "pixi.js";

export interface IConfiguration {
  placeholder?: PIXI.Texture;
  tileColor?: { floorColor?: string; leftFade?: number; rightFade?: number };
  avatarMovementDuration?: number;
  furnitureMovementDuration?: number;
}
