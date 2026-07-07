# <u> Contribution Rules </u>

Thank you for your interest in contributing! This project is specifically tailored for the **082 - BCT batch of Pulchowk Campus**, and even more specifically for the students of **Class AB**. 

To maintain the integrity of our project and ensure we grow together as a academic team, please adhere to the following rules.

---


## 1. Eligibility Requirements

This project is primarily intended for the students of **082 BCT "AB" (Pulchowk Campus, IOE)** and serves as a collaborative platform for our class.

- **Batch Members:** Students of **082 BCT "AB"** are welcome to contribute to all aspects of the project, subject to the contribution guidelines.
- **External Contributors:** Contributions that improve the project's general infrastructure—such as UI/UX, documentation, performance, bug fixes, developer tooling, and other non-security-related improvements—are welcome. However, contributions involving batch-specific content, resources, authentication, Firestore Security Rules, or other security-critical components are reserved for the project maintainers and members of **082 BCT "AB"**.

> **Note:** These restrictions exist to preserve the project's purpose as a class resource while still encouraging meaningful improvements from the wider developer community.

---

## 2. Setting up and testing

### Firestore Security Rules Deployment
To deploy the security rules included in `/firestore.rules`:
```bash
firebase deploy --only firestore:rules
```

### Run Locally
1. **Ensure dependencies are installed:**
   ```bash
   npm install
   ```
2. **Start the development server on Port 3000:**
   ```bash
   npm run dev
   ```
3.**Build the application:**
   ```bash
   npm run build
   ```

### Checks before contributing
Before Contributing ensure everything works fine. and try running 
```
npm run dev
```

Also run:
```
npm run build
```

Also run:
```
npm run preview
```

To ensure everything works fine and nothing breaks from your changes.

### Documenting your changes:

Properly clarify your changes in the `docs/CHANGELOG.md` following the same syntax as that used in the first log.
This is crucial for letting us have a simple view of where and what changes were made in a more broarder view.
(PS: You could technically write this and have the same in your pull Request as well: or keep a reference to that changelog.)

---

## 3. Pull Request Guidelines

To ensure your contributions are reviewed and merged efficiently, please follow these guidelines:

*   **Clarity:** Be as clear and descriptive as possible about what was changed, how it qualifies as a contribution, and what specific issue you solved.
*   **Use the Template:** You **must** follow the pull request template. Copy the template provided here and use it as needed:
    > [pull_request_template.md](https://github.com/aliz-bhattarai-001/082BCTAB/blob/main/.github/pull_request_template.md)
    <!--I will modify this with the updated link later on. -->
> **Important:** Template is provided to help both the contributors and reviewers , so please respect that and follow it whenever possible.

*  **Working:** Ensure Nothing else broke from the changes you made.
---

## 4. Issue Disclosure & Referencing

When addressing an issue, always mention the issue title and provide a direct link to it. Please use the following format in your PR description:

`In response to [Issue-X](link-to-issue)`

*(Replace `Issue-X` and `link-to-issue` with the actual issue number and URL, respectively).*

Always make sure to add additional context explaining your fix or implementation below the reference link.

---
> **Note** : Do read these rules carefully before submitting your pull requests.
