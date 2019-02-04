'use babel';
import { select as d3select } from 'd3-selection';

import { Renderer } from './Renderer';

import {
  rightHead as linkRightHead,
  leftHead as linkLeftHead,
  tailGenerator
} from '../helpers/link';

import { arrowLabel } from '../helpers/arrow-label'
import  { PADDING }  from './Renderer';
import  { MIN_WIDTH } from './Renderer';

export class TimelineRenderer extends Renderer {

  construct(opts) {
    super.construct(opts)
  }

  onCreate(svg, scene) {
    this.updateLinks(scene);
    this.updateTimeliens(scene);
    this.onDidDragOrZoom(svg.node());
    this.onDidRender(svg.node());
  }

  onBlockDrag(svg, scene) {
    this.updateLinks(scene);
    this.updateTimeliens(scene);
    this.onDidDragOrZoom(svg.node())
  }

  updateLinks(scene) {

    let yStart = 0; //Used only in links of type "MESSAGE"

    scene.selectAll('.dd-block').each((d) => {
      let y = d.layout.pos.y + d.layout.h + 50;
      yStart = Math.max(yStart, y)
    });

    scene.selectAll('.dd-link')
      .each(function(d) {
        const link = d3select(this);
        const tail = link.select('.dd-link-tail');
        const leftHead = link.select('.dd-link-head-left');
        const rightHead = link.select('.dd-link-head-right');
        const label = link.select('.dd-link-label');

        tail.attr('d', tailGenerator(d.style, {yStart: yStart, ySeparation: 60}));
        rightHead.attr('d', linkRightHead);
        leftHead.attr('d', linkLeftHead);

        arrowLabel(label, d, PADDING);
      })
  }

  updateTimeliens(scene) {
    let yStart = 0; //Used only in links of type "MESSAGE"

    scene.selectAll('.dd-timeline').each((d) => {
      let y = d.layout.pos.y + d.layout.h + 50;
      yStart = Math.max(yStart, y)
    });


    let yEnd = scene.selectAll('.dd-link').nodes().length * 60+ yStart;

    scene.selectAll('.dd-timeline')
      .attr('x1', d => d.layout.pos.x)
      .attr('y1', d =>  d.layout.pos.y + d.layout.h/2)
      .attr('x2', d =>  d.layout.pos.x)
      .attr('y2', yEnd)

  }

  autoLayout(diagram) {
    const layout = {
      blocks: {}
    }
console.log(diagram, MIN_WIDTH, PADDING);
    diagram.blocks.forEach((block, index) => {
      layout.blocks[block.id] = {
        pos: {x: (index+1)*(MIN_WIDTH + 4*PADDING),y:30},
        w: MIN_WIDTH,
        h: 0,
        links: {t: [],r: [],b: [],l: []}
      }
    });

    return layout;
  }

}
