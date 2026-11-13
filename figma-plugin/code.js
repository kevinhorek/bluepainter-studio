/**
 * BluePainter Studio — Figma plugin (main thread).
 *
 * Serialises the selected frame / component / instance from the Plugin API
 * scene graph into the REST-API-shaped JSON that BluePainter Studio's
 * "Import from Figma → Paste JSON" tab already accepts
 * (see src/utils/figmaImport.js in the Studio repo).
 *
 * Plain JS, no build step, no dependencies. Written in conservative syntax
 * (no optional chaining / object spread) for Figma's plugin sandbox.
 * The serialiser is pure (it only reads the nodes it is given), so
 * test/serialize.test.mjs runs it in plain Node with a fake node tree.
 */

// ── Constants ───────────────────────────────────────────────────────────────

/** Hosted Studio opened by the "Open BluePainter Studio" button. */
var STUDIO_URL = 'https://bluepainter-studio.vercel.app/#/app';

var PAYLOAD_SOURCE = 'bluepainter-figma-plugin';
var PAYLOAD_VERSION = 1;

/** Root types the Studio converter treats as an importable frame. */
var ROOT_TYPES = ['FRAME', 'COMPONENT', 'INSTANCE', 'COMPONENT_SET', 'SECTION', 'GROUP'];

/** Plugin API type → REST API type, where the two differ. */
var TYPE_ALIASES = { POLYGON: 'REGULAR_POLYGON' };

/** Types the Studio renders as a plain box (no vector geometry is exported). */
var VECTOR_TYPES = ['VECTOR', 'STAR', 'POLYGON', 'BOOLEAN_OPERATION'];

/** The Studio warns above this many nodes; the plugin UI repeats the warning. */
var LARGE_NODE_COUNT = 1000;

var FONT_STYLE_WEIGHTS = [
  ['thin', 100], ['hairline', 100],
  ['extralight', 200], ['ultralight', 200],
  ['semibold', 600], ['demibold', 600],
  ['extrabold', 800], ['ultrabold', 800],
  ['light', 300],
  ['medium', 500],
  ['bold', 700],
  ['black', 900], ['heavy', 900],
  ['regular', 400], ['normal', 400], ['book', 400]
];

// ── Small helpers ───────────────────────────────────────────────────────────

/** `figma.mixed` is a unique symbol; no other node property is a symbol. */
function isMixed(value) {
  return typeof value === 'symbol';
}

