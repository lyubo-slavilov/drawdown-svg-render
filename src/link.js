export function tail(d) {

  let sl = d.source.layout;
  let tl = d.target.layout;

  let dir = getApparentDir(sl, tl);

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
      script =  `M${start.x} ${start.y} H${end.x} V${end.y}`;
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
      script =  `M${start.x} ${start.y}V${end.y}H${end.x}`;
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
      script =  `M${start.x} ${start.y}H${middle}V${end.y}H${end.x}`;
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
      script =  `M${start.x} ${start.y}V${middle}H${end.x}V${end.y}`;
      break;
  }
  d.pathMeta = {
    start: start,
    end: end,
    dir: dir
  }
  return script;
}

export function head(d) {
  if (!d.pathMeta) {
    return;
  }
  let end = d.pathMeta.end;
  let dir = d.pathMeta.dir;
  let w = 14;
  let h = 8;
  switch (true) {
    case ['ENE', 'E', 'ESE'].indexOf(dir) >= 0:
      return `M${end.x} ${end.y}L${end.x - w} ${end.y - h/2}V${end.y + h/2}Z`;
    case ['WNW', 'W', 'WSW'].indexOf(dir) >= 0:
      return `M${end.x} ${end.y}L${end.x + w} ${end.y - h/2}V${end.y + h/2}Z`;
    case ['NNW', 'N', 'NNE'].indexOf(dir) >= 0:
      return `M${end.x} ${end.y}L${end.x - h/2} ${end.y + w}H${end.x + h/2}Z`;
    case ['SSW', 'S', 'SSE'].indexOf(dir) >= 0:
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
