# Sources and verification

**Checked: 12 October 2026.** Public documentation did not supply a stable
publication date in the fetched article bodies; this is the retrieval date,
not a claimed release date.

## Primary sources

| Source | Why it matters |
|---|---|
| [Using dynamic workflows](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/use-dynamic-workflows) | Experimental prerequisites, creation, direct CLI runs, trust, sharing, monitoring, and resume |
| [Creating a dynamic workflow](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/use-dynamic-workflows#creating-a-dynamic-workflow) | The user's starting point: authoring a session extension does not start a run |
| [Dynamic workflows concepts](https://docs.github.com/en/copilot/concepts/agents/dynamic-workflows) | Availability, permissions, limits, and distinction from autopilot/fleet |
| [Adding skills for Copilot CLI](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/create-skills) | Skill layout, project/personal scope, reload, and non-interactive commands |
| [Copilot CLI command reference](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-command-reference) | Current terminal commands and flags |
| [Copilot CLI programmatic reference](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-programmatic-reference) | Tool filters, workflow JSON output, exit codes, and result-file guarantees |
| [autonomous-delivery original gist](https://gist.github.com/EvanBoyle/8c1a97f682d92dab8c09d0e1ea73f4a0) | Upstream skill, installation guidance, version, and MIT attribution |
| [Pinned upstream revision](https://gist.github.com/EvanBoyle/8c1a97f682d92dab8c09d0e1ea73f4a0/5ce9f9486d3cbed37a8b03b1b0152917b4bdff90) | The bundled skill's exact source |

## Implementation baseline

The extension was authored against the built-in workflow and extension
authoring guides and SDK declarations bundled with **Copilot CLI 1.0.96-2**.
Those local guides define the specific `ctx.agent`, `ctx.step`, `ctx.parallel`,
`ctx.pause`, `argsSchema`, and null-failure behavior used here.

To obtain the equivalent reference for your installed version, ask Copilot:

```text
Show me the guidance for writing dynamic workflows and extensions.
```

The implementation has no third-party npm dependencies. Offline checks were
run with **Node.js 24.13.0** on Windows. The project declares Node.js 22+;
that is the demo's support target, not a claim about all Copilot host versions.

The skill is **autonomous-delivery v2.1.0**, upstream updated
**2026-10-12T00:41:21Z**. Its three bundled files were compared against the
public gist before publication.

## Evidence boundaries

The offline checks cover input validation, fixed document scope, snapshot
identity, exact line evidence, direct/parallel organization, null and hard
failures, complete coverage, cancellation, durable replay, and stale-input
refusal. The mock does not reproduce the complete host runtime.

`npm run demo:offline` is an explicitly labeled scripted simulation. It is
not evidence of live Copilot execution, billing, permissions, or model quality.

## Live verification

The real CLI discovered the bundled **project skill** and registered the
**project extension**. A direct run of `delivery-readiness` completed with
exit code **0** and wrote its result file:

| Evidence | Observed value |
|---|---|
| Host | Copilot CLI **1.0.96-2**, Windows |
| Model | **gpt-6.1-sol**, selected for this verification, not hard-coded in the extension |
| Run ID | `6d3b7e05-6833-42f5-a27b-41bce268ad36` |
| Phases | Snapshot, Assess, Reflect, Verify |
| Agents | Two completed assessments, neither canceled |
| Worker tool calls | **0** |
| Source hash | `a714329a8a917ab16732305813de1740117794fbc073e447a2a952fdd68b3ebe` |
| Result | Two documents assessed; four blocking findings; `needs-work` |

The [recorded live report](../examples/verified-live-report.json) is the actual
returned JSON for those public fixtures, not the scripted offline output.
Its finding counts and wording are observations, not golden model assertions.
Tests check its source hash and quoted evidence against the fixtures.

**Environment distinction:** the successful direct run used a separate,
session-local `COPILOT_HOME` and the current GitHub account's OAuth token only
in an environment variable. No personal configuration or credential file was
copied into the repository. This isolated the demo from unrelated personal
extensions/plugins. The README's ordinary command uses your normal profile.

The first normal-profile attempt rejected the unsupported bare wildcard
`--deny-tool='*'` before starting. After correcting that syntax, the project
extension loaded and agents launched, but the run failed with `connection
closed` alongside plugin-update/reload diagnostics. That failure was retained,
not counted as a successful run or diagnosed conclusively.

Separately, the **same workflow body** completed through a temporary session
adapter in a stable existing Copilot session. It used two agents and returned
three blocking findings, illustrating variable agent judgment. That adapter
was validation infrastructure, not the shared project extension.

**Not live-verified here:** the pause/resume exercise and single-document branch.
Their control flow was covered by offline tests and checked against the
installed SDK guide. Run the guided lab to exercise those paths in your host.
The mock does not establish preview entitlement, permissions, or accounting.

## Preview cautions

The workflow API and availability can change. Consult the installed host's
guidance when adapting the code. Limits are optional; choose them from user
intent or measured resource use rather than guessing a safe-looking budget.
Extension code runs outside normal subagent tool approval prompts, so loading
an extension is a trust decision.

Exact excerpt checks verify grounding, not semantic correctness or completeness.
No release, deployment, recurring automation, or external-write replay was
performed by the demo workflow.
