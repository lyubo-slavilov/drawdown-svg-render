# Drawdown Svg Render

D3 based renderer which renders [parsed drawdown][30d96062] diagrams.

  [30d96062]: https://github.com/lyubo-slavilov/drawdown-parser "drawdown-parser"

## Installation
```bash
$ npm install drawdown-svg-render --save
```
## Usage
In order to use the renderer you need to parse your drawdown script into an object representation. You can achieve this by using [drawdown parser][30d96062] package
```bash
$ npm install drawdown-parser
```

Once you have all dependencies you can do:

```javascript
import { factory } from 'drawdown-parser';
import { Renderer } from 'drawdown-svg-render';

let script = `- Hello.
- Do you like diagrams?
- Yes:
  - You are cool.
- No:
  - You need to get coffe.`

let diagramObject = factory('flow').parseText(script);
let renderer = new Renderer();
renderer.render(document.body, diagramObject);
```

This will render interactive SVG diagram editor into the `body` of your HTML document. The editor will contain diagram which will look something like this:

![Example diagram](assets/example-flow-diagram.png)

Editor will let you to pan and zoom the diagram, move nodes around and define the style of the arrows.

The actual look of the diagram will depend highly on your CSS rules. The `Renderer` itself does not provide any styling.

## API
Sorry. It is in TODO.

## Demo
Sorry. It is in TODO also.
