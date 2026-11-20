# Alarm_Monitoring — Source Code Audit

**Audit scope:** repository source files on `main`  
**Audit date:** 2026-11-20  
**Approach:** static source review; no live Google Sheets credentials or browser runtime were exercised.

## 1. Repository inventory

| File | Observed role | Existing behavior to preserve |
|---|---|---|
| `index.html` | Navigation shell and iframe host | Sidebar collapse, light/dark theme, page title, responsive iframe loading, clock |
| `alarm.html` | Site issue / closure executive dashboard | Google Sheets CSV refresh, KPI cards, Chart.js charts, open/closed tree breakdown, filters, site register, CSV export, print |
| `Alarm2.html` | Alarm/PIC monitoring dashboard | Google Sheets CSV loading, priority/region filters, KPI cards, top-10 sites, site drilldown, sortable table, CSV export |
| `README.md` | Repository introduction | Currently minimal; expand as documentation is added |

## 2. Key findings

### P0 — Navigation and discoverability
- The current `index.html` sidebar exposes a single `BLANK NAV` entry loading `alarm.html`.
- `Alarm2.html` exists but is not exposed as a navigation destination in the inspected shell.
- The shell uses an iframe, which is a reasonable low-disruption way to preserve the existing standalone pages. Keep this behavior during the first refactor.

### P1 — Data correctness and consistency
- `alarm.html` starts with hardcoded summary arrays and a large embedded site-record snapshot, then attempts to replace them with a Google Sheets CSV feed. Its fallback state therefore needs an explicit source timestamp/status and must not be presented as live.
- In `alarm.html`, the global dashboard filters operate on summary aggregates, while the detailed site register has a separate filter set. The two views can therefore show different populations.
- The global filter refresh currently updates only selected charts; circle and aging charts are not consistently rebuilt from the same filtered population.
- The detailed register attaches two input listeners to the same filter controls, causing duplicate render calls.
- The action-description chart is not backed by a field in the live nine-field mapping and should remain clearly marked unavailable/not supplied unless a source column is confirmed.
- In `Alarm2.html`, KPI calculations use `allData`, while the top-site and table views use `filteredData`. This may be intentional, but the distinction between total and filtered KPIs must be explicit.
- Alarm2's status normalization treats every value that does not contain “close” as Open. Unknown, blank, cancelled, or other statuses can be misclassified.
- Alarm2's priority mapping defaults unrecognized/blank severity to P4. Unknown severity should be retained as Unknown until a source mapping is confirmed.
- Alarm2's slash-date parsing assumes MM/DD/YYYY. Ambiguous date formats can distort displayed dates and aging; the source date format must be verified before changing the parser.
- Alarm2's CSV parser is line-oriented. Quoted commas are handled, but quoted fields containing embedded newlines are not robustly supported.
- The site search uses substring matching. Exact Site ID lookup should be available separately from partial search.

### P1 — Rendering and safety
- Several Alarm2 views build HTML strings from spreadsheet values. Values such as region, alarm name, site ID, vendor, cluster, and ticket ID should be escaped or rendered with DOM text APIs before insertion.
- Dynamic values are interpolated into inline event-handler attributes in the top-site table. Replace this with delegated event listeners and data attributes.
- CSV exports should quote and escape every field consistently, including commas, quotes, and line breaks.

### P2 — Reliability and maintainability
- Both dashboard pages use direct Google Sheets CSV URLs and browser-side fetch. This requires the published sheet to remain accessible and may be affected by browser/network/CORS behavior.
- `alarm.html` refreshes every five minutes without an in-flight guard. Repeated manual/automatic requests should be serialized or aborted.
- Error handling in Alarm2 is primarily alert-based; it should preserve the last successful dataset and show a visible stale/error state.
- The pages contain substantial inline CSS and JavaScript. Move shared helpers and page logic into versioned local assets only after behavior is covered by regression checks.
- No automated test/build setup or meaningful repository documentation was observed in the inspected files.

## 3. Current data contracts observed

### Site issue feed (`alarm.html`)
The current CSV normalizer recognizes these fields:
- Site ID
- Site Name
- Site Category
- Status NMS
- Circle
- Status
- aging_days
- Aging Category
- Category

The current live loader requires Site ID and Status. Other fields are optional in code, but their absence reduces analysis coverage.

### Alarm/PIC feed (`Alarm2.html`)
The current parser reads:
- Site ID
- Date
- Fault Level or Raw Severity
- Status
- Ticket ID
- Vendor
- Alarm Source
- New_Region or Location
- MC Cluster
- Alarm Name
- Root cause

These are observed field references, not a guarantee that every source row contains every column.

## 4. Non-breaking engineering rules

1. Keep the existing three HTML entry points working while introducing modules.
2. Keep Google Sheets as the primary source; do not silently replace it with invented or generated records.
3. Preserve raw source values alongside normalized values.
4. Unknown values remain Unknown; never silently coerce them to a favorable or unfavorable category.
5. Every KPI/chart/table must declare its unit and population (alarm records, unique sites, unique tickets, or issue records).
6. Filters must derive every connected KPI, chart, table, and export from one shared filtered dataset.
7. Show data source, last successful refresh, record count, and stale/error state.
8. Keep existing CSV export and print workflows.
9. Do not introduce new third-party dependencies without a clear need and a fallback strategy.

## 5. Recommended canonical model

Use separate entities instead of mixing site-level and alarm-level counts:

- **AlarmRecord:** source row identity, raw date, parsed timestamp, site ID, alarm name, severity raw/normalized, status raw/normalized, ticket ID, vendor, alarm source, region, cluster, root cause.
- **SiteIssueRecord:** source row identity, site ID/name, site category, NMS status, circle, issue status, aging days/category, issue category.
- **SiteDimension:** only attributes actually supplied by the existing source(s); do not infer coordinates, TAC/MME, transport path, or hardware inventory.
- **DataQualityIssue:** source, row number/key, field, raw value, validation code, and message.

Use distinct metrics for total alarm records, unique alarm names, unique sites, unique tickets, open alarm records, closed alarm records, site issue records, and unique affected sites.

## 6. Verification limitations

This audit is static. It did not authenticate to Google Sheets, execute the pages in a browser, validate live sheet headers/values, inspect the actual publication permissions, or verify production behavior on mobile browsers. Those checks are explicit gates in Phase 0/1 of the roadmap.
