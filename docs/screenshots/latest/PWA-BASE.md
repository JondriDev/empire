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

**Base-path check: ✅ PASS**
