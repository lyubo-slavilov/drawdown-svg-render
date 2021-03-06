
import { select as d3select } from 'd3-selection';
import { selectAll as d3selectAll } from 'd3-selection';
import { zoom as d3zoom } from 'd3-zoom';
import { drag as d3drag } from 'd3-drag';
import { event as d3event } from 'd3-selection';
import { zoomTransform  as d3zoomTransform } from 'd3-zoom';

import { hierarchy as d3Hierarchy, tree as d3Tree } from 'd3-hierarchy';




import { shapeGenerator } from '../helpers/shape';

import { arrowLabel } from '../helpers/arrow-label'

export const PADDING = 10;
export const MIN_WIDTH = 100;
const LINE_HEIGHT = 20;


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
      onDidSelection = ()=>{},
      onDidCreateScene = ()=>{},
      onDidRender = (svg)=>{},
      diagramLayout = {},
      onBlockClick = node => {},
      onBlockDblClick = node => {},
      nodesStyle = NODE_STYLE_AUTO,
      autoCenter = false,
      linksBeneathNodes = false,
      autoLayoutOptions = {}
  } = {}) {
    this.onDidChangeLayout = onDidChangeLayout;
    this.onDidDragOrZoom = onDidDragOrZoom;
    this.onDidSelection = onDidSelection;
    this.onDidCreateScene = onDidCreateScene;
    this.onDidRender = onDidRender;
    this.diagramLayout = diagramLayout;
    this.onBlockClick = onBlockClick;
    this.onBlockDblClick = onBlockDblClick;
    this.nodesStyle = nodesStyle;
    this.autoCenter = autoCenter;
    this.linksBeneathNodes = linksBeneathNodes;
    this.autoLayoutOptions = autoLayoutOptions;
  }

  render(container, diagram) {

    let layout;
    if (this.diagramLayout[diagram.hash]) {
      layout = this.diagramLayout[diagram.hash];
    } else {
      layout =this.autoLayout(diagram)
    }

    let [svg, scene] = this.createScene(container, diagram, layout);

    this.onDidCreateScene(svg.node(), scene.node())
    this.createDiagram(svg, scene, diagram, layout)

    //fix text selection on user interaction
    scene.selectAll('text')
      .on('mousedown', () => {
        d3select('.dd-link-handle').classed('active', false);
        d3event.stopPropagation();
      })

    this.onCreate(svg, scene);
  }

  onCreate(svg, scene) {
    this.updateLinks(scene);
    this.onDidDragOrZoom(svg.node(), {
      type: ''
    });
    this.onDidRender(svg.node());
  }

  onBlockDrag(svg, scene, e) {
    this.updateLinks(scene);
    this.onDidDragOrZoom(svg.node(), {
      type: e.type,
      target: e.sourceEvent.target,
      x: e.x,
      y: e.y,
      dx: e.dx,
      dy: e.dy
    });
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
      //  d3event.stopPropagation();
      })

    let workarea = svg.append('g')
      .attr('class', 'workarea');

    if (this.autoCenter) {
      workarea.attr('transform', `translate(${w/2} ${0.02*h})`);
    }

    let scene = workarea.append('g')
        .attr('class', 'scene')
        .attr('transform', () => {
          if (layout.transform){
            return `translate(${layout.transform.x} ${layout.transform.y}) scale(${layout.transform.k})`
          } else {
            return 'translate(0 0) scale(1)'
          }
        });

    scene.append('g').attr('class', 'dd-timelines');
    if (this.linksBeneathNodes) {
      scene.append('g').attr('class', 'dd-links');
      scene.append('g').attr('class', 'dd-blocks');
    } else {
      scene.append('g').attr('class', 'dd-blocks');
      scene.append('g').attr('class', 'dd-links');
    }

    this.createZoom(container, svg, scene, diagram, layout)


    return [svg, scene];
  }

  createZoom(container, svg, scene, diagram, layout) {
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
        renderer.onDidSelection(null);
      }).on('zoom', function(){
        diagram.transform = d3event.transform;
        scene.attr("transform", d3event.transform);
        renderer.onDidDragOrZoom(this, {
          type: d3event.type
        })
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
      var isSelecting = false;
      var coords = {
        x1: 0,
        y1: 0,
        x2: 0,
        y2: 0
      }

      d3select(container)
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
          let deselectedCollection = [];
          list.forEach((d) => {
            if (d.classList.contains('dd-block-shape')) {
              if (d.classList.toggle('selected')) {
                collection.push(d);
              } else {
                deselectedCollection.push(d);
              }
            }
          });
          renderer.onDidSelection(collection, deselectedCollection);
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
              if (d.initialPosition) {
                d.layout.pos.x = d.initialPosition.x;
                d.layout.pos.y = d.initialPosition.y;
              }
          })
          .on('click', function(d){
            renderer.onBlockClick(d3event);
          })
          .on('dblclick', function(d){
            renderer.onBlockDblClick(d3event);
          })
          .attr('x', d => d.layout.pos.x)
          .attr('y', d => d.layout.pos.y)
          // .attr('width', d => d.layout.w)
          // .attr('height', d => d.layout.h)
          .call(d3drag()
            .subject(d => d.layout.pos)
            .on('start', function(d) {

              if (!d3event.sourceEvent.shiftKey) {
                scene.selectAll('.selected').classed('selected', false);
                renderer.onDidSelection(null);
              }

              renderer.onDidSelection([d3select(this).select('.dd-block-shape').node()])
              d3select(this).select('.dd-block-shape').classed('selected', true);
            })
            .on('drag', function(d){
              d.layout.pos.x = d3event.x;
              d.layout.pos.y = d3event.y;
              d3select(this)
                .attr("x", d.layout.pos.x)
                .attr("y", d.layout.pos.y);

              renderer.onBlockDrag(svg, scene, d3event);
            })
            .on('end', () => {
              renderer.onDidChangeLayout(diagram);
            }));

    blocks.append('path').attr("class", "dd-block-shape");

    blocks.append('g').attr("class", "dd-block-icon");

    blocks.append('text')
      .attr('y', PADDING)
      .html(d => d.content);

    blocks.each(function(d){
      let block = d3select(this);
      let text = block.select('text');
      let path = block.select('path.dd-block-shape');
      let icon = block.select('g.dd-block-icon');

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

      if (d.iconHref) {
        icon.append('use').attr('href', d.iconHref)
      }


    })

    let links = scene.select('.dd-links').selectAll('g')
      .data(diagram.links).enter()
        .append('g')
          .attr('class', (d) => 'dd-link ' + (d.class || ''))
          .each(function(d){
            let link = d3select(this);
            link.append('path').attr('class', 'dd-link-tail').datum(d);
            if (d.rh) {
              link.append('path').attr('class', 'dd-link-head dd-link-head-right')
                .datum(d);
            }
            if (d.lh) {
              link.append('path').attr('class', 'dd-link-head dd-link-head-left')
                .datum(d);
            }
            link.append('text').attr('class', 'dd-link-label').datum(d);
          });

    let timelines = scene.select('.dd-timelines').selectAll('line')
      .data(diagram.blocks).enter()
        .append('line')
          .attr('class', 'dd-timeline');
  }
  /**
   * Used to redraw the links between nodes
   * @param  d3Selection scene The scene container
   */
  updateLinks(scene) {
    throw new Error('Update links not implemented')

  }

  updateTimelines(scene) {
    let yStart = 0; //Used only in links of type "MESSAGE"

    scene.selectAll('.dd-timeline').each((d) => {
      let y = d.layout.pos.y + d.layout.h + 50;
      yStart = Math.max(yStart, y)
    });


    let yEnd = scene.selectAll('.dd-link').nodes().length * 80+ yStart;

    scene.selectAll('.dd-timeline')
      .attr('x1', d => d.layout.pos.x)
      .attr('y1', d =>  d.layout.pos.y + d.layout.h/2)
      .attr('x2', d =>  d.layout.pos.x)
      .attr('y2', yEnd)

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

    const renderer = this;
    const nodeHSize = renderer.autoLayoutOptions.nodeHSize || 3;
    const nodeVSize = renderer.autoLayoutOptions.nodeVSize || 1.3;

    let tree = d3Tree().nodeSize([nodeHSize*MIN_WIDTH, nodeVSize*MIN_WIDTH])(root);
    let layout = {
      blocks: {}
    }

    let {center = {x:0, y:0}} = renderer.autoLayoutOptions;


    root.each(d => {
      let block = d.data.d;
      if (!block) {
        return;
      }
      layout.blocks[block.id] = {
        pos: renderer.autoLayoutOptions.horizontal ? {x: d.y,y:d.x} : {x: d.x,y:d.y},
        w: MIN_WIDTH,
        h: 0,
        links: {t: [],r: [],b: [],l: []}
      }
    });
    layout.transform = {x: center.x, y: center.y, k: 1};

    return layout;

  }
}
