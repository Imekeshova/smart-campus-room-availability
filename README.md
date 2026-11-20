# Software Engineering — Assignment 05
**Imekeshova Malika · 24B031819 · KBTU · 20 November 2026**

The PDF contains Tasks 01–10 in the order of the brief. The release decision for the supplied final version is **CONDITIONAL for a supervised classroom demo**, with agent readiness **2/3, Documented**.

[Deployed application](https://assignment-5-smart-c-g8ti.bolt.host/) · [Editable Bolt project](https://bolt.new/~/sb1-sjy8mrtr)

| Item | Contents |
|---|---|
| SoftwareEngineering_Assignment05_24B031819.pdf | Report with the risk register, readiness audit, two mitigation records, safeguards, decision, reflection, references and AI appendix. |
| source-exports/ | Original, unchanged Bolt ZIPs. The archive ending in rnfy6z5k is the baseline. The archive ending in sjy8mrtr is the final, including its original dist files. |
| baseline/ and final/ | Ready-to-inspect source trees extracted from the two exports, with generated dist omitted. README.md and AGENTS.md for the submitted version are in final/. |
| evidence/acceptance-criteria.md | Five acceptance criteria with test references. |
| evidence/risk-register.md | Ranked findings with evidence, ownership, controls and residual scores. |
| evidence/ai-use.md | Dated prompt and decision record with human and assistant evidence labelled. |
| evidence/screenshots/ | Nine original captures. Figure captions in the report identify the relevant captures. |
| evidence/logs/ and evidence/run-summary.json | Independent command logs and exit codes for baseline, red and final runs plus separate function and UI checks. |
| evidence/source-changes.patch and evidence/export-comparison.json | Four source-level changes and SHA-256 source manifests. |
| evidence/build-comparison.json | SHA-256 values of all three locally rebuilt and uploaded dist files. |
| evidence/proposal-review/ | Earlier reconstructed, unaccepted Bolt proposal, its compiler diagnostics and experiment. The “fixed” column is the review candidate at that date. Use logs/final-direct.json for the submitted source. |
| evidence/checks/ | Reproducible function and built-DOM supplemental checks. Project dependencies were unchanged. |

## Run the project
Use a fresh copy of either source tree. The independent rerun used Node 24.22.3 and npm 11.19.1. The repository does not pin those tools.

```sh
npm ci
npm run dev
```

Run each command from the version being checked:

```sh
npm test -- --pool=threads --poolOptions.threads.singleThread --reporter=verbose
npm run typecheck
npm run lint
npm run build
```

For the red phase, make a separate working copy of baseline/ and place final/src/lib/explain.test.ts at the same path in that copy. Run npm ci and the test command there. The four new failures are expected. Keep original source exports intact.

From the submission root, run the optional function probes with the checked Node version:

```sh
node evidence/checks/check-validators.mjs baseline --baseline
node evidence/checks/check-validators.mjs final
```

The three supplemental UI checks can be repeated after building final/. Supply the absolute path to an independently installed jsdom 26.1.0 package as the last argument. The test helper is outside the app.

```sh
node evidence/checks/ui-checks.cjs final/dist /absolute/path/to/jsdom
```

The student Terminal screenshot documents the red run. The final Bolt screenshot records the agent's green summary. The separate final-test.txt records the independent rerun from the actual final ZIP. The student Preview capture documents one overlap scenario. The jsdom log documents three synthetic DOM interactions with the rebuilt React application. Temporary Bolt probes, independent function checks and DOM checks are excluded from the 61 permanent Vitest cases.
