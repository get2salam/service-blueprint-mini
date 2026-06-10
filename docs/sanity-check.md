# Blueprint sanity check

A small CLI that reads an exported backup and flags **calibration conflicts** inside the blueprint — places where two signals about the same stage disagree, or where a default placeholder field was never filled in.

It is not a schema validator. The importer already rejects malformed shapes. This tool answers a different question: *does the data we have tell a coherent story about the service?*

## Rules

| Rule id | Triggers when |
| --- | --- |
| `state-health-fragile-but-healthy` | `state` is `Fragile` but `health` is `>= 8` — the badge and the score disagree. |
| `state-health-signature-but-weak` | `state` is `Signature` but `health` is `<= 5` — flagship stage with shaky internals. |
| `placeholder-owner` | `owner` is empty or still set to the seed default `Owner`. |
| `placeholder-handoff` | `handoff` is empty or still set to a seed default. |
| `ttv-out-of-range` | `ttv` (time-to-value, minutes) sits outside the plausible `5..480` window. |

## Run it

```bash
node bin/sanity-check.mjs path/to/service-blueprint-mini.json
```

Exit codes: `0` clean, `1` one or more issues, `2` usage or read error.

## Worked example

Given a backup with one obviously miscalibrated stage:

```json
{
  "items": [
    {
      "title": "Onboarding",
      "state": "Fragile",
      "health": 9,
      "owner": "Owner",
      "handoff": "Stage handoff",
      "ttv": 720
    }
  ]
}
```

The CLI prints:

```
Found 4 calibration issue(s) across 1 stage(s):
  - [state-health-fragile-but-healthy] Onboarding: state "Fragile" but health 9/10 — pick one signal
  - [placeholder-owner] Onboarding: owner still set to the default placeholder
  - [placeholder-handoff] Onboarding: handoff still set to the default placeholder
  - [ttv-out-of-range] Onboarding: time-to-value 720 min is outside the plausible 5..480 window
```

## Tests

```bash
node --test test/sanity-check.test.mjs
```
