"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => AgentPlugin
});
module.exports = __toCommonJS(main_exports);
var import_fragment6 = require("fragment");

// src/coeur.ts
function hasText(surface) {
  return typeof surface.getLine === "function";
}
function posVisibility(editor, pos) {
  const viewport = editor.viewportRange();
  if (pos < viewport.from || pos > viewport.to) return "offscreen";
  for (const r of editor.renderedRanges()) {
    if (pos >= r.from && pos <= r.to) return "rendered";
  }
  return "hidden";
}

// node_modules/@floating-ui/utils/dist/floating-ui.utils.mjs
var sides = ["top", "right", "bottom", "left"];
var min = Math.min;
var max = Math.max;
var round = Math.round;
var floor = Math.floor;
var createCoords = (v) => ({
  x: v,
  y: v
});
var oppositeSideMap = {
  left: "right",
  right: "left",
  bottom: "top",
  top: "bottom"
};
function clamp(start, value, end) {
  return max(start, min(value, end));
}
function evaluate(value, param) {
  return typeof value === "function" ? value(param) : value;
}
function getSide(placement) {
  return placement.split("-")[0];
}
function getAlignment(placement) {
  return placement.split("-")[1];
}
function getOppositeAxis(axis) {
  return axis === "x" ? "y" : "x";
}
function getAxisLength(axis) {
  return axis === "y" ? "height" : "width";
}
function getSideAxis(placement) {
  const firstChar = placement[0];
  return firstChar === "t" || firstChar === "b" ? "y" : "x";
}
function getAlignmentAxis(placement) {
  return getOppositeAxis(getSideAxis(placement));
}
function getAlignmentSides(placement, rects, rtl) {
  if (rtl === void 0) {
    rtl = false;
  }
  const alignment = getAlignment(placement);
  const alignmentAxis = getAlignmentAxis(placement);
  const length = getAxisLength(alignmentAxis);
  let mainAlignmentSide = alignmentAxis === "x" ? alignment === (rtl ? "end" : "start") ? "right" : "left" : alignment === "start" ? "bottom" : "top";
  if (rects.reference[length] > rects.floating[length]) {
    mainAlignmentSide = getOppositePlacement(mainAlignmentSide);
  }
  return [mainAlignmentSide, getOppositePlacement(mainAlignmentSide)];
}
function getExpandedPlacements(placement) {
  const oppositePlacement = getOppositePlacement(placement);
  return [getOppositeAlignmentPlacement(placement), oppositePlacement, getOppositeAlignmentPlacement(oppositePlacement)];
}
function getOppositeAlignmentPlacement(placement) {
  return placement.includes("start") ? placement.replace("start", "end") : placement.replace("end", "start");
}
var lrPlacement = ["left", "right"];
var rlPlacement = ["right", "left"];
var tbPlacement = ["top", "bottom"];
var btPlacement = ["bottom", "top"];
function getSideList(side, isStart, rtl) {
  switch (side) {
    case "top":
    case "bottom":
      if (rtl) return isStart ? rlPlacement : lrPlacement;
      return isStart ? lrPlacement : rlPlacement;
    case "left":
    case "right":
      return isStart ? tbPlacement : btPlacement;
    default:
      return [];
  }
}
function getOppositeAxisPlacements(placement, flipAlignment, direction, rtl) {
  const alignment = getAlignment(placement);
  let list = getSideList(getSide(placement), direction === "start", rtl);
  if (alignment) {
    list = list.map((side) => side + "-" + alignment);
    if (flipAlignment) {
      list = list.concat(list.map(getOppositeAlignmentPlacement));
    }
  }
  return list;
}
function getOppositePlacement(placement) {
  const side = getSide(placement);
  return oppositeSideMap[side] + placement.slice(side.length);
}
function expandPaddingObject(padding) {
  var _padding$top, _padding$right, _padding$bottom, _padding$left;
  return {
    top: (_padding$top = padding.top) != null ? _padding$top : 0,
    right: (_padding$right = padding.right) != null ? _padding$right : 0,
    bottom: (_padding$bottom = padding.bottom) != null ? _padding$bottom : 0,
    left: (_padding$left = padding.left) != null ? _padding$left : 0
  };
}
function getPaddingObject(padding) {
  return typeof padding !== "number" ? expandPaddingObject(padding) : {
    top: padding,
    right: padding,
    bottom: padding,
    left: padding
  };
}
function rectToClientRect(rect) {
  const {
    x,
    y,
    width,
    height
  } = rect;
  return {
    width,
    height,
    top: y,
    left: x,
    right: x + width,
    bottom: y + height,
    x,
    y
  };
}

// node_modules/@floating-ui/core/dist/floating-ui.core.mjs
function computeCoordsFromPlacement(_ref, placement, rtl) {
  let {
    reference,
    floating
  } = _ref;
  const sideAxis = getSideAxis(placement);
  const alignmentAxis = getAlignmentAxis(placement);
  const alignLength = getAxisLength(alignmentAxis);
  const side = getSide(placement);
  const isVertical = sideAxis === "y";
  const commonX = reference.x + reference.width / 2 - floating.width / 2;
  const commonY = reference.y + reference.height / 2 - floating.height / 2;
  const commonAlign = reference[alignLength] / 2 - floating[alignLength] / 2;
  let coords;
  switch (side) {
    case "top":
      coords = {
        x: commonX,
        y: reference.y - floating.height
      };
      break;
    case "bottom":
      coords = {
        x: commonX,
        y: reference.y + reference.height
      };
      break;
    case "right":
      coords = {
        x: reference.x + reference.width,
        y: commonY
      };
      break;
    case "left":
      coords = {
        x: reference.x - floating.width,
        y: commonY
      };
      break;
    default:
      coords = {
        x: reference.x,
        y: reference.y
      };
  }
  const alignment = getAlignment(placement);
  if (alignment) {
    coords[alignmentAxis] += commonAlign * (alignment === "end" ? 1 : -1) * (rtl && isVertical ? -1 : 1);
  }
  return coords;
}
async function detectOverflow(state, options) {
  var _await$platform$isEle;
  if (options === void 0) {
    options = {};
  }
  const {
    x,
    y,
    platform: platform2,
    rects,
    elements,
    strategy
  } = state;
  const {
    boundary = "clippingAncestors",
    rootBoundary = "viewport",
    elementContext = "floating",
    altBoundary = false,
    padding = 0
  } = evaluate(options, state);
  const paddingObject = getPaddingObject(padding);
  const altContext = elementContext === "floating" ? "reference" : "floating";
  const element = elements[altBoundary ? altContext : elementContext];
  const clippingClientRect = rectToClientRect(await platform2.getClippingRect({
    element: ((_await$platform$isEle = await (platform2.isElement == null ? void 0 : platform2.isElement(element))) != null ? _await$platform$isEle : true) ? element : element.contextElement || await (platform2.getDocumentElement == null ? void 0 : platform2.getDocumentElement(elements.floating)),
    boundary,
    rootBoundary,
    strategy
  }));
  const rect = elementContext === "floating" ? {
    x,
    y,
    width: rects.floating.width,
    height: rects.floating.height
  } : rects.reference;
  const offsetParent = await (platform2.getOffsetParent == null ? void 0 : platform2.getOffsetParent(elements.floating));
  const offsetScale = await (platform2.isElement == null ? void 0 : platform2.isElement(offsetParent)) && await (platform2.getScale == null ? void 0 : platform2.getScale(offsetParent)) || {
    x: 1,
    y: 1
  };
  const elementClientRect = rectToClientRect(platform2.convertOffsetParentRelativeRectToViewportRelativeRect ? await platform2.convertOffsetParentRelativeRectToViewportRelativeRect({
    elements,
    rect,
    offsetParent,
    strategy
  }) : rect);
  return {
    top: (clippingClientRect.top - elementClientRect.top + paddingObject.top) / offsetScale.y,
    bottom: (elementClientRect.bottom - clippingClientRect.bottom + paddingObject.bottom) / offsetScale.y,
    left: (clippingClientRect.left - elementClientRect.left + paddingObject.left) / offsetScale.x,
    right: (elementClientRect.right - clippingClientRect.right + paddingObject.right) / offsetScale.x
  };
}
var MAX_RESET_COUNT = 50;
var computePosition = async (reference, floating, config) => {
  const {
    placement = "bottom",
    strategy = "absolute",
    middleware = [],
    platform: platform2
  } = config;
  const platformWithDetectOverflow = platform2.detectOverflow ? platform2 : {
    ...platform2,
    detectOverflow
  };
  const rtl = await (platform2.isRTL == null ? void 0 : platform2.isRTL(floating));
  let rects = await platform2.getElementRects({
    reference,
    floating,
    strategy
  });
  let {
    x,
    y
  } = computeCoordsFromPlacement(rects, placement, rtl);
  let statefulPlacement = placement;
  let resetCount = 0;
  const middlewareData = {};
  for (let i = 0; i < middleware.length; i++) {
    const currentMiddleware = middleware[i];
    if (!currentMiddleware) {
      continue;
    }
    const {
      name,
      fn
    } = currentMiddleware;
    const {
      x: nextX,
      y: nextY,
      data,
      reset
    } = await fn({
      x,
      y,
      initialPlacement: placement,
      placement: statefulPlacement,
      strategy,
      middlewareData,
      rects,
      platform: platformWithDetectOverflow,
      elements: {
        reference,
        floating
      }
    });
    x = nextX != null ? nextX : x;
    y = nextY != null ? nextY : y;
    middlewareData[name] = {
      ...middlewareData[name],
      ...data
    };
    if (reset && resetCount < MAX_RESET_COUNT) {
      resetCount++;
      if (typeof reset === "object") {
        if (reset.placement) {
          statefulPlacement = reset.placement;
        }
        if (reset.rects) {
          rects = reset.rects === true ? await platform2.getElementRects({
            reference,
            floating,
            strategy
          }) : reset.rects;
        }
        ({
          x,
          y
        } = computeCoordsFromPlacement(rects, statefulPlacement, rtl));
      }
      i = -1;
    }
  }
  return {
    x,
    y,
    placement: statefulPlacement,
    strategy,
    middlewareData
  };
};
var flip = function(options) {
  if (options === void 0) {
    options = {};
  }
  return {
    name: "flip",
    options,
    async fn(state) {
      var _middlewareData$arrow, _middlewareData$flip;
      const {
        placement,
        middlewareData,
        rects,
        initialPlacement,
        platform: platform2,
        elements
      } = state;
      const {
        mainAxis: checkMainAxis = true,
        crossAxis: checkCrossAxis = true,
        fallbackPlacements: specifiedFallbackPlacements,
        fallbackStrategy = "bestFit",
        fallbackAxisSideDirection = "none",
        flipAlignment = true,
        ...detectOverflowOptions
      } = evaluate(options, state);
      if ((_middlewareData$arrow = middlewareData.arrow) != null && _middlewareData$arrow.alignmentOffset) {
        return {};
      }
      const side = getSide(placement);
      const initialSideAxis = getSideAxis(initialPlacement);
      const isBasePlacement = getSide(initialPlacement) === initialPlacement;
      const rtl = await (platform2.isRTL == null ? void 0 : platform2.isRTL(elements.floating));
      const fallbackPlacements = specifiedFallbackPlacements || (isBasePlacement || !flipAlignment ? [getOppositePlacement(initialPlacement)] : getExpandedPlacements(initialPlacement));
      const hasFallbackAxisSideDirection = fallbackAxisSideDirection !== "none";
      if (!specifiedFallbackPlacements && hasFallbackAxisSideDirection) {
        fallbackPlacements.push(...getOppositeAxisPlacements(initialPlacement, flipAlignment, fallbackAxisSideDirection, rtl));
      }
      const placements2 = [initialPlacement, ...fallbackPlacements];
      const overflow = await platform2.detectOverflow(state, detectOverflowOptions);
      const overflows = [];
      let overflowsData = ((_middlewareData$flip = middlewareData.flip) == null ? void 0 : _middlewareData$flip.overflows) || [];
      if (checkMainAxis) {
        overflows.push(overflow[side]);
      }
      if (checkCrossAxis) {
        const sides2 = getAlignmentSides(placement, rects, rtl);
        overflows.push(overflow[sides2[0]], overflow[sides2[1]]);
      }
      overflowsData = [...overflowsData, {
        placement,
        overflows
      }];
      if (!overflows.every((side2) => side2 <= 0)) {
        var _middlewareData$flip2, _overflowsData$filter;
        const nextIndex = (((_middlewareData$flip2 = middlewareData.flip) == null ? void 0 : _middlewareData$flip2.index) || 0) + 1;
        const nextPlacement = placements2[nextIndex];
        if (nextPlacement) {
          const ignoreCrossAxisOverflow = checkCrossAxis === "alignment" ? initialSideAxis !== getSideAxis(nextPlacement) : false;
          if (!ignoreCrossAxisOverflow || // We leave the current main axis only if every placement on that axis
          // overflows the main axis.
          overflowsData.every((d) => getSideAxis(d.placement) === initialSideAxis ? d.overflows[0] > 0 : true)) {
            return {
              data: {
                index: nextIndex,
                overflows: overflowsData
              },
              reset: {
                placement: nextPlacement
              }
            };
          }
        }
        let resetPlacement = (_overflowsData$filter = overflowsData.filter((d) => d.overflows[0] <= 0).sort((a, b) => a.overflows[1] - b.overflows[1])[0]) == null ? void 0 : _overflowsData$filter.placement;
        if (!resetPlacement) {
          switch (fallbackStrategy) {
            case "bestFit": {
              var _overflowsData$filter2;
              const placement2 = (_overflowsData$filter2 = overflowsData.filter((d) => {
                if (hasFallbackAxisSideDirection) {
                  const currentSideAxis = getSideAxis(d.placement);
                  return currentSideAxis === initialSideAxis || // Create a bias to the `y` side axis due to horizontal
                  // reading directions favoring greater width.
                  currentSideAxis === "y";
                }
                return true;
              }).map((d) => [d.placement, d.overflows.filter((overflow2) => overflow2 > 0).reduce((acc, overflow2) => acc + overflow2, 0)]).sort((a, b) => a[1] - b[1])[0]) == null ? void 0 : _overflowsData$filter2[0];
              if (placement2) {
                resetPlacement = placement2;
              }
              break;
            }
            case "initialPlacement":
              resetPlacement = initialPlacement;
              break;
          }
        }
        if (placement !== resetPlacement) {
          return {
            reset: {
              placement: resetPlacement
            }
          };
        }
      }
      return {};
    }
  };
};
function getSideOffsets(overflow, rect) {
  return {
    top: overflow.top - rect.height,
    right: overflow.right - rect.width,
    bottom: overflow.bottom - rect.height,
    left: overflow.left - rect.width
  };
}
function isAnySideFullyClipped(overflow) {
  return sides.some((side) => overflow[side] >= 0);
}
var hide = function(options) {
  if (options === void 0) {
    options = {};
  }
  return {
    name: "hide",
    options,
    async fn(state) {
      const {
        rects,
        platform: platform2
      } = state;
      const {
        strategy = "referenceHidden",
        ...detectOverflowOptions
      } = evaluate(options, state);
      switch (strategy) {
        case "referenceHidden": {
          const overflow = await platform2.detectOverflow(state, {
            ...detectOverflowOptions,
            elementContext: "reference"
          });
          const offsets = getSideOffsets(overflow, rects.reference);
          return {
            data: {
              referenceHiddenOffsets: offsets,
              referenceHidden: isAnySideFullyClipped(offsets)
            }
          };
        }
        case "escaped": {
          const overflow = await platform2.detectOverflow(state, {
            ...detectOverflowOptions,
            altBoundary: true
          });
          const offsets = getSideOffsets(overflow, rects.floating);
          return {
            data: {
              escapedOffsets: offsets,
              escaped: isAnySideFullyClipped(offsets)
            }
          };
        }
        default: {
          return {};
        }
      }
    }
  };
};
var originSides = /* @__PURE__ */ new Set(["left", "top"]);
async function convertValueToCoords(state, options) {
  const {
    placement,
    platform: platform2,
    elements
  } = state;
  const rtl = await (platform2.isRTL == null ? void 0 : platform2.isRTL(elements.floating));
  const side = getSide(placement);
  const alignment = getAlignment(placement);
  const isVertical = getSideAxis(placement) === "y";
  const mainAxisMulti = originSides.has(side) ? -1 : 1;
  const crossAxisMulti = rtl && isVertical ? -1 : 1;
  const rawValue = evaluate(options, state);
  let {
    mainAxis,
    crossAxis,
    alignmentAxis
  } = typeof rawValue === "number" ? {
    mainAxis: rawValue,
    crossAxis: 0,
    alignmentAxis: null
  } : {
    mainAxis: rawValue.mainAxis || 0,
    crossAxis: rawValue.crossAxis || 0,
    alignmentAxis: rawValue.alignmentAxis
  };
  if (alignment && typeof alignmentAxis === "number") {
    crossAxis = alignment === "end" ? alignmentAxis * -1 : alignmentAxis;
  }
  return isVertical ? {
    x: crossAxis * crossAxisMulti,
    y: mainAxis * mainAxisMulti
  } : {
    x: mainAxis * mainAxisMulti,
    y: crossAxis * crossAxisMulti
  };
}
var offset = function(options) {
  if (options === void 0) {
    options = 0;
  }
  return {
    name: "offset",
    options,
    async fn(state) {
      var _middlewareData$offse, _middlewareData$arrow;
      const {
        x,
        y,
        placement,
        middlewareData
      } = state;
      const diffCoords = await convertValueToCoords(state, options);
      if (placement === ((_middlewareData$offse = middlewareData.offset) == null ? void 0 : _middlewareData$offse.placement) && (_middlewareData$arrow = middlewareData.arrow) != null && _middlewareData$arrow.alignmentOffset) {
        return {};
      }
      return {
        x: x + diffCoords.x,
        y: y + diffCoords.y,
        data: {
          ...diffCoords,
          placement
        }
      };
    }
  };
};
var shift = function(options) {
  if (options === void 0) {
    options = {};
  }
  return {
    name: "shift",
    options,
    async fn(state) {
      const {
        x,
        y,
        placement,
        platform: platform2
      } = state;
      const {
        mainAxis: checkMainAxis = true,
        crossAxis: checkCrossAxis = false,
        limiter = {
          fn: (_ref) => {
            let {
              x: x2,
              y: y2
            } = _ref;
            return {
              x: x2,
              y: y2
            };
          }
        },
        ...detectOverflowOptions
      } = evaluate(options, state);
      const coords = {
        x,
        y
      };
      const overflow = await platform2.detectOverflow(state, detectOverflowOptions);
      const crossAxis = getSideAxis(placement);
      const mainAxis = getOppositeAxis(crossAxis);
      let mainAxisCoord = coords[mainAxis];
      let crossAxisCoord = coords[crossAxis];
      const clampCoord = (axis, coord) => clamp(coord + overflow[axis === "y" ? "top" : "left"], coord, coord - overflow[axis === "y" ? "bottom" : "right"]);
      if (checkMainAxis) {
        mainAxisCoord = clampCoord(mainAxis, mainAxisCoord);
      }
      if (checkCrossAxis) {
        crossAxisCoord = clampCoord(crossAxis, crossAxisCoord);
      }
      const limitedCoords = limiter.fn({
        ...state,
        [mainAxis]: mainAxisCoord,
        [crossAxis]: crossAxisCoord
      });
      return {
        ...limitedCoords,
        data: {
          x: limitedCoords.x - x,
          y: limitedCoords.y - y,
          enabled: {
            [mainAxis]: checkMainAxis,
            [crossAxis]: checkCrossAxis
          }
        }
      };
    }
  };
};

