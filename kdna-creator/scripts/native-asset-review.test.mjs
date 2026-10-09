import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const script = fileURLToPath(new URL('./native-asset-review.mjs', import.meta.url));
const authored = {
  manifest: { title: 'A bounded comparison', summary: 'Compare the named quantity.' },
  payload: {
    judgments: [{ id: 'j:one', scope: { statement: 'This question only.' } }, { id: 'j:two' }],
    kernel: { purpose: { kind: 'summary' }, foundation_refs: [] },
    declarations: { highest_question: 'Which comparison is justified?', boundaries: { state: 'none', value: null } },
    materials: [{ id: 'm:local', kind: 'premise', statement: 'Only the first question assumes this.', applies_to: { kind: 'judgments', judgment_refs: ['j:one'] } }],
    shared_declarations: [], examples: [{ id: 'e:constructed', kind: 'illustrative', results: [{ kind: 'expected', value: 3 }] }],
    conditions: [{ id: 'c:actual', statement: 'Retain the actual condition body.' }],
    reasons: [{ id: 'r:actual', statement: 'Retain the actual reason body.' }],
    contracts: [{ id: 'contract:actual', kind: 'result', statement: 'Retain the actual result contract.' }],
    extensions: [{ id: 'extension:actual', data: 'Keep without inventing semantics.' }],
  },
};

function fixture(fn, data = authored) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-content-inventory-'));
  try {
    const input = path.join(dir, 'authored.json');
    fs.writeFileSync(input, JSON.stringify(data));
    const run = review => {
      const args = [script, input];
      if (review) { const file = path.join(dir, 'review.json'); fs.writeFileSync(file, JSON.stringify(review)); args.push('--review', file); }
      const result = spawnSync(process.execPath, args, { encoding: 'utf8', timeout: 3000 });
      assert.equal(result.error, undefined); assert.equal(result.signal, null); assert.equal(result.stderr, '');
      return { status: result.status, report: JSON.parse(result.stdout) };
    };
    return fn(run);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}

test('inventory preserves local premises, empty common fields and constructed result identity without approving content', () => fixture(run => {
  const { status, report } = run();
  assert.equal(status, 0); assert.equal(report.status, 'author_review_required');
  assert.deepEqual(report.domains.common_foundations.fields[0].value, []);
  assert.deepEqual(report.domains.common_foundations.items[0].applies_to, { kind: 'judgments', judgment_refs: ['j:one'] });
  assert.deepEqual(report.domains.common_concepts.items, []);
  assert.equal(report.domains.examples.items[0].authored.kind, 'illustrative');
  assert.equal(report.domains.examples.items[0].authored.results[0].kind, 'expected');
  assert.equal(report.domains.provenance_rights_and_history.fields.find(f => f.pointer === '/manifest/license').present, false);
  assert.equal(report.content_quality, 'not_evaluated_by_script'); assert.equal(report.schema_admission, 'not_run');
  for (const name of ['conditions', 'reasons', 'contracts']) assert.deepEqual(report.domains.questions_and_methods.fields.find(f => f.pointer === '/payload/' + name).value, authored.payload[name]);
  assert.deepEqual(report.unassigned_authored_fields.find(f => f.pointer === '/payload/extensions').authored, authored.payload.extensions);
}));

function declaredReview(report) {
  const review = report.review.template;
  review.purpose = 'Inspect this draft, without declaring it ready.';
  review.actor.name = 'Test editorial record';
  for (const name of Object.keys(review.decisions)) review.decisions[name] = { state: 'not_applicable', rationale: 'This test examines review-record boundaries only.', evidence: [] };
  return review;
}

test('a review of different input bytes cannot be reused', () => fixture(run => {
  const review = declaredReview(run().report); review.input_sha256 = '0'.repeat(64);
  const { status, report } = run(review);
  assert.equal(status, 2); assert.ok(report.review.problems.includes('REVIEW_INPUT_IDENTITY_MISMATCH'));
}));

test('task-required common content remains unresolved while genuinely optional empty fields do not become schema errors', () => fixture(run => {
  const review = declaredReview(run().report);
  const optional = run(review); assert.equal(optional.status, 0); assert.equal(optional.report.content_quality, 'not_evaluated_by_script');
  review.required_domains = ['common_concepts'];
  const required = run(review); assert.equal(required.status, 2); assert.ok(required.report.review.problems.includes('REQUIRED_CONTENT_UNRESOLVED:common_concepts'));
  review.decisions.common_concepts = { state: 'provided', rationale: 'Claimed complete.', evidence: ['/payload/materials'] };
  const absent = run(review); assert.equal(absent.status, 2); assert.ok(absent.report.review.problems.includes('PROVIDED_CONTENT_ABSENT:common_concepts'));
}));

