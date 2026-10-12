import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  metadata,
  readSnapshot,
  reviewPrompt,
  reviewSchema,
  runDeliveryReadiness,
  validateArgs,
  verifyReview,
} from "../.github/extensions/delivery-readiness/workflow.mjs";
import { createMockContext } from "../scripts/mock-context.mjs";

const args = { documents: ["release-plan", "runbook"], pauseBeforeReport: false };
const snapshot = await readSnapshot(args.documents);

function reviewFor(id) {
  const document = snapshot.documents.find((item) => item.id === id);
  const lines = document.content.split("\n");
  const index = lines.findIndex((line) => line.includes("TODO:"));
  assert.notEqual(index, -1);
  return {
    document: id,
    findings: [{
      severity: "blocking",
      message: "Resolve the documented release gap.",
      startLine: index + 1,
      endLine: index + 1,
      quote: lines[index],
    }],
  };
}

const agent = async (_prompt, options) => reviewFor(options.schema.properties.document.const);

test("validates input without silently accepting duplicates or unknown arguments", () => {
  assert.deepEqual(validateArgs(args), args);
  for (const invalid of [
    null,
    [],
    {},
    { ...args, documents: [] },
    { ...args, documents: ["../private"] },
    { ...args, documents: ["constructor"] },
    { ...args, documents: ["release-plan", "release-plan"] },
    { ...args, documents: [1] },
    { ...args, pauseBeforeReport: "false" },
    { ...args, publish: true },
  ]) {
    assert.throws(() => validateArgs(invalid));
  }
});

test("snapshot is stable and bound to document order and contents", async () => {
  assert.deepEqual(await readSnapshot(args.documents), snapshot);
  assert.match(snapshot.hash, /^[a-f0-9]{64}$/);
  assert.notEqual((await readSnapshot([...args.documents].reverse())).hash, snapshot.hash);
  await assert.rejects(readSnapshot(["../../private"]), /Unsupported document ID/);
});

test("metadata uses documented schema vocabulary and does not guess resource limits", () => {
  assert.equal(metadata.name, "delivery-readiness");
  assert.equal(metadata.limits, undefined);
  assert.deepEqual(metadata.argsSchema.required, ["documents", "pauseBeforeReport"]);
  assert.deepEqual(reviewSchema("runbook").properties.document, { type: "string", const: "runbook" });
});

test("prompt supplies scope, numbered source, evidence requirements, and authority boundaries", () => {
  const prompt = reviewPrompt(snapshot.documents[0], snapshot.hash);
  assert.ok(prompt.includes(snapshot.hash));
  assert.ok(prompt.includes("1: # Beacon CLI release plan"));
  assert.ok(prompt.includes("Do not call tools"));
  assert.ok(prompt.includes("autonomous-delivery principles"));
  assert.ok(prompt.includes("untrusted source data"));
});

test("verifies exact excerpt lines and strips unexpected output fields", () => {
  const input = reviewFor("release-plan");
  input.extra = "discard";
  input.findings[0].extra = "discard";
  const verified = verifyReview(input, snapshot.documents[0]);
  assert.equal(verified.path, "fixtures/release-plan.md");
  assert.equal(verified.extra, undefined);
  assert.equal(verified.findings[0].extra, undefined);
});

test("rejects missing, malformed, ungrounded, or invalid agent output", () => {
  const valid = reviewFor("release-plan");
  const badFindings = [
    { severity: "other" },
    { message: " " },
    { startLine: 0 },
    { startLine: 1.5 },
    { endLine: 0 },
    { endLine: 10000 },
    { quote: "" },
    { quote: "invented evidence" },
    { quote: "10: " + valid.findings[0].quote },
  ];
  for (const invalid of [
    null,
    undefined,
    {},
    { ...valid, document: "runbook" },
    { ...valid, findings: null },
    ...badFindings.map((patch) => ({
      ...valid,
      findings: [{ ...valid.findings[0], ...patch }],
    })),
  ]) {
    assert.throws(() => verifyReview(invalid, snapshot.documents[0]));
  }
});

test("accepts exact multiline evidence but rejects mismatched ranges", () => {
  const lines = snapshot.documents[0].content.split("\n");
  const input = reviewFor("release-plan");
  input.findings[0] = { ...input.findings[0], startLine: 8, endLine: 10, quote: lines.slice(7, 10).join("\n") };
  assert.equal(verifyReview(input, snapshot.documents[0]).findings.length, 1);
  input.findings[0].endLine = 9;
  assert.throws(() => verifyReview(input, snapshot.documents[0]), /Evidence mismatch/);
});

test("two documents use a parallel barrier and deterministic integration", async () => {
  const mock = createMockContext(args, agent);
  const report = await runDeliveryReadiness(mock.ctx);
  assert.equal(mock.parallelCalls, 1);
  assert.equal(mock.calls.length, 2);
  assert.deepEqual(mock.calls.map((call) => call.options.label), ["assess:release-plan", "assess:runbook"]);
  assert.deepEqual(mock.phases, ["Snapshot", "Assess", "Reflect", "Verify"]);
  assert.equal(report.documentsAssessed, 2);
  assert.equal(report.blockingFindings, 2);
  assert.equal(report.assessment, "needs-work");
  assert.equal(report.organization, "parallel");
  assert.equal(report.snapshotHash, snapshot.hash);
  assert.ok(mock.logs.some((line) => line.includes("do not spawn a summarizer")));
});