// node_modules/@floating-ui/utils/dist/floating-ui.utils.dom.mjs
function hasWindow() {
  return typeof window !== "undefined";
}
function getNodeName(node) {
  if (isNode(node)) {
    return (node.nodeName || "").toLowerCase();
  }
  return "#document";
}
function getWindow(node) {
  var _node$ownerDocument;
  return (node == null || (_node$ownerDocument = node.ownerDocument) == null ? void 0 : _node$ownerDocument.defaultView) || window;
}
function getDocumentElement(node) {
  var _ref;
  return (_ref = (isNode(node) ? node.ownerDocument : node.document) || window.document) == null ? void 0 : _ref.documentElement;
}
function isNode(value) {
  if (!hasWindow()) {
    return false;
  }
  return value instanceof Node || value instanceof getWindow(value).Node;
}
function isElement(value) {
  if (!hasWindow()) {
    return false;
  }
  return value instanceof Element || value instanceof getWindow(value).Element;
}
function isHTMLElement(value) {
  if (!hasWindow()) {
    return false;
  }
  return value instanceof HTMLElement || value instanceof getWindow(value).HTMLElement;
}
function isShadowRoot(value) {
  if (!hasWindow() || typeof ShadowRoot === "undefined") {
    return false;
  }
  return value instanceof ShadowRoot || value instanceof getWindow(value).ShadowRoot;
}
function isOverflowElement(element) {
  const {
    overflow,
    overflowX,
    overflowY,
    display
  } = getComputedStyle2(element);
  return /auto|scroll|overlay|hidden|clip/.test(overflow + overflowY + overflowX) && display !== "inline" && display !== "contents";
}
function isTableElement(element) {
  return /^(table|td|th)$/.test(getNodeName(element));
}
function isTopLayer(element) {
  try {
    if (element.matches(":popover-open")) {
      return true;
    }
  } catch (_e) {
  }
  try {
    return element.matches(":modal");
  } catch (_e) {
    return false;
  }
}
var willChangeRe = /transform|translate|scale|rotate|perspective|filter/;
var containRe = /paint|layout|strict|content/;
var isNotNone = (value) => !!value && value !== "none";
var isWebKitValue;
function isContainingBlock(elementOrCss) {
  const css = isElement(elementOrCss) ? getComputedStyle2(elementOrCss) : elementOrCss;
  return isNotNone(css.transform) || isNotNone(css.translate) || isNotNone(css.scale) || isNotNone(css.rotate) || isNotNone(css.perspective) || !isWebKit() && (isNotNone(css.backdropFilter) || isNotNone(css.filter)) || willChangeRe.test(css.willChange || "") || containRe.test(css.contain || "");
}
function getContainingBlock(element) {
  let currentNode = getParentNode(element);
  while (isHTMLElement(currentNode) && !isLastTraversableNode(currentNode)) {
    if (isContainingBlock(currentNode)) {
      return currentNode;
    } else if (isTopLayer(currentNode)) {
      return null;
    }
    currentNode = getParentNode(currentNode);
  }
  return null;
}
function isWebKit() {
  if (isWebKitValue == null) {
    isWebKitValue = typeof CSS !== "undefined" && CSS.supports && CSS.supports("-webkit-backdrop-filter", "none");
  }
  return isWebKitValue;
}
function isLastTraversableNode(node) {
  return /^(html|body|#document)$/.test(getNodeName(node));
}
function getComputedStyle2(element) {
  return getWindow(element).getComputedStyle(element);
}
function getNodeScroll(element) {
  if (isElement(element)) {
    return {
      scrollLeft: element.scrollLeft,
      scrollTop: element.scrollTop
    };
  }
  return {
    scrollLeft: element.scrollX,
    scrollTop: element.scrollY
  };
}
function getParentNode(node) {
  if (getNodeName(node) === "html") {
    return node;
  }
  const result = (
    // Step into the shadow DOM of the parent of a slotted node.
    node.assignedSlot || // DOM Element detected.
    node.parentNode || // ShadowRoot detected.
    isShadowRoot(node) && node.host || // Fallback.
    getDocumentElement(node)
  );
  return isShadowRoot(result) ? result.host : result;
}
function getNearestOverflowAncestor(node) {
  const parentNode = getParentNode(node);
  if (isLastTraversableNode(parentNode)) {
    return (node.ownerDocument || node).body;
  }
  if (isHTMLElement(parentNode) && isOverflowElement(parentNode)) {
    return parentNode;
  }
  return getNearestOverflowAncestor(parentNode);
}
function getOverflowAncestors(node, list, traverseIframes) {
  var _node$ownerDocument2;
  if (list === void 0) {
    list = [];
  }
  if (traverseIframes === void 0) {
    traverseIframes = true;
  }
  const scrollableAncestor = getNearestOverflowAncestor(node);
  const isBody = scrollableAncestor === ((_node$ownerDocument2 = node.ownerDocument) == null ? void 0 : _node$ownerDocument2.body);
  const win = getWindow(scrollableAncestor);
  if (isBody) {
    const frameElement = getFrameElement(win);
    return list.concat(win, win.visualViewport || [], isOverflowElement(scrollableAncestor) ? scrollableAncestor : [], frameElement && traverseIframes ? getOverflowAncestors(frameElement) : []);
  } else {
    return list.concat(scrollableAncestor, getOverflowAncestors(scrollableAncestor, [], traverseIframes));
  }
}
function getFrameElement(win) {
  return win.parent && Object.getPrototypeOf(win.parent) ? win.frameElement : null;
}

// node_modules/@floating-ui/dom/dist/floating-ui.dom.mjs
function getCssDimensions(element) {
  const css = getComputedStyle2(element);
  let width = parseFloat(css.width) || 0;
  let height = parseFloat(css.height) || 0;
  const hasOffset = isHTMLElement(element);
  const offsetWidth = hasOffset ? element.offsetWidth : width;
  const offsetHeight = hasOffset ? element.offsetHeight : height;
  const shouldFallback = round(width) !== offsetWidth || round(height) !== offsetHeight;
  if (shouldFallback) {
    width = offsetWidth;
    height = offsetHeight;
  }
  return {
    width,
    height,
    $: shouldFallback
  };
}
function unwrapElement(element) {
  return !isElement(element) ? element.contextElement : element;
}
function getScale(element) {
  const domElement = unwrapElement(element);
  if (!isHTMLElement(domElement)) {
    return createCoords(1);
  }
  const rect = domElement.getBoundingClientRect();
  const {
    width,
    height,
    $
  } = getCssDimensions(domElement);
  let x = ($ ? round(rect.width) : rect.width) / width;
  let y = ($ ? round(rect.height) : rect.height) / height;
  if (!x || !Number.isFinite(x)) {
    x = 1;
  }
  if (!y || !Number.isFinite(y)) {
    y = 1;
  }
  return {
    x,
    y
  };
}
var noOffsets = /* @__PURE__ */ createCoords(0);
function getVisualOffsets(element) {
  const win = getWindow(element);
  if (!isWebKit() || !win.visualViewport) {
    return noOffsets;
  }
  return {
    x: win.visualViewport.offsetLeft,
    y: win.visualViewport.offsetTop
  };
}
function shouldAddVisualOffsets(element, isFixed, floatingOffsetParent) {
  if (isFixed === void 0) {
    isFixed = false;
  }
  return !!floatingOffsetParent && isFixed && floatingOffsetParent === getWindow(element);
}
function getBoundingClientRect(element, includeScale, isFixedStrategy, offsetParent) {
  if (includeScale === void 0) {
    includeScale = false;
  }
  if (isFixedStrategy === void 0) {
    isFixedStrategy = false;
  }
  const clientRect = element.getBoundingClientRect();
  const domElement = unwrapElement(element);
  let scale = createCoords(1);
  if (includeScale) {
    if (offsetParent) {
      if (isElement(offsetParent)) {
        scale = getScale(offsetParent);
      }
    } else {
      scale = getScale(element);
    }
  }
  const visualOffsets = shouldAddVisualOffsets(domElement, isFixedStrategy, offsetParent) ? getVisualOffsets(domElement) : createCoords(0);
  let x = (clientRect.left + visualOffsets.x) / scale.x;
  let y = (clientRect.top + visualOffsets.y) / scale.y;
  let width = clientRect.width / scale.x;
  let height = clientRect.height / scale.y;
  if (domElement && offsetParent) {
    const win = getWindow(domElement);
    const offsetWin = isElement(offsetParent) ? getWindow(offsetParent) : offsetParent;
    let currentWin = win;
    let currentIFrame = getFrameElement(currentWin);
    while (currentIFrame && offsetWin !== currentWin) {
      const iframeScale = getScale(currentIFrame);
      const iframeRect = currentIFrame.getBoundingClientRect();
      const css = getComputedStyle2(currentIFrame);
      const left = iframeRect.left + (currentIFrame.clientLeft + parseFloat(css.paddingLeft)) * iframeScale.x;
      const top = iframeRect.top + (currentIFrame.clientTop + parseFloat(css.paddingTop)) * iframeScale.y;
      x *= iframeScale.x;
      y *= iframeScale.y;
      width *= iframeScale.x;
      height *= iframeScale.y;
      x += left;
      y += top;
      currentWin = getWindow(currentIFrame);
      currentIFrame = getFrameElement(currentWin);
    }
  }
  return rectToClientRect({
    width,
    height,
    x,
    y
  });
}
function getWindowScrollBarX(element, rect) {
  const leftScroll = getNodeScroll(element).scrollLeft;
  if (!rect) {
    return getBoundingClientRect(getDocumentElement(element)).left + leftScroll;
  }
  return rect.left + leftScroll;
}
function getHTMLOffset(documentElement, scroll) {
  const htmlRect = documentElement.getBoundingClientRect();
  const x = htmlRect.left + scroll.scrollLeft - getWindowScrollBarX(documentElement, htmlRect);
  const y = htmlRect.top + scroll.scrollTop;
  return {
    x,
    y
  };
}
function convertOffsetParentRelativeRectToViewportRelativeRect(_ref) {
  let {
    elements,
    rect,
    offsetParent,
    strategy
  } = _ref;
  const isFixed = strategy === "fixed";
  const documentElement = getDocumentElement(offsetParent);
  const topLayer = elements ? isTopLayer(elements.floating) : false;
  if (offsetParent === documentElement || topLayer && isFixed) {
    return rect;
  }
  let scroll = {
    scrollLeft: 0,
    scrollTop: 0
  };
  let scale = createCoords(1);
  const offsets = createCoords(0);
  const isOffsetParentAnElement = isHTMLElement(offsetParent);
  if (isOffsetParentAnElement || !isFixed) {
    if (getNodeName(offsetParent) !== "body" || isOverflowElement(documentElement)) {
      scroll = getNodeScroll(offsetParent);
    }
    if (isOffsetParentAnElement) {
      const offsetRect = getBoundingClientRect(offsetParent);
      scale = getScale(offsetParent);
      offsets.x = offsetRect.x + offsetParent.clientLeft;
      offsets.y = offsetRect.y + offsetParent.clientTop;
    }
  }
  const htmlOffset = documentElement && !isOffsetParentAnElement && !isFixed ? getHTMLOffset(documentElement, scroll) : createCoords(0);
  return {
    width: rect.width * scale.x,
    height: rect.height * scale.y,
    x: rect.x * scale.x - scroll.scrollLeft * scale.x + offsets.x + htmlOffset.x,
    y: rect.y * scale.y - scroll.scrollTop * scale.y + offsets.y + htmlOffset.y
  };
}
function getClientRects(element) {
  return element.getClientRects ? Array.from(element.getClientRects()) : [];
}
function getDocumentRect(html) {
  const scroll = getNodeScroll(html);
  const body = html.ownerDocument.body;
  const width = max(html.scrollWidth, html.clientWidth, body.scrollWidth, body.clientWidth);
  const height = max(html.scrollHeight, html.clientHeight, body.scrollHeight, body.clientHeight);
  let x = -scroll.scrollLeft + getWindowScrollBarX(html);
  const y = -scroll.scrollTop;
  if (getComputedStyle2(body).direction === "rtl") {
    x += max(html.clientWidth, body.clientWidth) - width;
  }
  return {
    width,
    height,
    x,
    y
  };
}
var SCROLLBAR_MAX = 25;
function getViewportRect(element, strategy, rootBoundary) {
  if (rootBoundary === void 0) {
    rootBoundary = "viewport";
  }
  const isLayoutViewport = rootBoundary === "layoutViewport";
  const win = getWindow(element);
  const html = getDocumentElement(element);
  const visualViewport = win.visualViewport;
  let width = html.clientWidth;
  let height = html.clientHeight;
  let x = 0;
  let y = 0;
  if (visualViewport) {
    const layoutRelativeClientCoords = !isWebKit() || strategy === "fixed";
    if (isLayoutViewport) {
      if (!layoutRelativeClientCoords) {
        x = -visualViewport.offsetLeft;
        y = -visualViewport.offsetTop;
      }
    } else {
      width = visualViewport.width;
      height = visualViewport.height;
      if (layoutRelativeClientCoords) {
        x = visualViewport.offsetLeft;
        y = visualViewport.offsetTop;
      }
    }
  }
  const windowScrollbarX = getWindowScrollBarX(html);
  if (windowScrollbarX <= 0) {
    const doc = html.ownerDocument;
    const body = doc.body;
    const bodyStyles = getComputedStyle(body);
    const bodyMarginInline = doc.compatMode === "CSS1Compat" ? parseFloat(bodyStyles.marginLeft) + parseFloat(bodyStyles.marginRight) || 0 : 0;
    const reservedWidth = Math.abs(html.clientWidth - body.clientWidth - bodyMarginInline);
    const gutter = getComputedStyle(html).scrollbarGutter === "stable both-edges" ? reservedWidth / 2 : reservedWidth;
    if (gutter <= SCROLLBAR_MAX) {
      width -= gutter;
    }
  }
  return {
    width,
    height,
    x,
    y
  };
}
function getInnerBoundingClientRect(element, strategy) {
  const clientRect = getBoundingClientRect(element, true, strategy === "fixed");
  const top = clientRect.top + element.clientTop;
  const left = clientRect.left + element.clientLeft;
  const scale = getScale(element);
  const width = element.clientWidth * scale.x;
  const height = element.clientHeight * scale.y;
  const x = left * scale.x;
  const y = top * scale.y;
  return {
    width,
    height,
    x,
    y
  };
}
function getClientRectFromClippingAncestor(element, clippingAncestor, strategy) {
  let rect;
  if (clippingAncestor === "viewport" || clippingAncestor === "layoutViewport") {
    rect = getViewportRect(element, strategy, clippingAncestor);
  } else if (clippingAncestor === "document") {
    rect = getDocumentRect(getDocumentElement(element));
  } else if (isElement(clippingAncestor)) {
    rect = getInnerBoundingClientRect(clippingAncestor, strategy);
  } else {
    const visualOffsets = getVisualOffsets(element);
    rect = {
      x: clippingAncestor.x - visualOffsets.x,
      y: clippingAncestor.y - visualOffsets.y,
      width: clippingAncestor.width,
      height: clippingAncestor.height
    };
  }
  return rectToClientRect(rect);
}
function getClippingElementAncestors(element, cache) {
  const cachedResult = cache.get(element);
  if (cachedResult) {
    return cachedResult;
  }
  let result = getOverflowAncestors(element, [], false).filter((el) => isElement(el) && getNodeName(el) !== "body");
  let lastKeptComputedStyle = null;
  const elementIsFixed = getComputedStyle2(element).position === "fixed";
  let currentNode = elementIsFixed ? getParentNode(element) : element;
  while (isElement(currentNode) && !isLastTraversableNode(currentNode)) {
    const computedStyle = getComputedStyle2(currentNode);
    const currentNodeIsContaining = isContainingBlock(currentNode);
    const lastPosition = lastKeptComputedStyle ? lastKeptComputedStyle.position : elementIsFixed ? "fixed" : "";
    const shouldDropCurrentNode = !currentNodeIsContaining && (lastPosition === "fixed" || lastPosition === "absolute" && computedStyle.position === "static");
    if (shouldDropCurrentNode) {
      result = result.filter((ancestor) => ancestor !== currentNode);
    } else {
      lastKeptComputedStyle = computedStyle;
    }
    currentNode = getParentNode(currentNode);
  }
  cache.set(element, result);
  return result;
}
function getClippingRect(_ref) {
  let {
    element,
    boundary,
    rootBoundary,
    strategy
  } = _ref;
  const elementClippingAncestors = boundary === "clippingAncestors" ? isTopLayer(element) ? [] : getClippingElementAncestors(element, this._c) : [].concat(boundary);
  const clippingAncestors = [...elementClippingAncestors, rootBoundary];
  const firstRect = getClientRectFromClippingAncestor(element, clippingAncestors[0], strategy);
  let top = firstRect.top;
  let right = firstRect.right;
  let bottom = firstRect.bottom;
  let left = firstRect.left;
  for (let i = 1; i < clippingAncestors.length; i++) {
    const rect = getClientRectFromClippingAncestor(element, clippingAncestors[i], strategy);
    top = max(rect.top, top);
    right = min(rect.right, right);
    bottom = min(rect.bottom, bottom);
    left = max(rect.left, left);
  }
  return {
    width: right - left,
    height: bottom - top,
    x: left,
    y: top
  };
}
function getDimensions(element) {
  const {
    width,
    height
  } = getCssDimensions(element);
  return {
    width,
    height
  };
}
function getRectRelativeToOffsetParent(element, offsetParent, strategy) {
  const isOffsetParentAnElement = isHTMLElement(offsetParent);
  const documentElement = getDocumentElement(offsetParent);
  const isFixed = strategy === "fixed";
  const rect = getBoundingClientRect(element, true, isFixed, offsetParent);
  let scroll = {
    scrollLeft: 0,
    scrollTop: 0
  };
  const offsets = createCoords(0);
  if (isOffsetParentAnElement || !isFixed) {
    if (getNodeName(offsetParent) !== "body" || isOverflowElement(documentElement)) {
      scroll = getNodeScroll(offsetParent);
    }
    if (isOffsetParentAnElement) {
      const offsetRect = getBoundingClientRect(offsetParent, true, isFixed, offsetParent);
      offsets.x = offsetRect.x + offsetParent.clientLeft;
      offsets.y = offsetRect.y + offsetParent.clientTop;
    }
  }
  if (!isOffsetParentAnElement && documentElement) {
    offsets.x = getWindowScrollBarX(documentElement);
  }
  const htmlOffset = documentElement && !isOffsetParentAnElement && !isFixed ? getHTMLOffset(documentElement, scroll) : createCoords(0);
  const x = rect.left + scroll.scrollLeft - offsets.x - htmlOffset.x;
  const y = rect.top + scroll.scrollTop - offsets.y - htmlOffset.y;
  return {
    x,
    y,
    width: rect.width,
    height: rect.height
  };
}
function isStaticPositioned(element) {
  return getComputedStyle2(element).position === "static";
}
function getTrueOffsetParent(element, polyfill) {
  if (!isHTMLElement(element) || getComputedStyle2(element).position === "fixed") {
    return null;
  }
  if (polyfill) {
    return polyfill(element);
  }
  let rawOffsetParent = element.offsetParent;
  if (getDocumentElement(element) === rawOffsetParent) {
    rawOffsetParent = rawOffsetParent.ownerDocument.body;
  }
  return rawOffsetParent;
}
function getOffsetParent(element, polyfill) {
  const win = getWindow(element);
  if (isTopLayer(element)) {
    return win;
  }
  if (!isHTMLElement(element)) {
    let svgOffsetParent = getParentNode(element);
    while (svgOffsetParent && !isLastTraversableNode(svgOffsetParent)) {
      if (isElement(svgOffsetParent) && !isStaticPositioned(svgOffsetParent)) {
        return svgOffsetParent;
      }
      svgOffsetParent = getParentNode(svgOffsetParent);
    }
    return win;
  }
  let offsetParent = getTrueOffsetParent(element, polyfill);
  while (offsetParent && isTableElement(offsetParent) && isStaticPositioned(offsetParent)) {
    offsetParent = getTrueOffsetParent(offsetParent, polyfill);
  }
  if (offsetParent && isLastTraversableNode(offsetParent) && isStaticPositioned(offsetParent) && !isContainingBlock(offsetParent)) {
    return win;
  }
  return offsetParent || getContainingBlock(element) || win;
}
var getElementRects = async function(data) {
  const getOffsetParentFn = this.getOffsetParent || getOffsetParent;
  const getDimensionsFn = this.getDimensions;
  const floatingDimensions = await getDimensionsFn(data.floating);
  return {
    reference: getRectRelativeToOffsetParent(data.reference, await getOffsetParentFn(data.floating), data.strategy),
    floating: {
      x: 0,
      y: 0,
      width: floatingDimensions.width,
      height: floatingDimensions.height
    }
  };
};
function isRTL(element) {
  return getComputedStyle2(element).direction === "rtl";
}
var platform = {
  convertOffsetParentRelativeRectToViewportRelativeRect,
  getDocumentElement,
  getClippingRect,
  getOffsetParent,
  getElementRects,
  getClientRects,
  getDimensions,
  getScale,
  isElement,
  isRTL
};
function rectsAreEqual(a, b) {
  return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
}
function observeMove(element, onMove, ancestorResize) {
  let io = null;
  let timeoutId;
  const root = getDocumentElement(element);
  function cleanup() {
    var _io;
    clearTimeout(timeoutId);
    (_io = io) == null || _io.disconnect();
    io = null;
  }
  function refresh(skip, threshold) {
    if (skip === void 0) {
      skip = false;
    }
    if (threshold === void 0) {
      threshold = 1;
    }
    cleanup();
    const elementRectForRootMargin = element.getBoundingClientRect();
    const {
      left,
      top,
      width,
      height
    } = elementRectForRootMargin;
    if (!skip) {
      onMove();
    }
    if (!width || !height) {
      return;
    }
    const insetTop = floor(top);
    const insetRight = floor(root.clientWidth - (left + width));
    const insetBottom = floor(root.clientHeight - (top + height));
    const insetLeft = floor(left);
    const rootMargin = -insetTop + "px " + -insetRight + "px " + -insetBottom + "px " + -insetLeft + "px";
    const options = {
      rootMargin,
      threshold: max(0, min(1, threshold)) || 1
    };
    let isFirstUpdate = true;
    function handleObserve(entries) {
      const ratio = entries[0].intersectionRatio;
      if (!rectsAreEqual(elementRectForRootMargin, element.getBoundingClientRect())) {
        return refresh();
      }
      if (ratio !== threshold) {
        if (!isFirstUpdate) {
          return refresh();
        }
        if (!ratio) {
          timeoutId = setTimeout(() => {
            refresh(false, 1e-7);
          }, 1e3);
        } else {
          refresh(false, ratio);
        }
      }
      isFirstUpdate = false;
    }
    try {
      io = new IntersectionObserver(handleObserve, {
        ...options,
        // Handle <iframe>s
        root: root.ownerDocument
      });
    } catch (_e) {
      io = new IntersectionObserver(handleObserve, options);
    }
    io.observe(element);
  }
  const win = getWindow(element);
  const handleResize = () => refresh(ancestorResize);
  win.addEventListener("resize", handleResize);
  refresh(true);
  return () => {
    win.removeEventListener("resize", handleResize);
    cleanup();
  };
}
function autoUpdate(reference, floating, update, options) {
  if (options === void 0) {
    options = {};
  }
  const {
    ancestorScroll = true,
    ancestorResize = true,
    elementResize = typeof ResizeObserver === "function",
    layoutShift = typeof IntersectionObserver === "function",
    animationFrame = false
  } = options;
  const referenceEl = unwrapElement(reference);
  const ancestors = ancestorScroll || ancestorResize ? [...referenceEl ? getOverflowAncestors(referenceEl) : [], ...floating ? getOverflowAncestors(floating) : []] : [];
  ancestors.forEach((ancestor) => {
    ancestorScroll && ancestor.addEventListener("scroll", update);
    ancestorResize && ancestor.addEventListener("resize", update);
  });
  const cleanupIo = referenceEl && layoutShift ? observeMove(referenceEl, update, ancestorResize) : null;
  let reobserveFrame = -1;
  let resizeObserver = null;
  if (elementResize) {
    resizeObserver = new ResizeObserver((_ref) => {
      let [firstEntry] = _ref;
      if (firstEntry && firstEntry.target === referenceEl && resizeObserver && floating) {
        resizeObserver.unobserve(floating);
        cancelAnimationFrame(reobserveFrame);
        reobserveFrame = requestAnimationFrame(() => {
          var _resizeObserver;
          (_resizeObserver = resizeObserver) == null || _resizeObserver.observe(floating);
        });
      }
      update();
    });
    if (referenceEl && !animationFrame) {
      resizeObserver.observe(referenceEl);
    }
    if (floating) {
      resizeObserver.observe(floating);
    }
  }
  let frameId;
  let prevRefRect = animationFrame ? getBoundingClientRect(reference) : null;
  if (animationFrame) {
    frameLoop();
  }
  function frameLoop() {
    const nextRefRect = getBoundingClientRect(reference);
    if (prevRefRect && !rectsAreEqual(prevRefRect, nextRefRect)) {
      update();
    }
    prevRefRect = nextRefRect;
    frameId = requestAnimationFrame(frameLoop);
  }
  update();
  return () => {
    var _resizeObserver2;
    ancestors.forEach((ancestor) => {
      ancestorScroll && ancestor.removeEventListener("scroll", update);
      ancestorResize && ancestor.removeEventListener("resize", update);
    });
    cleanupIo == null || cleanupIo();
    (_resizeObserver2 = resizeObserver) == null || _resizeObserver2.disconnect();
    resizeObserver = null;
    if (animationFrame) {
      cancelAnimationFrame(frameId);
    }
  };
}
var offset2 = offset;
var shift2 = shift;
var flip2 = flip;
var hide2 = hide;
var computePosition2 = (reference, floating, options) => {
  const cache = /* @__PURE__ */ new Map();
  const mergedOptions = options != null ? options : {};
  const platformWithCache = {
    ...platform,
    ...mergedOptions.platform,
    _c: cache
  };
  return computePosition(reference, floating, {
    ...mergedOptions,
    platform: platformWithCache
  });
};

// src/ActionAgent.ts
var import_fragment2 = require("fragment");

// src/eclosion.ts
var RAIDEUR = 300;
var AMORTISSEMENT = 30;
var RETARD_ETIREMENT = 150;
var FONDU = 140;
var RAYON_BULLE = 12;
var MARGE = 24;
var compteur = 0;
function eclore(bouton, bulle) {
  const sansAnimation = () => {
    bulle.style.opacity = "";
    return { fini: Promise.resolve(), annuler: () => {
    } };
  };
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return sansAnimation();
  const parent = bulle.parentElement;
  if (!parent) return sansAnimation();
  const rb = bulle.getBoundingClientRect();
  const rk = bouton.getBoundingClientRect();
  const dx = parseFloat(bulle.style.left || "0") - rb.left;
  const dy = parseFloat(bulle.style.top || "0") - rb.top;
  const cible = { x: rb.left + dx, y: rb.top + dy, w: rb.width, h: rb.height };
  const d = Math.min(rk.width, rk.height);
  const bouton0 = { x: rk.left + dx + (rk.width - d) / 2, y: rk.top + dy + (rk.height - d) / 2, w: d, h: d };
  const cx = bouton0.x + d / 2;
  const cy = bouton0.y + d / 2;
  const px = Math.min(Math.max(cx, cible.x + d / 2), cible.x + cible.w - d / 2);
  const py = Math.min(Math.max(cy, cible.y + d / 2), cible.y + cible.h - d / 2);
  const depart = { x: px - d / 2, y: py - d / 2, w: d, h: d };
  const gauche = Math.min(bouton0.x, cible.x) - MARGE;
  const haut = Math.min(bouton0.y, cible.y) - MARGE;
  const droite = Math.max(bouton0.x + d, cible.x + cible.w) + MARGE;
  const bas = Math.max(bouton0.y + d, cible.y + cible.h) + MARGE;
  const id = `agent-goo-${++compteur}`;
  const fantome = document.createElement("div");
  fantome.classList.add("agent-eclosion");
  Object.assign(fantome.style, {
    left: `${gauche}px`,
    top: `${haut}px`,
    width: `${droite - gauche}px`,
    height: `${bas - haut}px`,
    filter: `url(#${id})`
  });
  fantome.innerHTML = filtreGoo(id);
  const forme = (r) => {
    const el = fantome.appendChild(document.createElement("div"));
    el.classList.add("agent-eclosion-forme");
    Object.assign(el.style, {
      left: `${r.x - gauche}px`,
      top: `${r.y - haut}px`,
      width: `${r.w}px`,
      height: `${r.h}px`,
      borderRadius: "50%"
    });
    return el;
  };
  forme(bouton0);
  const goutte = forme(depart);
  bulle.style.opacity = "0";
  parent.appendChild(fantome);
  const { easing, duree } = ressort();
  const fuite = goutte.animate(
    [{ translate: `${bouton0.x - depart.x}px ${bouton0.y - depart.y}px` }, { translate: "0px 0px" }],
    { duration: duree, easing, fill: "both" }
  );
  const etirement = goutte.animate(
    [
      { left: `${depart.x - gauche}px`, top: `${depart.y - haut}px`, width: `${d}px`, height: `${d}px`, borderRadius: `${d / 2}px` },
      { left: `${cible.x - gauche}px`, top: `${cible.y - haut}px`, width: `${cible.w}px`, height: `${cible.h}px`, borderRadius: `${RAYON_BULLE}px` }
    ],
    { duration: duree, delay: RETARD_ETIREMENT, easing, fill: "both" }
  );
  const teinte = goutte.animate(
    [{ backgroundColor: getComputedStyle(goutte).backgroundColor }, { backgroundColor: getComputedStyle(bulle).backgroundColor }],
    { duration: duree, delay: RETARD_ETIREMENT, easing: "ease-in", fill: "both" }
  );
  let annule = false;
  const animations = [fuite, etirement, teinte];
  const nettoyer = () => {
    for (const a of animations) a.cancel();
    fantome.remove();
    bulle.style.opacity = "";
  };
  const fini = Promise.all([fuite.finished, etirement.finished, teinte.finished]).then(() => {
    if (annule) return;
    const apparition = bulle.animate([{ opacity: 0 }, { opacity: 1 }], { duration: FONDU, easing: "ease-out" });
    const effacement = fantome.animate([{ opacity: 1 }, { opacity: 0 }], { duration: FONDU, easing: "ease-out", fill: "forwards" });
    animations.push(apparition, effacement);
    bulle.style.opacity = "";
    return Promise.all([apparition.finished, effacement.finished]).then(() => void 0);
  }).catch(() => {
  }).finally(() => {
    if (!annule) nettoyer();
  });
  return {
    fini,
    annuler: () => {
      if (annule) return;
      annule = true;
      nettoyer();
    }
  };
}
function filtreGoo(id) {
  return `<svg width="0" height="0" style="position:absolute"><defs><filter id="${id}"><feGaussianBlur in="SourceGraphic" stdDeviation="4.4" result="blur"/><feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -7" result="goo"/><feBlend in="SourceGraphic" in2="goo"/></filter></defs></svg>`;
}
function ressort(raideur = RAIDEUR, amortissement = AMORTISSEMENT) {
  const dt = 1 / 1e3;
  let x = 0;
  let v = 0;
  const releves = [0];
  let t = 0;
  for (let pas = 0; pas < 2e3; pas++) {
    const a = -raideur * (x - 1) - amortissement * v;
    v += a * dt;
    x += v * dt;
    t += dt;
    if (pas % 10 === 9) releves.push(x);
    if (Math.abs(x - 1) < 1e-3 && Math.abs(v) < 0.01) break;
  }
  releves.push(1);
  return {
    easing: `linear(${releves.map((r) => Math.round(r * 1e3) / 1e3).join(", ")})`,
    duree: Math.round(t * 1e3)
  };
}

// src/eviter.ts
var ECART = 8;
var PAS_BALAYAGE = 12;
function eviter(options) {
  return {
    name: "eviter",
    fn(state) {
      const { x, y, rects, elements } = state;
      const w = rects.floating.width;
      const h = rects.floating.height;
      const refClient = elements.reference.getBoundingClientRect();
      const tx = refClient.x - rects.reference.x;
      const ty = refClient.y - rects.reference.y;
      const local = (b) => ({ x: b.x - tx, y: b.y - ty, width: b.width, height: b.height });
      const obstacles = options.obstacles().filter((b) => b.width > 0 && b.height > 0).map(local);
      const cadre = local(options.limites());
      const libre = (px, py) => {
        const moi = { x: px, y: py, width: w, height: h };
        return dedans(moi, cadre) && obstacles.every((o) => !chevauche(moi, o));
      };
      if (libre(x, y)) return {};
      const ref = rects.reference;
      const candidats = [
        // Autour de la référence.
        { x: ref.x + ref.width + ECART, y },
        { x: ref.x - w - ECART, y },
        { x, y: ref.y + ref.height + ECART },
        { x, y: ref.y - h - ECART }
      ];
      for (const o of obstacles) {
        candidats.push(
          { x: o.x - w - ECART, y },
          { x: o.x + o.width + ECART, y },
          { x, y: o.y + o.height + ECART },
          { x, y: o.y - h - ECART }
        );
      }
      const colonnes = [...new Set(candidats.map((c) => c.x))];
      for (let py = cadre.y; py + h <= cadre.y + cadre.height; py += PAS_BALAYAGE) {
        for (const px of colonnes) candidats.push({ x: px, y: py });
      }
      const jour = (px, py) => Math.hypot(
        Math.max(0, ref.x - (px + w), px - (ref.x + ref.width)),
        Math.max(0, ref.y - (py + h), py - (ref.y + ref.height))
      );
      const deCote = (py) => py < ref.y + ref.height && py + h > ref.y ? 0 : 1;
      let meilleur = null;
      let meilleurCote = Infinity;
      let meilleurJour = Infinity;
      let distance = Infinity;
      for (const c of candidats) {
        const px = Math.min(Math.max(c.x, cadre.x), cadre.x + cadre.width - w);
        const py = Math.min(Math.max(c.y, cadre.y), cadre.y + cadre.height - h);
        if (!libre(px, py)) continue;
        const k = deCote(py);
        const j = Math.round(jour(px, py));
        const d = Math.hypot(px - x, py - y);
        const mieux = k !== meilleurCote ? k < meilleurCote : j !== meilleurJour ? j < meilleurJour : d < distance;
        if (mieux) {
          meilleurCote = k;
          meilleurJour = j;
          distance = d;
          meilleur = { x: px, y: py };
        }
      }
      return meilleur ?? {};
    }
  };
}
function chevauche(a, b) {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}
function dedans(a, cadre) {
  return a.x >= cadre.x - 0.5 && a.y >= cadre.y - 0.5 && a.x + a.width <= cadre.x + cadre.width + 0.5 && a.y + a.height <= cadre.y + cadre.height + 0.5;
}

// src/repondre.ts
var LATENCE_FACTICE = 700;
async function repondre(question, contexte) {
  await new Promise((r) => setTimeout(r, LATENCE_FACTICE));
  const extrait = contexte.texte.length > 60 ? `${contexte.texte.slice(0, 60)}\u2026` : contexte.texte;
  return `R\xE9ponse factice : le back n'est pas encore branch\xE9. Question re\xE7ue : \xAB ${question} \xBB, sur \xAB ${extrait} \xBB.`;
}
var LATENCE_OUTIL = 1500;
var FACTICE = {
  definir: "D\xE9finition factice : le back n'est pas encore branch\xE9.",
  visualiser: "Visualisation factice : frise, mind map ou sch\xE9ma viendront du back.",
  aider: "Indice factice : le back donnera des indices successifs, jamais la solution.",
  traduire: "Traduction factice : le back traduira vers la langue du vault.",
  resumer: "R\xE9sum\xE9 factice : le back donnera les points cl\xE9s de la s\xE9lection."
};
async function agir(outil, contexte) {
  await new Promise((r) => setTimeout(r, LATENCE_OUTIL));
  const extrait = contexte.texte.length > 60 ? `${contexte.texte.slice(0, 60)}\u2026` : contexte.texte;
  return `${FACTICE[outil]} Passage : \xAB ${extrait} \xBB.`;
}

// src/supprimer.ts
var import_fragment = require("fragment");
var PiedSupprimer = class {
  el;
  poubelleEl;
  confirmationEl;
  annulerEl;
  constructor(app, onSupprimer) {
    this.el = document.createElement("div");
    this.el.classList.add("agent-pied");
    this.el.hidden = true;
    this.poubelleEl = this.el.appendChild(document.createElement("button"));
    this.poubelleEl.type = "button";
    this.poubelleEl.classList.add("agent-pied-poubelle");
    this.poubelleEl.setAttribute("aria-label", "Supprimer l'annotation");
    this.poubelleEl.title = "Supprimer l'annotation";
    (0, import_fragment.setIcon)(app, this.poubelleEl, "trash-2");
    this.poubelleEl.addEventListener("click", () => this.confirmer(true));
    this.confirmationEl = this.el.appendChild(document.createElement("div"));
    this.confirmationEl.classList.add("agent-pied-confirmation");
    this.confirmationEl.setAttribute("role", "group");
    this.confirmationEl.setAttribute("aria-label", "Supprimer l'annotation ?");
    const question = this.confirmationEl.appendChild(document.createElement("span"));
    question.textContent = "Supprimer l'annotation ?";
    this.annulerEl = this.confirmationEl.appendChild(document.createElement("button"));
    this.annulerEl.type = "button";
    this.annulerEl.classList.add("agent-pied-annuler");
    this.annulerEl.textContent = "Annuler";
    this.annulerEl.addEventListener("click", () => {
      this.confirmer(false);
      this.poubelleEl.focus();
    });
    const supprimerEl = this.confirmationEl.appendChild(document.createElement("button"));
    supprimerEl.type = "button";
    supprimerEl.classList.add("agent-pied-supprimer");
    supprimerEl.textContent = "Supprimer";
    supprimerEl.addEventListener("click", () => onSupprimer());
    this.confirmationEl.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      this.confirmer(false);
      this.poubelleEl.focus();
    });
    this.confirmer(false);
  }
  /** Montre la poubelle (réponse rouverte depuis la marge) ou masque le pied. */
  montrer(visible) {
    this.el.hidden = !visible;
    this.confirmer(false);
  }
  confirmer(oui) {
    this.poubelleEl.hidden = oui;
    this.confirmationEl.hidden = !oui;
    if (oui) this.annulerEl.focus();
  }
};

