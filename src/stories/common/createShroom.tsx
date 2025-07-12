import * as PIXI from "pixi.js";
import { Shroom } from "../../../dist";
import { useRef } from "react";
import React from "react";
import { Application, Assets } from "pixi.js";

type CleanupFn = () => void;
type CallbackOptions = {
  application: PIXI.Application;
  shroom: Shroom;
  container: HTMLDivElement;
};

export function createShroom(
  cb: (options: CallbackOptions) => CleanupFn | void
) {
  const App = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    React.useEffect(() => {
      const element = canvasRef.current;
      const container = containerRef.current;
      if (element == null) return;
      if (container == null) return;

      Assets.setPreferences({
        preferWorkers: true,
        crossOrigin: 'use-credentials',
      });
      const application = new Application();

      (globalThis as any).__PIXI_APP__ = application;
      application.init({
        canvas: element,
        antialias: true, // Enable antialiasing for smoother text
        resolution: window.devicePixelRatio,
        autoDensity: true,
        resizeTo: window,
        backgroundAlpha: 0, // Use backgroundAlpha instead of transparent
        preference: 'webgl', // Use WebGL for better text rendering
        preserveDrawingBuffer: true,
      }).then(() => {
        const shroom = Shroom.create({
          resourcePath: "https://ass.havatars.app",
          application: application,
          configuration: {
          },
        });
        cb({ application, shroom, container });
      });

    }, []);

    return (
      <div ref={containerRef}>
        <canvas ref={canvasRef} />
      </div>
    );
  };

  return <App />;
}
