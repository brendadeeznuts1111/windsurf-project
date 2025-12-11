// worker.ts — Your arb hunter, compiled to standalone
import { scrapeOdds } from "./odds-proxy";  // Bundled in

async function hunt() {
  const opps = await scrapeOdds("draftkings", "soccer-epl-456");
  // Calc arb, claim via control plane
  if (opps.profitBps > 50) {
    await fetch("http://control:6969/api/opportunities", {
      method: "POST",
      body: JSON.stringify(opps),
    });
  }
}

setInterval(hunt, 100);  // Sub-second hunts