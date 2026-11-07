# Firebase Emulator Environment & Role-Based Testing Guide

This guide covers local Firebase emulator setup, test users, role
documents, role-by-role checks, security-rule testing, Git hygiene, and
moving tested changes into the deployed application.

It is based on the React/Firebase code shared in this project. The exact
`firebase.json`, Firebase initialization file, `AuthScreen.tsx`, email
parser, `.gitignore`, and Firestore rules have not all been inspected.
Treat snippets as examples to merge with existing configuration, not
replacements to paste blindly.

## 1. Emulator environment: what it is

The Firebase Emulator Suite provides local versions of Firebase
services. Your React app must explicitly connect to them.

  -----------------------------------------------------------------------
  Service                             Purpose
  ----------------------------------- -----------------------------------
  Authentication Emulator             Create and sign in synthetic test
                                      users

  Firestore Emulator                  Test profiles, roles, projects,
                                      messages, and rules

  Storage Emulator                    Test uploads if the app uses
                                      Firebase Storage

  Emulator UI                         Inspect Auth users and Firestore
                                      documents
  -----------------------------------------------------------------------

Local emulator data is separate from production data, provided your app
is actually connected to the emulators. Do not assume that starting the
emulator automatically redirects the frontend.

## 2. Prerequisites

Install dependencies and make the Firebase CLI available:

``` bash
npm install
npm install --save-dev firebase-tools
npx firebase --version
```

Sign in to the CLI if needed:

``` bash
npx firebase login
```

Use the Firebase project alias/configuration intended for this
repository:

``` bash
npx firebase use
```

Be careful not to run deployment commands while you intend to work
locally.

## 3. Configure and start the emulators

A minimal `firebase.json` example for Auth and Firestore:

``` json
{
  "emulators": {
    "auth": { "port": 9099 },
    "firestore": { "port": 8080 },
    "ui": { "enabled": true, "port": 4000 },
    "singleProjectMode": true
  }
}
```

If your existing file includes Firestore rules, indexes, Storage,
Functions, or Hosting configuration, preserve those sections. Do not
replace a working `firebase.json` with this minimal example.

Typical local endpoints:

  Service              Address
  -------------------- -------------------------
  Emulator UI          `http://127.0.0.1:4000`
  Auth Emulator        `http://127.0.0.1:9099`
  Firestore Emulator   `http://127.0.0.1:8080`

Start Auth and Firestore:

``` bash
npx firebase emulators:start --only auth,firestore
```

Or start every configured emulator:

``` bash
npx firebase emulators:start
```

Keep that terminal running. Open the Emulator UI at
`http://127.0.0.1:4000`. Stop the emulators with `Ctrl + C`.

Use the same project ID in the frontend Firebase initialization and the
CLI/emulators. A dedicated ID such as `demo-learning-react` helps
isolate local testing. Firebase `demo-` project IDs are intended for
emulator-only development. Verify the app configuration rather than
assuming the project ID is correct.

## 4. Connect the React app to the emulators

Your Firebase initialization file (the project previously imported
`auth` and `db` from `src/lib/firebase`) must connect the modular
Firebase SDK instances to the local endpoints.

Example pattern:

``` ts
import { initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";

const firebaseConfig = {
  // Keep your project's existing configuration.
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

if (import.meta.env.DEV) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099");
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
}
```

Merge this pattern into the existing initialization file. Do not
initialize a second Firebase app, Auth instance, or Firestore instance.
Connect each emulator exactly once and before the first request to that
service. Match the ports to `firebase.json`.

If the app uses Storage or Functions, configure those emulator
connections too.

### Environment files

For Vite projects:

-   `VITE_` variables are exposed to browser code. Never put
    service-account keys or private server credentials in them.
-   Keep machine-specific settings in `.env.local` or another ignored
    local file.
-   Commit `.env.example` with safe placeholder values.
-   Never commit `.env`, `.env.local`, private keys, or service-account
    JSON.

## 5. Emulator data persistence

For a clean test, stop the emulators and start again without importing a
saved export. Data persistence depends on how the emulators are run and
configured.

To save and later reload local emulator data:

``` bash
npx firebase emulators:export ./emulator-data
npx firebase emulators:start --import=./emulator-data
```

Or export on shutdown:

``` bash
npx firebase emulators:start --export-on-exit=./emulator-data
```

Treat `emulator-data/` as local test data. Ignore it in Git. It can
contain test Auth accounts and Firestore documents. Do not commit it as
normal project source.