// src/widget.ts
var LARGEUR_MIN = 220;
var HAUTEUR_MIN = 120;
var MARGE2 = 8;
var BORDS = ["n", "s", "e", "w", "ne", "nw", "se", "sw"];
var Widget = class {
  /** null : placé par Floating UI, jamais touché. */
  cadre = null;
  el;
  reference;
  constructor(el, poignee, reference) {
    this.el = el;
    this.reference = reference;
    this.el.classList.add("agent-widget");
    poignee.classList.add("agent-widget-poignee");
    this.glisser(poignee, (e) => {
      if (e.target instanceof Element && e.target.closest("button, input, textarea")) return null;
      return (dx, dy, depart) => this.borner({ ...depart, dx: depart.dx + dx, dy: depart.dy + dy }, true);
    });
    for (const bord of BORDS) {
      const b = this.el.appendChild(document.createElement("div"));
      b.classList.add("agent-widget-bord", `mod-${bord}`);
      b.setAttribute("aria-hidden", "true");
      this.glisser(b, () => (dx, dy, depart) => this.borner(redimensionner(bord, dx, dy, depart), false));
    }
  }
  /** Oublie le cadre : la prochaine ouverture repart de la place automatique. */
  oublier() {
    this.cadre = null;
    this.el.classList.remove("is-cadre");
    this.el.style.width = "";
    this.el.style.height = "";
    this.el.style.maxWidth = "";
  }
  /** Reprend un cadre gardé (une réponse rouverte depuis la marge). */
  reprendre(cadre) {
    if (!cadre) {
      this.oublier();
      return;
    }
    this.cadre = { ...cadre };
    this.appliquerTaille();
  }
  /**
   * Pose le widget sur son cadre. À appeler à la place de Floating UI dès
   * qu'il y a un cadre, à chaque scroll ou édition (autoUpdate du composant).
   */
  poser() {
    if (!this.cadre) return;
    const ref = this.reference();
    const loin = ref.left < -1e4;
    this.el.style.visibility = loin ? "hidden" : "visible";
    if (loin) return;
    this.plafonner();
    const { ox, oy } = this.origine();
    this.el.style.left = `${ref.left + this.cadre.dx - ox}px`;
    this.el.style.top = `${ref.top + this.cadre.dy - oy}px`;
  }
  /**
   * Garde le widget dans son pane, à MARGE de ses bords : au-delà, le pane le
   * rogne (il passait sous la barre latérale). Déplacé, il est repoussé
   * dedans ; agrandi, il s'arrête au bord. Seul le geste est borné : le
   * défilement peut l'emporter hors de l'écran avec son texte.
   */
  borner(c, deplacement) {
    const pane = this.el.parentElement?.getBoundingClientRect();
    if (!pane) return c;
    const ref = this.reference();
    const gauche = pane.left + MARGE2;
    const droite = pane.right - MARGE2;
    const haut = pane.top + MARGE2;
    const bas = pane.bottom - MARGE2;
    let x = ref.left + c.dx;
    let y = ref.top + c.dy;
    let { width, height } = c;
    if (deplacement) {
      x = Math.max(gauche, Math.min(x, droite - width));
      y = Math.max(haut, Math.min(y, bas - height));
    } else {
      const x2 = Math.min(x + width, droite);
      const y2 = Math.min(y + height, bas);
      x = Math.max(x, gauche);
      y = Math.max(y, haut);
      width = Math.max(Math.min(LARGEUR_MIN, c.width), x2 - x);
      height = Math.max(Math.min(HAUTEUR_MIN, c.height), y2 - y);
    }
    return { dx: x - ref.left, dy: y - ref.top, width, height };
  }
  /**
   * Jamais plus grand que son pane : un cadre gardé dans une grande fenêtre
   * peut revenir dans un pane devenu plus étroit (fenêtre réduite, split).
   */
  plafonner() {
    const pane = this.el.parentElement?.getBoundingClientRect();
    if (!this.cadre || !pane) return;
    const largeur = Math.max(Math.min(LARGEUR_MIN, this.cadre.width), pane.width - 2 * MARGE2);
    const hauteur = Math.max(Math.min(HAUTEUR_MIN, this.cadre.height), pane.height - 2 * MARGE2);
    if (this.cadre.width <= largeur && this.cadre.height <= hauteur) return;
    this.cadre = { ...this.cadre, width: Math.min(this.cadre.width, largeur), height: Math.min(this.cadre.height, hauteur) };
    this.appliquerTaille();
  }
  /** Client → repère du parent : l'écart entre la boîte client et left/top. */
  origine() {
    const r = this.el.getBoundingClientRect();
    return {
      ox: r.left - (parseFloat(this.el.style.left) || 0),
      oy: r.top - (parseFloat(this.el.style.top) || 0)
    };
  }
  /** Le cadre qui reproduit exactement la place actuelle (premier geste). */
  cadreActuel() {
    const r = this.el.getBoundingClientRect();
    const ref = this.reference();
    return { dx: r.left - ref.left, dy: r.top - ref.top, width: r.width, height: r.height };
  }
  appliquerTaille() {
    if (!this.cadre) return;
    this.el.classList.add("is-cadre");
    this.el.style.maxWidth = "none";
    this.el.style.width = `${this.cadre.width}px`;
    this.el.style.height = `${this.cadre.height}px`;
  }
  /**
   * Un geste au pointeur sur `cible`. `debut` décide au pointerdown si le
   * geste a lieu et rend la transformation du cadre de départ par le
   * déplacement du pointeur.
   */
  glisser(cible, debut) {
    const down = (e) => {
      if (e.button !== 0) return;
      const transformer = debut(e);
      if (!transformer) return;
      e.preventDefault();
      e.stopPropagation();
      const depart = this.cadre ?? this.cadreActuel();
      const x0 = e.clientX;
      const y0 = e.clientY;
      cible.setPointerCapture(e.pointerId);
      this.el.classList.add("is-geste");
      const move = (ev) => {
        this.cadre = transformer(ev.clientX - x0, ev.clientY - y0, depart);
        this.appliquerTaille();
        this.poser();
      };
      const up = () => {
        cible.removeEventListener("pointermove", move);
        cible.removeEventListener("pointerup", up);
        cible.removeEventListener("pointercancel", up);
        this.el.classList.remove("is-geste");
      };
      cible.addEventListener("pointermove", move);
      cible.addEventListener("pointerup", up);
      cible.addEventListener("pointercancel", up);
    };
    cible.addEventListener("pointerdown", down);
  }
};
function redimensionner(bord, dx, dy, c) {
  let { dx: x, dy: y, width, height } = c;
  const largeurMin = Math.min(LARGEUR_MIN, c.width);
  const hauteurMin = Math.min(HAUTEUR_MIN, c.height);
  if (bord.includes("e")) width = Math.max(largeurMin, c.width + dx);
  if (bord.includes("s")) height = Math.max(hauteurMin, c.height + dy);
  if (bord.includes("w")) {
    width = Math.max(largeurMin, c.width - dx);
    x = c.dx + c.width - width;
  }
  if (bord.includes("n")) {
    height = Math.max(hauteurMin, c.height - dy);
    y = c.dy + c.height - height;
  }
  return { dx: x, dy: y, width, height };
}

