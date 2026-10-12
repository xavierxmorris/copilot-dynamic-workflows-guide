# Presenter run sheet

An approximately **8-10 minute** demonstration. Timing is a presentation plan,
not a performance measurement.

## Prepare

Clone the repository, run `npm run check`, and confirm Copilot can access
dynamic workflows. Review the extension before enabling it. Start
`copilot --experimental` inside the repository, confirm skill discovery,
and ask for available workflows.

Decide your resource limits before the live run; a preview entitlement or
network issue is not a reason to bypass permissions. Keep the offline demo
available. Do not expose tokens, personal configuration, or unrelated session
history on screen.

## 0:00 - The distinction

Show the README diagram.

> "The skill is guidance for judgment. The workflow is code for a reusable
> process. Neither grants authority to publish or deploy."

Contrast this with GitHub Actions briefly: this workflow runs through the
Copilot runtime and can use agents; it is not Actions YAML.

## 1:00 - Inspect the artifacts

Show the skill frontmatter, upstream license, and tiny `extension.mjs`.
Explain that the skill is project-scoped and unchanged from the public gist.

> "Cloning the repo shares the instructions and workflow definition, not
> anyone else's run history or credentials."

## 2:00 - Run both

Paste the combined prompt from the README. The intent is readiness assessment
of the public fixtures; worker edits, further delegation, publishing,
deployments, and schedules are out of scope.

Open `/workflows` and show phases and usage. While waiting, point out the TODO
lines in the release plan and runbook.

## 4:00 - Explain the evidence

Show the returned findings and their source lines.

> "An exact quote passed a deterministic check. That is narrower than proving
> the release is safe. Successful execution can return 'needs-work'."

Call out unique worker labels, null-failure guards, and the absence of a third
summarizer. Do not infer a speedup from a single run.

## 5:30 - Show proportionality

Use the single-document input or explain the branch in `runDeliveryReadiness`.
The workflow uses one direct agent when the scope is one document.

> "Good orchestration is not measured by how many agents we can launch."

## 6:30 - Show pause/resume

Run the pause prompt from the guided lab, inspect `/workflows`, and resume
the same run with **R**. If time or credits are tight, show the checkpoint code
and the corresponding offline test instead, clearly labeling it as a test.

> "Durable results can be reused. They are not permission to reuse evidence
> after the source changes, or a guarantee of exactly-once external writes."

## 8:00 - Close on adaptation

Ask what one measured workflow change would improve quality and useful
throughput. Mention that model choices and budget limits belong to the user;
the demo does not secretly choose or replace them.

## Honest fallback

If live Copilot is unavailable, run:

```powershell
npm run demo:offline
```

Keep the `"simulation": true` field visible and say:

> "This exercises the JavaScript body with scripted responses. No model ran.
> It demonstrates the control flow, not live registration, billing, permissions,
> or agent quality."

Stop rather than presenting the fallback as a successful live run.
