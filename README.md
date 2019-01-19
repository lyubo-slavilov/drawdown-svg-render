# Drawdown Svg Render

D3 based renderer which renders parsed drawdown diagrams.

## Instalation
```bash
$ npm install drawdown-svg-render --save
```
## Usage
In order to use the renderer you need to parse your drawdown script into an object representation. You can achieve this by using drawdon-parser package
```bash
$ npm install drawdown-parser
```

Once you have all dependencies you can do
```javascript
import { factory } from 'drawdown-parser';
import { Renderer } from 'drawdown-svg-renderer';

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

This will produce interactive SVG diagram editor which will contain diagram which will look something like this:
![Example diagram](assets/example-flow-diagram.png)

The actual look of the diagram will depend highly on your CSS rules. The Renderer itself does not provide any styling.

## API
Sorry. It is in TODO.

## Demo
Sorry. It is in TODO also.