function isNumber(value) {
  return typeof value === 'number' && isFinite(value);
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

/** Read a property that may throw on some node types (returns undefined). */
function read(node, key) {
  try {
    return node[key];
  } catch (err) {
    return undefined;
  }
}

function callRange(node, method) {
  try {
    if (typeof node[method] !== 'function') return undefined;
    var characters = read(node, 'characters');
    if (typeof characters !== 'string' || characters.length === 0) return undefined;
    var value = node[method](0, 1);
    return isMixed(value) ? undefined : value;
  } catch (err) {
    return undefined;
  }
}

/** Property value, or the value of the first character when it is mixed. */
function readTextProp(node, key, rangeMethod) {
  var value = read(node, key);
  if (isMixed(value)) return callRange(node, rangeMethod);
  return value;
}

function weightFromFontStyle(styleName) {
  var normalised = String(styleName || '').toLowerCase().replace(/[\s_-]+/g, '');
  for (var i = 0; i < FONT_STYLE_WEIGHTS.length; i += 1) {
    if (normalised.indexOf(FONT_STYLE_WEIGHTS[i][0]) !== -1) return FONT_STYLE_WEIGHTS[i][1];
  }
  return 400;
}

// ── Paints ──────────────────────────────────────────────────────────────────

/**
 * Plugin API paints → REST-shaped paints.
 * - Hidden paints are dropped (they do not render).
 * - SOLID: paint opacity is folded into `color.a`, which is where the Studio
 *   converter reads alpha from.
 * - IMAGE: only the image hash is emitted (`imageRef`), never the bytes.
 * - Gradients / video / pattern: the type is kept so consumers can tell a
 *   paint existed; the Studio ignores them.
 * A mixed value (text with several fill colours) yields `null` so the caller
 * can fall back to the first character.
 */
function serializePaints(paints, stats) {
  if (isMixed(paints)) return null;
  if (!Array.isArray(paints)) return [];
  var out = [];
  for (var i = 0; i < paints.length; i += 1) {
    var paint = paints[i];
    if (!paint || paint.visible === false) continue;
    var opacity = isNumber(paint.opacity) ? Math.max(0, Math.min(1, paint.opacity)) : 1;
    if (paint.type === 'SOLID' && paint.color) {
      out.push({
        type: 'SOLID',
        blendMode: paint.blendMode || 'NORMAL',
        color: {
          r: paint.color.r,
          g: paint.color.g,
          b: paint.color.b,
          a: round2(opacity)
        }
      });
    } else if (paint.type === 'IMAGE') {
      if (stats) stats.imageFills += 1;
      out.push({
        type: 'IMAGE',
        blendMode: paint.blendMode || 'NORMAL',
        scaleMode: paint.scaleMode || 'FILL',
        imageRef: paint.imageHash || null
      });
    } else if (typeof paint.type === 'string') {
      if (stats) stats.unsupportedPaints += 1;
      out.push({ type: paint.type, blendMode: paint.blendMode || 'NORMAL' });
    }
  }
  return out;
}

function hasImagePaint(paints) {
  if (!Array.isArray(paints)) return false;
  for (var i = 0; i < paints.length; i += 1) {
    if (paints[i].type === 'IMAGE') return true;
  }
  return false;
}

// ── Geometry ────────────────────────────────────────────────────────────────

function serializeBox(node) {
  var box = read(node, 'absoluteBoundingBox');
  if (box && isNumber(box.x) && isNumber(box.y) && isNumber(box.width) && isNumber(box.height)) {
    return { x: round2(box.x), y: round2(box.y), width: round2(box.width), height: round2(box.height) };
  }
  // Older API versions: derive it from the absolute transform (ignores rotation).
  var transform = read(node, 'absoluteTransform');
  var width = read(node, 'width');
  var height = read(node, 'height');
  if (Array.isArray(transform) && isNumber(width) && isNumber(height)) {
    return {
      x: round2(transform[0][2]),
      y: round2(transform[1][2]),
      width: round2(width),
      height: round2(height)
    };
  }
  return undefined;
}

function applyCornerRadius(node, out) {
  var radius = read(node, 'cornerRadius');
  if (isNumber(radius)) {
    if (radius > 0) out.cornerRadius = round2(radius);
    return;
  }
  if (!isMixed(radius)) return;
  // Mixed → per-corner radii, the same way the REST API reports them.
  var corners = [
    read(node, 'topLeftRadius'),
    read(node, 'topRightRadius'),
    read(node, 'bottomRightRadius'),
    read(node, 'bottomLeftRadius')
  ];
  var radii = [];
  for (var i = 0; i < corners.length; i += 1) {
    radii.push(isNumber(corners[i]) ? round2(corners[i]) : 0);
  }
  out.rectangleCornerRadii = radii;
}

function applyStrokes(node, out, stats) {
  var strokes = serializePaints(read(node, 'strokes'), stats);
  if (!strokes || strokes.length === 0) return;
  var weight = read(node, 'strokeWeight');
  if (isMixed(weight)) {
    // Individual side weights: the Studio has one border width, use the widest.
    var sides = ['strokeTopWeight', 'strokeRightWeight', 'strokeBottomWeight', 'strokeLeftWeight'];
    var widest = 0;
    for (var i = 0; i < sides.length; i += 1) {
      var side = read(node, sides[i]);
      if (isNumber(side) && side > widest) widest = side;
    }
    weight = widest;
  }
  if (!isNumber(weight) || weight <= 0) return;
  out.strokes = strokes;
  out.strokeWeight = round2(weight);
  var align = read(node, 'strokeAlign');
  if (typeof align === 'string') out.strokeAlign = align;
}

function applyAutoLayout(node, out, stats) {
  var mode = read(node, 'layoutMode');
  if (typeof mode !== 'string' || mode === 'NONE') return;
  stats.autoLayoutFrames += 1;
  out.layoutMode = mode;
  var numeric = ['itemSpacing', 'paddingLeft', 'paddingRight', 'paddingTop', 'paddingBottom'];
  for (var i = 0; i < numeric.length; i += 1) {
    var value = read(node, numeric[i]);
    out[numeric[i]] = isNumber(value) ? round2(value) : 0;
  }
  var textual = ['primaryAxisAlignItems', 'counterAxisAlignItems', 'primaryAxisSizingMode', 'counterAxisSizingMode', 'layoutWrap'];
  for (var j = 0; j < textual.length; j += 1) {
    var text = read(node, textual[j]);
    if (typeof text === 'string') out[textual[j]] = text;
  }
}

// ── Text ────────────────────────────────────────────────────────────────────

function serializeTextStyle(node) {
  var style = {};
  var fontSize = readTextProp(node, 'fontSize', 'getRangeFontSize');
  var fontName = readTextProp(node, 'fontName', 'getRangeFontName');
  var fontWeight = readTextProp(node, 'fontWeight', 'getRangeFontWeight');
  var lineHeight = readTextProp(node, 'lineHeight', 'getRangeLineHeight');
  var letterSpacing = readTextProp(node, 'letterSpacing', 'getRangeLetterSpacing');

  if (fontName && typeof fontName === 'object') {
    if (fontName.family) style.fontFamily = fontName.family;
    if (/italic|oblique/i.test(String(fontName.style || ''))) style.italic = true;
  }
  if (isNumber(fontWeight)) style.fontWeight = fontWeight;
  else if (fontName && typeof fontName === 'object') style.fontWeight = weightFromFontStyle(fontName.style);
  else style.fontWeight = 400;

  if (isNumber(fontSize)) style.fontSize = round2(fontSize);

  var align = read(node, 'textAlignHorizontal');
  style.textAlignHorizontal = typeof align === 'string' ? align : 'LEFT';
  var alignVertical = read(node, 'textAlignVertical');
  if (typeof alignVertical === 'string') style.textAlignVertical = alignVertical;

  if (letterSpacing && typeof letterSpacing === 'object' && isNumber(letterSpacing.value)) {
    if (letterSpacing.unit === 'PIXELS') style.letterSpacing = round2(letterSpacing.value);
    else if (letterSpacing.unit === 'PERCENT' && isNumber(style.fontSize)) {
      style.letterSpacing = round2((letterSpacing.value / 100) * style.fontSize);
    }
  }

  // AUTO line height is left out: the Studio then uses its own default.
  if (lineHeight && typeof lineHeight === 'object' && isNumber(lineHeight.value)) {
    if (lineHeight.unit === 'PIXELS') style.lineHeightPx = round2(lineHeight.value);
    else if (lineHeight.unit === 'PERCENT' && isNumber(style.fontSize)) {
      style.lineHeightPx = round2((lineHeight.value / 100) * style.fontSize);
    }
  }
  return style;
}

function serializeTextFills(node, stats) {
  var fills = serializePaints(read(node, 'fills'), stats);
  if (fills !== null) return fills;
  // Mixed colours: use the first character's fills.
  var first = serializePaints(callRange(node, 'getRangeFills'), stats);
  return first || [];
}

// ── Node walk ───────────────────────────────────────────────────────────────

function createStats() {
  return {
    nodes: 0,
    frames: 0,
    textLayers: 0,
    imageLayers: 0,
    imageFills: 0,
    vectorLayers: 0,
    autoLayoutFrames: 0,
    hiddenSkipped: 0,
    unsupportedPaints: 0,
    mixedValues: 0,
    maxDepth: 0
  };
}

function countMixed(node, stats) {
  var keys = ['fills', 'strokes', 'cornerRadius', 'strokeWeight', 'fontSize', 'fontName', 'fontWeight', 'lineHeight', 'letterSpacing'];
  for (var i = 0; i < keys.length; i += 1) {
    if (isMixed(read(node, keys[i]))) stats.mixedValues += 1;
  }
}

/**
 * One Plugin API node → REST-shaped node (recursive). Hidden nodes return
 * `null` and are counted in `stats.hiddenSkipped` together with their subtree
 * root only (their descendants never render either way).
 */
function serializeNode(node, stats, depth) {
  if (!node) return null;
  if (read(node, 'visible') === false) {
    stats.hiddenSkipped += 1;
    return null;
  }
  var pluginType = String(read(node, 'type') || 'FRAME');
  var out = {
    id: String(read(node, 'id') || ''),
    name: String(read(node, 'name') || ''),
    type: TYPE_ALIASES[pluginType] || pluginType
  };

  stats.nodes += 1;
  if (depth > stats.maxDepth) stats.maxDepth = depth;
  countMixed(node, stats);

  var box = serializeBox(node);
  if (box) out.absoluteBoundingBox = box;

  var opacity = read(node, 'opacity');
  if (isNumber(opacity) && opacity < 1) out.opacity = round2(opacity);

  if (pluginType === 'TEXT') {
    stats.textLayers += 1;
    out.characters = String(read(node, 'characters') || '');
    out.style = serializeTextStyle(node);
    out.fills = serializeTextFills(node, stats);
    return out;
  }

  var fills = serializePaints(read(node, 'fills'), stats);
  out.fills = fills || [];
  if (hasImagePaint(out.fills)) stats.imageLayers += 1;
  if (VECTOR_TYPES.indexOf(pluginType) !== -1) stats.vectorLayers += 1;

  applyStrokes(node, out, stats);
  applyCornerRadius(node, out);
  // An ellipse has no corner radius in Figma; give the Studio a pill radius so
  // circles stay round (a non-circular ellipse becomes a stadium shape).
  if (pluginType === 'ELLIPSE' && box) {
    out.cornerRadius = round2(Math.min(box.width, box.height) / 2);
  }

  var clips = read(node, 'clipsContent');
  if (typeof clips === 'boolean') out.clipsContent = clips;

  applyAutoLayout(node, out, stats);

  var children = read(node, 'children');
  if (Array.isArray(children)) {
    stats.frames += 1;
    out.children = [];
    for (var i = 0; i < children.length; i += 1) {
      var child = serializeNode(children[i], stats, depth + 1);
      if (child) out.children.push(child);
    }
  }
  return out;
}

// ── Selection → payload ─────────────────────────────────────────────────────

/**
 * The Studio only accepts node ids shaped like `12:34`. Layers nested inside
 * an instance have ids like `I12:34;56:78`, so those are exported under a
 * synthetic key (the node's own `id` field keeps the real value).
 */
function payloadNodeId(id) {
  return /^\d+:\d+$/.test(String(id)) ? String(id) : '0:1';
}

/**
 * @param {ReadonlyArray<object>} selection `figma.currentPage.selection` (or a fake).
 * @returns {{ ok: true, payload: object, json: string, stats: object, name: string, warnings: string[] }
 *          | { ok: false, code: string, error: string }}
 */
function serializeSelection(selection) {
  var list = Array.isArray(selection) ? selection : [];
  if (list.length === 0) {
    return { ok: false, code: 'no-selection', error: 'Select a frame, component or instance to export.' };
  }
  if (list.length > 1) {
    return {
      ok: false,
      code: 'multiple-selection',
      error: 'Select exactly one frame (' + list.length + ' layers are selected). Group them into a frame first, or pick one.'
    };
  }
  var root = list[0];
  var rootType = String(read(root, 'type') || '');
  if (ROOT_TYPES.indexOf(rootType) === -1) {
    return {
      ok: false,
      code: 'unsupported-root',
      error: 'A ' + (rootType || 'layer').toLowerCase().replace(/_/g, ' ') + ' cannot be exported on its own. Select the frame, component or instance that contains it.'
    };
  }
  if (read(root, 'visible') === false) {
    return { ok: false, code: 'hidden-root', error: 'The selected layer is hidden. Show it, then export.' };
  }

  var stats = createStats();
  var documentNode = serializeNode(root, stats, 0);
  var nodeId = payloadNodeId(documentNode.id);
  var nodes = {};
  nodes[nodeId] = { document: documentNode };

  var payload = {
    source: PAYLOAD_SOURCE,
    version: PAYLOAD_VERSION,
    name: documentNode.name,
    nodeId: nodeId,
    nodes: nodes
  };

  var warnings = [];
  if (stats.nodes > LARGE_NODE_COUNT) {
    warnings.push(stats.nodes + ' layers — the Studio canvas may render slowly. Consider exporting a smaller frame.');
  }
  if (stats.imageLayers > 0) {
    warnings.push(stats.imageLayers + ' image layer' + (stats.imageLayers === 1 ? '' : 's') + ' exported as empty boxes (image bytes are not included).');
  }
  if (stats.vectorLayers > 0) {
    warnings.push(stats.vectorLayers + ' vector layer' + (stats.vectorLayers === 1 ? '' : 's') + ' exported as plain boxes.');
  }
  if (stats.unsupportedPaints > 0) {
    warnings.push(stats.unsupportedPaints + ' gradient or other non-solid paint' + (stats.unsupportedPaints === 1 ? '' : 's') + ' will be ignored.');
  }
  if (stats.mixedValues > 0) {
    warnings.push(stats.mixedValues + ' mixed value' + (stats.mixedValues === 1 ? '' : 's') + ' (for example text with several styles) reduced to the first one.');
  }

  return {
    ok: true,
    payload: payload,
    json: JSON.stringify(payload),
    stats: stats,
    name: documentNode.name,
    warnings: warnings
  };
}

// ── Plugin entry point ──────────────────────────────────────────────────────

function startPlugin(figmaApi, html) {
  figmaApi.showUI(html, { width: 340, height: 440, themeColors: true });

  function publish() {
    var result;
    try {
      result = serializeSelection(figmaApi.currentPage.selection);
    } catch (err) {
      result = { ok: false, code: 'serialize-failed', error: 'Could not read the selection: ' + (err && err.message ? err.message : String(err)) };
    }
    var message = {
      type: 'selection',
      ok: result.ok,
      studioUrl: STUDIO_URL,
      hostOpensLinks: typeof figmaApi.openExternal === 'function'
    };
    if (result.ok) {
      message.name = result.name;
      message.json = result.json;
      message.stats = result.stats;
      message.warnings = result.warnings;
    } else {
      message.code = result.code;
      message.error = result.error;
    }
    figmaApi.ui.postMessage(message);
  }

  figmaApi.on('selectionchange', publish);

  figmaApi.ui.onmessage = function (message) {
    if (!message || typeof message.type !== 'string') return;
    if (message.type === 'ready' || message.type === 'refresh') {
      publish();
    } else if (message.type === 'copied') {
      figmaApi.notify('Copied — paste it into BluePainter Studio → Import from Figma → Paste JSON');
    } else if (message.type === 'copy-failed') {
      figmaApi.notify('Could not copy automatically. Select the JSON in the plugin and copy it manually.', { error: true });
    } else if (message.type === 'open-studio') {
      if (typeof figmaApi.openExternal === 'function') figmaApi.openExternal(STUDIO_URL);
    } else if (message.type === 'close') {
      figmaApi.closePlugin();
    }
  };

  publish();
}

if (typeof figma !== 'undefined') {
  startPlugin(figma, __html__);
}

// Node (tests) only: Figma's sandbox has no `module`.
if (typeof module !== 'undefined' && module && module.exports) {
  module.exports = {
    STUDIO_URL: STUDIO_URL,
    PAYLOAD_SOURCE: PAYLOAD_SOURCE,
    PAYLOAD_VERSION: PAYLOAD_VERSION,
    serializeSelection: serializeSelection,
    serializeNode: serializeNode,
    serializePaints: serializePaints,
    createStats: createStats,
    startPlugin: startPlugin
  };
}
