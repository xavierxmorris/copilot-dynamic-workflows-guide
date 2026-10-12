import { readFile } from "node:fs/promises";
import { readSnapshot, runDeliveryReadiness } from "../.github/extensions/delivery-readiness/workflow.mjs";
import { createMockContext } from "./mock-context.mjs";

const args = JSON.parse(await readFile(new URL("../examples/workflow-input.json", import.meta.url), "utf8"));
const snapshot = await readSnapshot(args.documents);
const mock = createMockContext(args, async (_prompt, options) => {
  const id = options.schema.properties.document.const;
  const document = snapshot.documents.find((item) => item.id === id);
  const lines = document.content.split("\n");
  const index = lines.findIndex((line) => line.includes("TODO:"));
  if (index === -1) throw new Error(`Offline fixture ${id} no longer contains its expected TODO.`);
  return {
    document: id,
    findings: [{
      severity: "blocking",
      message: "This fixture deliberately leaves required release evidence incomplete.",
      startLine: index + 1,
      endLine: index + 1,
      quote: lines[index],
    }],
  };
});
const result = await runDeliveryReadiness(mock.ctx);
console.log(JSON.stringify({
  simulation: true,
  notice: "Scripted responses, not a Copilot workflow run. No model or AI credits used.",
  phases: mock.phases,
  logs: mock.logs,
  result,
}, null, 2));
