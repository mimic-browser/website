# What changes with Optimize?

Optimize tests what your workload can stop downloading, then measures the saved
profile with the same assertions. Savings depend on what your automation does.

## A complete extraction example

Books to Scrape extraction, five matched local runs for each configuration:

| Measurement | Ordinary Mimic | With Optimize |
| --- | ---: | ---: |
| Encoded HTTP body bytes | 284,591 | 5,276 |
| Acquired responses | 29 | 1 |
| Median workload time | 1.38 s | 1.17 s |
| Browser CPU | 1,469 ms | 1,172 ms |
| Sampled peak RSS | 185.4 MiB | 153.3 MiB |
| Workload assertions | 5/5 passed | 5/5 passed |

The workload extracts server-rendered product data. It needs the document;
images and other page resources are not required by its assertions. This example
shows what specialization can save, not a guarantee of comparable savings on a
JavaScript-heavy site. Encoded body bytes are not physical wire traffic.

## Dynamic pages and changing states

React documentation was validated across three article states. Each optimized
state passed five final local runs. A previous separate live activation also
passed. Default local replay of the dynamic page was uncovered, so there is no
matched default-versus-optimized percentage to publish for that case.

A GitLab navigation profile passed local checks, but the next live document
changed. Its guard selected normal Mimic and the trained acquisition savings
were lost. Supabase final profile validation encountered an unrecorded telemetry
request and did not install a profile. Several other dynamic scenarios failed
required default interactions and were not treated as optimizer successes.

These are useful limits: passing one recorded state does not prove that a future
site state is covered. Keep your assertions, check live results, and retrain when
relevant page behavior changes.

See [methodology](benchmarks.md), [profile lifecycle](profiles.md),
[safety](safety.md) and the
[full technical research record](https://github.com/mimic-browser/runtime/blob/main/docs/performance/workload-optimization-multistate-heavy.md).

The browser memory, CPU and throughput comparisons on the homepage use separate
controlled Chrome 152 measurements. They are not the same workload as this
network-acquisition example. The [browser benchmark page](/benchmarks/) records
those measurements and their limitations.
