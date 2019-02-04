

export function tailGenerator(style, opts) {
  switch ( style ) {

    case '-':
    case 'STRAIGHT': return straightTail;

    case '~':
    case 'CURVED': return curvedTail;

    case 'MESSAGE': return (d) => messageTail(d, opts);

    default:
      throw `Unknown link style "${style}"`;
  }
}

function messageTail(d, opts) {
  let yOffset = opts.yStart+ opts.ySeparation * d.index
  let sl = d.source.layout;
  let tl = d.target.layout


  if (d.source == d.target) {

    d.pathMeta = {
      start: {x: sl.pos.x, y: yOffset - opts.ySeparation},
      end: {x: sl.pos.x, y: yOffset},
      dir: 'W'
    }
    let start = d.pathMeta.start;

    d.textMeta = {
      pos: {x: start.x + opts.ySeparation*0.8, y: start.y + opts.ySeparation/2},
      baseLine: 'text-after-edge',
      textAnchor: 'start'

    }
    return `M${start.x} ${start.y}
          C ${start.x + opts.ySeparation} ${start.y}
            ${start.x + opts.ySeparation} ${start.y + opts.ySeparation}
            ${start.x} ${start.y + opts.ySeparation}`

  } else {

    d.pathMeta = {
      start: {x: sl.pos.x, y: yOffset},
      end: {x: tl.pos.x, y: yOffset},
      dir: tl.pos.x > sl.pos.x ? 'E': 'W'
    }

    d.textMeta = {
      pos: {x: d.pathMeta.start.x + (d.pathMeta.end.x - d.pathMeta.start.x) / 2, y: yOffset - 5 },
      baseLine: 'text-after-edge',
      textAnchor: 'middle'
    }
    return `M${d.source.layout.pos.x} ${yOffset} H ${d.target.layout.pos.x}`;
  }
}

function straightTail(d) {
  const [pathMeta, script] =  tail(d, true);
  d.pathMeta = pathMeta;
  return script;
}

function curvedTail(d) {
  const [pathMeta, script] =  tail(d, false);
  d.pathMeta = pathMeta;
  return script;
}

function tail(d, isStraight) {

  let sl = d.source.layout;
  let tl = d.target.layout;


  let dir = d.source.id == d.target.id ? 'SELF' : getApparentDir(sl, tl);

  let start =  {x: 0, y:0};
  let end =  {x: 0, y:0};
  let middle = 0;
  let script = '';

  switch (true) {
    case ['NNE', 'SSE', 'SSW', 'NNW'].indexOf(dir) >= 0:
      start.x = sl.pos.x + sl.bbw/2;
      start.y = sl.pos.y;
      end.x = tl.pos.x;
      end.y = tl.pos.y + tl.bbh/2;
      if (['NNW', 'SSW'].indexOf(dir) >= 0) {
        start.x = sl.pos.x - sl.bbw/2;
      }
      if (['SSE', 'SSW'].indexOf(dir) >= 0) {
        end.y = tl.pos.y - tl.bbh/2;
      }
      if (isStraight) {
        script =  `M${start.x} ${start.y} H${end.x} V${end.y}`;
      } else {
        script =  `M${start.x} ${start.y} Q${end.x} ${start.y} ${end.x} ${end.y}`;
      }
      break;
    case (['ENE', 'ESE', 'WNW', 'WSW'].indexOf(dir) >= 0):
      start.x = sl.pos.x;
      start.y = sl.pos.y - sl.bbh/2;
      end.x = tl.pos.x - tl.bbw/2;
      end.y = tl.pos.y;
      if (['ESE', 'WSW'].indexOf(dir) >= 0) {
        start.y = sl.pos.y + sl.bbh/2;
      }
      if (['WNW', 'WSW'].indexOf(dir) >= 0) {
        end.x = tl.pos.x + tl.bbw/2;
      }
      if (isStraight) {
        script =  `M${start.x} ${start.y}V${end.y}H${end.x}`;
      } else {
        script =  `M${start.x} ${start.y}Q${start.x} ${end.y} ${end.x} ${end.y}`;
      }
      break;

    case ['E', 'W'].indexOf(dir) >= 0:
      start.x = sl.pos.x + sl.bbw/2;
      start.y = sl.pos.y;
      end.x = tl.pos.x - tl.bbw/2;
      end.y = tl.pos.y;
      if (dir == 'W') {
        start.x = sl.pos.x - sl.bbw/2;
        end.x = tl.pos.x + tl.bbw/2;
      }
      middle = start.x + (end.x - start.x)/2;
      if (isStraight) {
        script =  `M${start.x} ${start.y}H${middle}V${end.y}H${end.x}`;
      } else {
        script =  `M${start.x} ${start.y}C${middle} ${start.y} ${middle} ${end.y} ${end.x} ${end.y}`;
      }
      break;
    case ['N', 'S'].indexOf(dir) >= 0:
      start.x = sl.pos.x;
      start.y = sl.pos.y - sl.bbh/2;
      end.x = tl.pos.x;
      end.y = tl.pos.y + tl.bbh/2;
      if (dir == 'S') {
        start.y = sl.pos.y + sl.bbh/2;
        end.y = tl.pos.y - tl.bbh/2;
      }
      middle = start.y + (end.y - start.y)/2;
      if (isStraight) {
        script =  `M${start.x} ${start.y}V${middle}H${end.x}V${end.y}`;
      } else {
        script =  `M${start.x} ${start.y}C${start.x} ${middle} ${end.x} ${middle} ${end.x} ${end.y}`;
      }
      break;
    case 'SELF' == dir:
      start.x = sl.pos.x;
      start.y = sl.pos.y - sl.bbh/2;
      end.x = sl.pos.x + sl.bbw/2;
      end.y = sl.pos.y;
      let r = Math.sqrt(sl.bbw*sl.bbw + sl.bbh*sl.bbh)/4;
      if (isStraight) {
        script =  `M${start.x} ${start.y}V${start.y - r}H${end.x + r}V${end.y}H${end.x}`;
      } else {
        script =  `M${start.x} ${start.y}C ${start.x+r} ${start.y-3*r} ${end.x + 3*r} ${end.y} ${end.x} ${end.y}`;
      }

      break;
  }

  return [
    {
      start: start,
      end: end,
      dir: dir
    },
    script
  ]
  return script;
}


