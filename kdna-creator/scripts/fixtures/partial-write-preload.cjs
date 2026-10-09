'use strict';
// Operator test fixture: force one real prefix write to the exclusive
// destination descriptor, then fail the write the way a full disk would.
//
// The target and marker paths arrive through the environment, so this file
// contains no generated code: nothing is interpolated into source text here,
// and the values it reads can only select which path is intercepted.
const fs = require('node:fs');

const target = process.env.KDNA_PARTIAL_WRITE_TARGET;
const marker = process.env.KDNA_PARTIAL_WRITE_MARKER;
if (typeof target !== 'string' || target === '' || typeof marker !== 'string' || marker === '') {
  throw new Error('KDNA_PARTIAL_WRITE_TARGET and KDNA_PARTIAL_WRITE_MARKER are required');
}

const open = fs.openSync;
const write = fs.writeSync;
let targetFD = null;

fs.openSync = function (file, ...args) {
  const fd = open.call(fs, file, ...args);
  if (file === target) targetFD = fd;
  return fd;
};

fs.writeSync = function (fd, buffer, offset, length, position) {
  if (fd === targetFD) {
    targetFD = null;
    write.call(fs, fd, buffer, offset, Math.min(length, 17), position);
    fs.writeFileSync(marker, 'actual partial write observed', { flag: 'wx' });
    throw Object.assign(new Error('controlled partial write failure'), { code: 'ENOSPC' });
  }
  return write.call(fs, fd, buffer, offset, length, position);
};
