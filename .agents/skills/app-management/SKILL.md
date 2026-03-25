# RefundRadar App Management

## App Identifiers
- Bundle ID: `com.refundradar.ios`
- App Store Connect App ID: `6760978003`
- Superwall App ID: `40880` (Tea organization)
- Expo Project ID: `c5f55101-7b9c-449d-8360-a94665dc82c7`
- Apple Team ID: `WRTNUA57VF`

## EAS Build Workflow
1. Run `npx eas-cli build --platform ios --non-interactive` from the repo root
2. Free tier builds can take 1-2+ hours in queue — do NOT stop monitoring
3. Check status with `npx eas-cli build:view <BUILD_ID>`
4. After build completes, submit with `npx eas-cli submit --platform ios --latest --non-interactive`
5. Wait ~5-10 min for Apple to process the build before attaching to a version

## App Store Connect Submission
1. Navigate to the version page (Distribution > iOS App)
2. Attach the new build (remove old build first if needed by hovering to reveal minus button)
3. Select In-App Purchases/Subscriptions to include with submission
4. Update App Review notes explaining changes
5. Save, then go to App Review > Submissions to resubmit
6. For rejected versions, click "Resubmit to App Review" on the submission detail page
7. Request expedited review at https://developer.apple.com/contact/app-store/?topic=expedite

## Superwall Configuration
- Dashboard: https://superwall.com/applications/40880
- API Key is in `src/config/superwall.ts` — must match dashboard Settings > Keys
- Placements: `unlock_pro`, `view_insights` (defined in `src/config/superwall.ts`)
- Campaign: "Upgrade to Pro" with Budget Pro paywall at 100% allocation
- When creating new subscriptions, update the product ID in the Superwall paywall editor
- Superwall SDK is native-only (doesn't work in Expo Go, needs `eas build`)

## Subscription Management
- Subscription group: "Pro" (ID: 21993134)
- When a subscription is rejected, create a NEW product ID (append version suffix like .v3)
- Delete old rejected subscriptions from the Pro group before resubmitting
- Ensure the new product is configured in both ASC AND Superwall dashboard
- Screenshot the Superwall paywall for the subscription's Review Information section

## Key URLs
- ASC App: https://appstoreconnect.apple.com/apps/6760978003
- ASC Subscriptions: https://appstoreconnect.apple.com/apps/6760978003/distribution/subscriptions
- Superwall Dashboard: https://superwall.com/applications/40880
- Expedite Review: https://developer.apple.com/contact/app-store/?topic=expedite

## Legal Pages
- TOS: https://app-store-login-app-3wpzngv3.devinapps.com/terms
- Privacy: https://app-store-login-app-3wpzngv3.devinapps.com/privacy

## Auth
- Apple Developer account: Use `APPLE_DEVELOPER_PASSWORD` secret + 2FA to phone ending in 92
- Superwall: Login via Google (${BEMOB_EMAIL}) — requires Google 2FA approval on user's iPhone Gmail app
- EAS credentials are cached after first build
