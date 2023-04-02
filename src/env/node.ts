/* eslint-disable no-restricted-globals */
import { Canvas as NodeCanvas, Image } from 'canvas';
import { JSDOM } from 'jsdom';
import { config } from '../config';
import { NodeGLProbe } from '../filters/GLProbes/NodeGLProbe';
import { setEnv } from './index';
import { TCopyPasteData, TFabricEnv } from './types';

const copyPasteData: TCopyPasteData = {};

const { window: JSDOMWindow } = new JSDOM(
  decodeURIComponent(
    '%3C!DOCTYPE%20html%3E%3Chtml%3E%3Chead%3E%3C%2Fhead%3E%3Cbody%3E%3C%2Fbody%3E%3C%2Fhtml%3E'
  ),
  {
    resources: 'usable',
    // needed for `requestAnimationFrame`
    pretendToBeVisual: true,
  }
);

config.configure({
  devicePixelRatio: JSDOMWindow.devicePixelRatio || 1,
});

export const getEnv = (): TFabricEnv => {
  return {
    document: JSDOMWindow.document,
    window: JSDOMWindow,
    isTouchSupported: false,
    WebGLProbe: new NodeGLProbe(),
    createCanvasElement(
      width = 300,
      height = 150,
      type?: 'image' | 'pdf' | 'svg'
    ) {
      return new NodeCanvas(width, height, type);
    },
    createImageElement() {
      return new Image();
    },
    copyPasteData,
  };
};

setEnv(getEnv());
