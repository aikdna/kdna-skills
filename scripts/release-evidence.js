'use strict';

const crypto = require('node:crypto');
const path = require('node:path');
const zlib = require('node:zlib');
const { COMMIT_RE, EXPECTED_PACKAGE_NAME, STABLE_VERSION_RE } = require('./release-policy');

const EVIDENCE_SCHEMA = 'kdna.mcp.release-evidence';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function isCanonicalSha512Integrity(value) {
  if (typeof value !== 'string' || !/^sha512-[A-Za-z0-9+/]{86}==$/.test(value)) return false;
  const encoded = value.slice('sha512-'.length);
  const digest = Buffer.from(encoded, 'base64');
  return digest.length === 64 && digest.toString('base64') === encoded;
}

function parseJsonDocument(text, label) {
  assert(typeof text === 'string' && text.trim().length > 0, `${label} must not be empty`);
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`${label} must be one complete JSON document`);
  }
}

function parseTarNumber(field) {
  if (field[0] & 0x80) {
    const bytes = Buffer.from(field);
    bytes[0] &= 0x7f;
    let value = 0n;
    for (const byte of bytes) value = value * 256n + BigInt(byte);
    assert(value <= BigInt(Number.MAX_SAFE_INTEGER), 'tar entry size exceeds the safe range');
    return Number(value);
  }
  const text = field.toString('ascii').replace(/\0.*$/, '').trim();
  assert(/^[0-7]*$/.test(text), 'tar header contains an invalid numeric field');
  return text === '' ? 0 : Number.parseInt(text, 8);
}

function parsePax(buffer) {
  const values = {};
  let offset = 0;
  while (offset < buffer.length) {
    const space = buffer.indexOf(0x20, offset);
    assert(space > offset, 'invalid PAX record length');
    const lengthText = buffer.subarray(offset, space).toString('ascii');
    assert(/^[1-9]\d*$/.test(lengthText), 'invalid PAX record length');
    const length = Number(lengthText);
    assert(Number.isSafeInteger(length) && offset + length <= buffer.length, 'truncated PAX record');
    const record = buffer.subarray(space + 1, offset + length - 1).toString('utf8');
    assert(buffer[offset + length - 1] === 0x0a, 'PAX record must end with a newline');
    const equals = record.indexOf('=');
    assert(equals > 0, 'invalid PAX record');
    values[record.slice(0, equals)] = record.slice(equals + 1);
    offset += length;
  }
  return values;
}

function packagePathFromTar(name) {
  assert(typeof name === 'string' && name.startsWith('package/'), 'packed entry must be rooted under package/');
  const packagePath = name.slice('package/'.length);
  const segments = packagePath.split('/');
  assert(
    packagePath &&
      !packagePath.startsWith('/') &&
      !/[\\\0-\x1f\x7f]/.test(packagePath) &&
      !segments.some((segment) => segment === '' || segment === '.' || segment === '..'),
    'unsafe packed path',
  );
  return packagePath;
}