For repeatable tests, keep a test-account/role checklist or a
deliberately sanitized fixture process. Keep local exports out of Git.

## 6. Create synthetic Auth test accounts

1.  Start the Auth and Firestore emulators.
2.  Open `http://127.0.0.1:4000`.
3.  Open the Authentication section.
4.  Create a user using the email/password provider, or register through
    the app.
5.  Use a synthetic test email and a test-only password.
6.  Copy the Auth user's UID. You need it for the Firestore role
    document.

### Important: confirm the canonical email domain

The conversation has mentioned both `@pcampu.edu.np` and
`@pcampus.edu.np`. The `App.tsx` code shared earlier compared against an
address ending in `@pcampus.edu.np`.

Do not assume these spellings are interchangeable. Inspect
`AuthScreen.tsx` and the email parsing helper and decide the one
canonical domain the application should accept. Make the validator,
parser, and special-email comparison consistent.

The stated allowed roll-number range is `082bct001` through `082bct048`.
Verify the actual parser and boundary checks in the code before treating
this as confirmed behavior.

Example synthetic emails below assume a local-part format accepted by
your parser. Adjust them to the actual expected format:

``` text
082bct001.teststudent@YOUR_CANONICAL_DOMAIN
082bct013.testadmin@YOUR_CANONICAL_DOMAIN
082bct048.teststudent@YOUR_CANONICAL_DOMAIN
```

Also test invalid cases such as:

``` text
082bct000.test@YOUR_CANONICAL_DOMAIN
082bct049.test@YOUR_CANONICAL_DOMAIN
082bct013.test@WRONG_DOMAIN
```

Do not use real users' identities as test accounts.

## 7. How the current app assigns roles

In the `App.tsx` shared in this project, `fetchProfileAndRole()`:

1.  Reads `users/{uid}`.
2.  Creates a basic profile if it does not exist.
3.  Reads `roles/{uid}`.
4.  If the role document exists, uses its `role` field.
5.  If it does not exist, assigns `admin` only if the email exactly
    matches the hard-coded special email; otherwise assigns `student`.
6.  Creates the role document.

The special email comparison in the shared code was:

``` ts
email === "requred@gmail.com"
```

Therefore, creating an Auth user alone does not make that user an admin.
A pre-existing `roles/{uid}` document takes precedence over the fallback
assignment. A missing role document normally results in `student`,
except for that exact special email.

The `UserRole` type shared in this project is:

``` ts
export type UserRole =
  | "admin"
  | "moderator"
  | "cr"
  | "locus_cr"
  | "student";
```

Use these exact lowercase values unless you intentionally change the
type and application logic.

**Security warning:** A Firestore role document is not secure merely
because the UI reads it. Firestore Security Rules and trusted backend
operations must independently enforce authorization. Do not let an
ordinary client user grant themselves `admin`.

## 8. Create role documents in the Firestore Emulator

After creating a test Auth user:

1.  Copy that user's UID from Emulator UI → Authentication.
2.  Open Emulator UI → Firestore.
3.  Create or open the `roles` collection.
4.  Create a document with the document ID exactly equal to the Auth
    UID.
5.  Add the fields below.

Example:

``` text
Collection: roles
Document ID: <AUTH_USER_UID>

uid        string     <AUTH_USER_UID>
email      string     test-admin@YOUR_CANONICAL_DOMAIN
role       string     admin
grantedBy  string     emulator-test
grantedAt  timestamp  current timestamp
```

The relationship must be:

``` text
Firebase Auth UID
       |
       v
roles/<same UID>
       |
       v
role: "admin"
```

The current app queries `doc(db, "roles", uid)`. If the document ID does
not match the signed-in user's UID, the app will not find it.

Create separate Auth users and role documents for each role:

``` text
roles/<ADMIN_UID>       role: "admin"
roles/<MODERATOR_UID>   role: "moderator"
roles/<CR_UID>          role: "cr"
roles/<LOCUS_CR_UID>    role: "locus_cr"
roles/<STUDENT_UID>     role: "student"
```

Use one account per role so that switching users gives a clear,
repeatable test.

## 9. Role-by-role test matrix

The current `App.tsx` explicitly registers `/admin` only for `admin` and
`moderator`:

``` tsx
{["admin", "moderator"].includes(userRole) && (
  <Route
    path="/admin"
    element={
      <AdminView
        currentUserUid={user.uid}
        currentUserRole={userRole}
      />
    }
  />
)}
```

