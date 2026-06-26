# Service Blueprint Mini

Map your service flow from first contact to final handoff.

![Service Blueprint Mini preview](docs/preview.svg)

Service Blueprint Mini is a local-first delivery board for consultants, agencies, and solo operators who want a clearer service journey. It makes weak handoffs, slow value moments, and fragile delivery steps visible before they start hurting trust.

## What it does

- ranks service stages by fragility, leverage, friction, and time-to-value
- tracks **owner**, **handoff**, **health**, and **time-to-value** for each stage
- highlights the weakest current step, the fastest value moment, and the highest leverage fix
- includes quick actions for strengthening a handoff, marking a stage reliable, and raising a red flag when service quality slips
- renders a weak-point queue and journey mix beneath the main board
- saves locally in the browser with JSON import/export backups

## Why it feels different

Service Blueprint Mini is not a generic task board. It is built around the client experience itself, so you can tune delivery flow, remove hidden friction, and make the service feel smoother from intake through expansion.

## Quick start

```bash
git clone https://github.com/get2salam/service-blueprint-mini.git
cd service-blueprint-mini
python -m http.server 8000
```

Then open <http://localhost:8000>.

## Keyboard shortcuts

- `N` creates a new stage
- `/` focuses the search box

## Data shape

```json
{
  "boardTitle": "Service blueprint",
  "items": [
    {
      "title": "Fast discovery intake",
      "category": "Intake",
      "state": "Reliable",
      "score": 9,
      "health": 8,
      "ttv": 30,
      "owner": "Founder",
      "handoff": "Discovery call -> scoped summary"
    }
  ]
}
```

## Blueprint sanity check

A tiny CLI flags **calibration conflicts** inside an exported backup — places where two signals about a stage disagree, like a stage tagged `Fragile` whose health score is `9/10`, or a `Signature` stage with sub-par health.

```bash
node bin/sanity-check.mjs path/to/service-blueprint-mini.json
npm test
npm run verify
```

`npm run verify` runs the Node test suite and a fixture-backed CLI smoke check, matching the GitHub Actions workflow used for pull requests and pushes to `main`.

Exit codes: `0` clean, `1` issues found, `2` usage or read error. See [docs/sanity-check.md](docs/sanity-check.md) for the rule list and a worked example.

## Runnable review example

The repository includes a deliberately at-risk export at `examples/at-risk-blueprint.json` so contributors can see the sanity checker without hand-writing a backup first:

```bash
npm run example:review
```

The example runner prints the same report as the CLI but exits successfully after confirming the fixture still demonstrates four review findings. That keeps the docs runnable in `npm run verify` while preserving the CLI's normal non-zero exit when a real backup contains issues.

## Handoff readiness brief

For a fast delivery-review ritual, generate a ranked handoff brief from any exported backup:

```bash
node bin/handoff-brief.mjs test/fixtures/clean-blueprint.json
npm run example:brief
```

The brief sorts stages by reliability risk, placeholder ownership, handoff clarity, friction, and time-to-value pressure. It gives a short next action for the top stages so a client-delivery review can move from board data to concrete fixes without opening the browser UI.

## Privacy

Everything stays in your browser unless you export a JSON backup.

## License

MIT
