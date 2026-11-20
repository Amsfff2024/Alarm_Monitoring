# RAN Operations Intelligence — Development Roadmap

**Repository:** `Amsfff2024/Alarm_Monitoring`  
**Scope:** All modules  
**Depth:** Expert  
**Primary data source:** Existing Google Sheets feeds and their current fields  
**Compatibility strategy:** additive, non-breaking, branch-first delivery

## Product objective

Evolve the existing Alarm Monitoring and Site Issue dashboard into a unified RAN Operations Intelligence workspace that explains **what is happening, where it is happening, how often it repeats, how severe/old it is, who owns the action (only if supplied), and what should be prioritized**.

The product must distinguish alarm events from site issues. A high alarm count is not automatically a high number of affected sites.

## Target information architecture

1. **Operations Overview** — data freshness, alarm/site issue health, priority queue, trends.
2. **Alarm Intelligence** — volume, severity, status, vendor, alarm source, alarm-name Pareto, recurrence, repeat sites.
3. **Site Issue Intelligence** — Open/Closed, category, circle, aging, site drilldown, closure movement when history exists.
4. **PIC & SLA Monitoring** — owner/PIC, ticket, due date, SLA and overdue only when those fields exist in the source.
5. **RCA Intelligence** — root-cause distribution, recurring alarm/site patterns, unresolved root-cause coverage.
6. **Site Intelligence** — site profile and geographic view only if valid coordinates or a trusted site-coordinate source is supplied.
7. **Data Quality & Refresh** — source status, row counts, schema validation, duplicate/missing fields, refresh history and stale state.

## Delivery phases

### Phase 0 — Baseline and source validation
**Deliverables**
- Source audit and roadmap (this document set).
- Capture actual Google Sheets headers, sample rows, source date semantics, status/severity values, and refresh permissions.
- Establish a known-good baseline for the current three pages.

**Exit criteria**
- Existing navigation, charts, filters, drilldown, exports and print behavior are recorded.
- Source contracts are confirmed rather than inferred from UI labels.
- No production page has been replaced.

### Phase 1 — Stabilize data ingestion and correctness
**Deliverables**
- Shared CSV parser that supports quoted commas, escaped quotes, CRLF and quoted newlines.
- Schema/alias validation with required and optional fields.
- Explicit raw-to-normalized mappings for status, severity, dates, vendor and region.
- Safe handling of Unknown/blank values.
- Refresh controller with in-flight protection, timeout, last-good-data retention, visible stale/error status.
- Consistent CSV escaping and safe DOM rendering.

**Exit criteria**
- Invalid or ambiguous source values are not silently reclassified.
- A failed refresh does not erase the last successful dataset.
- Record counts and unique entity counts are independently verified.

### Phase 2 — Unified data and filter engine
**Deliverables**
- Canonical `AlarmRecord` and `SiteIssueRecord` models.
- Shared filter state across KPI, chart, table, drilldown and export within each module.
- Explicit metric definitions and denominators.
- Deduplication rules based only on confirmed source keys; otherwise report source-row counts.
- Date parsing based on confirmed source format/time zone.

**Exit criteria**
- Filtered totals reconcile with filtered table rows.
- Every chart and export reflects the same selected population.
- Alarm records, tickets and unique sites are never conflated.

### Phase 3 — Alarm Intelligence
**Deliverables**
- Alarm volume and status trends by date.
- Severity distribution and priority queue.
- Top alarm names (Pareto), vendor, region/circle and alarm-source breakdowns.
- Top affected sites and site drilldown.
- Recurrence/repeat-failure views with clearly defined grouping key and time window.
- Ticket coverage and root-cause coverage where supplied.

**Exit criteria**
- Each insight is traceable to source records.
- Repeat logic documents whether it groups by site + alarm name, ticket, or another verified key.
- No unsupported impact/severity scoring is fabricated.

### Phase 4 — Site Issue Intelligence
**Deliverables**
- Reconciled site issue KPIs and category/circle breakdowns.
- Aging buckets with explicit boundaries and source timestamp.
- Open/Closed register with synchronized filters and exports.
- Closure progress/trend only when historical snapshots or dated status changes are available.
- Site detail page using the existing site fields.

**Exit criteria**
- Site counts are distinct from issue-record counts.
- Aging is calculated consistently and validated against source examples.
- No historical closure trend is inferred from a single current snapshot.

