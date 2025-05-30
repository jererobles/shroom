import * as PIXI from "pixi.js";

export class HighlightFilter extends PIXI.Filter {
  private _uniforms: any;

  constructor(private _backgroundColor: number, private _borderColor: number) {
    super({
      glProgram: PIXI.GlProgram.from({
        vertex,
        fragment,
      }),
    });

    this._uniforms = {
      backgroundColor: new Float32Array(4),
      borderColor: new Float32Array(4),
    };

    // Convert hex colors to RGB arrays
    const bgRgb = this.hexToRgb(this._backgroundColor);
    const borderRgb = this.hexToRgb(this._borderColor);

    this._uniforms.backgroundColor = [...bgRgb, 1.0];
    this._uniforms.borderColor = [...borderRgb, 1.0];
  }

  get uniforms() {
    return this._uniforms;
  }

  private hexToRgb(hex: number): [number, number, number] {
    return [
      ((hex >> 16) & 255) / 255,
      ((hex >> 8) & 255) / 255,
      (hex & 255) / 255
    ];
  }
}

const vertex = `
attribute vec2 aVertexPosition;
attribute vec2 aTextureCoord;

uniform mat3 projectionMatrix;

varying vec2 vTextureCoord;

void main(void)
{
    gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
    vTextureCoord = aTextureCoord;
}
`;

const fragment = `
varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform vec4 backgroundColor;
uniform vec4 borderColor;

void main(void) {
    vec4 currentColor = texture2D(uSampler, vTextureCoord);

    if (currentColor.a > 0.0) {
        if (currentColor.r == 0.0 && currentColor.g == 0.0 && currentColor.b == 0.0) {
            gl_FragColor = borderColor;
        } else {
            gl_FragColor = backgroundColor;
        }
    }
}
`;
