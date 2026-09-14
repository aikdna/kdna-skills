#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import {spawnSync} from "node:child_process";
import {fileURLToPath, pathToFileURL} from "node:url";
import assert from "node:assert/strict";
import {ARTIFACTS, EXPECTED_GRAPH, PACKED_FILES, verifySource} from "./verify-runtime-candidates.mjs";

const source = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const digest = (bytes, algorithm, encoding = "hex") => crypto.createHash(algorithm).update(bytes).digest(encoding);

// Build an explicit offline npm graph: package-relative file dependencies alone
// cannot be resolved before npm has extracted the MCP archive.
export function createLocalConsumer(destination, root = source) {
  verifySource(root);
  const output = path.resolve(destination);
  assert.ok(!fs.existsSync(output), "consumer destination must not exist");
  const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json")));
  fs.mkdirSync(output, {mode: 0o700});
  const vendor = path.join(output, "vendor");
  fs.mkdirSync(vendor);
  for (const artifact of ARTIFACTS) fs.copyFileSync(path.join(root, artifact.file), path.join(output, artifact.file), fs.constants.COPYFILE_EXCL);
  const packed = spawnSync("npm", ["pack", "--dry-run=false", "--offline", "--ignore-scripts", "--json", "--pack-destination", vendor], {cwd: root, encoding: "utf8", shell: false, timeout: 60000});
  assert.equal(packed.status, 0, packed.stderr);
  const [report] = JSON.parse(packed.stdout);
  assert.deepEqual(report.files.map(f=>f.path).sort(), PACKED_FILES);
  assert.equal(report.name, pkg.name); assert.equal(report.version, pkg.version);
  const archive = fs.readFileSync(path.join(vendor, report.filename));
  const integrity = "sha512-" + digest(archive,"sha512","base64");
  assert.equal(report.integrity, integrity);
  const dependencies = {[pkg.name]: "file:vendor/" + report.filename, ...pkg.dependencies};
  const manifest = {name:"kdna-mcp-local-consumer",version:"1.0.0",private:true,engines:pkg.engines,dependencies,
    overrides:Object.fromEntries(ARTIFACTS.map(a=>[a.name,"$"+a.name]))};
  const lock = {name:manifest.name,version:manifest.version,lockfileVersion:3,requires:true,packages:{
    "":{name:manifest.name,version:manifest.version,dependencies,engines:manifest.engines},
    ...EXPECTED_GRAPH,
    ["node_modules/"+pkg.name]:{version:pkg.version,resolved:dependencies[pkg.name],integrity,dependencies:pkg.dependencies,bin:pkg.bin,engines:pkg.engines,license:pkg.license}
  }};
  for (const [name,value] of [["package.json",manifest],["package-lock.json",lock]]) fs.writeFileSync(path.join(output,name),JSON.stringify(value,null,2)+"\n",{flag:"wx"});
  const archives = [...ARTIFACTS.map(a=>({file:a.file,sha256:a.sha256})),{file:"vendor/"+report.filename,sha256:digest(archive,"sha256")}];
  fs.writeFileSync(path.join(output,"archives.json"),JSON.stringify(archives,null,2)+"\n",{flag:"wx"});
  return {package:pkg.name,version:pkg.version,archives:archives.length,requiredPackages:ARTIFACTS.length+1,output};
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  assert.equal(process.argv.length,3,"usage: node scripts/create-local-consumer.mjs NEW_DIRECTORY");
  console.log(JSON.stringify(createLocalConsumer(process.argv[2])));
}
