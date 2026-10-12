import { defineWorkflow, joinSession } from "@github/copilot-sdk/extension";
import { metadata, runDeliveryReadiness } from "./workflow.mjs";

const deliveryReadiness = defineWorkflow({
  meta: metadata,
  run: runDeliveryReadiness,
});

await joinSession({ workflows: [deliveryReadiness] });
