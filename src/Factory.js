'use babel';
import { GeneralRenderer } from './renderer/GeneralRenderer';
import { TimelineRenderer } from './renderer/TimelineRenderer';

export function factory(rendererType, opts = {}) {
  switch (rendererType) {
    case 'GENERAL':
      return new GeneralRenderer(opts)
    case 'TIMELINE':
      return new TimelineRenderer(opts)
    default:
      throw new Error(`Unknown renderer ${rendererType}`)
  }
}
