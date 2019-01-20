import { select as d3select } from 'd3-selection';
import { selectAll as d3selectAll } from 'd3-selection';
import { zoom as d3zoom } from 'd3-zoom';
import { drag as d3drag } from 'd3-drag';
import { event as d3event } from 'd3-selection';
import { zoomTransform  as d3zoomTransform } from 'd3-zoom';

import { hierarchy as d3Hierarchy, tree as d3Tree } from 'd3-hierarchy';
import { head as linkHead, tailGenerator } from './link';
import { shapeGenerator } from './shape';


export const PADDING = 10;
const LINE_HEIGHT = 20;
const MIN_WIDTH = 100;


const LINK_STYLE_STRAIGHT = 'STRAIGHT';
const LINK_STYLE_CURVED = 'CURVED';

const NODE_STYLE_AUTO = 'AUTO';
const NODE_STYLE_RECTANGLE = 'RECTANGLE';
const NODE_STYLE_CIRCLE = 'CIRCLE';
const NODE_STYLE_ELLIPSE = 'ELLIPSE';
const NODE_STYLE_DIAMOND = 'DIAMOND';

export class Renderer {

  constructor({
      onDidChangeLayout = ()=>{},
      onDidDragOrZoom = ()=>{},
      onDidRender = (svg)=>{},
      diagramLayout = {},
      linksStyle = LINK_STYLE_STRAIGHT,
      nodesStyle = NODE_STYLE_AUTO
  } = {}) {
    this.onDidChangeLayout = onDidChangeLayout;
    this.onDidDragOrZoom = onDidDragOrZoom;
    this.onDidRender = onDidRender;
    this.diagramLayout = diagramLayout;
    this.linksStyle = linksStyle;
    this.nodesStyle = nodesStyle;
  }

  render(container, diagram) {

    let layout;
    if (this.diagramLayout[diagram.hash]) {
      layout = this.diagramLayout[diagram.hash];
    } else {
      layout =this.autoLayout(diagram)
    }

    let [svg, scene] = this.createScene(container, diagram, layout);

    this.createDiagram(svg, scene, diagram, layout)

    //fix text selection on user interaction
    scene.selectAll('text')
      .on('mousedown', () => {
        d3select('.dd-link-handle').classed('active', false);
        d3event.stopPropagation();
      })

    this.updateLinks(scene);
    this.onDidDragOrZoom(svg.node());
    this.onDidRender(svg.node());
  }

  createScene(container, diagram, layout) {
    let renderer = this;
    let w = container.clientWidth;
    let h = container.clientHeight;

    let svg =  d3select(container).append('svg')
      .attr('class', 'dd-diagram')
      .attr("width", w)
      .attr("height", 200)
      .on('mousedown', function(){
        d3select(this).classed('focused', true);
        d3event.stopPropagation();
      })

    let workarea = svg.append('g')
      .attr('class', 'workarea')
      .attr('transform', `translate(${w/2} ${0.02*h})`);

    let scene = workarea.append('g')
        .attr('class', 'scene')
        .attr('transform', () => {
          if (layout.transform){
            return `translate(${layout.transform.x} ${layout.transform.y}) scale(${layout.transform.k})`
          } else {
            return 'translate(0 0) scale(1)'
          }
        });

    scene.append('g').attr('class', 'dd-blocks');
    scene.append('g').attr('class', 'dd-links');

    this.createZoom(svg, scene, diagram, layout)


    return [svg, scene];
  }