// src/ActionAgent.ts
var OUTILS = {
  definir: { icone: "book-a", libelle: "D\xE9finir" },
  visualiser: { icone: "chart-network", libelle: "Visualiser" },
  aider: { icone: "lightbulb", libelle: "Aider" },
  traduire: { icone: "languages", libelle: "Traduire" },
  resumer: { icone: "list", libelle: "R\xE9sumer" }
};
var RAIDEUR2 = 700;
var AMORTISSEMENT2 = 48;
var ActionAgent = class extends import_fragment2.Component {
  cercleEl;
  carteEl;
  iconeCercleEl;
  iconeCarteEl;
  titreEl;
  corpsEl;
  pied;
  /** Déplacer et agrandir la carte (widget.ts). Le rond, lui, ne bouge pas. */
  widget;
  /** Le numéro du lancement en cours : une réponse d'un lancement fermé est ignorée. */
  lancement = 0;
  /**
   * L'écart entre le haut du rond et le haut du passage, relevé quand la
   * carte s'ouvre : la carte garde le haut du rond, dont elle sort, même
   * une fois le rond retiré.
   */
  decalageCarte = 0;
  animations = [];
  /** L'outil et la réponse montrés par la carte, lus par le calque à la fermeture. */
  montre = null;
  app;
  parentEl;
  reference;
  onFermer;
  evitement;
  constructor(app, parentEl, reference, onFermer, evitement, onSupprimer) {
    super();
    this.app = app;
    this.parentEl = parentEl;
    this.reference = reference;
    this.onFermer = onFermer;
    this.evitement = evitement;
    this.cercleEl = document.createElement("div");
    this.cercleEl.classList.add("agent-action-cercle");
    this.cercleEl.setAttribute("role", "status");
    this.iconeCercleEl = this.cercleEl.appendChild(document.createElement("span"));
    this.iconeCercleEl.classList.add("agent-action-icone");
    this.cercleEl.insertAdjacentHTML(
      "beforeend",
      '<svg class="agent-action-arc" viewBox="0 0 60 60" aria-hidden="true"><circle cx="30" cy="30" r="28" pathLength="100"/></svg>'
    );
    this.carteEl = document.createElement("div");
    this.carteEl.classList.add("agent-action-carte");
    this.carteEl.setAttribute("role", "dialog");
    const tete = this.carteEl.appendChild(document.createElement("div"));
    tete.classList.add("agent-action-tete");
    this.iconeCarteEl = tete.appendChild(document.createElement("span"));
    this.iconeCarteEl.classList.add("agent-action-icone");
    this.titreEl = tete.appendChild(document.createElement("span"));
    this.titreEl.classList.add("agent-action-titre");
    const fermerEl = tete.appendChild(document.createElement("button"));
    fermerEl.type = "button";
    fermerEl.classList.add("agent-bulle-fermer");
    fermerEl.setAttribute("aria-label", "Fermer");
    fermerEl.title = "Fermer";
    (0, import_fragment2.setIcon)(app, fermerEl, "x");
    fermerEl.addEventListener("click", () => this.fermer());
    this.corpsEl = this.carteEl.appendChild(document.createElement("div"));
    this.corpsEl.classList.add("agent-action-corps");
    this.corpsEl.setAttribute("aria-live", "polite");
    this.pied = new PiedSupprimer(app, onSupprimer);
    this.carteEl.appendChild(this.pied.el);
    this.widget = new Widget(this.carteEl, tete, () => reference.getBoundingClientRect());
    this.carteEl.addEventListener("keydown", (e) => e.stopPropagation());
  }
  estOuverte() {
    return this._loaded;
  }
  /** La réponse que la carte montre, ou null (l'agent réfléchit encore, ou a échoué). */
  resultat() {
    return this.montre;
  }
  /** Où la carte a été posée et à quelle taille, null si on n'y a pas touché. */
  cadre() {
    return this.widget.cadre ? { ...this.widget.cadre } : null;
  }
  /**
   * Lance `outil` sur le passage. `depuis` est la boîte CLIENT de la barre,
   * juste avant qu'elle ne soit retirée : le rond en sort.
   */
  lancer(outil, contexte, depuis) {
    const { libelle } = OUTILS[outil];
    this.cercleEl.setAttribute("aria-label", `${libelle} : l'agent r\xE9fl\xE9chit`);
    this.preparer(outil);
    this.lancement++;
    const lancement = this.lancement;
    const estCourant = () => this._loaded && this.lancement === lancement;
    this.cercleEl.style.opacity = "0";
    this.parentEl.appendChild(this.cercleEl);
    this.load();
    void this.placer().then(() => {
      if (!estCourant()) return;
      this.animations.push(resorber(depuis, this.cercleEl));
    });
    agir(outil, contexte).then((reponse) => {
      if (!estCourant()) return;
      this.montre = { outil, texte: reponse };
      this.ouvrirCarte(reponse, false);
    }).catch((err) => {
      if (estCourant()) {
        this.ouvrirCarte(`L'agent n'a pas pu r\xE9pondre : ${err instanceof Error ? err.message : String(err)}`, true);
      }
    });
  }
  /**
   * Rouvre une réponse déjà reçue (une icône de l'historique, traces.ts) :
   * pas de rond, la carte sort directement de l'icône.
   */
  montrer(outil, texte, depuis, cadre) {
    this.preparer(outil);
    this.widget.reprendre(cadre);
    this.pied.montrer(true);
    this.montre = { outil, texte };
    this.corpsEl.textContent = texte;
    this.lancement++;
    const lancement = this.lancement;
    this.decalageCarte = 0;
    this.carteEl.style.opacity = "0";
    this.parentEl.appendChild(this.carteEl);
    this.load();
    void this.placer().then(() => {
      if (!this._loaded || this.lancement !== lancement) return;
      this.animations.push(eclore(depuis, this.carteEl));
    });
  }
  fermer() {
    this.unload();
  }
  /** L'icône et le nom de l'outil sur le rond et la carte, le corps vidé. */
  preparer(outil) {
    const { icone, libelle } = OUTILS[outil];
    (0, import_fragment2.setIcon)(this.app, this.iconeCercleEl, icone);
    (0, import_fragment2.setIcon)(this.app, this.iconeCarteEl, icone);
    this.titreEl.textContent = libelle;
    this.carteEl.setAttribute("aria-label", libelle);
    this.corpsEl.textContent = "";
    this.corpsEl.classList.remove("is-error");
    this.pied.montrer(false);
    this.widget.oublier();
    this.montre = null;
  }
  onload() {
    this.register(autoUpdate(this.reference, this.cercleEl, () => void this.placer()));
  }
  onunload() {
    for (const a of this.animations) a.annuler();
    this.animations = [];
    this.cercleEl.remove();
    this.carteEl.remove();
    this.cercleEl.classList.remove("is-fini");
    this.cercleEl.style.opacity = "";
    this.carteEl.style.opacity = "";
    this.onFermer();
  }
  /** Public, pour les mouvements que autoUpdate ne voit pas (voir agentLayer). */
  placer() {
    if (!this._loaded) return Promise.resolve();
    const poser = (el, placement) => computePosition2(this.reference, el, {
      placement,
      strategy: "absolute",
      middleware: [
        // Le rond à la place de la barre (même écart au passage) ; la
        // carte sur le haut du passage.
        offset2({ mainAxis: 12, crossAxis: placement === "right" ? 0 : this.decalageCarte }),
        flip2({ padding: 8, fallbackPlacements: [placement === "right" ? "left" : "left-start"] }),
        shift2({ padding: 8 }),
        eviter(this.evitement),
        hide2()
      ]
    }).then(({ x, y, middlewareData }) => {
      if (!this._loaded) return;
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      el.style.visibility = middlewareData.hide?.referenceHidden ? "hidden" : "visible";
    });
    const enCours = [];
    if (this.cercleEl.isConnected) enCours.push(poser(this.cercleEl, "right"));
    if (this.carteEl.isConnected && this.widget.cadre) this.widget.poser();
    else if (this.carteEl.isConnected) enCours.push(poser(this.carteEl, "right-start"));
    return Promise.all(enCours).then(() => void 0);
  }
  /** Le rond s'ouvre en carte : la goutte du chat (eclosion.ts), depuis le rond. */
  ouvrirCarte(texte, erreur) {
    this.corpsEl.textContent = texte;
    this.corpsEl.classList.toggle("is-error", erreur);
    this.decalageCarte = this.cercleEl.getBoundingClientRect().top - this.reference.getBoundingClientRect().top;
    this.carteEl.style.opacity = "0";
    this.parentEl.appendChild(this.carteEl);
    const lancement = this.lancement;
    void this.placer().then(() => {
      if (!this._loaded || this.lancement !== lancement) return;
      this.cercleEl.classList.add("is-fini");
      const eclosion = eclore(this.cercleEl, this.carteEl);
      this.animations.push(eclosion);
      void eclosion.fini.then(() => {
        if (this._loaded && this.lancement === lancement) this.cercleEl.remove();
      });
    });
  }
};
function resorber(depuis, cercle) {
  const montrer = () => {
    cercle.style.opacity = "";
  };
  const parent = cercle.parentElement;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !parent) {
    montrer();
    return { annuler: () => {
    } };
  }
  const rc = cercle.getBoundingClientRect();
  const dx = parseFloat(cercle.style.left || "0") - rc.left;
  const dy = parseFloat(cercle.style.top || "0") - rc.top;
  const forme = document.createElement("div");
  forme.classList.add("agent-action-forme");
  parent.appendChild(forme);
  const { easing, duree } = ressort(RAIDEUR2, AMORTISSEMENT2);
  const anim = forme.animate(
    [
      { left: `${depuis.left + dx}px`, top: `${depuis.top + dy}px`, width: `${depuis.width}px`, height: `${depuis.height}px`, borderRadius: "10px" },
      { left: `${rc.left + dx}px`, top: `${rc.top + dy}px`, width: `${rc.width}px`, height: `${rc.height}px`, borderRadius: `${rc.width / 2}px` }
    ],
    { duration: duree, easing, fill: "both" }
  );
  let annule = false;
  anim.finished.then(() => {
    if (annule) return;
    forme.remove();
    montrer();
    cercle.firstElementChild?.animate(
      [{ opacity: 0, scale: "0.5" }, { opacity: 1, scale: "1" }],
      { duration: 140, easing: "cubic-bezier(0.2, 0.9, 0.3, 1.2)" }
    );
  }).catch(() => {
  });
  return {
    annuler: () => {
      annule = true;
      anim.cancel();
      forme.remove();
      montrer();
    }
  };
}

