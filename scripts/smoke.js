#!/usr/bin/env node
import { formatSearchResult, searchWithMiMo } from "../src/mimoClient.js";

const query = process.argv.slice(2).join(" ").trim() || "What are the latest Xiaomi MiMo model updates?";

try {
  const result = await searchWithMiMo({
    query,
    force_search: true,
    max_keyword: 2,
    limit: 2
  });
  console.log(formatSearchResult(result));
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
