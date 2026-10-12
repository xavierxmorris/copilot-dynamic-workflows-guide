# Guided lab: use the skill and the workflow together

Return to the [quick start](../README.md) for setup. Commands are PowerShell
unless labeled as prompts inside Copilot.

## 1. Understand and invoke the skill

The upstream skill is bundled at
`.github/skills/autonomous-delivery/SKILL.md`. Cloning this repository gives you
a **project-scoped skill**: no modification of your personal skill directory is
required.

Inside Copilot, run `/skills reload`, then `/skills info autonomous-delivery`.
If you already have a personal version, check the location and version reported
by `info` rather than assuming which copy was selected.

Start with a skill-only prompt:

```text
Use the autonomous-delivery skill to explain how you would assess
fixtures/release-plan.md and fixtures/runbook.md.

Do not create or run a workflow yet. Define the outcome, evidence required,
owned scope, and authority boundaries. Decide whether separate workers would
earn their coordination cost. Keep the answer short.
```

Observe: loading the skill adds instructions, not new tools or a running
process. It encourages proportional organization; it does not demand a fixed
roster of agents for every task.

## 2. Inspect an existing dynamic workflow

Ask:

```text
Describe the delivery-readiness dynamic workflow, its arguments, phases,
permissions, checkpoint, and failure behavior. Do not run it.
```

Open these two files:

- [extension.mjs](../.github/extensions/delivery-readiness/extension.mjs)
  imports `defineWorkflow` and `joinSession` from the host-supplied SDK.
- [workflow.mjs](../.github/extensions/delivery-readiness/workflow.mjs)
  defines the argument contract and process.

No SDK package installation is needed for extension loading. Do **not** run
`node extension.mjs` as though it were a standalone program: Copilot supplies
module resolution, the session connection, and the workflow runtime.

## 3. Learn workflow creation without overwriting the demo

GitHub's default authoring scope is the current session. Try a distinct,
deterministic warm-up:

```text
Create a SESSION-SCOPED dynamic workflow named demo-plan-echo.
It accepts {"outcome":"a non-empty string"}.
Use deterministic code to validate the outcome and return:
{"outcome": "...", "authority": "explanation only"}.
Use no agents, tools, external calls, writes, or recurring automation.
Use the built-in workflow authoring guide and do not run it yet.
```

Then ask what workflows are available and explicitly run `demo-plan-echo`
with an outcome of `"Assess the two public demo documents"`.

This demonstrates creation and registration separately from execution, without
needing an agent call inside the new workflow. The parent chat may still use
AI credits to author it.

To share that definition, ask for the extension path, inspect it, and ask
Copilot to copy its containing directory into
`.github/extensions/demo-plan-echo/`. Start a new session and verify discovery.
This shares the definition, **not** the original run history. Do not overwrite
`delivery-readiness`.

For the rest of the lab, use the checked-in `delivery-readiness` workflow.

## 4. Run the combined experience

```text
Use the autonomous-delivery skill and explicitly run the delivery-readiness
dynamic workflow with:
{"documents":["release-plan","runbook"],"pauseBeforeReport":false}

The goal is an evidence-grounded readiness assessment of these fictional
documents. The two document assessments can be independent; no edits,
tool calls by workers, further delegation, publishing, deployments,
credential access, or schedules are authorized.

After the run, explain the organization choice and one workflow reflection.
Do not claim that excerpt matching verifies tests or approves a release.
```

Approve the workflow if prompted under your permission settings. Open
`/workflows` to inspect phase progress and AI-credit usage.

The process:

1. Capture a SHA-256-bound snapshot of the two allowlisted documents.
2. Launch one assessment agent per document with unique labels and a schema.
3. Require complete coverage and validate exact evidence excerpts.
4. Reflect on the organization; integrate deterministically without a third agent.
5. Confirm the documents are unchanged and return a report.

The deliberate gaps are acceptance evidence in the release plan and rollback
details in the runbook. Findings are model-generated, so counts and wording are
not fixed. The verifier rejects invented excerpts, not every possible mistaken
interpretation.

## 5. Show proportional organization

Use the same workflow with one document:

```text
Use autonomous-delivery and explicitly run delivery-readiness with:
{"documents":["release-plan"],"pauseBeforeReport":false}
Compare this run's organization with the two-document run.
```

The code uses one direct `ctx.agent` call rather than a parallel barrier.
That is a small, explicit example of adapting organization to scope. It is
not a general-purpose autonomous planner or proof that parallelism saves time.
Compare actual latency, credit usage, and usefulness before drawing that claim.

## 6. Pause at a durable checkpoint and resume

Prefer the interactive session for this exercise:

```text
Use autonomous-delivery and explicitly run delivery-readiness with:
{"documents":["release-plan","runbook"],"pauseBeforeReport":true}
Stop at the workflow's review checkpoint. Do not edit the fixtures.
```

Open `/workflows` and select the paused run. Inspect the progress and coverage.
Press **R** to resume. You can also explicitly ask Copilot to resume the
reported run ID.

On the first attempt, `ctx.pause("assessment-review-v1")` pauses the run.
On resume, the body starts again; durable steps and identical agent calls
reuse saved results, the checkpoint returns, and final verification continues.

The checkpoint is a chance to review progress, **not** a release approval form.
The final returned report is produced only after resume; the demo logs coverage
and excerpt counts before pausing.

If you edit a fixture while paused, resume fails with:

```text
Fixtures changed since this run's snapshot. Start a NEW run.
```

That is intentional. Do not reuse old evidence for a changed input. Start a new
run after a deliberate edit. Canceling a run is different from pausing it:
canceled runs are not resumable.

## 7. Make resource limits deliberate

The checked-in metadata does not invent a time or credit budget. The document
scope bounds the planned work to one or two top-level assessment calls; a
structured-output retry can launch another agent, and descendants consume
resources too if delegation is allowed.

For a live demonstration, decide your own acceptable limits before running,
or perform the small fixture run and inspect actual usage before scaling.
Specify chosen limits in your prompt. Do not treat the sample input size as a
hard spending cap.

| Limit | Behavior |
|---|---|
| Concurrent subagents | Extra work waits; reaching the cap does not itself fail the run |
| Total subagents | Exceeding the cumulative cap stops the attempt |
| Active time | Includes active work across resumed attempts, not paused time |
| AI credits | A soft, post-paid ceiling; already-running work can settle above it |

If a limit is reached, resume the **same run ID** with a higher total for only
the exhausted limit. Prior usage still counts. Do not restart a run merely to
hide its resource usage.

Model, reasoning, and context choices are deliberately not hard-coded here.
Keep the user's choices and supported host capabilities rather than silently
substituting a preferred model.

## 8. Reflect and adapt without multiplying agents

Ask after a completed run:

```text
Using autonomous-delivery, reflect on this workflow. What measured friction
exists, what single change would address it, and what evidence would show
improvement in both quality and useful throughput? Do not change the workflow
or launch more agents without an explicit request.
```

A useful change might be stronger acceptance criteria, clearer quoted evidence,
or a different ownership boundary. An unnecessary third summarizer is not an
improvement just because it creates more activity.

If you later adapt the workflow to a real repository, replace the fixed fixture
reader deliberately, establish file and data boundaries, test the failure paths,
and version durable step keys whenever their meaning or inputs change.
Workflow code cannot invoke nested dynamic workflows in the current SDK.

## Completion criteria

You can explain the skill/process distinction; load both from the repository;
run a small workflow; recognize the intentional gaps; distinguish a simulation
from a live run; pause/resume the same run; and identify what the evidence does
and does not verify. No publishing or deployment step belongs to this lab.
