// worker-task.js - Simple echo worker for Bun Workers example
// Demonstrates zero-copy message passing

self.onmessage = (e) => {
  // Echo the message back with zero-copy (no serialization)
  self.postMessage(e.data);
};