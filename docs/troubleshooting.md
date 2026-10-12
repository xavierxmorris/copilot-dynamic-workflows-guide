# Troubleshooting

The feature is in preview. Start by checking `copilot --version`,
`copilot workflow run --help`, and the current
[GitHub workflow documentation](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/use-dynamic-workflows).

## Skill not found

The file must be named `SKILL.md`, with valid YAML frontmatter, inside a skill
directory. This repo uses `.github/skills/autonomous-delivery/SKILL.md`.

Start Copilot from the repository, run `/skills reload`, then
`/skills info autonomous-delivery`. From a terminal, use `copilot skill list`.
Check disabled skills and a duplicate personal version rather than repeatedly
copying the same files.

## Workflow not found

The entry point must be
`.github/extensions/delivery-readiness/extension.mjs`, inside a discovered
repository. Trust the code deliberately, enable preview features, and start a
new session from the repo.

Ask Copilot to inspect the extension's status and log using the built-in
extension management tools. A failed extension is not fixed by merely repeating
the run prompt.

For headless commands, the current documentation requires
`GITHUB_COPILOT_PROMPT_MODE_EXTENSIONS=true` to load a project extension in an
untrusted working directory. Set it only for code you reviewed, for that
invocation. It enables extension code, not subagent tool permissions.

## SDK import fails when using node directly

Do not run `node .github/extensions/delivery-readiness/extension.mjs`.
Copilot supplies `@github/copilot-sdk/extension` and the live session protocol.
Use `copilot workflow run` or an interactive session.

The standalone offline demo imports only `workflow.mjs`, which uses Node.js
built-ins and the mock context.

## Experimental features are off

Launch with `copilot --experimental`, or use `/experimental on` inside a
session. This does not alter your Copilot billing eligibility.

## dynamic_workflows_unavailable

The installed host or account may not be eligible to execute workflows.
Check current [plan and billing availability](https://docs.github.com/en/copilot/concepts/agents/dynamic-workflows#availability-of-dynamic-workflows).
Do not replace an unavailable feature with a simulation and label it live.
The offline demo remains useful for studying control flow.

## Ordinary agent failure / incomplete coverage

The demo fails rather than producing a green partial report. The failed item
may have returned null after a structured-output retry. Inspect the run's
progress, permission denials, and returned failure.

A direct terminal run does not offer interactive permission prompts. This demo
needs no worker tools: fixture content is embedded in the prompt. If a worker
nevertheless calls a denied tool, do not respond by granting all permissions.

## Invalid --deny-tool value: *

The verified CLI rejects a bare wildcard permission rule. Use supported kinds
such as `shell`, `write`, `read`, `url`, and `memory`. The README additionally
uses an empty model-tool allowlist because workers need only the embedded text.
Availability filters and permission rules are different mechanisms.

## Connection closed during a headless run

Inspect both the run failure and the extension/host logs. This repository's
first valid headless verification reached assessment and launched its two
workers, but stopped with `connection closed`. The host also reported a
plugin-auto-update / extension-reload failure in that attempt. These are
correlated observations, not proof of a general SDK bug or a complete diagnosis.

The direct demo completed successfully when tested with a separate,
session-local `COPILOT_HOME` and current-account authentication in an environment
variable. You can also use a stable interactive session to inspect and run the
process if a fresh headless launch is affected.

An isolated home does not inherit your profile's model and subagent settings:
select your intended model explicitly for that test. Never copy your entire
personal configuration or authentication files into this public repository.
Do not change unrelated global plugin settings or hide the failed attempt.
`--no-auto-update` controls CLI binary updates; do not assume it disables every
plugin update. See the [verification record](sources-and-verification.md#live-verification)
for the separate live checks and their scope.

## Evidence mismatch / invalid finding values

The quote must contain the exact full source line(s) without numbered prompt
prefixes. Line numbers must be integers and in range. The demo checks these
values because the runtime schema does not enforce every constraint.

Inspect the mismatch. Do not weaken the verifier to make a run look successful
or repeatedly retry until a favorable answer appears.

## Fixtures changed since snapshot

Start a new run. A resumed run keeps its identity and old journal. The demo
refuses to attach that evidence to changed documents.

If workflow semantics change, version durable keys. Changing a producer's code
does not automatically invalidate its old journaled result.

## workflow_limit_reached

Use `/workflows` to inspect the stopped run. If you approve more work, resume
its **existing ID**, raising only the exhausted limit to a higher cumulative
total. Previously used credits, agent admissions, and active time still count.

The concurrency cap queues work. The credit ceiling is post-paid and soft:
already-running work can exceed it before accounting settles.

## Result file absent, or an old file remains

The direct CLI command writes `--result-file` only when a workflow completes
successfully with a result. A pause, failure, or interruption leaves an old
file unchanged.

Check the current run status and ID before trusting a file left by an earlier
run. `outputs/` is intentionally gitignored.

## Can I run another dynamic workflow inside this one?

Not with the current workflow context: nested dynamic workflows are unsupported.
Keep orchestration inside one workflow or coordinate separate explicit runs
from the main session. The skill's local-orchestrator idea does not override
the host's capabilities.

## Will this schedule ongoing work?

No. Neither installation nor this demo starts recurring automation. The skill
describes scheduling only for explicitly authorized recurring objectives with
scope, cadence, budget, ownership, and a stop condition.