So the route behavior implied by the shared code is:

  -----------------------------------------------------------------------
  Role                    Expected `/admin` route Additional checks
                          result                  
  ----------------------- ----------------------- -----------------------
  `admin`                 Allowed                 Test all intended admin
                                                  operations and database
                                                  permissions

  `moderator`             Allowed                 Verify moderator
                                                  permissions are
                                                  appropriately limited

  `cr`                    Not registered;         Test CR-specific
                          catch-all redirects to  features and data
                          `/`                     access

  `locus_cr`              Not registered;         Test locus-CR-specific
                          catch-all redirects to  features and data
                          `/`                     access

  `student`               Not registered;         Test ordinary student
                          catch-all redirects to  features only
                          `/`                     
  -----------------------------------------------------------------------

This table describes the route condition only. It does not establish
what each role can do inside `AdminView` or what Firestore rules permit.
Inspect those separately.

### Repeat this procedure for every account

1.  Sign out of the previous account.
2.  Sign in with the selected test account.
3.  Confirm the profile loads.
4.  Confirm the expected role is loaded.
5.  Navigate directly to `/admin`.
6.  Confirm the route result matches the matrix.
7.  Test the UI operations that role should be allowed to perform.
8.  Test an operation that role must not be allowed to perform.
9.  Confirm Firestore Security Rules reject forbidden reads/writes.
10. Sign out before testing the next account.

Hiding a link or route is not security. A user can enter a URL manually
or call Firebase APIs from browser code. Security Rules must reject
unauthorized database operations.

### Test role changes

The current app fetches the role during its Auth state listener. It may
not automatically refresh an already signed-in user's role when you edit
the Firestore document.

For a reliable manual test:

1.  Sign out.
2.  Change the role document in the Firestore Emulator.
3.  Sign in again.

## 10. Test eligibility separately from authorization

These are distinct checks:

-   **Eligibility:** Does the email/roll number satisfy the registration
    policy?
-   **Authentication:** Has Firebase Auth successfully signed the user
    in?
-   **Role authorization:** Has the user been granted the appropriate
    role?
-   **Data authorization:** Do Firestore Rules permit this specific
    operation?

Test eligibility boundaries:

-   Correct domain + lowest allowed roll (`082bct001`).
-   Correct domain + highest allowed roll (`082bct048`).
-   Below range (`082bct000`).
-   Above range (`082bct049`).
-   Wrong domain.
-   Malformed email.
-   Missing or malformed roll-number segment.
-   Case variations if the app should normalize them.

The expected result must be derived from the actual `AuthScreen.tsx` and
parser implementation.

A valid campus email must not automatically mean admin. Elevated roles
should be granted through a trusted process. Normalize email
consistently (for example, trim and lowercase) before comparisons.
Missing role documents should default to the least-privileged role.

For a larger application, Firebase custom claims set by a trusted Admin
SDK backend can be considered for privileged authorization. Never set
custom claims from browser code.

## 11. Test Firestore Security Rules

Review the actual `firestore.rules` file and test both allowed and
forbidden operations. Questions to check:

-   Can an unauthenticated visitor read protected collections?
-   Can a student read the intended public data?
-   Can a student edit their own profile?
-   Can a student change their own `role` field?
-   Can a moderator perform only moderator-approved operations?
-   Can an admin perform the intended admin operations?
-   Can a user read another user's private messages?
-   Can a user star a project without changing its owner or privileged
    fields?

Use the Firestore Emulator to attempt both permitted and prohibited
operations. A successful page render is not proof of database security.

For automated tests, Firebase provides `@firebase/rules-unit-testing`
for exercising rules against the Firestore Emulator. Commit test source
files and scripts, not local emulator data exports.

## 12. Repeatable testing checklist

### Before testing

-   [ ] Pull the latest project branch.
-   [ ] Install dependencies.
-   [ ] Confirm `firebase.json` emulator ports.
-   [ ] Confirm the frontend connects to Auth and Firestore emulators in
    development.
-   [ ] Confirm the frontend is not accidentally connected to
    production.
-   [ ] Start the emulators and open Emulator UI.
-   [ ] Create/import synthetic test users.
-   [ ] Create matching `roles/{uid}` documents.

### During testing

-   [ ] Test wrong email domain.
-   [ ] Test roll number below the lower boundary.
-   [ ] Test the lower boundary.
-   [ ] Test a middle roll number.
-   [ ] Test the upper boundary.
-   [ ] Test roll number above the upper boundary.
-   [ ] Test `admin`.
-   [ ] Test `moderator`.
-   [ ] Test `cr`.
-   [ ] Test `locus_cr`.
-   [ ] Test `student`.
-   [ ] Test direct navigation to `/admin`.
-   [ ] Test forbidden Firestore reads and writes.
-   [ ] Test sign-out and account switching.
-   [ ] Inspect browser console and emulator logs.

