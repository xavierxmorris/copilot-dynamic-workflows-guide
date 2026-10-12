# Code walkthrough

The authoritative API guide is the **built-in authoring guide in your installed
Copilot version**. Ask Copilot, "Show me the guidance for writing dynamic
workflows." This walkthrough explains this demo, not a stable SDK contract.

## Registration

[extension.mjs](../.github/extensions/delivery-readiness/extension.mjs) is the
host-loaded entry point:

```javascript
import { defineWorkflow, joinSession } from "@github/copilot-sdk/extension";
import { metadata, runDeliveryReadiness } from "./workflow.mjs";

const deliveryReadiness = defineWorkflow({
  meta: metadata,
  run: runDeliveryReadiness,
});

await joinSession({ workflows: [deliveryReadiness] });
```

The extension registers a definition; it does not start a run. The CLI supplies
the SDK module resolver and JSON-RPC connection. No sensitive environment
variables are requested, and stdout is not used for extension logging.

## Inputs and snapshots

`metadata.argsSchema` records required fields and the permitted document IDs.
`validateArgs` also checks the semantics in JavaScript: non-empty selection,
unique IDs, no unknown fields, and a real boolean.

Why both? The preview schema validator enforces structure but not every JSON
Schema keyword. Do not rely on `minLength`, `pattern`, numeric ranges, or
`additionalProperties` to enforce policy.

`readSnapshot` reads **only** `fixtures/release-plan.md` and
`fixtures/runbook.md`, resolves them relative to this module, normalizes CRLF
to LF, and hashes the selected IDs, paths, order, and content.
It has no arbitrary path input, external network request, subprocess, or writer.

```javascript
const snapshot = await ctx.step("snapshot-v1", () => readSnapshot(args.documents));
```

`ctx.step` journals a JSON value for replay. The key is the sole identity; the
runtime does not automatically hash the producer or its inputs. Change keys
when step meaning changes. These read-only steps avoid external-effect replay
risks, but journaling in general is **not exactly-once execution**.

Two volatile reads re-check current input: before agent work and before the
final report. They prevent a resumed or completed report from quietly claiming
to assess newer documents with older evidence.

## Bounded workers and organization

For one document, the workflow calls `ctx.agent` directly. For two documents,
it uses `ctx.parallel` and then integrates all results. This barrier is useful
because the final coverage and report need the full set.

For per-item multistage work that does not need all results at once, the SDK's
`ctx.pipeline` can avoid a barrier between stages. This demo does not add a
pipeline merely to showcase another API.

Each worker gets:

- An owned document ID and exact snapshot hash.
- Numbered source text, treated as untrusted data.
- Read-only scope and explicit prohibited actions.
- Relevant autonomous-delivery principles in its own prompt.
- A structured output schema requiring findings and source excerpts.
- A unique `assess:<document-id>` label.

Identical `ctx.agent` prompts and options, including the label, are memoized.
Unique labels make these **independent** calls; on resume, the same calls can
reuse results.

There is no assumed automatic propagation of the parent's loaded skill.
Referencing a skill name in the worker prompt is not the same as loading its
entire `SKILL.md`. The explicit principles are sufficient for this small,
scoped assessment; expand context deliberately for a broader assignment.

## Evidence and failures

`ctx.agent` normally returns `null` for ordinary failures, empty responses, or
structured output that still fails after its retry. A parallel item can also
become `null`. Hard runtime errors and cancellation propagate instead.

The code requires full coverage and rejects every null response. It does not
filter away failed assessments and then label the survivors "ready."

`verifyReview` validates values the schema does not enforce:

- Matching document identity and a findings array.
- Allowed severity and a non-empty message.
- Integer, in-bounds, ordered line ranges.
- An exact match between the quoted full lines and the snapshot.

It copies only validated fields into the report. A valid excerpt grounds a
finding; it does **not** prove the interpretation is correct or that the agent
found every gap. The workflow never executes the fictional formatter's tests.

## Reflection and the checkpoint

`ctx.phase` is called only at run-level transitions, not inside parallel
workers, because phase is a run-global value. Worker labels distinguish
concurrent work.

The deterministic reflection logs document coverage, validated finding count,
and why another summarizer is unnecessary. This is a deliberately narrow
reflection, not a hidden claim of autonomous process optimization.

```javascript
const saved = await ctx.step("assessments-v1", () => assessments);
if (args.pauseBeforeReport) {
  await ctx.pause("assessment-review-v1");
}
```

The checkpoint runs only in the main workflow flow. On resume the workflow
starts again; the durable checkpoint returns instead of pausing again.
Snapshot freshness is checked before old assessments are accepted.

## Result

The final JSON includes the workflow version, run ID, source hash, organization,
coverage, blocking findings, exact excerpts, and a next action.

`assessment` is either:

- `needs-work`: at least one reported blocking gap.
- `no-blocking-findings`: agents did not report a blocking gap; **not approval**.

`verification` explicitly limits the claim to excerpt matching. A successful
workflow run can correctly return `needs-work`: process completion and release
readiness are different things.

## Offline testing

`npm run check` uses built-in Node.js syntax checks and `node --test`, with no
npm dependencies. The mock context implements only the journal, checkpoint,
agent, and parallel behavior needed by the tests.

It does not simulate the entire Copilot runtime, billing, permissions, schema
retry engine, or hard/ordinary error classification. Tests inject null failures
explicitly. A live registration/run remains a separate check.

The offline demo clearly identifies its scripted results as a simulation.
Neither its output nor unit-test success should be presented as an agent's
live judgment.
