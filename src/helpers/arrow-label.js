'use babel';

export function arrowLabel(label, d, padding) {
  if (d.textMeta) {
    textMetaBasedLabel(label, d, padding);
  } else {
    pathMetaBasedLabel(label, d, padding);
  }
}


function pathMetaBasedLabel(label, d, padding) {
  label.html(d.label)
    .attr('x', d.pathMeta.start.x)
    .attr('y', d.pathMeta.start.y)
    .attr('dx', d => {
      if (['SSW', 'W', 'NNW'].indexOf(d.pathMeta.dir) >= 0) {
        return - padding / 2;
      } else {
        return padding / 2;
      }
    })
    .attr('dy', d => {
      if (['WNW', 'N', 'ENE'].indexOf(d.pathMeta.dir) >= 0) {
        return  - padding / 2;
      } else {
        return padding / 2;
      }
    })
    .attr('dominant-baseline', d => {
      if (['WNW', 'N', 'ENE'].indexOf(d.pathMeta.dir) >= 0) {
        return  'text-after-edge'
      } else {
        return 'text-before-edge';
      }
    })
    .attr('text-anchor', d => {
      if (['SSW', 'W', 'NNW'].indexOf(d.pathMeta.dir) >= 0) {
        return 'end';
      } else {
        return 'start';
      }
    })
}

function textMetaBasedLabel(label, d, padding) {
  label.html(d.label)
    .attr('x', d.textMeta.pos.x)
    .attr('y', d.textMeta.pos.y)
    .attr('dx', 0)
    .attr('dy', 0)
    .attr('dominant-baseline', d.textMeta.baseLine)
    .attr('text-anchor', d.textMeta.textAnchor)
}
