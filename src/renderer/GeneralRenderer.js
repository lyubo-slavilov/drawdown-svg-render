'use babel';
import { select as d3select } from 'd3-selection';

import { Renderer } from './Renderer';

import {
  rightHead as linkRightHead,
  leftHead as linkLeftHead,
  tailGenerator
} from '../helpers/link';

import { arrowLabel } from '../helpers/arrow-label';
import { PADDING, MIN_WIDTH } from './Renderer';

export class GeneralRenderer extends Renderer {

  construct(opts) {
    super.construct(opts)
  }

  updateLinks(scene) {
    scene.selectAll('.dd-link')
      .each(function(d) {
        const link = d3select(this);
        const tail = link.select('.dd-link-tail');
        const leftHead = link.select('.dd-link-head-left');
        const rightHead = link.select('.dd-link-head-right');
        const label = link.select('.dd-link-label');

        tail.attr('d', tailGenerator(d.style));
        rightHead.attr('d', linkRightHead);
        leftHead.attr('d', linkLeftHead);

        arrowLabel(label, d, PADDING);
      })
  }
}