### After testing

-   [ ] Stop the emulators.
-   [ ] Keep exported emulator data local and ignored.
-   [ ] Review the Git diff.
-   [ ] Run the project's lint/type checks and production build.
-   [ ] Commit source, tests, rules, indexes, and safe shared
    configuration only.

## 13. What belongs in Git?

Emulator configuration is part of the project. You generally **keep** it
in Git; you do not strip it out just because you are deploying the app.

  --------------------------------------------------------------------------
  File/data                  Commit?                 Notes
  -------------------------- ----------------------- -----------------------
  `firebase.json`            Yes                     Shared emulator/service
                                                     configuration

  `.firebaserc`              Usually yes, after      Check aliases and
                             review                  project mapping

  `firestore.rules`          Yes                     Shared security rules

  `firestore.indexes.json`   Yes                     Shared index
                                                     definitions

  `storage.rules`            Yes, if used            Shared Storage rules

  Cloud Functions source     Yes, if used            Backend source

  Emulator rule tests        Yes                     Repeatable tests

  `package.json`             Yes                     Scripts and
                                                     dependencies

  `package-lock.json`        Yes                     Reproducible installs

  `.env.example`             Yes                     Safe placeholders only

  Setup documentation        Yes                     Teammates need it

  `.env` / `.env.local`      No                      Local settings and
                                                     possible secrets

  Service-account            No                      Sensitive credentials
  JSON/private keys                                  

  `.firebase/`               No                      Local Firebase state

  Emulator export directory  No                      Local test users/data

  `node_modules/`            No                      Recreated by npm

  `dist/`                    Usually no              Generated build output

  Local logs/debug output    No                      Machine-specific files
  --------------------------------------------------------------------------

A Firebase web config is not the same as a service-account private key,
but keep configuration consistent and never expose Admin SDK credentials
in frontend code.

Example `.gitignore` additions (merge with the existing file):

``` gitignore
# Local environment files
.env
.env.*
!.env.example

# Firebase local state and emulator exports
.firebase/
emulator-data/

# Generated output and dependencies
dist/
node_modules/
```

Do not ignore `firebase.json`, Firestore rules, Firestore indexes, or
safe test source files.

## 14. If emulator files were already committed

First inspect the repository:

``` bash
git status
git ls-files
git log -1 --stat
git diff
git diff --cached
```

Check whether a path is tracked:

``` bash
git ls-files path/to/file-or-directory
```

If Git prints the path, it is tracked.

### A. A local emulator export or generated directory was committed

For example:

``` bash
git rm -r --cached emulator-data/
```

Or, if `.firebase/` is tracked:

``` bash
git rm -r --cached .firebase/
```

Only run commands for paths that actually exist and should stop being
tracked. `--cached` removes the path from Git's index but leaves your
local copy in place. Add the path to `.gitignore`, then commit the
cleanup.

### B. A local environment file was committed

For example:

``` bash
git rm --cached .env.local
```

Add it to `.gitignore`, then commit.

**If a real secret or private key was committed, deleting the file in a
later commit is not enough.** It remains in Git history and may have
been copied. Revoke/rotate the credential immediately, review access as
appropriate, and follow your repository host's secret-removal process if
history cleanup is needed.

### C. The unwanted file is in the latest commit and that commit has not been pushed

You can amend the local commit:

``` bash
git add .gitignore
git rm --cached path/to/unwanted-file
git commit --amend
```

Review the staged changes first. Amending rewrites the latest local
commit.

### D. The commit has already been pushed or shared

Prefer a new cleanup commit:

``` bash
git rm --cached path/to/unwanted-file
git add .gitignore
git commit -m "chore: exclude local emulator data"
git push
```

This avoids rewriting published history. If the file contained a secret,
rotate it even after removing it. Coordinate history rewriting with
collaborators if sensitive data requires history cleanup.

Do not delete every Firebase-related file. The emulator configuration,
rules, indexes, and tests are normally supposed to remain in the
repository.

## 15. Moving tested changes to the deployed application

You do not need to remove emulator support to deploy. Keep the emulator
configuration and development-only connection code, provided production
builds cannot connect to local endpoints.

Recommended workflow:

1.  Finish the feature and test it against the emulators.

2.  Verify development builds connect to local Auth and Firestore.

