'use babel';
import { PADDING as P } from './Renderer'

export function block(d) {
  let l = d.layout;

  switch (d.blockType.toUpperCase()) {
    case 'PROCESS':
      return process(0, 0, l.w, l.h);
    case 'NODE':
        return process(0, 0, l.w, l.h);
    case 'CONDITION':
      return condition(0, 0, l.w, l.h)
  }
}

function process(x, y, w, h) {
  return `M${x-w/2-P} ${y-h/2 - P}h${w+2*P}v${h+2*P}h${-w-2*P}Z`;
}

function condition(x, y, w, h) {
  let ww = w+h + 4*P;
  return `M${0} ${y-ww/2}
          L${x+ww/2} 0
          L0 ${y + ww/2}
          L${x-ww/2} 0
          Z`
}
