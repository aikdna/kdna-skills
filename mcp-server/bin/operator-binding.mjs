import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";

export class AdapterError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}
const invalid = () => new AdapterError("MCP_BINDING_INVALID", "The operator-selected local file is unavailable or changed.");
const invalidPassword = () => new AdapterError("MCP_BINDING_INVALID", "The operator-supplied password source is unavailable or invalid.");
const sameFile = (a, b) => a.isFile() && b.isFile() && a.dev === b.dev && a.ino === b.ino && a.size === b.size && a.mtimeMs === b.mtimeMs && a.ctimeMs === b.ctimeMs;

function stripTrailingNewline(bytes) {
  let end = bytes.length;
  if (end > 0 && bytes[end - 1] === 0x0a) {
    end -= 1;
    if (end > 0 && bytes[end - 1] === 0x0d) end -= 1;
  }
  return bytes.subarray(0, end);
}

function readPasswordFile(passwordPath) {
  if (!path.isAbsolute(passwordPath) || path.resolve(passwordPath) !== passwordPath || passwordPath.length > 4096) throw invalidPassword();
  let fd;
  try {
    const before = fs.lstatSync(passwordPath);
    if (!before.isFile() || before.isSymbolicLink() || before.size === 0 || before.size > 4096 || fs.realpathSync(passwordPath) !== passwordPath) throw invalidPassword();
    fd = fs.openSync(passwordPath, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW);
    const opened = fs.fstatSync(fd);
    if (!sameFile(before, opened)) throw invalidPassword();
    const raw = Buffer.alloc(opened.size);
    let count = 0;
    while (count < raw.length) {
      const n = fs.readSync(fd, raw, count, raw.length - count, null);
      if (n === 0) throw invalidPassword();
      count += n;
    }
    if (fs.readSync(fd, Buffer.alloc(1), 0, 1, null) !== 0 || !sameFile(opened, fs.fstatSync(fd))) throw invalidPassword();
    const trimmed = stripTrailingNewline(raw);
    if (trimmed.length === 0) throw invalidPassword();
    return Buffer.from(trimmed);
  } catch (error) {
    if (error instanceof AdapterError) throw error;
    throw invalidPassword();
  } finally {
    if (fd !== undefined) fs.closeSync(fd);
  }
}

function readPasswordFd(fdNumber) {
  try {
    const chunks = [];
    let total = 0;
    const buf = Buffer.alloc(1024);
    while (true) {
      const n = fs.readSync(fdNumber, buf, 0, buf.length, null);
      if (n === 0) break;
      total += n;
      if (total > 4096) throw invalidPassword();
      chunks.push(Buffer.from(buf.subarray(0, n)));
    }
    const raw = Buffer.concat(chunks, total);
    const trimmed = stripTrailingNewline(raw);
    if (trimmed.length === 0) throw invalidPassword();
    return Buffer.from(trimmed);
  } catch (error) {
    if (error instanceof AdapterError) throw error;
    throw invalidPassword();
  }
}

// Only the local operator/trusted launcher supplies argv, never MCP input.
export function bindOperatorInput(argv) {
  let selected, allowed = false, passwordFile, passwordFd;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--asset" && selected === undefined && typeof argv[i + 1] === "string") selected = argv[++i];
    else if (argv[i] === "--allow-read" && !allowed) allowed = true;
    else if (argv[i] === "--password-file" && passwordFile === undefined && passwordFd === undefined && typeof argv[i + 1] === "string" && argv[i + 1].length > 0) passwordFile = argv[++i];
    else if (argv[i] === "--password-fd" && passwordFd === undefined && passwordFile === undefined && typeof argv[i + 1] === "string" && /^[1-9][0-9]*$/.test(argv[i + 1]) && Number(argv[i + 1]) >= 3 && Number.isSafeInteger(Number(argv[i + 1]))) passwordFd = Number(argv[++i]);
    else throw new AdapterError("MCP_ARGUMENT_INVALID", "Use --asset /absolute/selected.kdna --allow-read [--password-file /absolute/passphrase | --password-fd <fd>=3..], or start without a binding.");
  }
  if (allowed && selected === undefined) throw new AdapterError("MCP_ARGUMENT_INVALID", "An operator-selected file is required.");
  if ((passwordFile !== undefined || passwordFd !== undefined) && (!allowed || selected === undefined)) throw new AdapterError("MCP_ARGUMENT_INVALID", "Password options require --asset /absolute/selected.kdna --allow-read.");
  let directory = null, identity = null, closed = false;
  const binding = {
    state: "unbound", file: null, passwordFile: null, name: null, digest: null,
    assertReadable() {
      if (closed) throw new AdapterError("MCP_BINDING_CANCELLED", "This process binding is closed. The operator must start a new process to select again.");
      if (!this.file) throw new AdapterError("MCP_BINDING_REQUIRED", "The local operator must select one file and permit local read before starting this process.");
    },
    close() {
      closed = true; this.state = "cancelled"; this.file = null;
      if (this.passwordFile !== null) {
        try {
          const stat = fs.lstatSync(this.passwordFile);
          if (stat.isFile() && !stat.isSymbolicLink()) fs.writeFileSync(this.passwordFile, Buffer.alloc(stat.size, 0));
        } catch { /* cleaned up with directory below */ }
        this.passwordFile = null;
      }
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
    const passphraseBytes = passwordFile !== undefined ? readPasswordFile(passwordFile) : passwordFd !== undefined ? readPasswordFd(passwordFd) : null;
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "kdna-mcp-read-"));
    fs.chmodSync(directory, 0o700); identity = fs.lstatSync(directory);
    const copy = path.join(directory, "selected.kdna");
    fs.writeFileSync(copy, bytes, { flag: "wx", mode: 0o600 });
    if (passphraseBytes !== null) {
      const passCopy = path.join(directory, "passphrase");
      fs.writeFileSync(passCopy, passphraseBytes, { flag: "wx", mode: 0o600 });
      passphraseBytes.fill(0);
      binding.passwordFile = passCopy;
    }
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
