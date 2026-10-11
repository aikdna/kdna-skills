import { isDeepStrictEqual } from "node:util";

// This only changes the adapter's representation of already-complete Read
// content. Aliases are outside authored JSON; null without an alias stays null.
const object = value => value !== null && typeof value === "object" && !Array.isArray(value);
const canonicalRoles = new Set(["result", "result_contract", "method_component"]);
const escaped = value => String(value).replaceAll("~", "~0").replaceAll("/", "~1");
const pointer = parts => "/" + parts.map(escaped).join("/");
const prefix = (parent, child) => parent.length <= child.length && parent.every((part, index) => part === child[index]);
const fail = message => { throw new TypeError("Invalid task content aliases: " + message); };

function parts(value) {
  if (typeof value !== "string" || !value.startsWith("/") || /~(?![01])/u.test(value)) fail("invalid JSON pointer");
  return value.slice(1).split("/").map(part => part.replaceAll("~1", "/").replaceAll("~0", "~"));
}
function own(value, key) {
  if ((!object(value) && !Array.isArray(value)) || !Object.hasOwn(value, key)) fail("pointer target is absent");
  if (Array.isArray(value) && (!/^(0|[1-9]\d*)$/u.test(key) || Number(key) >= value.length)) fail("invalid array index");
  return value[key];
}
function get(value, path) {
  for (const key of path) value = own(value, key);
  return value;
}
function put(value, path, replacement) {
  const parent = get(value, path.slice(0, -1));
  own(parent, path.at(-1));
  Object.defineProperty(parent, path.at(-1), { value: replacement, enumerable: true, configurable: true, writable: true });
}

function validRoute(content, alias) {
  const from = alias.fromParts, at = alias.atParts;
  if (from[0] !== "closure" || from.length < 2) fail("source is not a closure node");
  const node = get(content, from.slice(0, 2));
  if (!object(node) || node.id !== alias.node_id || node.role !== alias.role) fail("canonical identity does not match");
  if (from.length === 2) {
    if (!(at.length === 2 && at[0] === "declarations") && !(at.length === 3 && at[0] === "provenance" && at[1] === "declarations")) fail("unsupported node-copy target");
    return;
  }
  if (from.length === 3 && from[2] === "value" && canonicalRoles.has(node.role)) {
    if (at[0] !== "closure" || at[1] === from[1] || at[2] !== "value") fail("unsupported value-copy target");
    const owner = get(content, at.slice(0, 2));
    if (owner.role !== "judgment") fail("value-copy target is not a judgment");
    const allowed = (node.role === "result" && at.length === 4 && at[3] === "result") ||
      (node.role === "result_contract" && at.length === 4 && at[3] === "result_contract") ||
      (node.role === "method_component" && at.length === 6 && at[3] === "method" && at[4] === "components");
    if (!allowed) fail("unsupported author-copy path");
    return;
  }
  if (node.role === "judgment" && from.length === 4 && from[2] === "value" && from[3] === "method" && at.length === 4 && at[0] === "closure" && at[1] === from[1] && at[2] === "method_interpretation" && at[3] === "declaration") return;
  fail("unsupported canonical source");
}

export function compactTaskContent(original) {
  if (!object(original)) throw new TypeError("Task content must be a JSON object.");
  const content = structuredClone(original), content_aliases = [];
  if (!Array.isArray(original.closure)) return { content, content_aliases };
  const closure = original.closure;
  const canonical = closure.map((node, index) => ({ node, index })).filter(({ node }) => object(node) && typeof node.id === "string" && typeof node.role === "string");
  const add = (at, from, node) => {
    // Never alias scalars, authored prose, explicit null, or a partial object.
    const before = get(original, at), source = get(original, from);
    if (!object(before) || !object(source) || !isDeepStrictEqual(before, source)) return;
    content_aliases.push({ at: pointer(at), from: pointer(from), node_id: node.id, role: node.role });
  };
  const nodeCopies = (entries, at) => {
    if (!Array.isArray(entries)) return;
    entries.forEach((entry, index) => {
      const source = canonical.find(({ node }) => isDeepStrictEqual(entry, node));
      if (source) add([...at, index], ["closure", source.index], source.node);
    });
  };
  nodeCopies(original.declarations, ["declarations"]);
  nodeCopies(original.provenance?.declarations, ["provenance", "declarations"]);
  const copyValue = (at, role) => {
    const value = get(original, at);
    const source = canonical.find(({ node }) => node.role === role && object(node.value) && isDeepStrictEqual(value, node.value));
    if (source) add(at, ["closure", source.index, "value"], source.node);
  };
  canonical.forEach(({ node, index }) => {
    if (node.role !== "judgment" || !object(node.value)) return;
    const base = ["closure", index, "value"];
    if (Object.hasOwn(node.value, "result")) copyValue([...base, "result"], "result");
    if (Object.hasOwn(node.value, "result_contract")) copyValue([...base, "result_contract"], "result_contract");
    if (Array.isArray(node.value.method?.components)) node.value.method.components.forEach((_, component) => copyValue([...base, "method", "components", component], "method_component"));
    if (Object.hasOwn(node.value, "method") && object(node.method_interpretation) && Object.hasOwn(node.method_interpretation, "declaration")) add(["closure", index, "method_interpretation", "declaration"], [...base, "method"], node);
  });
  // A source may contain placeholders that are restored first, but must never
  // be inside a removed subtree. These finite routes do not overlap targets.
  const aliases = content_aliases.map(alias => ({ ...alias, atParts: parts(alias.at), fromParts: parts(alias.from) }));
  for (const alias of aliases) {
    validRoute(content, alias);
    if (aliases.some(other => prefix(other.atParts, alias.fromParts))) fail("canonical source would be removed");
    put(content, alias.atParts, null);
  }
  return { content, content_aliases };
}

export function reconstructTaskContent(representation) {
  if (!object(representation) || !object(representation.content) || !Array.isArray(representation.content_aliases)) throw new TypeError("Task representation requires content and content_aliases.");
  const content = structuredClone(representation.content);
  const aliases = representation.content_aliases.map(alias => {
    if (!object(alias) || Object.keys(alias).length !== 4 || !["at", "from", "node_id", "role"].every(key => Object.hasOwn(alias, key)) || typeof alias.node_id !== "string" || typeof alias.role !== "string") fail("invalid alias fields");
    return { ...alias, atParts: parts(alias.at), fromParts: parts(alias.from) };
  });
  for (const alias of aliases) {
    validRoute(content, alias);
    if (get(content, alias.atParts) !== null) fail("target is not a null placeholder");
    if (prefix(alias.fromParts, alias.atParts)) fail("source contains its own target");
    if (aliases.some(other => prefix(other.atParts, alias.fromParts))) fail("canonical source is removed");
    if (aliases.some(other => other !== alias && (prefix(other.atParts, alias.atParts) || prefix(alias.atParts, other.atParts)))) fail("overlapping targets");
  }
  const pending = new Set(aliases);
  while (pending.size) {
    const next = [...pending].find(alias => ![...pending].some(other => other !== alias && prefix(alias.fromParts, other.atParts)));
    if (!next) fail("cyclic alias dependencies");
    const source = get(content, next.fromParts);
    if (!object(source)) fail("source is not a complete object");
    put(content, next.atParts, structuredClone(source));
    pending.delete(next);
  }
  return content;
}
