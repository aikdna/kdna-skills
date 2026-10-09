#!/usr/bin/env node
import fs from 'node:fs/promises';
import { constants } from 'node:fs';
import { createHash } from 'node:crypto';

// Author-side inventory only. Core remains the schema and semantic authority.
const limit = 25 * 1024 * 1024;
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const array = value => Array.isArray(value) ? value : [];
const own = (value, key) => record(value) && Object.hasOwn(value, key);
const text = value => typeof value === 'string' && value.trim().length > 0;
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const pick = (value, keys) => Object.fromEntries(keys.filter(key => own(value, key)).map(key => [key, value[key]]));

async function readJson(file) {
  const handle = await fs.open(file, constants.O_RDONLY | constants.O_NONBLOCK);
  try {
    const stat = await handle.stat();
    if (!stat.isFile() || stat.size > limit) throw new Error('INPUT_FILE_UNSUPPORTED');
    const bytes = Buffer.alloc(limit + 1);
    let size = 0;
    while (size <= limit) {
      const { bytesRead } = await handle.read(bytes, size, Math.min(65536, bytes.length - size), null);
      if (!bytesRead) break;
      size += bytesRead;
    }
    if (size > limit) throw new Error('INPUT_FILE_TOO_LARGE');
    const input = bytes.subarray(0, size);
    let value;
    try { value = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(input)); } catch { throw new Error('INPUT_JSON_INVALID'); }
    return { value, sha256: sha(input), bytes: size };
  } finally {
    await handle.close();
  }
}

function at(root, pointer) {
  if (typeof pointer !== 'string' || !pointer.startsWith('/') || /~(?![01])/.test(pointer)) return { present: false };
  let value = root;
  for (const part of pointer.slice(1).split('/').map(s => s.replace(/~1/g, '/').replace(/~0/g, '~'))) {
    if (Array.isArray(value) && (!/^(0|[1-9][0-9]*)$/.test(part) || Number(part) >= value.length)) return { present: false };
    if (value === null || typeof value !== 'object' || !Object.hasOwn(value, part)) return { present: false };
    value = value[part];
  }
  return { present: true, value };
}

function items(values, pointer) {
  return array(values).map((value, index) => ({
    pointer: `${pointer}/${index}`,
    ...pick(value, ['id', 'kind', 'term', 'applies_to', 'subject', 'source_refs', 'target_kind', 'target_ref']),
    authored: value,
  }));
}

function inventory(authored) {
  const p = authored.payload;
  const materials = items(p.materials, '/payload/materials');
  const judgments = items(p.judgments, '/payload/judgments');
  const domain = (pointers, values = []) => ({
    fields: pointers.map(pointer => ({ pointer, ...at(authored, pointer) })),
    items: values,
  });
  return {
    identity_and_purpose: domain(['/manifest/title', '/manifest/summary', '/manifest/description', '/manifest/keywords', '/manifest/asset_id', '/manifest/asset_uid', '/manifest/asset_type', '/manifest/format_version', '/manifest/version', '/manifest/judgment_version', '/payload/profile', '/payload/profile_version', '/payload/asset', '/payload/asset_capability', '/payload/declarations/highest_question', '/payload/kernel/purpose']),
    common_foundations: domain(['/payload/kernel/foundation_refs'], materials.filter(item => ['foundation', 'premise'].includes(item.kind))),
    common_concepts: domain(['/payload/materials'], materials.filter(item => item.kind === 'definition')),
    shared_declarations: domain(['/payload/shared_declarations'], items(p.shared_declarations, '/payload/shared_declarations')),
    questions_and_methods: domain(['/payload/judgments', '/payload/conditions', '/payload/reasons', '/payload/contracts'], [...judgments, ...items(p.conditions, '/payload/conditions'), ...items(p.reasons, '/payload/reasons'), ...items(p.contracts, '/payload/contracts')]),
    scope_and_boundaries: domain(['/payload/scope', '/payload/declarations/boundaries', '/payload/exceptions', '/payload/misuse'], judgments.map(item => ({ pointer: item.pointer, id: item.id, authored: pick(item.authored, ['scope', 'subject', 'boundaries', 'exceptions', 'misuse']) }))),
    relationships_and_dependencies: domain(['/payload/relationships', '/payload/dependencies', '/payload/reading_order', '/payload/cohesion'], judgments.map(item => ({ pointer: item.pointer, id: item.id, authored: pick(item.authored, ['parent_ref']) }))),
    examples: domain(['/payload/examples'], items(p.examples, '/payload/examples')),
    sources_and_uses: domain(['/payload/sources', '/payload/source_uses', '/payload/resources'], [...items(p.sources, '/payload/sources'), ...items(p.source_uses, '/payload/source_uses')]),
    provenance_rights_and_history: domain(['/manifest/creator', '/manifest/created_at', '/manifest/updated_at', '/manifest/languages', '/manifest/lineage', '/manifest/history', '/manifest/license', '/manifest/access', '/manifest/encryption', '/manifest/entitlement', '/manifest/compatibility', '/manifest/payload', '/manifest/runtime', '/manifest/content_digest', '/manifest/authoring', '/payload/actors', '/payload/attributions', '/payload/content_risk']),
  };
}