3.  Verify production builds do not call `connectAuthEmulator()` or
    `connectFirestoreEmulator()`.

4.  Review `firebase.json`, `.firebaserc`, environment files, and
    `.gitignore`.

5.  Run the checks that actually exist in `package.json`:

    ``` bash
    npm run build
    ```

    If the project has a lint or type-check script, run that too. Do not
    assume a `lint` script exists.

6.  Inspect changes:

    ``` bash
    git status
    git diff
    git diff --cached
    ```

7.  Commit application source, safe shared Firebase configuration,
    rules, indexes, and tests.

8.  Push your feature branch and open a pull request or follow the
    repository's contribution workflow.

9.  Deploy only through the project's approved deployment process.

10. Test the deployed application with an authorized production test
    account.

Do not:

-   Copy emulator test users into production Auth.
-   Copy emulator role documents or test data into production Firestore.
-   Deploy emulator exports.
-   Deploy local environment files.
-   Commit service-account credentials.
-   Remove correctly guarded emulator code just because you are
    deploying.
-   Assume local testing proves production rules or indexes are
    deployed.

Production roles must be granted through the organization's trusted
process or a secure backend using the Firebase Admin SDK. Never create a
production admin role merely to test local behavior, and never let a
user grant themselves a role through browser code.

## 16. Optional npm scripts

If equivalent scripts do not already exist, you can add entries like
these to the existing `package.json` scripts object:

``` json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "emulators": "firebase emulators:start",
    "emulators:auth-firestore": "firebase emulators:start --only auth,firestore"
  }
}
```

Do not overwrite the existing scripts object or replace the project's
real build command. Add only missing scripts.

Run the emulators in one terminal:

``` bash
npm run emulators:auth-firestore
```

Run the frontend in another terminal:

``` bash
npm run dev
```

## 17. Troubleshooting

### Auth works, but Firestore requests fail

-   Confirm Firestore Emulator is running.
-   Confirm host and port match the configuration.
-   Confirm the emulator connection is made before the first Firestore
    request.
-   Inspect Firestore rules and emulator logs.
-   Confirm Auth and Firestore use the same project ID.

### A test user signs in but cannot access `/admin`

-   Copy the exact Auth UID.
-   Confirm `roles/{uid}` exists.
-   Confirm `role` is exactly `admin` or `moderator`.
-   Sign out and sign in again after changing the role.
-   Check browser console and role-fetch errors.
-   Remember that the current route registers `/admin` only for `admin`
    and `moderator`.

### The app unexpectedly talks to production

-   Inspect the Firebase initialization file.
-   Verify emulator connection code runs in the development build.
-   Verify the frontend project ID/configuration.
-   Restart the frontend after changing environment values.
-   Do not test with real users or production data until the connection
    is confirmed.

### Emulator data disappears

This can be expected if you are not importing a saved export. Use an
explicit export/import workflow for repeatable local fixtures, and keep
the export directory out of Git.

### The role becomes `student`

The current `App.tsx` creates a default `student` role if no role
document exists and the email does not exactly match the special admin
email. Create the role document before first role assignment, or edit
the existing emulator role document and sign in again.

## 18. The four layers to remember

1.  **Authentication:** Who signed in? Firebase Auth answers this.
2.  **Eligibility:** Does the email/roll number meet registration
    policy? Your app validation answers this.
3.  **Role authorization:** What role has the user been granted? Trusted
    role assignment and authorization logic answer this.
4.  **Data authorization:** Is this user allowed to read or write this
    data? Firestore Security Rules and trusted backend checks enforce
    this.

The emulator lets you test these layers locally without changing
production users or data.

------------------------------------------------------------------------

## Project-specific items to verify before treating this guide as definitive

-   Confirm whether the canonical email domain is `pcampu.edu.np` or
    `pcampus.edu.np`. The conversation contains both spellings; the
    shared `App.tsx` special-admin comparison used `pcampus.edu.np`.
-   Inspect `AuthScreen.tsx` and the email parser to confirm the exact
    accepted email structure and `082bct001`--`082bct048` boundary
    logic.
-   Inspect `src/lib/firebase.ts` to confirm emulator connections,
    project ID, and environment guards.
-   Inspect `firebase.json`, `.firebaserc`, `.gitignore`, and
    `firestore.rules` before changing them.
-   Confirm whether `cr` and `locus_cr` have role-specific routes or
    permissions elsewhere. The shared `App.tsx` only showed the `/admin`
    route condition for `admin` and `moderator`.
