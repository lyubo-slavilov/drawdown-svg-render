import { PADDING as P } from './Renderer'


export function shapeGenerator(style) {
  switch ( style ) {
    case 'AUTO': return auto;
    case 'RECTANGLE': return rectangle;
    case 'CIRCLE': return circle;
    case 'DIAMOND': return diamond;
    default:
      throw `Unknown node style "${style}"`;
  }
}

export function auto(d) {
  let l = d.layout;

  switch (d.blockType.toUpperCase()) {
    case 'PROCESS':
      return rectanglePath(0, 0, l.w, l.h);
    case 'NODE':
        return circlePath(0, 0,  Math.sqrt(l.w*l.w + l.h*l.h)/2);
    case 'CONDITION':
      return diamondPath(0, 0, l.w, l.h)
  }
}

export function circle(d) {
  let l = d.layout;
  return circlePath(0,0, Math.sqrt(l.w*l.w + l.h*l.h)/2);
}

export function rectangle(d) {
  let l = d.layout;
  return rectanglePath(0, 0, l.w, l.h);
}

export function diamond(d) {
  let l = d.layout;
  return diamondPath(0, 0, l.w, l.h);
}

// PATHS

function rectanglePath(x, y, w, h) {
  return `M${x-w/2-P} ${y-h/2 - P}h${w+2*P}v${h+2*P}h${-w-2*P}Z`;
}

function diamondPath(x, y, w, h) {
  let ww = w+h + P;
  return `M${0} ${y-ww/2}
          L${x+ww/2} 0
          L0 ${y + ww/2}
          L${x-ww/2} 0
          Z`
}

function circlePath(x,y,r) {
  return `M${x-r} ${y}
          a ${r} ${r} 0 1 0 ${r*2} 0
          a ${r} ${r} 0 1 0 ${-r*2} 0`
}
