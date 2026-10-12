# Beacon CLI release plan

## Scope
Ship version 0.2 of a fictional command-line tool that formats local text files.
The release must preserve existing command names and file contents.

## Acceptance
- Formatting is idempotent: running the formatter twice produces the same bytes.
- Dry-run mode prints proposed changes without writing files.
- TODO: record the Windows dry-run test result before declaring readiness.

## Ownership
The demo maintainer owns local verification and the final release decision.
Reviewers can report gaps; they cannot publish, deploy, or change this plan.

## Release gate
Do not release while acceptance evidence is incomplete.