// src/BarreAgent.ts
var import_fragment3 = require("fragment");

// src/rallonge.ts
var RAIDEUR3 = 520;
var AMORTISSEMENT3 = 38;
var RETARD = 70;
var CASCADE = 35;
var APPARITION = 220;
function rallonger(barre, plus, nouveaux) {
  const avant = barre.offsetHeight;
  plus.style.display = "none";
  for (const el of nouveaux) el.hidden = false;
  const apres = barre.offsetHeight;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || apres <= avant) {
    return { fini: Promise.resolve(), annuler: () => {
    } };
  }
  const { easing, duree } = ressort(RAIDEUR3, AMORTISSEMENT3);
  barre.style.boxSizing = "border-box";
  barre.style.overflow = "hidden";
  const hauteur = barre.animate(
    [{ height: `${avant}px` }, { height: `${apres}px` }],
    { duration: duree, easing }
  );
  const apparitions = nouveaux.map((el, i) => el.animate(
    [
      { opacity: 0, scale: "0.5", filter: "blur(4px)" },
      { opacity: 1, scale: "1", filter: "blur(0px)" }
    ],
    { duration: APPARITION, delay: RETARD + i * CASCADE, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)", fill: "backwards" }
  ));
  const animations = [hauteur, ...apparitions];
  let annule = false;
  const nettoyer = () => {
    for (const a of animations) a.cancel();
    barre.style.boxSizing = "";
    barre.style.overflow = "";
  };
  const fini = Promise.all(animations.map((a) => a.finished)).then(() => void 0).catch(() => {
  }).finally(() => {
    if (!annule) nettoyer();
  });
  return {
    fini,
    annuler: () => {
      if (annule) return;
      annule = true;
      nettoyer();
    }
  };
}

