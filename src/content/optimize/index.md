# Optimize your workload

Optimize learns which network traffic an ordinary CDP workload can avoid. Your existing assertions define success.

## Quickstart

```sh
mimic optimize --name shop -- node scraper.js
mimic --profile shop
```

The workload can be any executable, including Python, a test runner or a compiled program. Optimize chooses a private free port and supplies `MIMIC_CDP_URL`. An ordinary Mimic listener can stay running on `:9222`. Use `--endpoint-env NAME` for an existing endpoint setting. For a hardcoded endpoint, choose it explicitly with `--listen 127.0.0.1:9222`; that address must be free. Optimize never silently trains against a different running instance.

## How optimization works

Mimic remains a general browser runtime. Training runs your command, records one successful network environment to disk, validates local replay, searches resource combinations, then measures the selected profile.

Training does not contact the website again during candidate search. The resulting profile runs against the live network in ordinary Mimic. It does not replay captured results. Read about [workload assertions](workloads.md) and [recording and replay](replay.md).

## Using a profile

```sh
mimic optimize --output ./shop.mprofile -- python scraper.py
mimic --profile ./shop.mprofile
mimic optimize --inspect shop
```

Profiles and captures are managed below the user configuration directory, under `Mimic`. `MIMIC_DATA_DIR` selects a different directory. See [profile lifecycle](profiles.md) for reuse and [manual controls](manual-policy.md) for explicit policy configuration.

## Multi-state workloads

For workloads with several ordinary input states, use the optional [multi-state workflow](workloads.md#multiple-workload-states). One generated plan must pass every supplied state. This strengthens validation without claiming correctness for untested inputs.

## Safety & limitations

This is an empirically validated feature: read the [safety limits](safety.md) before using it for production data. Captures can contain credentials and personal data. Protect their directory as you would a browser profile.

Use [troubleshooting](troubleshooting.md) to diagnose rejected training, and consult the [benchmark methodology](benchmarks.md) and [dynamic results](results.md) when interpreting measured improvements.
