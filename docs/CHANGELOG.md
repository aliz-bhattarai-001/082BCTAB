
## Change Logs:


### <u>LOGGER</u> : `Aliz Bhattarai` (LOG 01)

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


--- 

### <u>LOGGER</u> : `Aliz Bhattarai` (LOG 02)

#### `#` <u>Changes Made</u>:

1. Updated:
   - `AppRouter.tsx` to register the `UsernameRedirect` component and enable username-based showcase routing.
   - `ProfilesView.tsx` to update the Visit Website handler to use the `/u/:username` route instead of directly opening a root-level username path.
   - Application routing structure to properly separate public showcase routes from the main application routes.
   - Navigation handling to ensure browser history behaves correctly during in-app route transitions.

2. Fixed:
   - Browser Back button navigation issue that previously caused users to exit the application instead of returning to the previously visited in-app route.
   - Visit Website functionality, which previously redirected users to the landing page instead of opening their respective public showcases.
   - Username-based navigation by connecting the generated profile URL to the corresponding Firebase user document.
   - Route resolution conflicts between public showcase URLs and existing application endpoints.
   - Unnecessary browser history entries during username resolution by utilizing React Router's `replace` navigation.

3. Configured / Prepared:
   - Dedicated `/u/:username` route for accessing public user showcases through readable username-based URLs.
   - Username resolution through Firestore to identify the corresponding user document.
   - Automatic redirection from username-based URLs to `/showcase/:userId`.
   - Direct showcase access through Firebase document IDs.
   - External tab navigation using `window.open()` with `noopener,noreferrer` for improved browsing security.
   - SPA fallback rewrites in the hosting configuration to support direct URL access and page refreshes.

4. Routing:
   - Preserved existing application routes such as `/about`, `/profiles`, `/events`, and `/explore`.
   - Maintained the existing chat navigation structure under `/chat/:targetUid`.
   - Separated showcase navigation from the main application routing through dedicated route registration.
   - Improved browser history management through React Router navigation rather than relying on unintended browser-level navigation behavior.

#### `#` Note:

- Public showcase URLs now follow the `/u/username` structure, avoiding potential conflicts with existing application routes.
- Username resolution currently relies on matching the slugified user name against Firestore user documents.
- The current implementation fetches the users collection for username resolution. A dedicated, unique `username` field with a Firestore query is recommended for improved scalability.
- Firebase Hosting (or the respective hosting provider) must be configured to rewrite application routes to `index.html` to ensure direct navigation and browser refreshes work correctly.
- The `ShowcasePage` component should be verified independently to ensure showcase HTML/CSS is correctly retrieved and rendered for each user.