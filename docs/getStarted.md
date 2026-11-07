# Getting Started with Local Testing

This guide explains how to run the React application against the local
Firebase Authentication and Firestore emulators, without signing in to
Firebase or using the production Firebase project.

## Prerequisites

-   Node.js and npm installed.
-   Dependencies installed for the project (`npm install`).
-   Firebase CLI available through `npx` (no global installation or
    project dependency is required).
-   The project has its existing `firebase.json` and Firebase
    configuration file.

## 1. Configure the Firebase emulators

In the root `firebase.json`, add an `emulators` section while preserving
any existing configuration (especially Firestore rules and indexes):

``` json
{
  "emulators": {
    "auth": {
      "port": 9099
    },
    "firestore": {
      "port": 8080
    },
    "ui": {
      "enabled": true,
      "port": 4000
    },
    "singleProjectMode": true
  }
}
```

If `firebase.json` already contains other top-level properties, merge
this section into that object. Do not replace the existing file.

## 2. Configure the Firebase client to use the emulators

In the Firebase initialization module:

1.  Initialize the Firebase app.
2.  Create the Auth and Firestore instances.
3.  Connect those instances to the emulators in development mode.

The emulator connection calls must come **after** `auth` and `db` have
been created:

``` ts
if (import.meta.env.DEV) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099");
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
}
```

The existing Firebase configuration object is still used to initialize
the SDK. When the emulator connections are active, Auth and Firestore
requests from the development app are routed to the local emulators.

## 3. Make Vite environment types available to TypeScript

Create `src/vite-env.d.ts` if it does not already exist, and add:

``` ts
/// <reference types="vite/client" />
```

This provides TypeScript definitions for `import.meta.env`, including
`import.meta.env.DEV`.

## 4. Start the emulators

Open a terminal at the project root and run:

``` bash
npx --yes firebase-tools emulators:start --project demo-bctab82 --only auth,firestore
```

The `demo-` project ID tells the Firebase Emulator Suite to use a local
demo project. Keep this terminal running.

Expected local endpoints or something simialr:

-   Authentication: `http://127.0.0.1:9099`
-   Firestore: `http://127.0.0.1:8080`
-   Emulator UI: `http://127.0.0.1:4000`

## 5. Start the React development server

Open a second terminal at the project root and run:

``` bash
npm run dev
```

Open the localhost URL printed by Vite (commonly
`http://localhost:5173`).

## 6. Create a local test account

1.  Open `http://127.0.0.1:4000`.
2.  Select **Authentication**.
3.  Add a test user with an email address and password.
4.  Use those credentials in the application's email/password login
    form.

Users created in the Auth Emulator are local test users. They are not
created in production Firebase Authentication.

Creating an Auth user does not automatically create any corresponding
student, profile, role, or authorization document in Firestore. If the
application expects such a document, create the required test document
in the Firestore Emulator as well.

## 7. Stop the emulators

In the terminal running the emulators, press:

``` text
Ctrl + C
```

## Commands used or discussed during setup

The following commands were used, attempted, or discussed while
diagnosing and setting up the project. Some are diagnostic or optional
rather than required every time.

### Dependency audit and investigation

``` bash
npm audit fix
npm audit
npm ls @grpc/grpc-js
npm ls qs
npm explain @grpc/grpc-js
npm explain qs
npm view express@4.22.3 dependencies
npm view @firebase/firestore@4.19.1 dependencies
npm view @firebase/firestore@latest version dependencies
npm view firebase@latest version dependencies
npm update express
```

`npm audit fix` updated compatible dependencies. The Express update
addressed the vulnerable `qs` dependency. The remaining reported gRPC
advisories were traced to the Firestore dependency constraint. The
proposed npm override for `@grpc/grpc-js` was discussed, but is not
required for local emulator testing and should not be assumed to have
been applied.

### Firebase CLI setup and authentication attempts

``` bash
npm install -g firebase-tools
npm install -D firebase-tools
npm uninstall -D firebase-tools
npx firebase login
npx firebase-tools logout
npx firebase-tools login:list
npx firebase-tools init emulators
```

The global install encountered a Linux permissions (`EACCES`) error.
Installing as a development dependency would modify the project's
dependency list, so the recommended repeatable approach is
`npx --yes firebase-tools ...`, which avoids adding `firebase-tools` to
`package.json`.

The `firebase init emulators` command was also attempted, but it
requested Firebase authentication/project association. The manual
`firebase.json` configuration in this guide is intended to avoid that
initialization step for local demo-emulator use.

### Emulator startup attempts

``` bash
npx firebase-tools emulators:start --project demo-bctab82 --only firestore,auth
npx firebase-tools emulators:start --project demo-bctab82 --onlyauth,firestore
npx firebase-tools emulators:start --project demo-bctab82 --only auth,firestore
```

The `--onlyauth,firestore` form was a typo; the correct syntax includes
a space after `--only`:

``` bash
npx --yes firebase-tools emulators:start --project demo-bctab82 --only auth,firestore
```

The Auth Emulator did not start before it was configured in
`firebase.json`.

### React development server

``` bash
npm run dev
```

## Notes and troubleshooting

-   You do not need to run `firebase login` to use the local Auth and
    Firestore emulators with a `demo-` project ID.
-   You do need an authenticated account with suitable permissions to
    deploy to a real Firebase project.
-   The Firebase Emulator UI showing Firestore as **On** and
    Authentication as **Off** means the Auth Emulator has not started.
    Check that the `auth` section exists in `firebase.json`, then
    restart the emulators.
-   Make sure the React app connects to the emulators before any Auth or
    Firestore operation is made.
-   The Google sign-in popup flow is separate from email/password
    testing. Start by testing email/password authentication with a local
    test user. Do not expect real Google OAuth popup sign-in to work as
    though it were a production OAuth configuration.
-   Keep the `demo-` project ID for isolated local testing. Avoid
    switching to the production project ID when testing.
-   The exact contents of the repository's existing `firebase.json` were
    not reviewed in this conversation. Merge the emulator section into
    the existing file rather than overwriting it.
