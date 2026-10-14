# Android preview APK login: network diagnosis and fix

Checked on 14 October 2026. This note applies to the `preview` APK and the local backend on the same Wi-Fi network.

## Root cause and evidence

The latest previously available EAS APK (`81233d08-07b5-4789-9f39-6f87a3beb4b7`) targets Android SDK 34 and declares `android.permission.INTERNET`, but its compiled `AndroidManifest.xml` has no `android:usesCleartextTraffic` attribute. The preview build targets `http://192.168.29.44:5000/api`. Android can reject plain HTTP before a request reaches Express. The plain `usesCleartextTraffic` property in `app.json` was visible to Expo config but did not produce that native manifest attribute.

The backend was also not listening on port 5000 at the beginning of this investigation. After starting `npm run dev` in `backend`, MongoDB connected, the server listened on `0.0.0.0:5000`, and `http://192.168.29.44:5000/api/health` returned HTTP 200. A valid demo login returned HTTP 200 with a citizen and token; an incorrect password returned HTTP 401. The AI service is not involved in this login path.

The screenshot's generic network message matches an older login client. EAS build metadata points to Git commit `5e00c48`; EAS may upload uncommitted working files, so that commit alone does not prove the exact JavaScript version in the installed APK. The phone and installed APK were not available over ADB, so its precise build ID and phone-to-PC connectivity remain unverified.

## Request path

Citizen Sign In calls `AuthContext.login`, then `authApi.login`, then `axiosClient.post('/auth/login', {email, password})`. The shared base URL comes from `EXPO_PUBLIC_API_URL` in the EAS preview profile unless a saved server override exists on the phone. Axios sends JSON to `POST http://192.168.29.44:5000/api/auth/login` with `Content-Type: application/json`. Express routes `/api/auth/login` to `authController.login`, checks the user in MongoDB, and returns `{success:true,data:{user,token}}` on HTTP 200 or a 401 for wrong credentials. The frontend validates the response and stores the token and user only after a valid successful reply.

## Changes

- `app.config.ts`, `app.json`, `eas.json`, `package.json`, and `package-lock.json`: installed the Expo SDK 51 compatible `expo-build-properties` config plugin. The `preview` profile explicitly enables HTTP for local LAN testing in the generated Android manifest. Other profiles leave cleartext disabled. Removed the ineffective `app.json` property.
- `src/api/axiosClient.ts`: logs only safe endpoints, status, and duration in development; distinguishes HTTP errors, timeout, and requests with no HTTP response. It never logs credentials, token headers, request bodies, or query strings. HTTP 500 details are not shown to users.
- `src/api/authApi.ts`: reports an invalid login response instead of failing with an unrelated property access error.
- `src/components/ServerConfigModal.tsx`: validates `/api` addresses, tests the matching `/api/health` endpoint, clears the timeout, and resets to the current build default.
- `scripts/check-preview-api.ps1`: verifies the profile URL matches this computer and that the LAN health endpoint responds before building or testing on a phone.
- `tests/e2e/live-login.cjs`: live smoke test for successful login, wrong credentials, and an unreachable server message without API mocking.

## Verification

- `npm run type-check`: passed.
- `npx expo install --check`: compatible dependencies.
- `npx expo export --platform android --output-dir tests/artifacts/android-export`: passed.
- Expo native config introspection: `android:usesCleartextTraffic=true` with the preview flag and `false` without it.
- New EAS preview build `161740b1-df14-477b-96f9-429134ddaba9`: build finished; downloaded APK declares Internet permission and `android:usesCleartextTraffic=true` in its compiled manifest. Its bundle contains the configured LAN IP.
- `scripts/check-preview-api.ps1`: passed while the backend was running.
- Live backend: LAN health HTTP 200, valid login HTTP 200, wrong credentials HTTP 401.
- Live web login smoke test: success, 401, and unreachable backend messages passed.
- Local ADB installation was found, but `adb devices` listed no connected device. The Vivo V30 and installed APK could not be tested directly.

## Build and phone test

From the repository root in PowerShell, start the backend and keep that terminal running:

```powershell
cd backend
npm run dev
```

In another PowerShell terminal:

```powershell
cd mobile
.\scripts\check-preview-api.ps1
eas build -p android --profile preview
```

The preview URL is currently `http://192.168.29.44:5000/api`. If the computer's Wi-Fi IP changes, update `mobile/eas.json` first and rebuild. The API URL is public configuration, not a secret. Do not place JWT secrets or database credentials in an `EXPO_PUBLIC_` variable.

Install the [verified new preview APK](https://expo.dev/accounts/codraja/projects/civic-issue-detection/builds/161740b1-df14-477b-96f9-429134ddaba9). Connect the Vivo V30 and the computer to the same Wi-Fi. In the phone browser, open `http://192.168.29.44:5000/api/health`; it should show `"status":"OK"`. On the APK's citizen login screen, open **Server Settings**, run **Test Connection**, then sign in. If the browser cannot open the health URL, check that the backend remains running, the Wi-Fi IP is still `192.168.29.44`, the phone is on the same LAN, and Windows Firewall allows inbound TCP port 5000 for that network. A Wi-Fi network with client isolation will also block the phone from the computer.

If the health URL works but login returns HTTP 401, the network is working; check the account credentials. If Server Settings points to an old custom URL, choose **Reset Default**. If the address changes but the old APK still shows a generic network error, uninstall that APK and install the new build. For a remotely deployed backend, use a real HTTPS URL and remove the temporary LAN setup; the current `production` EAS profile still points to a local HTTP address and needs a deployed HTTPS endpoint before a usable production build.