test('a provided domain needs nonempty evidence from that domain', () => fixture(run => {
  const review = declaredReview(run().report);
  review.required_domains = ['examples'];
  review.decisions.examples = { state: 'provided', rationale: 'Inspect this actual constructed example.', evidence: ['/payload/examples/0'] };
  assert.equal(run(review).status, 0);
  review.decisions.examples.evidence = ['/manifest/title'];
  const wrong = run(review); assert.equal(wrong.status, 2); assert.ok(wrong.report.review.problems.includes('REVIEW_EVIDENCE_WRONG_DOMAIN:examples'));
  review.required_domains = ['shared_declarations'];
  review.decisions.examples = { state: 'not_applicable', rationale: 'Not required in this check.', evidence: [] };
  review.decisions.shared_declarations = { state: 'provided', rationale: 'Claimed present.', evidence: ['/payload/shared_declarations'] };
  const empty = run(review); assert.equal(empty.status, 2); assert.ok(empty.report.review.problems.includes('PROVIDED_CONTENT_ABSENT:shared_declarations'));
  review.required_domains = ['examples'];
  review.decisions.shared_declarations = { state: 'not_applicable', rationale: 'Not required in this check.', evidence: [] };
  review.decisions.examples = { state: 'provided', rationale: 'Runtime length is not authored evidence.', evidence: ['/payload/examples/length'] };
  const length = run(review); assert.equal(length.status, 2); assert.ok(length.report.review.problems.includes('REVIEW_EVIDENCE_INVALID:examples'));
}));

test('unfinished states block a content_reviewed_candidate only for task-required domains', () => fixture(run => {
  const review = declaredReview(run().report);
  review.conclusion = 'content_reviewed_candidate';
  review.decisions.shared_declarations = { state: 'unknown', rationale: 'Honest optional unknown; this task needs no shared declarations.', evidence: [], action: 'Leave unresolved and say so.' };
  const optional = run(review); assert.equal(optional.status, 0);
  assert.ok(!optional.report.review.problems.includes('CONTENT_REVIEW_UNFINISHED:shared_declarations'));
  review.required_domains = ['shared_declarations'];
  const required = run(review); assert.equal(required.status, 2);
  assert.ok(required.report.review.problems.includes('REQUIRED_CONTENT_UNRESOLVED:shared_declarations'));
  assert.ok(required.report.review.problems.includes('CONTENT_REVIEW_UNFINISHED:shared_declarations'));
}));

test('a Declared wrapper is not content: none/unknown cannot claim provided, provided bodies and plain scope text can', () => {
  const noneWrapped = structuredClone(authored);
  noneWrapped.payload.judgments[0].scope = { state: 'none', value: null };
  noneWrapped.payload.declarations.boundaries = { state: 'unknown', value: null };
  fixture(run => {
    const review = declaredReview(run().report);
    review.required_domains = ['scope_and_boundaries'];
    review.decisions.scope_and_boundaries = { state: 'provided', rationale: 'Claimed via a none wrapper alone.', evidence: ['/payload/judgments/0/scope'] };
    const none = run(review); assert.equal(none.status, 2); assert.ok(none.report.review.problems.includes('PROVIDED_CONTENT_ABSENT:scope_and_boundaries'));
    review.decisions.scope_and_boundaries = { state: 'provided', rationale: 'Claimed via an unknown wrapper alone.', evidence: ['/payload/declarations/boundaries'] };
    const unknown = run(review); assert.equal(unknown.status, 2); assert.ok(unknown.report.review.problems.includes('PROVIDED_CONTENT_ABSENT:scope_and_boundaries'));
  }, noneWrapped);
  const providedWrapped = structuredClone(authored);
  providedWrapped.payload.judgments[0].scope = { state: 'provided', value: { statement: 'The real authored scope text.' } };
  fixture(run => {
    const review = declaredReview(run().report);
    review.required_domains = ['scope_and_boundaries'];
    review.decisions.scope_and_boundaries = { state: 'provided', rationale: 'A provided wrapper with a real inner body.', evidence: ['/payload/judgments/0/scope'] };
    assert.equal(run(review).status, 0);
  }, providedWrapped);
  fixture(run => {
    const review = declaredReview(run().report);
    review.required_domains = ['scope_and_boundaries'];
    review.decisions.scope_and_boundaries = { state: 'provided', rationale: 'Plain authored scope text stays valid.', evidence: ['/payload/judgments/0/scope'] };
    assert.equal(run(review).status, 0);
  });
});

test('honest unknown/incomplete acknowledgments need an action, not only a rationale', () => fixture(run => {
  const review = declaredReview(run().report);
  review.conclusion = 'content_reviewed_candidate';
  review.decisions.shared_declarations = { state: 'unknown', rationale: 'Honest optional unknown for this task.', evidence: [] };
  const missing = run(review); assert.equal(missing.status, 2); assert.ok(missing.report.review.problems.includes('REVIEW_ACTION_MISSING:shared_declarations'));
  review.decisions.shared_declarations.action = 'Leave unresolved and say so.';
  assert.equal(run(review).status, 0);
  review.decisions.scope_and_boundaries = { state: 'incomplete', rationale: 'Only partially authored in this draft.', evidence: [] };
  const incomplete = run(review); assert.equal(incomplete.status, 2); assert.ok(incomplete.report.review.problems.includes('REVIEW_ACTION_MISSING:scope_and_boundaries'));
  review.decisions.scope_and_boundaries.action = 'Complete the boundaries before any candidate review.';
  assert.equal(run(review).status, 0);
}));
