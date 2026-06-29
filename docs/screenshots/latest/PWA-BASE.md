# Empire QA — Base-path + install-flow (EPIC-4 S3)

**Built with base:** `/empire/`

| Surface | Result |
|---|---|
| index.html assets prefixed | ✅ |
| manifest linked + prefixed | ✅ |
| sw navigateFallback | ✅ /empire/index.html |
| registerSW url + scope | ✅ /empire/sw.js / /empire/ |
| manifest start_url/scope relative | ✅ both `.` |
| manifest id stable non-root | ✅ `empire` |

## Installability (EPIC-4 S4)

| Criterion | Result |
|---|---|
| name + short_name | ✅ |
| icon ≥192px (any) | ✅ |
| icon ≥512px (any) | ✅ |
| maskable icon | ✅ |
| display standalone-ish | ✅ `standalone` |
| start_url | ✅ |
| background_color + theme_color | ✅ |

**Installable: ✅ PASS**

**Base-path + install check: ✅ PASS**