function parseTarFiles(tarball) {
  assert(Buffer.isBuffer(tarball) && tarball.length > 0, 'packed tarball is empty');
  let archive;
  try {
    archive = zlib.gunzipSync(tarball);
  } catch {
    throw new Error('packed artifact is not a complete gzip stream');
  }
  const files = [];
  let offset = 0;
  let pax = {};
  let longName = null;
  let sawEnd = false;

  while (offset + 512 <= archive.length) {
    const header = archive.subarray(offset, offset + 512);
    if (header.every((byte) => byte === 0)) {
      const second = archive.subarray(offset + 512, offset + 1024);
      assert(second.length === 512 && second.every((byte) => byte === 0), 'tar archive has an incomplete end marker');
      assert(archive.subarray(offset + 1024).every((byte) => byte === 0), 'tar archive contains data after its end marker');
      sawEnd = true;
      break;
    }
    const storedChecksum = parseTarNumber(header.subarray(148, 156));
    let computedChecksum = 0;
    for (let index = 0; index < header.length; index += 1) {
      computedChecksum += index >= 148 && index < 156 ? 0x20 : header[index];
    }
    assert(storedChecksum === computedChecksum, 'tar header checksum mismatch');

    const size = parseTarNumber(header.subarray(124, 136));
    const type = String.fromCharCode(header[156] || 0x30);
    const name = header.subarray(0, 100).toString('utf8').replace(/\0.*$/, '');
    const prefix = header.subarray(345, 500).toString('utf8').replace(/\0.*$/, '');
    const headerName = prefix ? `${prefix}/${name}` : name;
    const dataStart = offset + 512;
    const dataEnd = dataStart + size;
    const nextOffset = dataStart + Math.ceil(size / 512) * 512;
    assert(dataEnd <= archive.length && nextOffset <= archive.length, 'truncated tar entry');
    const data = archive.subarray(dataStart, dataEnd);

    if (type === 'x') {
      pax = parsePax(data);
    } else if (type === 'L') {
      longName = data.toString('utf8').replace(/\0.*$/, '');
      assert(longName.length > 0, 'GNU long-name record is empty');
    } else {
      const effectiveName = pax.path || longName || headerName;
      let effectiveSize = size;
      if (pax.size !== undefined) {
        assert(/^\d+$/.test(pax.size), 'invalid PAX file size');
        effectiveSize = Number(pax.size);
      }
      assert(Number.isSafeInteger(effectiveSize) && effectiveSize >= 0, 'invalid PAX file size');
      assert(effectiveSize === size, 'PAX file size does not match the tar entry');
      if (type === '0' || type === '\0') {
        files.push({ path: packagePathFromTar(effectiveName), size: effectiveSize });
      } else if (type === '5') {
        assert(size === 0, 'tar directory entry must be empty');
        packagePathFromTar(effectiveName.replace(/\/$/, ''));
      } else {
        throw new Error(`unsupported tar entry type: ${JSON.stringify(type)}`);
      }
      pax = {};
      longName = null;
    }
    offset = nextOffset;
  }

  assert(sawEnd, 'tar archive is missing its two-block end marker');
  assert(Object.keys(pax).length === 0 && longName === null, 'tar metadata record has no target entry');
  files.sort((left, right) => left.path.localeCompare(right.path));
  assert(new Set(files.map((file) => file.path)).size === files.length, 'tar archive contains duplicate file paths');
  assert(files.length > 0, 'tar archive contains no package files');
  return files;
}

function validateFiles(files) {
  assert(Array.isArray(files) && files.length > 0, 'npm pack must report files');
  const normalized = files.map((file) => {
    assert(file && typeof file === 'object', 'npm pack file entry is invalid');
    assert(
      typeof file.path === 'string' &&
        file.path.length > 0 &&
        !path.isAbsolute(file.path) &&
        !/[\\\0-\x1f\x7f]/.test(file.path) &&
        !file.path.split('/').some((part) => part === '' || part === '.' || part === '..'),
      'npm pack reported an unsafe path',
    );
    assert(Number.isSafeInteger(file.size) && file.size >= 0, 'npm pack file size is invalid');
    return { path: file.path, size: file.size };
  });
  normalized.sort((left, right) => left.path.localeCompare(right.path));
  assert(new Set(normalized.map((file) => file.path)).size === normalized.length, 'duplicate pack path');
  return normalized;
}

function validatePackReport({ reportText, tarball, pkg, source }) {
  assert(pkg.name === EXPECTED_PACKAGE_NAME, `package name must be ${EXPECTED_PACKAGE_NAME}`);
  assert(STABLE_VERSION_RE.test(pkg.version), 'package version must be stable canonical SemVer');
  assert(source.ref === `refs/tags/v${pkg.version}`, 'source ref must be the canonical version tag');
  assert(COMMIT_RE.test(source.commit || ''), 'source commit must be full lowercase hex');
  const reports = parseJsonDocument(reportText, 'npm pack output');
  assert(Array.isArray(reports) && reports.length === 1, 'npm pack must report exactly one artifact');
  const report = reports[0];
  assert(report && typeof report === 'object' && !Array.isArray(report), 'npm pack report is invalid');
  assert(report.name === pkg.name && report.version === pkg.version, 'npm pack identity mismatch');
  const expectedFilename = `${pkg.name.slice(1).replace('/', '-')}-${pkg.version}.tgz`;
  assert(
    report.filename === expectedFilename && path.basename(report.filename) === report.filename,
    'npm pack filename mismatch',
  );
  assert(Buffer.isBuffer(tarball) && tarball.length > 0, 'packed tarball is empty');

  const shasum = crypto.createHash('sha1').update(tarball).digest('hex');
  const integrity = `sha512-${crypto.createHash('sha512').update(tarball).digest('base64')}`;
  assert(report.shasum === shasum, 'npm pack shasum does not match the tarball bytes');
  assert(report.integrity === integrity, 'npm pack integrity does not match the tarball bytes');
  assert(report.size === tarball.length, 'npm pack size does not match the tarball bytes');

  const files = parseTarFiles(tarball);
  const reportedFiles = validateFiles(report.files);
  assert(JSON.stringify(reportedFiles) === JSON.stringify(files), 'npm pack file report does not match the tarball');
  const unpackedSize = files.reduce((total, file) => total + file.size, 0);
  assert(report.entryCount === files.length, 'npm pack entry count does not match the tarball');
  assert(report.unpackedSize === unpackedSize, 'npm pack unpacked size does not match the tarball');

  return Object.freeze({
    schema: EVIDENCE_SCHEMA,
    version: '1.0',
    source: { ref: source.ref, commit: source.commit },
    package: { name: pkg.name, version: pkg.version },
    artifact: {
      filename: report.filename,
      integrity,
      shasum,
      packed_size: tarball.length,
      unpacked_size: unpackedSize,
      file_count: files.length,
      files,
    },
  });
}

