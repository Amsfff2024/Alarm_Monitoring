# Alarm_Monitoring

RAN operations monitoring workspace.

## Current pages
- `index.html` — main navigation shell.
- `alarm.html` — site issue and closure monitoring.
- `Alarm2.html` — alarm/PIC monitoring.

## Development
The current dashboards use existing Google Sheets CSV feeds. Do not treat embedded snapshots as live data. Preserve source provenance and distinguish alarm records, tickets, site issues and unique sites.

## Documentation
- [Source code audit](docs/SOURCE_AUDIT.md)
- [RAN Operations Intelligence roadmap](docs/ROADMAP.md)
- [Data ingestion smoke tests](tests/ingestion-smoke-test.html)
- Shared browser data utilities: `assets/js/ran-data.js`

The audit is static; live source schemas, date semantics, publication access and browser behavior must be verified before implementing advanced metrics.