// src/BarreAgent.ts
var BarreAgent = class extends import_fragment3.Component {
  dom;
  /** Le bouton tête de chat : le chat s'aligne sur lui. */
  chatEl;
  parentEl;
  reference;
  actions;
  /** Ce que la barre ne doit jamais recouvrir, et le cadre où elle reste (voir eviter.ts). */
  evitement;
  /**
   * La hauteur de la barre avant la rallonge. Floating UI centre la barre sur
   * le passage (`right`) : on la décale de la moitié de ce qu'elle a gagné
   * depuis, lu sur sa hauteur COURANTE, pour que son haut ne bouge ni pendant
   * le geste ni après.
   */
  hauteurCourte = null;
  rallonge = null;
  /** Vrai pendant cacher() : le démontage ne prévient pas le calque. */
  silencieux = false;
  /** « … », et les outils qu'il fait apparaître. */
  plusEl;
  caches;
  constructor(app, parentEl, reference, actions, evitement) {
    super();
    this.parentEl = parentEl;
    this.reference = reference;
    this.actions = actions;
    this.evitement = evitement;
    this.dom = document.createElement("div");
    this.dom.classList.add("agent-barre");
    this.dom.setAttribute("role", "toolbar");
    this.dom.setAttribute("aria-orientation", "vertical");
    this.dom.setAttribute("aria-label", "Agent");
    const fermerEl = this.bouton(app, "x", "Fermer", "agent-barre-fermer");
    fermerEl.addEventListener("click", () => this.fermer());
    this.chatEl = this.bouton(app, "cat", "Discuter avec l'agent");
    this.chatEl.addEventListener("click", () => this.actions.onChat());
    const outil = (id) => {
      const el = this.bouton(app, OUTILS[id].icone, OUTILS[id].libelle, "agent-barre-outil");
      el.addEventListener("click", () => this.actions.onOutil(id));
      return el;
    };
    outil("definir");
    outil("visualiser");
    this.caches = ["aider", "traduire", "resumer"].map((id) => {
      const el = outil(id);
      el.hidden = true;
      return el;
    });
    this.plusEl = this.bouton(app, "ellipsis", "Plus d'outils", "agent-barre-plus");
    this.plusEl.addEventListener("click", () => {
      if (this.rallonge) return;
      this.hauteurCourte = this.dom.offsetHeight;
      const rallonge = rallonger(this.dom, this.plusEl, this.caches);
      this.rallonge = rallonge;
      this.placer();
      void rallonge.fini.then(() => {
        if (this.rallonge !== rallonge) return;
        this.plusEl.remove();
      });
    });
    this.dom.addEventListener("keydown", (e) => e.stopPropagation());
  }
  estOuverte() {
    return this._loaded;
  }
  montrer() {
    if (!this._loaded) {
      this.parentEl.appendChild(this.dom);
      this.load();
    }
    this.placer();
  }
  fermer() {
    this.unload();
  }
  /**
   * Retire la barre SANS la fermer au sens du calque : un outil prend sa
   * place, le passage reste visé. onFermer n'est pas appelé.
   */
  cacher() {
    this.silencieux = true;
    this.unload();
    this.silencieux = false;
  }
  onload() {
    this.register(autoUpdate(this.reference, this.dom, () => this.placer()));
  }
  onunload() {
    this.replier();
    this.dom.remove();
    if (!this.silencieux) this.actions.onFermer();
  }
  /** Public, pour les mouvements que autoUpdate ne voit pas (voir agentLayer). */
  placer() {
    if (!this._loaded) return;
    void computePosition2(this.reference, this.dom, {
      placement: "right",
      strategy: "absolute",
      middleware: [
        offset2({
          mainAxis: 12,
          crossAxis: this.hauteurCourte === null ? 0 : (this.dom.offsetHeight - this.hauteurCourte) / 2
        }),
        flip2({ padding: 8, fallbackPlacements: ["left"] }),
        shift2({ padding: 8 }),
        // Après flip et shift : ils ignorent les AUTRES flottants, dont la
        // barre d'annotation, rangée par défaut dans la même marge.
        eviter(this.evitement),
        hide2()
      ]
    }).then(({ x, y, middlewareData }) => {
      if (!this._loaded) return;
      this.dom.style.left = `${x}px`;
      this.dom.style.top = `${y}px`;
      this.dom.style.visibility = middlewareData.hide?.referenceHidden ? "hidden" : "visible";
    });
  }
  /** La barre est réutilisée d'un trait à l'autre : elle rouvre courte. */
  replier() {
    this.rallonge?.annuler();
    this.rallonge = null;
    this.hauteurCourte = null;
    for (const el of this.caches) el.hidden = true;
    this.plusEl.style.display = "";
    if (!this.plusEl.isConnected) this.dom.appendChild(this.plusEl);
  }
  bouton(app, icone, libelle, classe) {
    const el = this.dom.appendChild(document.createElement("button"));
    el.type = "button";
    el.classList.add("agent-barre-bouton");
    if (classe) el.classList.add(classe);
    el.setAttribute("aria-label", libelle);
    el.title = libelle;
    if (icone) (0, import_fragment3.setIcon)(app, el, icone);
    return el;
  }
};