function validateReleaseEvidence(evidence) {
  assert(evidence && typeof evidence === 'object' && !Array.isArray(evidence), 'release evidence must be an object');
  assert(evidence.schema === EVIDENCE_SCHEMA && evidence.version === '1.0', 'release evidence schema mismatch');
  assert(evidence.package && evidence.package.name === EXPECTED_PACKAGE_NAME, 'release evidence package mismatch');
  assert(STABLE_VERSION_RE.test(evidence.package.version || ''), 'release evidence version is invalid');
  assert(evidence.source && evidence.source.ref === `refs/tags/v${evidence.package.version}`, 'release evidence ref mismatch');
  assert(COMMIT_RE.test(evidence.source.commit || ''), 'release evidence commit is invalid');
  const artifact = evidence.artifact;
  assert(
    artifact?.filename ===
      `${evidence.package.name.slice(1).replace('/', '-')}-${evidence.package.version}.tgz` &&
      path.basename(artifact.filename) === artifact.filename,
    'release evidence filename mismatch',
  );
  assert(artifact && isCanonicalSha512Integrity(artifact.integrity), 'release evidence integrity is invalid');
  assert(/^[0-9a-f]{40}$/.test(artifact.shasum || ''), 'release evidence shasum is invalid');
  assert(Number.isSafeInteger(artifact.packed_size) && artifact.packed_size > 0, 'release evidence packed size is invalid');
  assert(Number.isSafeInteger(artifact.unpacked_size) && artifact.unpacked_size > 0, 'release evidence unpacked size is invalid');
  assert(Number.isSafeInteger(artifact.file_count) && artifact.file_count > 0, 'release evidence file count is invalid');
  const files = validateFiles(artifact.files);
  assert(files.length === artifact.file_count, 'release evidence files mismatch');
  assert(
    files.reduce((total, file) => total + file.size, 0) === artifact.unpacked_size,
    'release evidence unpacked size mismatch',
  );
  return evidence;
}

function validateEvidenceArtifact(rawEvidence, tarball) {
  const evidence = validateReleaseEvidence(rawEvidence);
  assert(Buffer.isBuffer(tarball) && tarball.length > 0, 'verified release artifact is empty');
  const shasum = crypto.createHash('sha1').update(tarball).digest('hex');
  const integrity = `sha512-${crypto.createHash('sha512').update(tarball).digest('base64')}`;
  assert(tarball.length === evidence.artifact.packed_size, 'verified artifact packed size mismatch');
  assert(shasum === evidence.artifact.shasum, 'verified artifact shasum mismatch');
  assert(integrity === evidence.artifact.integrity, 'verified artifact integrity mismatch');
  const files = parseTarFiles(tarball);
  const evidenceFiles = validateFiles(evidence.artifact.files);
  assert(JSON.stringify(files) === JSON.stringify(evidenceFiles), 'verified artifact files mismatch');
  assert(files.length === evidence.artifact.file_count, 'verified artifact file count mismatch');
  assert(files.reduce((total, file) => total + file.size, 0) === evidence.artifact.unpacked_size, 'verified artifact unpacked size mismatch');
  return evidence;
}

module.exports = { parseJsonDocument, parseTarFiles, validatePackReport, validateEvidenceArtifact, validateReleaseEvidence };