function reviewRecord(review, input, domains) {
  const problems = [];
  if (!record(review) || review.input_sha256 !== input.sha256) problems.push('REVIEW_INPUT_IDENTITY_MISMATCH');
  if (!text(review?.purpose)) problems.push('REVIEW_PURPOSE_MISSING');
  if (!['draft', 'content_reviewed_candidate'].includes(review?.conclusion)) problems.push('REVIEW_CONCLUSION_INVALID');
  if (!record(review?.actor) || !['agent', 'human_declared'].includes(review.actor.kind) || !text(review.actor.name)) problems.push('REVIEW_ACTOR_MISSING');
  if (!Array.isArray(review?.required_domains) || review.required_domains.some(name => !own(domains, name))) problems.push('REVIEW_REQUIRED_DOMAINS_INVALID');
  const states = ['provided', 'none', 'not_applicable', 'unknown', 'incomplete'];
  for (const name of Object.keys(domains)) {
    const decision = review?.decisions?.[name];
    if (!record(decision) || !states.includes(decision.state) || !text(decision.rationale)) {
      problems.push(`REVIEW_DOMAIN_UNRESOLVED:${name}`);
      continue;
    }
    // An honest unfinished acknowledgment states both why (rationale) and what
    // happens next (action); none/not_applicable/provided need no action.
    if (['unknown', 'incomplete'].includes(decision.state) && !text(decision.action)) problems.push(`REVIEW_ACTION_MISSING:${name}`);
    if (!Array.isArray(decision.evidence) || decision.evidence.some(pointer => !at(input.value, pointer).present)) problems.push(`REVIEW_EVIDENCE_INVALID:${name}`);
    if (decision.state === 'provided' && !decision.evidence?.length) problems.push(`REVIEW_EVIDENCE_MISSING:${name}`);
    if (decision.state === 'provided' && Array.isArray(decision.evidence)) {
      let roots = domains[name].fields.map(field => field.pointer);
      if (name === 'common_concepts') roots = domains[name].items.map(item => item.pointer);
      if (name === 'common_foundations') roots.push(...domains[name].items.map(item => item.pointer));
      if (name === 'scope_and_boundaries' || name === 'relationships_and_dependencies') {
        for (const item of domains[name].items) roots.push(...Object.keys(item.authored).map(key => `${item.pointer}/${key}`));
      }
      if (decision.evidence.some(pointer => !roots.some(root => pointer === root || pointer.startsWith(root + '/')))) problems.push(`REVIEW_EVIDENCE_WRONG_DOMAIN:${name}`);
      // A Declared wrapper ({state,value}) is not itself a body: none/unknown/
      // not_applicable and provided-with-null cannot stand in for provided content.
      const wrapper = value => record(value) && states.includes(value.state) && Object.hasOwn(value, 'value');
      const expressed = value => {
        if (wrapper(value)) { if (value.state !== 'provided') return false; value = value.value; }
        return value !== undefined && value !== null && (typeof value === 'string' ? value.trim().length > 0 : Array.isArray(value) ? value.length > 0 : record(value) ? Object.keys(value).length > 0 : true);
      };
      if (!decision.evidence.some(pointer => expressed(at(input.value, pointer).value))) problems.push(`PROVIDED_CONTENT_ABSENT:${name}`);
    }
    if (decision.state === 'provided' && name === 'common_concepts' && !domains[name].items.length) problems.push(`PROVIDED_CONTENT_ABSENT:${name}`);
    if (decision.state === 'provided' && name === 'common_foundations' && !array(input.value.payload.kernel?.foundation_refs).length) problems.push(`PROVIDED_CONTENT_ABSENT:${name}`);
    if (array(review.required_domains).includes(name) && decision.state !== 'provided') problems.push(`REQUIRED_CONTENT_UNRESOLVED:${name}`);
    if (review.conclusion === 'content_reviewed_candidate' && array(review.required_domains).includes(name) && ['unknown', 'incomplete'].includes(decision.state)) problems.push(`CONTENT_REVIEW_UNFINISHED:${name}`);
  }
  return { status: problems.length ? 'review_record_incomplete' : 'declared_review_record_complete', problems, declared: review };
}

