// One-off source-content assertions for the campaign status model. Run with:
//   node scripts/checks/campaign-status.mjs
// (The lib modules use the Next "@/" alias-free pure-ESM style but the repo is
//  not type:module, so we assert over source text rather than importing.)
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const read = (p) => readFile(resolve(root, p), "utf8");
let failures = 0;
const ok = (cond, msg) => { if (!cond) { failures++; console.error("FAIL:", msg); } };

const cs = await read("src/lib/campaignStatus.js");

// EN labels re-mapped
ok(/SCHEDULED:\s*"Scheduled"/.test(cs), 'EN SCHEDULED label is "Scheduled"');
ok(/ACTIVE:\s*"Ongoing"/.test(cs), 'EN ACTIVE label is "Ongoing"');
ok(/COMPLETED:\s*"Complete"/.test(cs), 'EN COMPLETED label is "Complete"');
ok(!/"Upcoming"|"Live"|"Completed"/.test(cs), "no stale EN labels (Upcoming/Live/Completed)");
// NP labels re-mapped
ok(/SCHEDULED:\s*"मिति तय"/.test(cs), "NP SCHEDULED label is मिति तय");
ok(/ACTIVE:\s*"चलिरहेको"/.test(cs), "NP ACTIVE label is चलिरहेको");
ok(!/"आउँदै"|"लाइभ"/.test(cs), "no stale NP labels (आउँदै/लाइभ)");
// PAUSED present as a known status + label, but NOT in the sequence
ok(/PAUSED:\s*\{\s*key:\s*"PAUSED",\s*kind:\s*"event",\s*visual:\s*"paused"\s*\}/.test(cs),
  "PAUSED entry in CAMPAIGN_STATUSES with visual paused");
ok(/PAUSED:\s*"रोकिएको"/.test(cs) && /PAUSED:\s*"Paused"/.test(cs), "PAUSED labels np+en");
const seqMatch = cs.match(/CAMPAIGN_STATUS_SEQUENCE\s*=\s*\[([\s\S]*?)\]/);
ok(seqMatch && !/PAUSED/.test(seqMatch[1]), "CAMPAIGN_STATUS_SEQUENCE does NOT contain PAUSED");

const ia = await read("src/lib/issueActions.js");
ok(/case\s+"PAUSED":\s*\n\s*return\s*\{\s*label:\s*"paused",\s*roleScope:\s*\[\],\s*joinable:\s*false\s*\};/.test(ia),
  "eventJoinPhase has explicit PAUSED no-join case");

if (failures) { console.error(`\n${failures} assertion(s) failed.`); process.exit(1); }
console.log("campaign-status checks passed.");
