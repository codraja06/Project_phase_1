# Operations Analytics exports

Open **Authority → Operations Analytics**, choose **7 Days**, **30 Days**, or **All Time**, and select an export.

- **Excel (.xlsx)** downloads a real workbook with **Operations Summary** and **Incidents** sheets. The summary includes status totals, high/urgent priorities, verified reports, resolution rate, valid average resolution hours and category counts. The Incidents sheet contains a filterable named Excel table.
- **Power BI (.csv)** downloads one row per complaint for Power BI import. This is an importable dataset, not a `.pbix` dashboard or a live Power BI connection. Excel can also be imported using its Incidents table.

In Power BI Desktop, select **Home → Get data → Text/CSV**, choose the downloaded CSV and select **Transform data** or **Load**. Keep ComplaintId as text, Verified as true/false, timestamps as Date/Time/Timezone, ResolutionHours/Latitude/Longitude as decimal numbers, and CreatedDateUTC as Date. Use Status on a chart axis and count ComplaintId for the values. Use Category and Priority as slicers. Export and replace the source file when a new snapshot is needed.

The selected period filters **complaint creation time**, not resolution time. Status represents the current recorded status at export. Timestamps and date/month grouping columns use **UTC**. Missing or reversed resolution timestamps are excluded from resolution-hour calculations. Reports do not invent ward or SLA values. Personal contact details, authentication tokens and photo URLs are not exported. Tamil text is preserved in both formats; CSV uses UTF-8 with a BOM, quoted fields and formula-injection protection.

## Runtime and verification

The authenticated Officer-only endpoint is `GET /api/authority/analytics/export?format=xlsx&period=7d`. Supported formats are `xlsx` and `csv`; periods are `7d`, `30d`, and `all`. Exports use a new database snapshot, so a recently updated complaint can differ from an older page view until refresh.

Browser downloads use the normal download prompt. Android/iOS prepare a file and open the system share sheet for saving/sending. Successful native files remain in the OS-managed cache so receiving applications can read them. Mobile sharing requires a new native build containing the SDK-compatible `expo-sharing` module; it has not been verified on a physical phone.

Dependencies added: backend `exceljs` for runtime XLSX generation; mobile `expo-file-system` and `expo-sharing` for native file handling. Restart the backend after installing dependencies. Refresh the browser for the new controls.

Verification on 19 October 2026: backend build and 43 tests passed, including seven export tests for role guards, format/period validation, typed workbook contents, empty reports, Unicode/CSV safety and date filtering. Mobile TypeScript and Android JavaScript export passed. An isolated real backend/browser download test opened the generated XLSX, verified its table/row totals, downloaded the selected-period CSV, checked the controls at 320px and exercised failed-export recovery. Test records remained in isolated test databases; no application records were changed by export testing.

Run the backend checks with `npm test` from `backend`. The separate browser test is `mobile/tests/e2e/analytics-exports.cjs`; it requires the isolated loopback audit API on port 5099 and its audit-only Officer fixture. It does not replace real downloads with mocks; only its final failure-recovery request is simulated.
