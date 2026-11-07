
## Change Logs:

### <u>LOGGER</u> : `Aliz Bhattarai`

#### `#` <u>Changes Made</u>:

1. Updated:
    - package-lock.json through npm audit fix to update compatible dependencies and address reported vulnerabilities.
    - Express dependency to resolve the vulnerable qs dependency.
    - Firebase initialization module to support local Authentication and Firestore emulators.
    - Vite type declarations (vite-env.d.ts) to support import.meta.env and remove the need to bypass TypeScript typing.

2. Configured / Prepared:
    - Firebase Authentication Emulator for local authentication testing.
    - Firestore Emulator for local database testing.
    - Emulator connections to activate only in development mode.
    - Local demo project ID (demo-bctab82) to avoid interacting with production Firebase services during testing.

3. Security:
    - Reduced the reported vulnerabilities from 16 to 4.
    - Resolved the qs vulnerability.
    - Identified the remaining @grpc/grpc-js vulnerabilities as originating from Firebase Firestore's dependency constraints.
    - Avoided forcing a breaking Firebase downgrade.

#### `#` Note:

- Local Firebase emulators allow contributors to test authentication and Firestore without requiring access to the production Firebase project or Google OAuth configuration.

- The remaining four reported vulnerabilities have not been resolved and should be revisited before production deployment.

- The manual emulator configuration in firebase.json still needs to be merged with the repository's existing configuration if it has not already been added.