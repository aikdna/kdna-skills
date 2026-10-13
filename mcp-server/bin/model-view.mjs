import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

// The installed Read package owns the projection function; this adapter calls
// the same official entry the CLI uses and never reshapes fields itself. The
// capability is detected at runtime, so an installation without it keeps the
// previous default instead of receiving an invented surface.
export function loadModelView() {
  try {
    const module = require("@aikdna/kdna-read");
    return typeof module.projectModelView === "function" &&
      typeof module.MODEL_VIEW_CONTRACT === "string"
      ? module
      : null;
  } catch {
    return null;
  }
}

export function projectBody(modelView, value) {
  // A channel that is not a read envelope, a rejection and a no-body control
  // pass through the projection unchanged; the official function decides.
  return modelView.projectModelView(value, {
    view: "body",
    ...(typeof value?.envelope?.mode === "string" && value.envelope.mode
      ? { mode: value.envelope.mode }
      : {}),
  });
}
