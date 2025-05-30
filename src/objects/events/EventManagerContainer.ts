import * as PIXI from "pixi.js";
import { EventManager } from "./EventManager";

export class EventManagerContainer {
  private _box: PIXI.TilingSprite | undefined;

  constructor(
    private _application: PIXI.Application,
    private _eventManager: EventManager
  ) {
    this._updateRectangle();

    _application.ticker.add(this._updateRectangle);

    // In PIXI.js v8, use direct event listeners on the stage
    this._application.stage.eventMode = 'static';
    this._application.stage.hitArea = this._application.screen;

    this._application.stage.addEventListener(
      "pointermove",
      (event: PIXI.FederatedPointerEvent) => {
        const position = event.getLocalPosition(this._application.stage);
        this._eventManager.move(event as any, position.x, position.y);
      }
    );

    this._application.stage.addEventListener(
      "pointerup",
      (event: PIXI.FederatedPointerEvent) => {
        const position = event.getLocalPosition(this._application.stage);
        this._eventManager.pointerUp(event as any, position.x, position.y);
      }
    );

    this._application.stage.addEventListener(
      "pointerdown",
      (event: PIXI.FederatedPointerEvent) => {
        const position = event.getLocalPosition(this._application.stage);
        this._eventManager.pointerDown(event as any, position.x, position.y);
      }
    );
  }

  destroy() {
    this._application.ticker.remove(this._updateRectangle);
    // Remove event listeners
    this._application.stage.removeAllListeners();
  }

  private _updateRectangle = () => {
    //this._box?.destroy();

    const renderer = this._application.renderer;
    const width = renderer.width / renderer.resolution;
    const height = renderer.height / renderer.resolution;

    this._box = new PIXI.TilingSprite({
      texture: PIXI.Texture.WHITE,
      width,
      height,
    });
    this._box.alpha = 0.3;

    //this._application.stage.addChild(this._box);
  };
}