// src/BulleAgent.ts
var import_fragment4 = require("fragment");
var BulleAgent = class extends import_fragment4.Component {
  /** La racine, montée dans le pane à l'ouverture, retirée à la fermeture. */
  dom;
  extraitEl;
  filEl;
  champEl;
  envoyerEl;
  pied;
  /** Déplacer et agrandir la bulle (widget.ts). */
  widget;
  /** La zone sur laquelle porte la conversation, `null` bulle fermée. */
  contexte = null;
  enAttente = false;
  /**
   * Le numéro de l'ouverture en cours. Une réponse ne sait pas annuler sa
   * requête : fermée puis rouverte pendant l'attente, la bulle recevrait la
   * réponse de l'ANCIENNE conversation. Chaque réponse compare donc le numéro
   * de son ouverture à celui-ci avant de toucher à quoi que ce soit.
   */
  ouverture = 0;
  /** L'animation d'ouverture en cours, à annuler si on ferme pendant. */
  eclosion = null;
  /** Le pane de la vue : la bulle y est montée, et `shift` l'y garde. */
  parentEl;
  /** La barre : la bulle se pose à sa droite. */
  reference;
  /** Le bouton tête de chat : la bulle s'aligne sur son haut. */
  alignEl;
  /**
   * Une conversation rouverte depuis la marge (voir rouvrir()) : la bulle se
   * tient seule contre le trait, sans la barre, et sort de l'icône. null
   * pour une bulle ouverte par la tête de chat de la barre.
   */
  seule = null;
  /**
   * Prévenu à chaque fermeture, avec la conversation et son passage tels
   * qu'ils étaient : le calque en garde une trace dans la marge (traces.ts).
   */
  onFermer;
  /** Ce que la bulle ne doit jamais recouvrir, et le cadre où elle reste (voir eviter.ts). */
  evitement;
  constructor(app, parentEl, reference, alignEl, onFermer, evitement, onSupprimer, trait) {
    super();
    this.parentEl = parentEl;
    this.reference = reference;
    this.alignEl = alignEl;
    this.evitement = evitement;
    this.onFermer = onFermer;
    this.dom = document.createElement("div");
    this.dom.classList.add("agent-bulle");
    this.dom.setAttribute("role", "dialog");
    this.dom.setAttribute("aria-label", "Question \xE0 l'agent");
    const tete = this.dom.appendChild(document.createElement("div"));
    tete.classList.add("agent-bulle-tete");
    this.extraitEl = tete.appendChild(document.createElement("div"));
    this.extraitEl.classList.add("agent-bulle-extrait");
    const fermerEl = tete.appendChild(document.createElement("button"));
    fermerEl.type = "button";
    fermerEl.classList.add("agent-bulle-fermer");
    fermerEl.setAttribute("aria-label", "Fermer");
    fermerEl.title = "Fermer";
    (0, import_fragment4.setIcon)(app, fermerEl, "x");
    fermerEl.addEventListener("click", () => this.fermer());
    this.filEl = this.dom.appendChild(document.createElement("div"));
    this.filEl.classList.add("agent-bulle-fil");
    this.filEl.setAttribute("aria-live", "polite");
    const saisie = this.dom.appendChild(document.createElement("form"));
    saisie.classList.add("agent-bulle-saisie");
    saisie.addEventListener("submit", (e) => {
      e.preventDefault();
      void this.envoyer();
    });
    this.champEl = saisie.appendChild(document.createElement("textarea"));
    this.champEl.classList.add("agent-bulle-champ");
    this.champEl.rows = 1;
    this.champEl.placeholder = "Poser une question sur ce passage";
    this.champEl.setAttribute("aria-label", "Question");
    this.champEl.addEventListener("input", () => this.ajusterChamp());
    this.champEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
        e.preventDefault();
        void this.envoyer();
      }
    });
    this.envoyerEl = saisie.appendChild(document.createElement("button"));
    this.envoyerEl.type = "submit";
    this.envoyerEl.classList.add("agent-bulle-envoyer");
    this.envoyerEl.setAttribute("aria-label", "Envoyer");
    this.envoyerEl.title = "Envoyer";
    (0, import_fragment4.setIcon)(app, this.envoyerEl, "arrow-up");
    this.pied = new PiedSupprimer(app, onSupprimer);
    this.dom.appendChild(this.pied.el);
    this.widget = new Widget(this.dom, tete, () => trait.getBoundingClientRect());
    this.dom.addEventListener("keydown", (e) => e.stopPropagation());
  }
  // ── L'état, vu de l'extérieur ─────────────────────────────────────────
  estOuverte() {
    return this._loaded;
  }
  /**
   * La conversation, sans la réponse qu'on attend encore : c'est ce que
   * l'historique de la marge garde et rouvre.
   */
  conversation() {
    return [...this.filEl.children].filter((el) => !el.classList.contains("is-pending")).map((el) => ({
      auteur: el.classList.contains("mod-moi") ? "moi" : "agent",
      texte: el.textContent ?? ""
    }));
  }
  /**
   * Rouvre une conversation gardée dans la marge, SANS la barre : la bulle se
   * pose à droite du trait (`reference`), comme la carte d'un outil, et sort
   * de l'icône cliquée (`depuis`). On relit une discussion, on n'en lance pas
   * une autre : les outils de la barre n'ont rien à y faire.
   */
  rouvrir(contexte, messages, reference, depuis, cadre) {
    this.fermer();
    this.seule = { reference, depuis };
    this.widget.reprendre(cadre);
    this.ouvrir(contexte);
    this.filEl.replaceChildren();
    for (const m of messages) this.ajouterMessage(m.auteur, m.texte);
    this.pied.montrer(true);
  }
  /** Ouverte seule, depuis la marge : sa croix ferme tout, il n'y a pas de barre. */
  estSeule() {
    return this._loaded && this.seule !== null;
  }
  /** La zone suivie : lue par le calque pour ancrer et surligner. */
  zone() {
    return this.contexte;
  }
  // ── Ouvrir, suivre, fermer ────────────────────────────────────────────
  /**
   * Ouvre la bulle sur une zone, ou la déplace sur une nouvelle si elle est
   * déjà ouverte. Le champ prend le focus : on vient de cliquer sur la tête
   * de chat, c'est pour poser une question.
   */
  ouvrir(contexte) {
    this.contexte = contexte;
    this.extraitEl.textContent = contexte.texte.replace(/\s+/g, " ").trim();
    this.extraitEl.title = contexte.texte;
    if (!this._loaded) {
      this.ouverture++;
      this.dom.style.opacity = "0";
      this.parentEl.appendChild(this.dom);
      this.load();
      const ouverture = this.ouverture;
      void this.placer().then(() => {
        if (!this._loaded || this.ouverture !== ouverture) return;
        this.eclosion = eclore(this.seule?.depuis ?? this.alignEl, this.dom);
      });
    } else {
      void this.placer();
    }
    this.champEl.focus({ preventScroll: true });
  }
  /**
   * Le texte a été édité : la zone a de nouvelles bornes, et peut-être un
   * nouveau contenu (une frappe DANS le passage). La question suivante doit
   * partir avec le texte qu'on voit surligné, pas avec celui d'avant.
   */
  deplacerZone(from, to, texte) {
    if (!this.contexte) return;
    this.contexte = { ...this.contexte, from, to, texte };
    this.extraitEl.textContent = texte.replace(/\s+/g, " ").trim();
    this.extraitEl.title = texte;
  }
  fermer() {
    this.unload();
  }
  onload() {
    this.register(autoUpdate(this.seule?.reference ?? this.reference, this.dom, () => this.placer()));
  }
  onunload() {
    const messages = this.conversation();
    const contexte = this.contexte;
    const cadre = this.widget.cadre;
    this.widget.oublier();
    this.eclosion?.annuler();
    this.eclosion = null;
    this.dom.style.opacity = "";
    this.dom.remove();
    this.filEl.replaceChildren();
    this.champEl.value = "";
    this.champEl.style.height = "";
    this.contexte = null;
    this.pied.montrer(false);
    this.enAttente = false;
    this.seule = null;
    this.envoyerEl.disabled = false;
    this.onFermer(messages, contexte, cadre);
  }
  /**
   * Recalcule la position. Public : le calque l'appelle quand la zone bouge
   * sans qu'aucun scroll ni redimensionnement ne le signale (frappe au-dessus,
   * split redimensionné).
   */
  placer() {
    if (!this._loaded) return Promise.resolve();
    if (this.widget.cadre) {
      this.widget.poser();
      return Promise.resolve();
    }
    const seule = this.seule;
    return computePosition2(seule?.reference ?? this.reference, this.dom, {
      placement: "right-start",
      strategy: "absolute",
      middleware: [
        // À 8 px du BORD de la barre, et descendue jusqu'au haut de la
        // tête de chat : ancrer sur le bouton lui-même collerait la
        // bulle au padding de la barre. Seule, elle se tient à 12 px du
        // trait, sur son haut, comme la carte d'un outil.
        offset2(() => seule ? { mainAxis: 12, crossAxis: 0 } : { mainAxis: 8, crossAxis: this.alignEl.offsetTop }),
        flip2({ padding: 8, fallbackPlacements: ["left-start"] }),
        shift2({ padding: 8 }),
        eviter(this.evitement),
        hide2()
      ]
    }).then(({ x, y, middlewareData }) => {
      if (!this._loaded) return;
      this.dom.style.left = `${x}px`;
      this.dom.style.top = `${y}px`;
      this.dom.style.visibility = middlewareData.hide?.referenceHidden ? "hidden" : "visible";
    });
  }
  // ── La conversation ───────────────────────────────────────────────────
  async envoyer() {
    const question = this.champEl.value.trim();
    const contexte = this.contexte;
    if (!question || !contexte || this.enAttente) return;
    this.ajouterMessage("moi", question);
    this.champEl.value = "";
    this.ajusterChamp();
    const ouverture = this.ouverture;
    const estCourante = () => this._loaded && this.ouverture === ouverture;
    this.enAttente = true;
    this.envoyerEl.disabled = true;
    const reponseEl = this.ajouterMessage("agent", "\u2026");
    reponseEl.classList.add("is-pending");
    try {
      const reponse = await repondre(question, contexte);
      if (!estCourante()) return;
      reponseEl.textContent = reponse;
    } catch (err) {
      if (!estCourante()) return;
      reponseEl.textContent = `L'agent n'a pas pu r\xE9pondre : ${err instanceof Error ? err.message : String(err)}`;
      reponseEl.classList.add("is-error");
    } finally {
      if (estCourante()) {
        reponseEl.classList.remove("is-pending");
        this.enAttente = false;
        this.envoyerEl.disabled = false;
      }
    }
    if (!estCourante()) return;
    this.filEl.scrollTop = this.filEl.scrollHeight;
  }
  ajouterMessage(auteur, texte) {
    const el = this.filEl.appendChild(document.createElement("div"));
    el.classList.add("agent-message", `mod-${auteur}`);
    el.textContent = texte;
    this.filEl.scrollTop = this.filEl.scrollHeight;
    return el;
  }
  /** Le champ grandit avec le texte, jusqu'au plafond fixé en CSS. */
  ajusterChamp() {
    this.champEl.style.height = "auto";
    const bordure = this.champEl.offsetHeight - this.champEl.clientHeight;
    this.champEl.style.height = `${this.champEl.scrollHeight + bordure}px`;
  }
};

// src/traces.ts
var import_fragment5 = require("fragment");
var TAILLE = 24;
var ECART2 = 6;
var RETRAIT = 0;
var prochainId = 1;
var CarnetTraces = class {
  traces = [];
  icones = /* @__PURE__ */ new Map();
  /**
   * La trace dont la carte ou le chat est ouvert : son icône s'efface le temps
   * de la lecture, mais garde sa place, pour que ses voisines ne glissent pas.
   */
  ouverte = null;
  app;
  editor;
  overlays;
  chemin;
  onOuvrir;
  /** Ce que les icônes ne recouvrent jamais (la barre d'annotation), en coordonnées client. */
  obstacles;
  constructor(app, editor, overlays, chemin, onOuvrir, obstacles) {
    this.app = app;
    this.editor = editor;
    this.overlays = overlays;
    this.chemin = chemin;
    this.onOuvrir = onOuvrir;
    this.obstacles = obstacles;
  }
  /**
   * Ce qu'on vient de fermer. Si c'est une trace rouverte, elle reprend sa
   * place (avec la conversation, peut-être allongée) ; sinon, une trace neuve.
   */
  fermer(zone, trait, contenu, cadre) {
    const rouverte = this.traces.find((t) => t.id === this.ouverte);
    this.ouverte = null;
    if (rouverte) {
      rouverte.contenu = contenu;
      rouverte.cadre = cadre;
      this.placer();
      return;
    }
    this.traces.push({ id: prochainId++, zone, trait, decalageTrait: trait.pos - zone.from, contenu, cadre });
    this.placer();
  }
  /** Une carte ou un chat rouvert depuis une icône a été fermé sans rien à garder. */
  oublierOuverte() {
    this.ouverte = null;
    this.placer();
  }
  /**
   * Supprime la trace dont la réponse est ouverte (la poubelle de la carte ou
   * du chat) et la rend, pour que le calque efface son trait. null s'il n'y
   * en a pas.
   */
  supprimerOuverte() {
    const i = this.traces.findIndex((t) => t.id === this.ouverte);
    this.ouverte = null;
    if (i < 0) return null;
    const [trace] = this.traces.splice(i, 1);
    this.retirer(trace.id);
    this.placer();
    return trace;
  }
  /** Le trait de la trace, recalé sur son passage (le texte a pu bouger). */
  traitDe(trace) {
    return { ...trace.trait, pos: trace.zone.from + trace.decalageTrait };
  }
  /** Le passage suit le texte, et disparaît avec lui. */
  remapper(mapPos) {
    const chemin = this.chemin();
    for (let i = this.traces.length - 1; i >= 0; i--) {
      const t = this.traces[i];
      if (t.zone.chemin !== chemin) continue;
      const from = mapPos(t.zone.from, 1).pos;
      const to = mapPos(t.zone.to, -1).pos;
      if (to <= from) {
        this.retirer(t.id);
        this.traces.splice(i, 1);
        continue;
      }
      t.zone = { ...t.zone, from, to, texte: texteEntre(this.editor, from, to) };
    }
  }
  /** Pose les icônes du document affiché, et retire les autres. */
  placer() {
    const chemin = this.chemin();
    const bande = this.overlays.gutterBand("left");
    const visibles = this.traces.filter((t) => t.zone.chemin === chemin);
    for (const id of [...this.icones.keys()]) {
      if (!visibles.some((t) => t.id === id)) this.retirer(id);
    }
    const colonnes = [];
    const places = visibles.map((t) => ({ t, ligne: this.editor.coordsForRange(t.zone.from, t.zone.from + 1)[0] ?? null })).sort((a, b) => (a.ligne?.top ?? 0) - (b.ligne?.top ?? 0));
    for (const { t, ligne } of places) {
      const el = this.icone(t);
      el.classList.toggle("is-ouverte", t.id === this.ouverte);
      if (!ligne) continue;
      const top = (ligne.top + ligne.bottom) / 2 - TAILLE / 2;
      let col = 0;
      while ((colonnes[col] ?? []).some((y) => Math.abs(y - top) < TAILLE + 2)) col++;
      (colonnes[col] ??= []).push(top);
      if (!bande) {
        el.style.display = "none";
        continue;
      }
      el.style.left = `${bande.left + bande.width - RETRAIT - TAILLE - col * (TAILLE + ECART2)}px`;
      el.style.top = `${top}px`;
      el.style.display = posVisibility(this.editor, t.zone.from) === "hidden" ? "none" : "";
      if (el.style.display === "") this.contourner(el, bande);
    }
  }
  /**
   * L'icône tombe sur la barre d'annotation : elle passe de l'autre côté,
   * vers l'extérieur d'abord, vers le texte s'il n'y a pas la place, et se
   * masque si la marge n'a de place nulle part. Les décalages client et
   * document sont les mêmes : on corrige `left` du dépassement mesuré.
   */
  contourner(el, bande) {
    const r = el.getBoundingClientRect();
    const gene = this.obstacles().find((o) => r.left < o.right && r.right > o.left && r.top < o.bottom && r.bottom > o.top);
    if (!gene) return;
    const left = parseFloat(el.style.left);
    const dehors = left - (r.right - gene.left) - ECART2;
    const dedans2 = left + (gene.right - r.left) + ECART2;
    if (dehors >= bande.left) el.style.left = `${dehors}px`;
    else if (dedans2 + TAILLE <= bande.left + bande.width - RETRAIT) el.style.left = `${dedans2}px`;
    else el.style.display = "none";
  }
  detruire() {
    for (const id of [...this.icones.keys()]) this.retirer(id);
  }
  icone(t) {
    const deja = this.icones.get(t.id);
    if (deja) return deja.el;
    const el = document.createElement("button");
    el.type = "button";
    el.classList.add("agent-trace");
    const libelle = t.contenu.type === "outil" ? OUTILS[t.contenu.outil].libelle : "Conversation";
    const extrait = t.zone.texte.replace(/\s+/g, " ").trim();
    el.setAttribute("aria-label", `${libelle} : ${extrait}`);
    el.title = `${libelle} : \xAB ${extrait.length > 60 ? `${extrait.slice(0, 60)}\u2026` : extrait} \xBB`;
    (0, import_fragment5.setIcon)(this.app, el, t.contenu.type === "outil" ? OUTILS[t.contenu.outil].icone : "cat");
    el.style.position = "absolute";
    el.style.pointerEvents = "auto";
    el.addEventListener("click", () => {
      this.onOuvrir(t, el);
      this.ouverte = t.id;
      requestAnimationFrame(() => this.placer());
    });
    const off = this.overlays.mount(el, "document");
    this.icones.set(t.id, { el, off });
    return el;
  }
  retirer(id) {
    this.icones.get(id)?.off();
    this.icones.delete(id);
  }
};
function texteEntre(editor, from, to) {
  const debut = editor.offsetToPos(from);
  const fin = editor.offsetToPos(to);
  if (debut.line === fin.line) return editor.getLine(debut.line).slice(debut.ch, fin.ch);
  const lignes = [editor.getLine(debut.line).slice(debut.ch)];
  for (let n = debut.line + 1; n < fin.line; n++) lignes.push(editor.getLine(n));
  lignes.push(editor.getLine(fin.line).slice(0, fin.ch));
  return lignes.join("\n");
}