async function main(argv) {
  if (![1, 3].includes(argv.length) || (argv.length === 3 && argv[1] !== '--review')) throw new Error('USAGE: native-asset-review.mjs <authored.json> [--review <author-review.json>]');
  const input = await readJson(argv[0]);
  if (!record(input.value) || !record(input.value.manifest) || !record(input.value.payload)) throw new Error('AUTHORED_MANIFEST_PAYLOAD_REQUIRED');
  const domains = inventory(input.value);
  const covered = new Set(Object.values(domains).flatMap(domain => domain.fields.map(field => field.pointer.split('/').slice(0, 3).join('/'))));
  const unassigned = ['manifest', 'payload'].flatMap(section => Object.keys(input.value[section]).filter(key => !covered.has(`/${section}/${key}`)).map(key => ({ pointer: `/${section}/${key.replace(/~/g, '~0').replace(/\//g, '~1')}`, authored: input.value[section][key] })));
  const p = input.value.payload;
  const prompts = [];
  if (array(p.judgments).length > 1 && !array(p.kernel?.foundation_refs).length) prompts.push({ field: '/payload/kernel/foundation_refs', task: 'Check whether these judgments need common foundations; preserve each local premise scope. Empty is not automatically invalid.' });
  if (array(p.judgments).length > 1 && !domains.common_concepts.items.length) prompts.push({ field: '/payload/materials', task: 'Review repeated terms and distinctions needed across judgments; add definitions only when they serve this work.' });
  if (p.declarations?.boundaries?.state === 'none') prompts.push({ field: '/payload/declarations/boundaries', task: 'Confirm that no work-wide limit is needed; keep judgment-specific limits local.' });
  if (array(p.sources).length && !array(p.source_uses).length) prompts.push({ field: '/payload/source_uses', task: 'Check actual source-to-content attribution; a source list does not imply support for every statement.' });
  const template = {
    input_sha256: input.sha256, purpose: '', actor: { kind: 'agent', name: '' },
    required_domains: [], conclusion: 'draft',
    decisions: Object.fromEntries(Object.keys(domains).map(name => [name, { state: 'unknown', rationale: '', evidence: [], action: '' }])),
  };
  const review = argv.length === 3 ? reviewRecord((await readJson(argv[2])).value, input, domains) : { status: 'author_review_required', problems: [], template };
  process.stdout.write(JSON.stringify({
    format: 'kdna.author-content-inventory/1', input: { sha256: input.sha256, bytes: input.bytes },
    status: review.status, content_quality: 'not_evaluated_by_script', schema_admission: 'not_run',
    official_readback: 'not_run', reader_rendering: 'not_run', actor_identity: 'not_verified',
    domains, unassigned_authored_fields: unassigned, author_prompts: prompts, review,
  }, null, 2) + '\n');
  if (review.problems.length) process.exitCode = 2;
}

main(process.argv.slice(2)).catch(error => {
  const safe = ['INPUT_FILE_UNSUPPORTED', 'INPUT_FILE_TOO_LARGE', 'INPUT_JSON_INVALID', 'AUTHORED_MANIFEST_PAYLOAD_REQUIRED'];
  const code = safe.includes(error.message) || error.message.startsWith('USAGE:') ? error.message : 'INPUT_READ_FAILED';
  process.stderr.write(code + '\n');
  process.exitCode = 1;
});
