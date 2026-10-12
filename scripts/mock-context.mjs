export function createMockContext(args, agent, state = {}) {
  const journal = state.journal ?? new Map();
  const checkpoints = state.checkpoints ?? new Set();
  const calls = [];
  const logs = [];
  const phases = [];
  let parallelCalls = 0;
  const signal = new AbortController().signal;
  const ctx = {
    args,
    runId: "offline-simulation",
    signal,
    log(message) {
      logs.push(message);
    },
    phase(title) {
      phases.push(title);
    },
    async agent(prompt, options) {
      const key = `agent:${JSON.stringify([prompt, options])}`;
      if (journal.has(key)) return structuredClone(journal.get(key));
      calls.push({ prompt, options });
      const result = await agent(prompt, options);
      journal.set(key, structuredClone(result));
      return result;
    },
    async step(key, producer, options = {}) {
      if (!options.volatile && journal.has(key)) return structuredClone(journal.get(key));
      const result = await producer();
      if (!options.volatile) journal.set(key, structuredClone(result));
      return structuredClone(result);
    },
    async parallel(thunks) {
      parallelCalls += 1;
      // Tests inject null explicitly; thrown failures propagate in this mock.
      return Promise.all(thunks.map((thunk) => thunk()));
    },
    async pause(key) {
      if (checkpoints.has(key)) return;
      checkpoints.add(key);
      throw new Error("MOCK_PAUSED");
    },
  };
  return {
    ctx,
    calls,
    logs,
    phases,
    journal,
    checkpoints,
    get parallelCalls() {
      return parallelCalls;
    },
  };
}