  createZoom(svg, scene, diagram, layout) {
    let renderer = this;
    //set zoom behavior
    svg.call(d3zoom().scaleExtent([0.5, 1])
      .filter(function(){
          if (!d3select(this).classed('focused')) {
            return false;
          }

         return ! (d3event.button || d3event.shiftKey)
       })
      .on('start', () => {
        d3select('.dd-link-handle').classed('active', false);
        svg.selectAll('.selected').classed('selected', false)
      }).on('zoom', function(){
        diagram.transform = d3event.transform;
        scene.attr("transform", d3event.transform);
        renderer.onDidDragOrZoom(this)
      }).on('end', () => {
        renderer.onDidChangeLayout(diagram);
      })
    );

    //Setup zoom-and-drag behavior and initial transform
    let it = d3zoomTransform(svg.node()); //initial transform
    if (layout.transform) {
      it = it.translate(layout.transform.x, layout.transform.y);
      it = it.scale(layout.transform.k);
    }

    //a little bit hakish, but I want to set the zoom state
    //without actually transforming the svg element
    svg.node().__zoom = it;

    // -----------------------------
    // Setup Rect Selector
    // -------------------------
    svg.append('rect').attr('class', 'selector'); // <-- noobs often forget this comma :) Well, me also

    (function() {
      return; //This behavior is unstable for now. So bypass it.
      var isSelecting = false;
      var coords = {
        x1: 0,
        y1: 0,
        x2: 0,
        y2: 0
      }

      d3select(document)
        .on('mousedown', function() {
          if (d3event.target != svg.node()) {
            return;
          }
          let screenM3x = svg.node().getScreenCTM();
          coords.x1 = d3event.x - screenM3x.e;
          coords.y1 = d3event.y - screenM3x.f;

          isSelecting = true;
        }).
        on('mousemove', function() {
          if (!isSelecting) {
            return;
          }
          let screenM3x = svg.node().getScreenCTM();
          coords.x2 = d3event.x - screenM3x.e;
          coords.y2 = d3event.y - screenM3x.f;

          svg.classed('selecting', true);
          svg.select('rect.selector')
            .attr('x', Math.min(coords.x1, coords.x2))
            .attr('y', Math.min(coords.y1, coords.y2))
            .attr('width', Math.abs(coords.x1 - coords.x2))
            .attr('height', Math.abs(coords.y1 - coords.y2))

        })
        .on('mouseup', function(){
          if (!isSelecting) {
            return;
          }
          isSelecting = false;
          svg.classed('selecting', false);
          let svgNode = svg.node();
          let svgRect = svgNode.createSVGRect();
          svgRect.x = Math.min(coords.x1, coords.x2);
          svgRect.y = Math.min(coords.y1, coords.y2);
          svgRect.width = Math.abs(coords.x1 - coords.x2);
          svgRect.height = Math.abs(coords.y1 - coords.y2);

          let list = svgNode.getIntersectionList(svgRect, svgNode);
          let collection = [];
          list.forEach((d) => {
            if (d.classList.contains('selectable')) {
              collection.push(d);
              d.classList.toggle('selected');
            }
          })
        });
    })();
  }