### Phase 5 — PIC, SLA and action intelligence
**Deliverables**
- PIC workload, unassigned items, action status, ticket linkage.
- SLA due/overdue segmentation and response/restore duration.
- Work queue prioritization.

**Data gate**
Only implement dimensions for which the existing sheet contains reliable PIC/owner, timestamps, due date, SLA target and action/status fields. If absent, display a clear “not available in source” state and publish the required field specification rather than synthesizing values.

### Phase 6 — RCA and recurrence intelligence
**Deliverables**
- Root-cause Pareto and RCA completeness.
- Repeat site/alarm combinations.
- Recurrence intervals and repeat-after-closure analysis where timestamped history exists.
- Recommended action library only if approved operational mappings are supplied.

**Data gate**
A current-state export without event history cannot prove recurrence, MTTR, or post-closure reoccurrence. These require historical snapshots or event-level timestamps.

### Phase 7 — Site/geospatial intelligence
**Deliverables**
- Site map, cluster and regional distribution.
- Site detail joined to alarm and issue records.
- Geographic concentration and nearest-site views only if coordinates are present and validated.

**Data gate**
No coordinates, TAC, MME, transport dependency, vendor hardware or topology are to be invented. Use only source fields or a separately approved inventory feed.

### Phase 8 — Unified portal, performance and operational release
**Deliverables**
- Main navigation linking every module.
- Common theme, responsive layout and consistent filter patterns.
- Lazy loading for heavy modules, pagination/virtualization for large tables.
- Regression checklist, source documentation, versioning and release notes.

**Exit criteria**
- All original workflows remain available.
- Mobile and desktop smoke tests pass.
- Data freshness and source failures are visible.
- No new dependency is required for core functionality unless documented with a fallback.

## Priority backlog

| Priority | Work item | Why |
|---|---|---|
| P0 | Add Alarm2 to navigation | Existing module is currently not discoverable from the inspected shell |
| P0 | Validate source schemas/date/status/severity | Prevent misleading KPIs and aging |
| P0 | Fix CSV parsing and safe rendering | Data integrity and security |
| P1 | Unify filter state and metric definitions | Cross-view consistency |
| P1 | Add data freshness and last-good-data handling | Operational reliability |
| P1 | Alarm trend/Pareto/vendor/region | Core alarm intelligence |
| P1 | Site issue reconciliation and aging | Core site operations |
| P2 | Recurrence and repeat failure | Requires reliable event keys and timestamps |
| P2 | PIC/SLA intelligence | Requires PIC and SLA source fields |
| P2 | RCA intelligence | Requires reliable root cause and history |
| P3 | Geospatial intelligence | Requires validated coordinates |
| P3 | Performance optimization and release hardening | Scale and maintainability |

## Proposed module architecture

```text
index.html
  └── Main navigation / application shell
      ├── alarm.html                 (compatibility entry point)
      ├── Alarm2.html                (compatibility entry point)
      └── modules/
          ├── operations-overview/
          ├── alarm-intelligence/
          ├── site-issue-intelligence/
          ├── pic-sla/
          ├── rca-recurrence/
          ├── site-intelligence/
          └── data-quality/

assets/
  ├── css/
  └── js/
      ├── data/
      ├── parsing/
      ├── normalization/
      ├── metrics/
      ├── filters/
      ├── charts/
      └── export/
docs/
  ├── SOURCE_AUDIT.md
  └── ROADMAP.md
```

The proposed tree is a target architecture, not a claim that these files or modules already exist. Refactor incrementally and retain the current HTML entry points until each replacement passes regression checks.

## Data contract checklist

Before building advanced metrics, verify the following from the existing sheets:

- Stable unique row key or a documented composite key.
- Timestamp field meaning (first occurrence, report date, update date, or snapshot date).
- Source timezone and date format.
- Complete set of raw status and severity values.
- Whether one row represents one alarm event, one active alarm, one ticket, or one site issue.
- Whether ticket IDs can repeat across alarm rows.
- Whether root cause and PIC fields are populated consistently.
- Whether historical snapshots are available.

## Release discipline

- Work on a feature branch; do not directly overwrite the default branch during the audit.
- Make small, reviewable commits.
- Keep the existing source files intact until a replacement is verified.
- For each phase, compare old/new KPI totals and test representative filters, drilldowns, refresh failure, exports and mobile layout.
- Promote only after source reconciliation and regression checks pass.
