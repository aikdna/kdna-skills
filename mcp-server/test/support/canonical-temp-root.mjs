import fs from "node:fs";
import os from "node:os";
import path from "node:path";

/**
 * Create an isolated temporary directory whose path is already canonical.
 *
 * The operator binding intentionally requires the selected file to be strictly
 * canonical: `path.isAbsolute(selected)`, `path.resolve(selected) === selected`
 * and `fs.realpathSync(selected) === selected`, on top of the lstat/ino and
 * O_NOFOLLOW identity checks. That constraint is a security property and is not
 * weakened here.
 *
 * On macOS `os.tmpdir()` returns a `/var/folders/...` path whose real path is
 * `/private/var/folders/...`, so a fixture root taken verbatim from
 * `fs.mkdtempSync(os.tmpdir(), ...)` is already non-canonical before any test
 * logic runs and the binding correctly rejects the fixture. Canonicalizing the
 * fixture root once here keeps every derived path canonical on every platform.
 */
export function makeCanonicalTempRoot(prefix) {
  return fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), prefix)));
}