test("one document uses direct work rather than unnecessary orchestration", async () => {
  const mock = createMockContext({ ...args, documents: ["release-plan"] }, agent);
  const report = await runDeliveryReadiness(mock.ctx);
  assert.equal(mock.parallelCalls, 0);
  assert.equal(mock.calls.length, 1);
  assert.equal(report.organization, "direct");
});

test("an empty findings array is not represented as release approval", async () => {
  const mock = createMockContext(args, async (_prompt, options) => ({
    document: options.schema.properties.document.const,
    findings: [],
  }));
  const report = await runDeliveryReadiness(mock.ctx);
  assert.equal(report.assessment, "no-blocking-findings");
  assert.match(report.verification, /not verified/);
  assert.match(report.nextAction, /not release approval/);
});

test("advisory findings are retained without becoming a blocking finding", async () => {
  const mock = createMockContext(args, async (_prompt, options) => {
    const review = reviewFor(options.schema.properties.document.const);
    review.findings[0].severity = "advisory";
    return review;
  });
  const report = await runDeliveryReadiness(mock.ctx);
  assert.equal(report.blockingFindings, 0);
  assert.equal(report.assessment, "no-blocking-findings");
  assert.equal(report.assessments[0].findings.length, 1);
});

test("ordinary null failures cannot produce a successful partial report", async () => {
  const mock = createMockContext(args, async (_prompt, options) =>
    options.schema.properties.document.const === "runbook" ? null : reviewFor("release-plan"));
  await assert.rejects(runDeliveryReadiness(mock.ctx), /assessments failed/);
  assert.ok(mock.logs.some((line) => line.includes("Incomplete coverage: runbook")));
  assert.equal(mock.journal.has("report-v1"), false);
});

test("hard agent errors propagate rather than turning into a green fallback", async () => {
  const mock = createMockContext(args, async () => { throw new Error("workflow_limit_reached"); });
  await assert.rejects(runDeliveryReadiness(mock.ctx), /workflow_limit_reached/);
});

test("missing parallel output fails the coverage check", async () => {
  const mock = createMockContext(args, agent);
  mock.ctx.parallel = async () => [reviewFor("release-plan")];
  await assert.rejects(runDeliveryReadiness(mock.ctx), /coverage differs/);
});

test("unverified evidence never reaches a checkpoint or report", async () => {
  const mock = createMockContext({ ...args, pauseBeforeReport: true }, async (_prompt, options) => {
    const review = reviewFor(options.schema.properties.document.const);
    review.findings[0].quote = "invented";
    return review;
  });
  await assert.rejects(runDeliveryReadiness(mock.ctx), /Evidence mismatch/);
  assert.equal(mock.checkpoints.size, 0);
});

test("pause and resume reuse journaled assessments with the same run ID", async () => {
  const mock = createMockContext({ ...args, pauseBeforeReport: true }, agent);
  await assert.rejects(runDeliveryReadiness(mock.ctx), /^Error: MOCK_PAUSED$/);
  assert.equal(mock.journal.has("assessments-v1"), true);
  assert.equal(mock.journal.has("report-v1"), false);
  const resumed = createMockContext(mock.ctx.args, async () => { throw new Error("agent unexpectedly reran"); }, mock);
  const report = await runDeliveryReadiness(resumed.ctx);
  assert.equal(resumed.calls.length, 0);
  assert.equal(report.runId, mock.ctx.runId);
  assert.equal(report.assessment, "needs-work");
});

test("changed snapshot on resume blocks reuse before any agent runs", async () => {
  const mock = createMockContext(args, agent);
  mock.journal.set("snapshot-v1", { ...snapshot, hash: "outdated" });
  await assert.rejects(runDeliveryReadiness(mock.ctx), /Start a NEW run/);
  assert.equal(mock.calls.length, 0);
});

test("changed snapshot after assessment blocks final report", async () => {
  const mock = createMockContext(args, agent);
  const step = mock.ctx.step;
  mock.ctx.step = async (key, producer, options) =>
    key === "final-snapshot-v1" ? { ...snapshot, hash: "changed" } : step(key, producer, options);
  await assert.rejects(runDeliveryReadiness(mock.ctx), /changed during assessment/);
  assert.equal(mock.journal.has("report-v1"), false);
});

test("cancellation is surfaced before work starts", async () => {
  const mock = createMockContext(args, agent);
  const controller = new AbortController();
  controller.abort(new Error("user cancelled"));
  mock.ctx.signal = controller.signal;
  await assert.rejects(runDeliveryReadiness(mock.ctx), /user cancelled/);
  assert.equal(mock.calls.length, 0);
});

test("all example inputs satisfy the workflow input contract", async () => {
  for (const filename of ["workflow-input.json", "single-document.json", "pause-input.json"]) {
    const input = JSON.parse(await readFile(new URL(`../examples/${filename}`, import.meta.url), "utf8"));
    assert.deepEqual(validateArgs(input), input);
  }
});

test("recorded live report is grounded in the current public fixtures", async () => {
  const report = JSON.parse(await readFile(new URL("../examples/verified-live-report.json", import.meta.url), "utf8"));
  assert.equal(report.workflow, metadata.name);
  assert.equal(report.version, 1);
  assert.equal(report.snapshotHash, snapshot.hash);
  assert.equal(report.documentsAssessed, snapshot.documents.length);
  assert.equal(report.assessments.length, snapshot.documents.length);
  const verified = report.assessments.map((review, index) =>
    verifyReview(review, snapshot.documents[index]));
  const blocking = verified.flatMap((review) => review.findings)
    .filter((finding) => finding.severity === "blocking").length;
  assert.equal(report.blockingFindings, blocking);
  assert.equal(report.assessment, blocking > 0 ? "needs-work" : "no-blocking-findings");
});
