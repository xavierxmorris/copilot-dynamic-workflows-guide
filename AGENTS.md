# Demo repository

This repository teaches GitHub Copilot agent skills and dynamic workflows.
Use the current CLI's built-in workflow and extension authoring guides before
changing `.github/extensions/`; the API is experimental.

Run `npm run check` and `npm run demo:offline` for local verification. There
are no npm dependencies to install. Offline execution is a simulation, not
proof that Copilot registered or ran the workflow.

Preserve the intentional gaps in `fixtures/` unless the user asks to fix them.
The workflow reads only its allowlisted public fixtures, checks quoted evidence,
and returns a report. Never add publishing, deployment, recurring automation,
credential access, or arbitrary path inputs to the demo implicitly.

The vendored autonomous-delivery skill is upstream MIT-licensed material.
Preserve its attribution and license. Do not assume parent skill instructions
are inherited by workflow subagents; their prompts must carry their own scope.
