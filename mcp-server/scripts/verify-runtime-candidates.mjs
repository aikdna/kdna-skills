#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const EXPECTED_GRAPH = {
  "node_modules/@aikdna/kdna-core": {
    "version": "0.24.0-rc.component-semantics.2",
    "license": "Apache-2.0",
    "dependencies": {
      "ajv": "8.20.0",
      "ajv-formats": "3.0.1",
      "cbor-x": "1.6.5",
      "@noble/hashes": "1.8.0",
      "pako": "2.1.0"
    },
    "engines": {
      "node": ">=20"
    },
    "resolved": "file:vendor/aikdna-kdna-core-0.24.0-rc.component-semantics.2.tgz",
    "integrity": "sha512-GQZj2AcVaRdbWzvQ74QfSz5wfKtIG9ygUz6hx/p5b0+GtYIyRMdt8mg7JZTL7y62i7cgl7y/3faPgZLu8R4M7w=="
  },
  "node_modules/@aikdna/kdna-read": {
    "version": "0.3.0-rc.component-semantics.2",
    "license": "Apache-2.0",
    "dependencies": {
      "ajv": "8.20.0"
    },
    "peerDependencies": {
      "@aikdna/kdna-core": "0.24.0-rc.component-semantics.2"
    },
    "engines": {
      "node": ">=20"
    },
    "resolved": "file:vendor/aikdna-kdna-read-0.3.0-rc.component-semantics.2.tgz",
    "integrity": "sha512-gz6JSH8i0fve0+nt7RdAeby2UDNtkWgEAUpb+Fi1kvCEv0O7Aw4eMiRAbR5EHLyj+7Mjn9mLjthpugqTbTRbLQ=="
  },
  "node_modules/@noble/hashes": {
    "version": "1.8.0",
    "resolved": "file:vendor/noble-hashes-1.8.0.tgz",
    "integrity": "sha512-l5yqfa+G4+TEnAyx8QvX6ar/GmBKTFtXyH7sD1acBDvsHlvpUqYmrNifc9nUHBqno2xTGKtlm780Ey4g+JD8AQ==",
    "license": "MIT",
    "engines": {
      "node": "^14.21.3 || >=16"
    },
    "funding": {
      "url": "https://paulmillr.com/funding/"
    }
  },
  "node_modules/ajv": {
    "version": "8.20.0",
    "resolved": "file:vendor/ajv-8.20.0.tgz",
    "integrity": "sha512-PoeA4s5LLuxnvLBb33FOgHIrmP293WOD7XlCveSJ4jYq9KKtSrEPYq6MJ3IVl1/SGjtENLTCCRWSuKMV1ZjnjQ==",
    "license": "MIT",
    "dependencies": {
      "fast-deep-equal": "^3.1.3",
      "fast-uri": "^3.0.1",
      "json-schema-traverse": "^1.0.0",
      "require-from-string": "^2.0.2"
    },
    "funding": {
      "type": "github",
      "url": "https://github.com/sponsors/epoberezkin"
    }
  },
  "node_modules/ajv-formats": {
    "version": "3.0.1",
    "resolved": "file:vendor/ajv-formats-3.0.1.tgz",
    "integrity": "sha512-6ntjgU/EpYnv9mclziLrY13Ihi9F6ub/lqdjW+sXUeNwQE+uAlv+YI+MDmP7ML4dZdEQC93/5iyA1GZ3F0vsQg==",
    "license": "MIT",
    "dependencies": {
      "ajv": "^8.0.0"
    },
    "peerDependencies": {
      "ajv": "^8.0.0"
    },
    "peerDependenciesMeta": {
      "ajv": {
        "optional": true
      }
    }
  },
  "node_modules/cbor-x": {
    "version": "1.6.5",
    "resolved": "file:vendor/cbor-x-1.6.5.tgz",
    "integrity": "sha512-wbTmofexrQJf8xrss5pez0r5rSeuM8bEenYnudE6FPspJugREVxqhy+huaP7RGxBn+ise/OjpnJ2E5JOaApGXQ==",
    "license": "MIT",
    "optionalDependencies": {
      "cbor-extract": "^2.2.2"
    }
  },
  "node_modules/fast-deep-equal": {
    "version": "3.1.3",
    "resolved": "file:vendor/fast-deep-equal-3.1.3.tgz",
    "integrity": "sha512-8516vKgodeREfw8mJcZL8D2xburm/BZZB7C80NkCaaGuI040/iqxGnr+KcZAofMFtTP3ubZgHKaTqY66L2Q9ZQ==",
    "license": "MIT"
  },
  "node_modules/fast-uri": {
    "version": "3.1.7",
    "resolved": "file:vendor/fast-uri-3.1.7.tgz",
    "integrity": "sha512-aMDEVX6P8vorK2rM048F+QQCdtOTofaUyCFWTTCkhMJL8UdXuG2FsNAGqymKRqlsvZyxJrbG9gLaeHeBPBFjVg==",
    "funding": [
      {
        "type": "github",
        "url": "https://github.com/sponsors/fastify"
      },
      {
        "type": "opencollective",
        "url": "https://opencollective.com/fastify"
      }
    ],
    "license": "BSD-3-Clause"
  },
  "node_modules/json-schema-traverse": {
    "version": "1.0.0",
    "resolved": "file:vendor/json-schema-traverse-1.0.0.tgz",
    "integrity": "sha512-IakiG9hGRIsxzoMxZE9RXqc7LILkD9yfL2k6ann/bp6tPFiYOmF2/BlRFhUxUQar77FA+K5NuBv9MNFpPOcy8A==",
    "license": "MIT"
  },
  "node_modules/pako": {
    "version": "2.1.0",
    "resolved": "file:vendor/pako-2.1.0.tgz",
    "integrity": "sha512-w+eufiZ1WuJYgPXbV/PO3NCMEc3xqylkKHzp8bxp1uW4qaSNQUkwmLLEc3kKsfz8lpV1F8Ht3U1Cm+9Srog2ug==",
    "license": "(MIT AND Zlib)",
    "dependencies": {}
  },
  "node_modules/require-from-string": {
    "version": "2.0.2",
    "resolved": "file:vendor/require-from-string-2.0.2.tgz",
    "integrity": "sha512-IeaUNSnLwmvGQX/Du6dRZ0Tl3G0OPi436st7XA/5BvMhNITGt/Mu0y1ymDsq4a3ljZsnveADsOGiqp0ehYZIsw==",
    "license": "MIT",
    "engines": {
      "node": ">=0.10.0"
    },
    "dependencies": {}
  },
  "node_modules/@cbor-extract/cbor-extract-darwin-arm64": {
    "version": "2.2.2",
    "resolved": "https://registry.npmjs.org/@cbor-extract/cbor-extract-darwin-arm64/-/cbor-extract-darwin-arm64-2.2.2.tgz",
    "integrity": "sha512-ZKZ/F8US7JR92J4DMct6cLW/Y66o2K576+zjlEN/MevH70bFIsB10wkZEQPLzl2oNh2SMGy55xpJ9JoBRl5DOA==",
    "cpu": [
      "arm64"
    ],
    "license": "MIT",
    "optional": true,
    "os": [
      "darwin"
    ]
  },
  "node_modules/@cbor-extract/cbor-extract-darwin-x64": {
    "version": "2.2.2",
    "resolved": "https://registry.npmjs.org/@cbor-extract/cbor-extract-darwin-x64/-/cbor-extract-darwin-x64-2.2.2.tgz",
    "integrity": "sha512-32b1mgc+P61Js+KW9VZv/c+xRw5EfmOcPx990JbCBSkYJFY0l25VinvyyWfl+3KjibQmAcYwmyzKF9J4DyKP/Q==",
    "cpu": [
      "x64"
    ],
    "license": "MIT",
    "optional": true,
    "os": [
      "darwin"
    ]
  },
  "node_modules/@cbor-extract/cbor-extract-linux-arm": {
    "version": "2.2.2",
    "resolved": "https://registry.npmjs.org/@cbor-extract/cbor-extract-linux-arm/-/cbor-extract-linux-arm-2.2.2.tgz",
    "integrity": "sha512-tNg0za41TpQfkhWjptD+0gSD2fggMiDCSacuIeELyb2xZhr7PrhPe5h66Jc67B/5dmpIhI2QOUtv4SBsricyYQ==",
    "cpu": [
      "arm"
    ],
    "license": "MIT",
    "optional": true,
    "os": [
      "linux"
    ]
  },
  "node_modules/@cbor-extract/cbor-extract-linux-arm64": {
    "version": "2.2.2",
    "resolved": "https://registry.npmjs.org/@cbor-extract/cbor-extract-linux-arm64/-/cbor-extract-linux-arm64-2.2.2.tgz",
    "integrity": "sha512-wfqgzqCAy/Vn8i6WVIh7qZd0DdBFaWBjPdB6ma+Wihcjv0gHqD/mw3ouVv7kbbUNrab6dKEx/w3xQZEdeXIlzg==",
    "cpu": [
      "arm64"
    ],
    "license": "MIT",
    "optional": true,
    "os": [
      "linux"
    ]
  },
  "node_modules/@cbor-extract/cbor-extract-linux-x64": {
    "version": "2.2.2",
    "resolved": "https://registry.npmjs.org/@cbor-extract/cbor-extract-linux-x64/-/cbor-extract-linux-x64-2.2.2.tgz",
    "integrity": "sha512-rpiLnVEsqtPJ+mXTdx1rfz4RtUGYIUg2rUAZgd1KjiC1SehYUSkJN7Yh+aVfSjvCGtVP0/bfkQkXpPXKbmSUaA==",
    "cpu": [
      "x64"
    ],
    "license": "MIT",
    "optional": true,
    "os": [
      "linux"
    ]
  },
  "node_modules/@cbor-extract/cbor-extract-win32-x64": {
    "version": "2.2.2",
    "resolved": "https://registry.npmjs.org/@cbor-extract/cbor-extract-win32-x64/-/cbor-extract-win32-x64-2.2.2.tgz",
    "integrity": "sha512-dI+9P7cfWxkTQ+oE+7Aa6onEn92PHgfWXZivjNheCRmTBDBf2fx6RyTi0cmgpYLnD1KLZK9ZYrMxaPZ4oiXhGA==",
    "cpu": [
      "x64"
    ],
    "license": "MIT",
    "optional": true,
    "os": [
      "win32"
    ]
  },
  "node_modules/cbor-extract": {
    "version": "2.2.2",
    "resolved": "https://registry.npmjs.org/cbor-extract/-/cbor-extract-2.2.2.tgz",
    "integrity": "sha512-hlSxxI9XO2yQfe9g6msd3g4xCfDqK5T5P0fRMLuaLHhxn4ViPrm+a+MUfhrvH2W962RGxcBwEGzLQyjbDG1gng==",
    "hasInstallScript": true,
    "license": "MIT",
    "optional": true,
    "dependencies": {
      "node-gyp-build-optional-packages": "5.1.1"
    },
    "bin": {
      "download-cbor-prebuilds": "bin/download-prebuilds.js"
    },
    "optionalDependencies": {
      "@cbor-extract/cbor-extract-darwin-arm64": "2.2.2",
      "@cbor-extract/cbor-extract-darwin-x64": "2.2.2",
      "@cbor-extract/cbor-extract-linux-arm": "2.2.2",
      "@cbor-extract/cbor-extract-linux-arm64": "2.2.2",
      "@cbor-extract/cbor-extract-linux-x64": "2.2.2",
      "@cbor-extract/cbor-extract-win32-x64": "2.2.2"
    }
  },
  "node_modules/detect-libc": {
    "version": "2.1.2",
    "resolved": "https://registry.npmjs.org/detect-libc/-/detect-libc-2.1.2.tgz",
    "integrity": "sha512-Btj2BOOO83o3WyH59e8MgXsxEQVcarkUOpEYrubB0urwnN10yQ364rsiByU11nZlqWYZm05i/of7io4mzihBtQ==",
    "license": "Apache-2.0",
    "optional": true,
    "engines": {
      "node": ">=8"
    }
  },
  "node_modules/node-gyp-build-optional-packages": {
    "version": "5.1.1",
    "resolved": "https://registry.npmjs.org/node-gyp-build-optional-packages/-/node-gyp-build-optional-packages-5.1.1.tgz",
    "integrity": "sha512-+P72GAjVAbTxjjwUmwjVrqrdZROD4nf8KgpBoDxqXXTiYZZt/ud60dE5yvCSr9lRO8e8yv6kgJIC0K0PfZFVQw==",
    "license": "MIT",
    "optional": true,
    "dependencies": {
      "detect-libc": "^2.0.1"
    },
    "bin": {
      "node-gyp-build-optional-packages": "bin.js",
      "node-gyp-build-optional-packages-optional": "optional.js",
      "node-gyp-build-optional-packages-test": "build-test.js"
    }
  },
  "node_modules/@aikdna/kdna-cli": {
    "version": "0.38.0-rc.component-semantics.1",
    "license": "Apache-2.0",
    "dependencies": {
      "@aikdna/kdna-core": "0.24.0-rc.component-semantics.2",
      "@aikdna/kdna-read": "0.3.0-rc.component-semantics.2"
    },
    "bin": {
      "kdna": "src/cli.js"
    },
    "engines": {
      "node": ">=22"
    },
    "resolved": "file:vendor/aikdna-kdna-cli-0.38.0-rc.component-semantics.1.tgz",
    "integrity": "sha512-dkiscjGAvaw3QkgRCdsex+sHYrERBv+Gx+W/NjgyCqpMXMaRBnn+47qnK9YtOhunUhkq9Q7YqIYFykB4wWX8PQ=="
  }
};
export const ARTIFACTS = [
  {
    "name": "@aikdna/kdna-core",
    "version": "0.24.0-rc.component-semantics.2",
    "sha256": "a9cb3f08735b00657e4848766f0ac517abdcb256121a841f01e662525a0858ea",
    "integrity": "sha512-GQZj2AcVaRdbWzvQ74QfSz5wfKtIG9ygUz6hx/p5b0+GtYIyRMdt8mg7JZTL7y62i7cgl7y/3faPgZLu8R4M7w==",
    "file": "vendor/aikdna-kdna-core-0.24.0-rc.component-semantics.2.tgz"
  },
  {
    "name": "@aikdna/kdna-read",
    "version": "0.3.0-rc.component-semantics.2",
    "sha256": "43d0f12a1a63a88d26570bfff821919a5cd478fdbd0568bd9c819bc56078b0f0",
    "integrity": "sha512-gz6JSH8i0fve0+nt7RdAeby2UDNtkWgEAUpb+Fi1kvCEv0O7Aw4eMiRAbR5EHLyj+7Mjn9mLjthpugqTbTRbLQ==",
    "file": "vendor/aikdna-kdna-read-0.3.0-rc.component-semantics.2.tgz"
  },
  {
    "name": "ajv",
    "version": "8.20.0",
    "sha256": "fae4b66af86b883f888c03dee309592a69c863c843c4a5c3e8ae849249a0df99",
    "integrity": "sha512-PoeA4s5LLuxnvLBb33FOgHIrmP293WOD7XlCveSJ4jYq9KKtSrEPYq6MJ3IVl1/SGjtENLTCCRWSuKMV1ZjnjQ==",
    "file": "vendor/ajv-8.20.0.tgz"
  },
  {
    "name": "ajv-formats",
    "version": "3.0.1",
    "sha256": "a249bc89a9ba8b948774b9d34d01585d4fa5b702afff4f9f6c52d51f8019893d",
    "integrity": "sha512-6ntjgU/EpYnv9mclziLrY13Ihi9F6ub/lqdjW+sXUeNwQE+uAlv+YI+MDmP7ML4dZdEQC93/5iyA1GZ3F0vsQg==",
    "file": "vendor/ajv-formats-3.0.1.tgz"
  },
  {
    "name": "cbor-x",
    "version": "1.6.5",
    "sha256": "219be6b1732913143a86ccd79a44a9ea78dd2f34450845ce2109c979b918beeb",
    "integrity": "sha512-wbTmofexrQJf8xrss5pez0r5rSeuM8bEenYnudE6FPspJugREVxqhy+huaP7RGxBn+ise/OjpnJ2E5JOaApGXQ==",
    "file": "vendor/cbor-x-1.6.5.tgz"
  },
  {
    "name": "fast-deep-equal",
    "version": "3.1.3",
    "sha256": "6d4c2b9c0b3dd6e58e0c5a4d73709e06b3aa2fbf313fedcc0a2f49ee6eb5bf79",
    "integrity": "sha512-8516vKgodeREfw8mJcZL8D2xburm/BZZB7C80NkCaaGuI040/iqxGnr+KcZAofMFtTP3ubZgHKaTqY66L2Q9ZQ==",
    "file": "vendor/fast-deep-equal-3.1.3.tgz"
  },
  {
    "name": "fast-uri",
    "version": "3.1.7",
    "sha256": "75d114fa009a342a4f964e099012cfc9660cab130d8df367184e01f0d0198777",
    "integrity": "sha512-aMDEVX6P8vorK2rM048F+QQCdtOTofaUyCFWTTCkhMJL8UdXuG2FsNAGqymKRqlsvZyxJrbG9gLaeHeBPBFjVg==",
    "file": "vendor/fast-uri-3.1.7.tgz"
  },
  {
    "name": "json-schema-traverse",
    "version": "1.0.0",
    "sha256": "57be57126b2f47e0361a83cb54d812624ce6ed8bc939984c359cdeddaa5e029b",
    "integrity": "sha512-IakiG9hGRIsxzoMxZE9RXqc7LILkD9yfL2k6ann/bp6tPFiYOmF2/BlRFhUxUQar77FA+K5NuBv9MNFpPOcy8A==",
    "file": "vendor/json-schema-traverse-1.0.0.tgz"
  },
  {
    "name": "@noble/hashes",
    "version": "1.8.0",
    "sha256": "2f8ce985a97936715bab16a7b3025bd73cc317831ec4d7ccaa4d136a6b04bfb5",
    "integrity": "sha512-l5yqfa+G4+TEnAyx8QvX6ar/GmBKTFtXyH7sD1acBDvsHlvpUqYmrNifc9nUHBqno2xTGKtlm780Ey4g+JD8AQ==",
    "file": "vendor/noble-hashes-1.8.0.tgz"
  },
  {
    "name": "pako",
    "version": "2.1.0",
    "sha256": "49fedc8866b4abfc8e71dc7fe75ad4ef1ff1ac9601b0642cff88ee5bf2338709",
    "integrity": "sha512-w+eufiZ1WuJYgPXbV/PO3NCMEc3xqylkKHzp8bxp1uW4qaSNQUkwmLLEc3kKsfz8lpV1F8Ht3U1Cm+9Srog2ug==",
    "file": "vendor/pako-2.1.0.tgz"
  },
  {
    "name": "require-from-string",
    "version": "2.0.2",
    "sha256": "daf9e97bbcd592f3af8ae259359536d1b9d81a697253f22fe2aeb8fcbe1c33ba",
    "integrity": "sha512-IeaUNSnLwmvGQX/Du6dRZ0Tl3G0OPi436st7XA/5BvMhNITGt/Mu0y1ymDsq4a3ljZsnveADsOGiqp0ehYZIsw==",
    "file": "vendor/require-from-string-2.0.2.tgz"
  },
  {
    "name": "@aikdna/kdna-cli",
    "version": "0.38.0-rc.component-semantics.1",
    "sha256": "3e2fbdbc7dcaf07b6a8dbc17b8df7f365e4837c61d391d8d6416d951abcac3be",
    "integrity": "sha512-dkiscjGAvaw3QkgRCdsex+sHYrERBv+Gx+W/NjgyCqpMXMaRBnn+47qnK9YtOhunUhkq9Q7YqIYFykB4wWX8PQ==",
    "file": "vendor/aikdna-kdna-cli-0.38.0-rc.component-semantics.1.tgz"
  }
];
export const PACKED_FILES = ["LICENSE", "NOTICE", "README.md", "bin/kdna-mcp.mjs", "bin/operator-binding.mjs", "bin/read-session.mjs", "package.json", "vendor/aikdna-kdna-cli-0.38.0-rc.component-semantics.1.tgz", "vendor/aikdna-kdna-core-0.24.0-rc.component-semantics.2.tgz", "vendor/aikdna-kdna-read-0.3.0-rc.component-semantics.2.tgz", "vendor/ajv-8.20.0.tgz", "vendor/ajv-formats-3.0.1.tgz", "vendor/cbor-x-1.6.5.tgz", "vendor/fast-deep-equal-3.1.3.tgz", "vendor/fast-uri-3.1.7.tgz", "vendor/json-schema-traverse-1.0.0.tgz", "vendor/noble-hashes-1.8.0.tgz", "vendor/pako-2.1.0.tgz", "vendor/require-from-string-2.0.2.tgz"];
const read = (root, name) => JSON.parse(fs.readFileSync(path.join(root, name), "utf8"));
export function validateSourceFacts({ packageJson, lock, root }) {
  assert.equal(packageJson.name, "@aikdna/kdna-mcp-server");
  assert.equal(packageJson.version, "0.7.0-rc.component-semantics.1");
  assert.equal(packageJson.private, true, "candidate must remain private");
  const dependencies = Object.fromEntries(ARTIFACTS.map(item => [item.name, "file:" + item.file]));
  assert.deepEqual(packageJson.dependencies, dependencies);
  assert.deepEqual(packageJson.kdna_runtime, { cli: "0.38.0-rc.component-semantics.1", core: "0.24.0-rc.component-semantics.2", read: "0.3.0-rc.component-semantics.2", read_contract: "kdna.read/0.2.0" });
  assert.deepEqual(packageJson.overrides, { "fast-uri": "$fast-uri" });
  assert.equal(lock.name, packageJson.name); assert.equal(lock.version, packageJson.version);
  assert.equal(lock.lockfileVersion, 3); assert.deepEqual(lock.packages[""].dependencies, dependencies);
  assert.deepEqual(Object.fromEntries(Object.entries(lock.packages).filter(([name]) => name)), EXPECTED_GRAPH, "the entire accepted dependency graph must stay exact");
  for (const item of ARTIFACTS) {
    const bytes = fs.readFileSync(path.join(root, item.file));
    assert.equal(crypto.createHash("sha256").update(bytes).digest("hex"), item.sha256);
    assert.equal("sha512-" + crypto.createHash("sha512").update(bytes).digest("base64"), item.integrity);
    const tar = spawnSync("tar", ["-xOzf", path.join(root, item.file), "package/package.json"], { encoding: "utf8", shell: false });
    assert.equal(tar.status, 0, tar.stderr); const manifest = JSON.parse(tar.stdout);
    assert.equal(manifest.name, item.name); assert.equal(manifest.version, item.version);
  }
  return { fixedArtifacts: ARTIFACTS.length, runtime: packageJson.kdna_runtime };
}
export function verifySource(root = ROOT) {
  return validateSourceFacts({packageJson: read(root, "package.json"), lock: read(root, "package-lock.json"), root});
}
export function validateCandidateFacts({ packageJson, lock, installed, packedFiles, root }) {
  validateSourceFacts({packageJson, lock, root});
  const required = Object.entries(EXPECTED_GRAPH).filter(([, value]) => !value.optional);
  assert.equal(required.length, 12); assert.deepEqual(Object.keys(installed).sort(), required.map(([name]) => name).sort());
  for (const [name, value] of required) { assert.equal(installed[name].version, value.version); assert.equal(installed[name].name, name.slice("node_modules/".length)); }
  assert.deepEqual(packedFiles.map(item => typeof item === "string" ? item : item.path).sort(), PACKED_FILES);
  return { fixedArtifacts: 12, lockedRequiredPackages: 12, installedRequiredPackages: 12, optionalOmitted: 9, packedFileCount: 19, status: "LOCAL_RC_ONLY_UNPUBLISHED" };
}
export function verifyRuntime(root = ROOT) {
  const installed = {};
  for (const [name, value] of Object.entries(EXPECTED_GRAPH)) {
    if (value.optional) { assert.equal(fs.existsSync(path.join(root, name)), false, "optional native graph must remain omitted"); continue; }
    installed[name] = read(root, name + "/package.json");
  }
  const packed = spawnSync("npm", ["pack", "--dry-run", "--json", "--ignore-scripts"], { cwd: root, env: process.env, encoding: "utf8", shell: false });
  assert.equal(packed.status, 0, packed.stderr);
  const result = validateCandidateFacts({ packageJson: read(root, "package.json"), lock: read(root, "package-lock.json"), installed, packedFiles: JSON.parse(packed.stdout)[0].files, root });
  const cliBinding = read(root, "node_modules/@aikdna/kdna-cli/public-contract-binding.json");
  assert.equal(cliBinding.semantic_source_sha256, "862cea95bdb3a634356ad729b95e0882cb0b75fdb80f103a11f4037783899110");
  assert.equal(cliBinding.generated_contract_sha256, "ec8a2616a768f5523e8852487e757f6f9560d1933ea3a9ee90ead69fe1120f4d");
  assert.equal(cliBinding.tuple.read, "kdna.read/0.2.0");
  assert.equal(cliBinding.component_semantics_digest, "sha256:3087cd19542e72322aec19b3015c916d2cfb074fa42e3fd76b3756bb4f097de3");
  return result;
}
// Entry guard. Both sides are compared through realpath so an invocation through
// a symlinked or aliased directory still RUNS the verification (and can never
// exit 0 silently, which is the failure mode this guard exists to prevent). An
// import is not the entry point and must not run it; an entry path that realpath
// cannot resolve refuses to run instead of reporting success.
function entryGuardOutcome() {
  if (!process.argv[1]) return "import";
  const selfPath = fileURLToPath(import.meta.url);
  let invoked = null;
  let self = null;
  try {
    invoked = fs.realpathSync(process.argv[1]);
  } catch {
    invoked = null;
  }
  try {
    self = fs.realpathSync(selfPath);
  } catch {
    self = null;
  }
  if (invoked && self && invoked === self) return "entry";
  if (path.resolve(process.argv[1]) === path.resolve(selfPath)) return "unresolved-entry";
  return "import";
}
const entryGuard = entryGuardOutcome();
if (entryGuard === "unresolved-entry") {
  console.error(
    "KDNA_MCP_RUNTIME_CANDIDATES_ENTRY_GUARD_FAILED: refusing to run under an unresolved entry path",
  );
  process.exit(2);
}
if (entryGuard === "entry") {
  const args = process.argv.slice(2);
  assert.ok(args.length === 0 || (args.length === 1 && args[0] === "--source-only"), "only --source-only is supported");
  console.log(JSON.stringify(args.length ? verifySource() : verifyRuntime()));
}