export function leftHead(d) {
  return head(d, false)
}
export function rightHead(d) {
  return head(d, true)
}
function head(d, isRight) {
  if (!d.pathMeta) {
    return;
  }
  let end;
  if (isRight) {
    end = d.pathMeta.end;
  } else {
    end = d.pathMeta.start;
  }

  const dir = d.pathMeta.dir;
  const w = 14;
  const h = 8;

  let directions;
  if (isRight) {
    directions = {
      easts: ['ENE', 'E', 'ESE'],
      wests: ['WNW', 'W', 'WSW', "SELF"],
      norts: ['NNW', 'N', 'NNE'],
      souths: ['SSW', 'S', 'SSE']
    }
  } else {
    directions = {
      easts: ['NNW', 'W', 'SSW'],
      wests: ['NNE', 'E', 'SSE'],
      norts: ['WSW', 'S', 'ESE'],
      souths: ['WNW', 'N', 'ENE', "SELF"]
    }
  }

  switch (true) {
    case directions.easts.indexOf(dir) >= 0:
      return `M${end.x} ${end.y}L${end.x - w} ${end.y - h/2}V${end.y + h/2}Z`;
    case directions.wests.indexOf(dir) >= 0:
      return `M${end.x} ${end.y}L${end.x + w} ${end.y - h/2}V${end.y + h/2}Z`;
    case directions.norts.indexOf(dir) >= 0:
      return `M${end.x} ${end.y}L${end.x - h/2} ${end.y + w}H${end.x + h/2}Z`;
    case directions.souths.indexOf(dir) >= 0:
      return `M${end.x} ${end.y}L${end.x - h/2} ${end.y - w}H${end.x + h/2}Z`;

  }
}

function getApparentDir(sl, tl) {


  let vDir = 'SAME';
  let hDir = 'SAME';
  let dir = '?';

  if (tl.pos.y + tl.bbh/2 < sl.pos.y - sl.bbh/2 ) {
    vDir = 'TOP';
  } else if (tl.pos.y - tl.bbh/2 > sl.pos.y + sl.bbh/2) {
    vDir = 'BOTTOM';
  }

  if (tl.pos.x + tl.bbw /2  < sl.pos.x - sl.bbw/2) {
    hDir = 'LEFT'
  } else if (sl.pos.x + sl.bbw/2 < tl.pos.x - tl.bbw/2) {
    hDir = 'RIGHT'
  }

  switch (true) {
    case hDir == 'SAME' && vDir == 'TOP':
      dir = 'N';
      break;
    case hDir == 'SAME' && vDir == 'BOTTOM':
      dir = 'S';
      break;
    case hDir == 'RIGHT' && vDir == 'SAME':
      dir = 'E';
      break;
    case hDir == 'LEFT' && vDir == 'SAME':
      dir = 'W';
      break;
    case hDir == 'RIGHT' && vDir == 'TOP':
      dir = 'NE';
      if (tl.pos.x - tl.bbw/2 - sl.pos.x - sl.bbw/2 > sl.pos.y - sl.bbh/2 - tl.pos.y - tl.bbh/2) {
        dir = 'ENE'
      } else {
        dir = 'NNE'
      }
      break;
    case hDir == 'RIGHT' && vDir == 'BOTTOM':
      dir = 'SE';
      if (tl.pos.x - tl.bbw/2- sl.pos.x - sl.bbw/2 > tl.pos.y - tl.bbh /2 - sl.pos.y - sl.bbh/2) {
        dir = 'ESE'
      } else {
        dir = 'SSE'
      }
      break;
    case hDir == 'LEFT' && vDir == 'TOP':
      dir = 'NW';
      if (sl.pos.x - sl.bbw/2 - tl.pos.x - tl.bbw/2 > sl.pos.y - sl.bbh/2- tl.pos.y - tl.bbh/2) {
        dir = 'WNW'
      } else {
        dir = 'NNW'
      }
      break;
    case hDir == 'LEFT' && vDir == 'BOTTOM':
      dir = 'SW';
      if (sl.pos.x - sl.bbw/2 - tl.pos.x - tl.bbw/2 > tl.pos.y - tl.bbh/2 - sl.pos.y - sl.bbh/2) {
        dir = 'WSW'
      } else {
        dir = 'SSW'
      }
      break;
  }
  return dir;

}
