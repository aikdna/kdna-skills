import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { AdapterError } from "./operator-binding.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const packageInfo = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const versions = { cli: "0.38.0-rc.component-semantics.1", core: "0.24.0-rc.component-semantics.2", read: "0.3.0-rc.component-semantics.2" };
function localPackage(name) {
  const roots = [path.join(root, "node_modules")];
  if (path.basename(path.dirname(root)) === "@aikdna" && path.basename(path.dirname(path.dirname(root))) === "node_modules") roots.push(path.dirname(path.dirname(root)));
  for (const base of roots) {
    const directory = path.join(base, "@aikdna", "kdna-" + name);
    if (!fs.existsSync(path.join(directory, "package.json"))) continue;
    if (fs.realpathSync(directory) !== directory) break;
    const value = JSON.parse(fs.readFileSync(path.join(directory, "package.json"), "utf8"));
    if (value.name !== "@aikdna/kdna-" + name || value.version !== versions[name]) break;
    return { directory, value };
  }
  throw new AdapterError("MCP_RUNTIME_INVALID", "The fixed local CLI/Core/Read installation is unavailable.");
}
const cli = localPackage("cli"); localPackage("core"); localPackage("read");
const cliEntry = path.resolve(cli.directory, cli.value.bin?.kdna || "");
export const publicBinding = JSON.parse(fs.readFileSync(path.join(cli.directory, "public-contract-binding.json"), "utf8"));
if (packageInfo.kdna_runtime?.cli !== versions.cli || packageInfo.kdna_runtime?.core !== versions.core || packageInfo.kdna_runtime?.read !== versions.read || publicBinding.semantic_source_sha256 !== "862cea95bdb3a634356ad729b95e0882cb0b75fdb80f103a11f4037783899110" || publicBinding.generated_contract_sha256 !== "ec8a2616a768f5523e8852487e757f6f9560d1933ea3a9ee90ead69fe1120f4d" || publicBinding.tuple?.read !== "kdna.read/0.2.0" || publicBinding.component_semantics_digest !== "sha256:3087cd19542e72322aec19b3015c916d2cfb074fa42e3fd76b3756bb4f097de3" || publicBinding.accepted_core?.tar_sha256 !== "a9cb3f08735b00657e4848766f0ac517abdcb256121a841f01e662525a0858ea" || publicBinding.accepted_read?.tar_sha256 !== "43d0f12a1a63a88d26570bfff821919a5cd478fdbd0568bd9c819bc56078b0f0" || packageInfo.kdna_runtime?.read_contract !== "kdna.read/0.2.0" || !cliEntry.startsWith(cli.directory + path.sep) || !fs.statSync(cliEntry).isFile()) throw new AdapterError("MCP_RUNTIME_INVALID", "The fixed runtime contract binding is invalid.");
const childEnv = Object.fromEntries(["HOME", "TMPDIR", "XDG_CACHE_HOME", "PATH", "LANG", "LC_ALL", "NODE_DISABLE_COMPILE_CACHE"].filter(key => process.env[key] !== undefined).map(key => [key, process.env[key]]));
const unavailable = () => new AdapterError("MCP_CLI_UNAVAILABLE", "The official local CLI session did not complete. Start a new operator-bound process.");
const cancelled = () => new AdapterError("MCP_READ_CANCELLED", "Local read presentation was cancelled; this process binding is closed.");

export class ReadSession {
  constructor(binding) { this.binding = binding; this.child = null; this.pending = null; this.closing = null; this.stopped = false; }
  start() {
    this.binding.assertReadable();
    if (this.stopped) throw unavailable();
    if (this.child) return;
    const child = spawn(process.execPath, [cliEntry, "read", this.binding.file, "--session", "--allow-read"], { env: childEnv, stdio: ["pipe", "pipe", "pipe"], shell: false });
    this.child = child; this.buffer = Buffer.alloc(0); this.stderrBytes = 0;
    this.exited = new Promise(resolve => child.once("close", (code, signal) => { this.stopped = true; this.rejectPending(unavailable()); resolve({ code, signal }); }));
    child.on("error", () => { this.rejectPending(unavailable()); void this.close(false); });
    child.stdin.on("error", () => { this.rejectPending(unavailable()); void this.close(false); });
    child.stderr.on("data", chunk => { this.stderrBytes += chunk.length; if (this.stderrBytes > 65536) { this.rejectPending(unavailable()); void this.close(false); } });
    child.stdout.on("data", chunk => {
      this.buffer = Buffer.concat([this.buffer, chunk]);
      if (this.buffer.length > 8 * 1024 * 1024) { this.rejectPending(unavailable()); void this.close(false); return; }
      let newline;
      while ((newline = this.buffer.indexOf(10)) !== -1) {
        const bytes = this.buffer.subarray(0, newline); this.buffer = this.buffer.subarray(newline + 1);
        const pending = this.pending;
        if (!pending) { void this.close(false); return; }
        this.pending = null; clearTimeout(pending.timer);
        try { pending.resolve(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes))); }
        catch { pending.reject(unavailable()); void this.close(false); }
      }
    });
  }
  rejectPending(error) {
    if (!this.pending) return;
    const pending = this.pending; this.pending = null; clearTimeout(pending.timer); pending.reject(error);
  }
  request(value) {
    this.start();
    if (this.pending) throw new AdapterError("MCP_READ_BUSY", "Wait for the current local read or cancel it.");
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.rejectPending(new AdapterError("MCP_READ_TIMEOUT", "The bounded local CLI read timed out.")); void this.close(false); }, 30000);
      this.pending = { resolve, reject, timer };
      this.child.stdin.write(JSON.stringify(value) + "\n", error => { if (error) { this.rejectPending(unavailable()); void this.close(false); } });
    });
  }
  async close(graceful = true) {
    if (this.closing) return this.closing;
    this.stopped = true;
    this.closing = (async () => {
      this.rejectPending(cancelled());
      if (!this.child) return;
      if (graceful) this.child.stdin.end(); else this.child.kill("SIGTERM");
      const timer = setTimeout(() => this.child.kill("SIGKILL"), 1000);
      try { return await this.exited; } finally { clearTimeout(timer); }
    })();
    return this.closing;
  }
}

export function inspectBoundFile(binding, signal) {
  binding.assertReadable();
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [cliEntry, "inspect", binding.file], { env: childEnv, stdio: ["ignore", "pipe", "pipe"], shell: false });
    let output = Buffer.alloc(0), errorBytes = 0, failure, killTimer;
    const stop = error => { failure ??= error; child.kill("SIGTERM"); killTimer ??= setTimeout(() => child.kill("SIGKILL"), 1000); };
    const aborted = () => stop(cancelled());
    signal.addEventListener("abort", aborted, { once: true });
    const timer = setTimeout(() => stop(unavailable()), 30000);
    child.on("error", () => { failure ??= unavailable(); });
    child.stdout.on("data", chunk => { output = Buffer.concat([output, chunk]); if (output.length > 8 * 1024 * 1024) stop(unavailable()); });
    child.stderr.on("data", chunk => { errorBytes += chunk.length; if (errorBytes > 65536) stop(unavailable()); });
    child.once("close", code => {
      clearTimeout(timer); clearTimeout(killTimer); signal.removeEventListener("abort", aborted);
      if (failure) { reject(failure); return; }
      if (code !== 0 && code !== 1) { reject(unavailable()); return; }
      try { resolve(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(output))); } catch { reject(unavailable()); }
    });
    if (signal.aborted) aborted();
  });
}
