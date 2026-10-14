# CivicTrack engineering and UI audit

Status updated 14 October 2026. The earlier full UI and codebase audit was run on 11 October; this update adds a live Android login network investigation. Results below distinguish browser and bundle checks from physical-device verification.

## Scope inspected

The existing Expo SDK 51 / React Native 0.74 app, Express / MongoDB backend, and FastAPI AI service were inspected. Citizen screens covered launch, registration, login, dashboard, report/photo/AI/GPS/map flow, history, details, notifications, and profile. Authority screens covered login, dashboard, queue, details and status controls, map, analytics, notifications, and profile. Shared navigation, cards, dialogs, drawers, tab bars, image and map components, API clients, role checks, validation, storage, permissions, server config, and responsive styles were included. The repository architecture and red/navy visual identity were retained. Officer User Management was not reintroduced.

## Issue categories and fixes

| Category | Observed problem | Fix |
|---|---|---|
| Authentication and access | Authority routes were reachable from the launch navigator; public registration and Google linking needed stronger role checks. | Role-based navigator, citizen-only registration, verified Google ID token and email checks, controlled account linking. |
| API and data safety | Development fallbacks could fabricate complaint data, images, or locations; malformed requests and uploads needed validation. | Explicit empty/error states; actual complaint IDs, images, and GPS; upload type/signature checks; bounded search and status transitions; structured HTTP errors. |
| Citizen dashboard | Search/date controls and cards did not consistently reflect live reports or small screens. | Live filtered summary, responsive grid and recent list, error/retry/empty states, route actions. |
| Forms, keyboard, and safe areas | Some dialogs could clip on phones or sit under system UI. | Shared safe-area dialog with scroll and keyboard handling, inset-aware headers and toast, scrollable success flow. |
| Maps and media | Blank map panels, false default coordinates, stale photo overlays, and native/web API mixing. | Native and web map surfaces, valid-coordinate handling, manual pin editing, real complaint markers, native Expo image picker and separate web implementation. |
| Authority data | KPI, analytics, profile counts, and notification/read displays used unsupported sample values. | Derived real counts and date ranges; missing values are shown as unavailable; actual notification state and complaint status. |
| Accessibility and responsiveness | Card layout, mobile tabs, text wrapping, unnamed buttons, and animation affected usability. | Flexible card layout, safe tab labels, explicit action names, reduced-motion success state, error/retry controls. |
| Android login network | Previous APK lacked cleartext allowance while the preview API uses HTTP; backend was not listening when checked. | SDK-compatible native preview cleartext config, live backend startup and LAN check, improved diagnostics and server URL controls. See [Android login fix](mobile/ANDROID_LOGIN_FIX.md). |

## Key files changed

Navigation and auth: `mobile/src/navigation/AppNavigator.tsx`, auth screens, `mobile/src/context/AuthContext.tsx`, `mobile/src/api/axiosClient.ts`, `mobile/src/api/authApi.ts`, `mobile/src/services/googleAuth.ts`, backend auth controller and validators.

Citizen UI: `mobile/src/screens/citizen/*`, `mobile/src/components/ImagePickerCamera.tsx`, `DetectionOverlay.tsx`, `MapLocationPicker.tsx`, `MapSurface.tsx`, `SuccessModal.tsx`, `Timeline.tsx`, `LocationCard.tsx`.

Authority UI: `mobile/src/screens/authority/*`, `AuthorityMobileHeader.tsx`, `MobileDrawer.tsx`, `AuthoritySidebar.tsx`, and shared `Card.tsx`, `FormDialog.tsx`, `RequestError.tsx`, `useComplaintSummary.ts`.

Configuration and checks: `mobile/app.config.ts`, `mobile/app.json`, `mobile/eas.json`, both package lockfiles, `mobile/scripts/check-preview-api.ps1`, `mobile/tests/e2e/*`, backend isolated test setup and security tests. The working tree diff is the authoritative list for the current uncommitted Android login changes; earlier UI work is already in Git history.

## Verification evidence

- On 11 October, isolated backend tests passed: 19 tests across 4 suites. The test setup forces `civictrack_isolated_test`; do not run destructive test cleanup against the application database.
- AI service tests passed: 4 tests. The local AI health endpoint responded after startup, but AI is not part of login.
- Browser checks: 27 sizes (320 to 3440 pixels plus landscape) had no horizontal overflow or recorded page errors on the citizen dashboard; dashboard axe checks reported no violations for the selected WCAG rules. Auth screens had 108 size checks; 13 authenticated citizen/authority routes had 351 route/size checks without overflow. Six browser workflow checks passed, including report upload/submit/detail and officer verify/progress/resolve. These used isolated intercepted API fixtures except where specifically marked live.
- On 14 October, `npm run type-check`, Expo compatibility check, Android bundle export, preview native config introspection, and a **live** web login test all passed. The live test reached the running backend for success and HTTP 401, then checked the unavailable-server message. The backend LAN health endpoint returned HTTP 200.
- The previous downloaded EAS APK had Internet permission and target SDK 34, but no cleartext manifest attribute. The new EAS preview APK `161740b1-df14-477b-96f9-429134ddaba9` was downloaded and its compiled manifest contains `android:usesCleartextTraffic=true` and Internet permission. Other profiles introspect to `false`.

There is no configured lint script. Browser tests establish responsive and interaction behavior in React Native Web; Android bundle export proves bundling, not native runtime rendering. The Vivo V30 was not connected to ADB during this audit, so status bar, cutout, camera, location, Android map tiles, keyboard, and installed APK login still need physical-device checks.

## Configuration and remaining work

The local preview backend is `http://192.168.29.44:5000/api`. It must be running while the phone uses it, and the computer/phone must share a reachable LAN. A changing DHCP address requires updating `mobile/eas.json` and rebuilding, or using Server Settings in the current app. The production profile still points at a LAN HTTP address; a deployed HTTPS backend URL is required before a useful production build. Image URLs without Cloudinary require `BACKEND_PUBLIC_URL` to be reachable from the phone. Google login requires a valid client ID and configured redirect; password reset, external notification delivery, and unsupported analytics data sources remain unconfigured and are shown honestly in the UI. Dependency audit advisories remain in older Expo/React Native and development toolchains; those require a planned SDK migration rather than an untested forced upgrade.

The first backend test attempt in the earlier audit used the configured database before the isolated test setup was added. Its cleanup selectors matched some demo/test addresses; this was disclosed immediately. Subsequent test runs used only `civictrack_isolated_test`.
