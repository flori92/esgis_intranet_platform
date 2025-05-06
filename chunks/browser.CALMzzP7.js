import { g as getDefaultExportFromCjs } from "../index.js";
var browser = function() {
  throw new Error(
    "ws does not work in the browser. Browser clients must use the native WebSocket object"
  );
};
const browser$1 = /* @__PURE__ */ getDefaultExportFromCjs(browser);
const browser$2 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: browser$1
}, Symbol.toStringTag, { value: "Module" }));
export {
  browser$2 as b
};
