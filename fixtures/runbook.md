# Beacon CLI runbook

## Before release
Run the formatter tests and inspect the dry-run output on a sample directory.
Record the exact commit and package version used for verification.

## Rollout
The demo maintainer approves publication after reviewing acceptance evidence.
Publication is out of scope for the delivery-readiness workflow.

## Recovery
TODO: name the known-good version and write the rollback steps.
Keep the original files available until the release has been accepted.

## Stop condition
A failed check blocks publication and must be reported, not retried until lucky.