  /**
   * Creates the diagram itself
   * @param  {d3selection} svg
   * @param  {d3selection} scene
   * @param  {object} diagram
   * @param  {object} layout
   */
  createDiagram(svg, scene, diagram, layout) {
    let renderer = this;
    const nodeShape = shapeGenerator(this.nodesStyle);
    //BLOCKS
    let blocks = scene.select('.dd-blocks').selectAll('svg')
      .data(diagram.blocks).enter()
        .append('svg')
          .attr('class', d=> 'dd-block dd-block-' + d.blockType.toLowerCase())
          .each(d => {
              let lyt = layout.blocks[d.id] ? layout.blocks[d.id] : {};
              d.layout = {
                pos: lyt.pos ? {... lyt.pos} : {x:0,y:0},
                w: MIN_WIDTH, //lyt.w ? lyt.w : 0,
                h: lyt.h ? lyt.h : 0,
                links: lyt.links ? {... lyt.links} : {t: [],r: [],b: [],l: []}
              };
          })
          .attr('x', d => d.layout.pos.x)
          .attr('y', d => d.layout.pos.y)
          // .attr('width', d => d.layout.w)
          // .attr('height', d => d.layout.h)
          .call(d3drag()
            .subject(d => d.layout.pos)
            .on('drag', function(d){

              d.layout.pos.x = d3event.x;
              d.layout.pos.y = d3event.y;
              d3select(this)
                .attr("x", d.layout.pos.x)
                .attr("y", d.layout.pos.y);
              renderer.updateLinks(scene);
              renderer.onDidDragOrZoom(svg.node())
            })
            .on('end', () => {
              renderer.onDidChangeLayout(diagram);
            }));

    blocks.append('path');

    blocks.append('text')
      .attr('y', PADDING)
      .html(d => d.content);

    blocks.each(function(d){
      let block = d3select(this);
      let text = block.select('text');
      let path = block.select('path');


      let lyt = layout.blocks[d.id];
      let width = lyt ? lyt.w : MIN_WIDTH;

      renderer.wrap(d.content, text.node(), width)
      let bbox = text.node().getBBox();
      d.layout.w = MIN_WIDTH;
      d.layout.h = bbox.height


      text.attr('transform', `translate(${-(bbox.width)  / 2} ${-(bbox.height)/2})`)
      path.attr('d', nodeShape);
      block.attr('overflow', 'auto');

      bbox = path.node().getBBox();
      d.layout.bbw = bbox.width;
      d.layout.bbh = bbox.height;

    })

    let links = scene.select('.dd-links').selectAll('g')
      .data(diagram.links).enter()
        .append('g')
          .attr('class', 'dd-link')
          .each(function(d){
            let link = d3select(this);
            link.append('path').attr('class', 'dd-link-tail').datum(d);
            link.append('path').attr('class', 'dd-link-head').datum(d);
            link.append('text').attr('class', 'dd-link-label').datum(d);
          });


  }
  /**
   * Used to redraw the links between nodes
   * @param  d3Selection scene The scene container
   */
  updateLinks(scene) {

    const linkTail = tailGenerator(this.linksStyle);

    let links = scene.selectAll('.dd-link')
      .each(function(d) {
        let link = d3select(this);
        let tail = link.select('.dd-link-tail');
        let head = link.select('.dd-link-head');
        let label = link.select('.dd-link-label');

        tail.attr('d', linkTail);
        head.attr('d', linkHead);

        label.html(d.label)
          .attr('x', d.pathMeta.start.x)
          .attr('y', d.pathMeta.start.y)
          .attr('dx', d => {
            if (['SSW', 'W', 'NNW'].indexOf(d.pathMeta.dir) >= 0) {
              return - PADDING / 2;
            } else {
              return PADDING / 2;
            }
          })
          .attr('dy', d => {
            if (['WNW', 'N', 'ENE'].indexOf(d.pathMeta.dir) >= 0) {
              return  - PADDING / 2;
            } else {
              return PADDING / 2;
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
      })

  }

  wrap(text, textNode, width){
    //---clear previous---
    textNode.innerHTML = '';

    let textStyle = window.getComputedStyle(textNode);
    let fontSize = parseFloat(textStyle.fontSize)

    let words = text.split(' ');

    let tSpan = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
    tSpan.innerHTML = words.shift();

    tSpan.setAttribute("y", fontSize);
    tSpan.setAttribute("x", 0);
    textNode.appendChild(tSpan)

    for(let word of words) {
      let currentText = tSpan.innerHTML;
      tSpan.innerHTML += ' ' + word;
      if (tSpan.getComputedTextLength() > width ) {
        tSpan.innerHTML = currentText;
        tSpan = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
        tSpan.setAttribute("x",  0);
        tSpan.setAttribute("dy", fontSize);
        tSpan.innerHTML = word;
        textNode.appendChild(tSpan);
      }
    }
  }

  autoLayout(diagram) {

    let treeData = diagram.tree;
    let root = d3Hierarchy(treeData);
    let tree = d3Tree().nodeSize([2*MIN_WIDTH, 1.5*MIN_WIDTH])(root);
    let layout = {
      blocks: {}
    }

    root.each(d => {
      let block = d.data.d;
      if (!block) {
        return;
      }
      layout.blocks[block.id] = {
        pos: {x: d.x,y:d.y},
        w: MIN_WIDTH,
        h: 0,
        links: {t: [],r: [],b: [],l: []}
      }
    });

    return layout;

  }
}
