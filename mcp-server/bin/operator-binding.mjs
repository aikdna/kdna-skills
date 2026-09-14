import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";

export class AdapterError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}
const invalid = () => new AdapterError("MCP_BINDING_INVALID", "The operator-selected local file is unavailable or changed.");
const sameFile = (a, b) => a.isFile() && b.isFile() && a.dev === b.dev && a.ino === b.ino && a.size === b.size && a.mtimeMs === b.mtimeMs && a.ctimeMs === b.ctimeMs;

// Only the local operator/trusted launcher supplies argv, never MCP input.
export function bindOperatorInput(argv) {
  let selected, allowed = false;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--asset" && selected === undefined && typeof argv[i + 1] === "string") selected = argv[++i];
    else if (argv[i] === "--allow-read" && !allowed) allowed = true;
    else throw new AdapterError("MCP_ARGUMENT_INVALID", "Use --asset /absolute/selected.kdna --allow-read, or start without a binding.");
  }
  if (allowed && selected === undefined) throw new AdapterError("MCP_ARGUMENT_INVALID", "An operator-selected file is required.");
  let directory = null, identity = null, closed = false;
  const binding = {
    state: "unbound", file: null, name: null, digest: null,
    assertReadable() {
      if (closed) throw new AdapterError("MCP_BINDING_CANCELLED", "This process binding is closed. The operator must start a new process to select again.");
      if (!this.file) throw new AdapterError("MCP_BINDING_REQUIRED", "The local operator must select one file and permit local read before starting this process.");
    },
    close() {
      closed = true; this.state = "cancelled"; this.file = null;
      if (directory !== null) {
        const current = fs.lstatSync(directory);
        if (!current.isDirectory() || current.isSymbolicLink() || current.dev !== identity.dev || current.ino !== identity.ino) throw new AdapterError("MCP_CLEANUP_FAILED", "The private binding directory changed.");
        fs.rmSync(directory, { recursive: true }); directory = null;
      }
    },
  };
  if (!allowed) return binding;
  if (!path.isAbsolute(selected) || path.resolve(selected) !== selected || path.extname(selected) !== ".kdna" || selected.length > 4096) throw invalid();
  let descriptor;
  try {
    const before = fs.lstatSync(selected);
    if (!before.isFile() || before.isSymbolicLink() || before.size > 64 * 1024 * 1024 || fs.realpathSync(selected) !== selected) throw invalid();
    descriptor = fs.openSync(selected, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW);
    const opened = fs.fstatSync(descriptor);
    if (!sameFile(before, opened)) throw invalid();
    const bytes = Buffer.alloc(opened.size);
    let count = 0;
    while (count < bytes.length) {
      const read = fs.readSync(descriptor, bytes, count, bytes.length - count, null);
      if (read === 0) throw invalid();
      count += read;
    }
    if (fs.readSync(descriptor, Buffer.alloc(1), 0, 1, null) !== 0 || !sameFile(opened, fs.fstatSync(descriptor))) throw invalid();
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "kdna-mcp-read-"));
    fs.chmodSync(directory, 0o700); identity = fs.lstatSync(directory);
    const copy = path.join(directory, "selected.kdna");
    fs.writeFileSync(copy, bytes, { flag: "wx", mode: 0o600 });
    binding.file = copy; binding.name = path.basename(selected);
    binding.digest = "sha256:" + createHash("sha256").update(bytes).digest("hex");
    binding.state = "bound";
    return binding;
  } catch (error) {
    if (directory !== null) binding.close();
    if (error instanceof AdapterError) throw error;
    throw invalid();
  } finally { if (descriptor !== undefined) fs.closeSync(descriptor); }
}