// src/zoneDuTrait.ts
var COTE_MIN_CERCLE = 20;
var HAUTEUR_MAX_SOULIGNE = 14;
var PAS = 4;
function formeDuTrait(points, outil) {
  if (points.length < 2) return null;
  const b = boite(points);
  const largeur = b.maxX - b.minX;
  const hauteur = b.maxY - b.minY;
  const ecart = Math.hypot(points[0].x - points[points.length - 1].x, points[0].y - points[points.length - 1].y);
  const ferme = ecart <= Math.max(24, Math.max(largeur, hauteur) / 3);
  if (ferme && largeur >= COTE_MIN_CERCLE && hauteur >= COTE_MIN_CERCLE) return "entoure";
  if (outil === "surligneur") return "surligne";
  if (hauteur <= HAUTEUR_MAX_SOULIGNE && largeur > hauteur * 2) return "souligne";
  return null;
}
function plageDuTrait(points, outil, mesure) {
  const forme = formeDuTrait(points, outil);
  if (!forme) return null;
  const plage = forme === "entoure" ? plageEntouree(points, mesure) : plageLeLong(points, forme, mesure);
  return plage ? rogner(plage, mesure) : null;
}
function plageEntouree(points, mesure) {
  const b = boite(points);
  const bornes = [];
  for (let y = b.minY; y <= b.maxY + PAS; y += PAS) {
    const yb = Math.min(y, b.maxY);
    for (const x of [b.minX, b.maxX]) {
      const off = mesure.posAt(x, yb);
      if (off !== null) bornes.push(off);
    }
  }
  if (bornes.length === 0) return null;
  const debut = Math.min(...bornes);
  const fin = Math.max(...bornes);
  let from = Infinity;
  let to = -Infinity;
  for (let off = debut; off <= fin; off++) {
    const r = mesure.coordsAt(off);
    if (!r || r.right <= r.left) continue;
    const centre = { x: (r.left + r.right) / 2, y: (r.top + r.bottom) / 2 };
    if (dansPolygone(centre, points)) {
      from = Math.min(from, off);
      to = Math.max(to, off + 1);
    }
  }
  return from < to ? { from, to } : null;
}
function plageLeLong(points, forme, mesure) {
  let remontee = 0;
  if (forme === "souligne") {
    const p0 = mesure.posAt(points[0].x, points[0].y);
    const r = p0 === null ? null : mesure.coordsAt(p0);
    remontee = r ? (r.bottom - r.top) / 2 + 2 : 10;
  }
  let from = Infinity;
  let to = -Infinity;
  for (const p of echantillonner(points)) {
    const off = mesure.posAt(p.x, p.y - remontee);
    if (off === null) continue;
    from = Math.min(from, off);
    to = Math.max(to, off);
  }
  return from < to ? { from, to } : null;
}
function rogner(plage, mesure) {
  let { from, to } = plage;
  while (from < to && /\s/.test(mesure.charAt(from))) from++;
  while (to > from && /\s/.test(mesure.charAt(to - 1))) to--;
  return from < to ? { from, to } : null;
}
function echantillonner(points) {
  const out = [points[0]];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / PAS));
    for (let k = 1; k <= n; k++) out.push({ x: a.x + (b.x - a.x) * k / n, y: a.y + (b.y - a.y) * k / n });
  }
  return out;
}
function boite(points) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of points) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  return { minX, minY, maxX, maxY };
}
function dansPolygone(p, poly) {
  let dedans2 = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i];
    const b = poly[j];
    if (a.y > p.y !== b.y > p.y && p.x < (b.x - a.x) * (p.y - a.y) / (b.y - a.y) + a.x) {
      dedans2 = !dedans2;
    }
  }
  return dedans2;
}

// src/agentLayer.ts
function createAgentLayer(ctx) {
  const surface = ctx.editor;
  if (!surface || !hasText(surface)) return () => {
  };
  const editor = surface;
  const paneEl = ctx.view.contentEl;
  paneEl.classList.add("agent-pane");
  const chemin = () => ctx.view.file?.path ?? "";
  let zone = null;
  const origine = () => {
    const base = editor.scrollEl.getBoundingClientRect();
    return { dx: base.left - editor.scrollEl.scrollLeft, dy: base.top - editor.scrollEl.scrollTop };
  };
  const rectsClient = () => {
    if (!zone) return [];
    const { dx, dy } = origine();
    return editor.coordsForRange(zone.from, zone.to).map(
      (r) => new DOMRect(r.left + dx, r.top + dy, r.right - r.left, r.bottom - r.top)
    );
  };
  let trait = null;
  const reference = {
    // Floating UI surveille le scroll des ancêtres de cet élément.
    contextElement: editor.contentEl,
    getBoundingClientRect: () => {
      const loin = new DOMRect(-1e5, -1e5, 0, 0);
      if (!trait || rectsClient().length === 0) return loin;
      const glyphe = editor.coordsAtPos(trait.pos);
      if (!glyphe) return loin;
      const { dx, dy } = origine();
      const m = trait.width / 2;
      const xs = trait.points.map((p) => glyphe.left + p.dx + dx);
      const ys = trait.points.map((p) => glyphe.top + p.dy + dy);
      const left = Math.min(...xs) - m;
      const top = Math.min(...ys) - m;
      return new DOMRect(left, top, Math.max(...xs) + m - left, Math.max(...ys) + m - top);
    }
  };
  const mesure = {
    posAt: (x, y) => {
      const { dx, dy } = origine();
      return editor.posAtCoords(x + dx, y + dy);
    },
    coordsAt: (off) => {
      const rects = editor.coordsForRange(off, off + 1);
      return rects.length === 1 ? rects[0] : null;
    },
    charAt: (off) => texteEntre(editor, off, off + 1)
  };
  const boite2 = (el) => {
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  };
  const barresAnnotation = () => [...paneEl.querySelectorAll(".toolbar")].map(boite2);
  const passage = () => {
    if (!zone) return [];
    const r = reference.getBoundingClientRect();
    return [{ x: r.x, y: r.y, width: r.width, height: r.height }];
  };
  const limites = () => {
    const r = paneEl.getBoundingClientRect();
    return { x: r.x + 8, y: r.y + 8, width: r.width - 16, height: r.height - 16 };
  };
  const barre = new BarreAgent(ctx.app, paneEl, reference, {
    onChat: () => {
      if (zone) bulle.ouvrir(zone);
      majOccupe();
    },
    // La croix de la barre ferme tout : le chat, accroché à la barre,
    // n'aurait plus rien à côté de quoi se tenir.
    onFermer: () => {
      zone = null;
      bulle.fermer();
      editor.requestUpdate();
    },
    // Un outil : le chat se ferme, la barre fond dans le rond de l'outil.
    onOutil: (outil) => {
      if (!zone) return;
      const depuis = barre.dom.getBoundingClientRect();
      bulle.fermer();
      barre.cacher();
      action.lancer(outil, zone, depuis);
      majOccupe();
    }
  }, {
    obstacles: () => [...barresAnnotation(), ...passage()],
    limites
  });
  const bulle = new BulleAgent(ctx.app, paneEl, barre.dom, barre.chatEl, (messages, contexte, cadre) => {
    if (!suppression && contexte && trait && messages.length > 0) carnet.fermer(contexte, trait, { type: "chat", messages }, cadre);
    else carnet.oublierOuverte();
    if (!barre.estOuverte()) {
      zone = null;
      editor.requestUpdate();
    }
    majOccupe();
  }, {
    obstacles: () => [...barresAnnotation(), ...barre.estOuverte() ? [boite2(barre.dom)] : [], ...passage()],
    limites
  }, () => supprimer(), reference);
  const action = new ActionAgent(ctx.app, paneEl, reference, () => {
    const resultat = action.resultat();
    if (!suppression && resultat && zone && trait) carnet.fermer(zone, trait, { type: "outil", ...resultat }, action.cadre());
    else carnet.oublierOuverte();
    zone = null;
    majOccupe();
    editor.requestUpdate();
  }, {
    obstacles: () => [...barresAnnotation(), ...passage()],
    limites
  }, () => supprimer());
  const rouvrir = (t, depuis) => {
    action.fermer();
    barre.fermer();
    bulle.fermer();
    zone = { ...t.zone };
    trait = carnet.traitDe(t);
    if (t.contenu.type === "outil") {
      action.montrer(t.contenu.outil, t.contenu.texte, depuis, t.cadre);
    } else {
      bulle.rouvrir(zone, t.contenu.messages, reference, depuis, t.cadre);
    }
    majOccupe();
    editor.requestUpdate();
  };
  let suppression = false;
  const supprimer = () => {
    const t = carnet.supprimerOuverte();
    if (!t) return;
    suppression = true;
    try {
      bulle.fermer();
      action.fermer();
      barre.fermer();
    } finally {
      suppression = false;
    }
    zone = null;
    annotation?.source.erase(t.zone.chemin, t.trait.id);
    majOccupe();
    editor.requestUpdate();
  };
  const carnet = new CarnetTraces(
    ctx.app,
    editor,
    ctx.overlays,
    chemin,
    rouvrir,
    () => [...paneEl.querySelectorAll(".toolbar")].map((el) => el.getBoundingClientRect())
  );
  const surScroll = () => carnet.placer();
  editor.scrollEl.addEventListener("scroll", surScroll, { passive: true });
  const occupe = () => bulle.estOuverte() || action.estOuverte();
  const majOccupe = () => {
    paneEl.classList.toggle("agent-occupe", occupe());
  };
  const bloquer = (e) => {
    if (!occupe() || !(e.target instanceof Element) || !e.target.closest(".annotation-surface")) return;
    e.preventDefault();
    e.stopPropagation();
  };
  paneEl.addEventListener("pointerdown", bloquer, true);
  const surTrait = (path, stroke) => {
    if (path !== chemin()) return;
    if (occupe()) return;
    const glyphe = editor.coordsAtPos(stroke.pos);
    if (!glyphe) return;
    const points = stroke.points.map((p) => ({ x: glyphe.left + p.dx, y: glyphe.top + p.dy }));
    const plage = plageDuTrait(points, stroke.tool, mesure);
    if (!plage) return;
    zone = { texte: texteEntre(editor, plage.from, plage.to), chemin: path, ...plage };
    trait = stroke;
    barre.montrer();
    editor.requestUpdate();
  };
  const annotation = ctx.app.plugins.plugins.get("annotation");
  const vus = /* @__PURE__ */ new Set();
  const connaitre = () => {
    for (const s of annotation?.source.strokes(chemin()) ?? []) vus.add(s.id);
  };
  connaitre();
  const refTrait = annotation?.source.on("change", (path) => {
    if (path !== chemin()) return;
    const neuf = annotation.source.strokes(path).filter((s) => !vus.has(s.id)).at(-1);
    connaitre();
    if (neuf) surTrait(path, neuf);
  });
  const replacer = () => {
    barre.placer();
    void bulle.placer();
    void action.placer();
    carnet.placer();
  };
  const offChange = editor.onChange((c) => {
    if (c.docChanged) carnet.remapper(c.mapPos);
    if (c.docChanged && zone) {
      const from = c.mapPos(zone.from, 1).pos;
      const to = c.mapPos(zone.to, -1).pos;
      zone = { ...zone, from, to, texte: texteEntre(editor, from, to) };
      bulle.deplacerZone(from, to, zone.texte);
    }
    if (c.docChanged || c.viewportChanged) replacer();
  });
  const offSurlignage = editor.addLayer({
    above: false,
    markers: (e) => {
      if (!zone || !hasText(e)) return [];
      return e.coordsForRange(zone.from, zone.to).map((r) => new MarqueZone(r));
    }
  });
  const offGeometrie = ctx.overlays.onGeometryChange(replacer);
  const observateur = new MutationObserver((mutations) => {
    const touche = (n) => n instanceof Element && (n.matches(".toolbar") || n.closest(".toolbar") !== null || n.querySelector(".toolbar") !== null);
    const concerne = mutations.some((m) => m.type === "childList" ? [...m.addedNodes, ...m.removedNodes].some(touche) : touche(m.target));
    if (concerne) replacer();
  });
  observateur.observe(paneEl, { subtree: true, childList: true, attributes: true, attributeFilter: ["style", "class"] });
  const refFichier = ctx.app.workspace.on("file-open", () => {
    connaitre();
    if (zone && zone.chemin !== chemin()) {
      barre.fermer();
      bulle.fermer();
      action.fermer();
    }
    carnet.placer();
  });
  return () => {
    paneEl.removeEventListener("pointerdown", bloquer, true);
    paneEl.classList.remove("agent-occupe");
    paneEl.classList.remove("agent-pane");
    observateur.disconnect();
    refFichier.off();
    offGeometrie();
    offSurlignage();
    offChange();
    refTrait?.off();
    barre.fermer();
    bulle.fermer();
    action.fermer();
    editor.scrollEl.removeEventListener("scroll", surScroll);
    carnet.detruire();
  };
}
var MarqueZone = class _MarqueZone {
  r;
  constructor(r) {
    this.r = r;
  }
  eq(other) {
    return other instanceof _MarqueZone && Math.round(other.r.left) === Math.round(this.r.left) && Math.round(other.r.top) === Math.round(this.r.top) && Math.round(other.r.right) === Math.round(this.r.right) && Math.round(other.r.bottom) === Math.round(this.r.bottom);
  }
  draw() {
    const el = document.createElement("div");
    el.classList.add("agent-zone");
    el.style.left = `${this.r.left}px`;
    el.style.top = `${this.r.top}px`;
    el.style.width = `${this.r.right - this.r.left}px`;
    el.style.height = `${this.r.bottom - this.r.top}px`;
    return el;
  }
};

// src/main.ts
var AgentPlugin = class extends import_fragment6.Plugin {
  onload() {
    this.registerLayer({
      id: "agent",
      name: "Agent",
      icon: "message-circle",
      // Activé d'office, contrairement au dessin : il ne s'arme sur rien,
      // il attend un trait d'annotation.
      defaultEnabled: true,
      // Même garde que doc-widget et annotation : pas dans une feuille flottante.
      appliesTo: (view) => view.leaf.parent !== null,
      create: (ctx) => createAgentLayer(ctx)
    });
  }
};
