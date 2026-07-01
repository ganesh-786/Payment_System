# ADR-0002: Client-Side Fixes and ESLint Configuration

## Status

Accepted

## Date

2026-06-25

## Context

The client application (`client/src/`) had several code-quality issues:

1. **Undefined function reference** — `handleLogout` was passed as a prop to the `Profile` component but never defined, causing a runtime `ReferenceError`.
2. **Button component ignored passed `className`** — the `Button` component spread `{...props}` before a hardcoded `className`, so any externally provided `className` (e.g., `mt-4 w-full` on the "Transfer Money" button) was silently overwritten and never applied.
3. **Unused import** — `import React from "react"` in `BalancePreview.jsx` served no purpose with the automatic JSX runtime enabled by `@vitejs/plugin-react`.
4. **Inconsistent import extensions** — `main.jsx` imported `App` without the `.jsx` extension, while other files in the same project used explicit extensions.
5. **Missing ESLint configuration** — `eslint-plugin-react` was listed as a devDependency but no ESLint config file existed, causing the editor to show phantom errors such as "JSX expressions must have one parent element."

## Decision

### 1. Add `handleLogout` function

Define the missing logout handler in `App.jsx` to clear authentication state:

```js
const handleLogout = () => {
  localStorage.removeItem(tokenKey);
  setUser(null);
  setToken(null);
  setStatusMessage(null);
};
```

### 2. Fix Button className merging

Restructure `Button` to destructure `className` from props and concatenate it with the default classes, then spread the remaining props after the className attribute:

```jsx
function Button({ children, className, ...props }) {
  return (
    <button
      className={`mt-3 inline-flex w-full ... ${className ?? ""}`}
      {...props}
    >
      {children}
    </button>
  );
}
```

### 3. Remove unused React import

Delete `import React from "react"` from `BalancePreview.jsx`, as the automatic JSX runtime (`@vitejs/plugin-react`) injects `React.createElement` (or `jsxRuntime`) at compile time.

### 4. Standardize import extensions

Change `import App from "./App"` to `import App from "./App.jsx"` in `main.jsx` for consistency with the rest of the codebase.

### 5. Add ESLint flat config

Create `client/eslint.config.js` with the React plugin configured so the editor's ESLint extension understands JSX syntax and stops reporting false positives:

```js
import reactPlugin from "eslint-plugin-react";

export default [
  {
    files: ["src/**/*.{js,jsx}"],
    plugins: { react: reactPlugin },
    rules: {
      "react/jsx-uses-react": "error",
      "react/jsx-uses-vars": "error",
    },
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
  },
];
```

## Reasons

1. **Runtime safety** — referencing an undefined function causes an uncatchable `ReferenceError` at render time.
2. **Component contract** — a public `className` prop is a standard React convention; ignoring it breaks layout expectations.
3. **Dead code elimination** — unused imports increase bundle size marginally and confuse static analyzers.
4. **Codebase consistency** — mixed import styles reduce predictability and can trip up tooling.
5. **Developer experience** — without an ESLint config, the editor lacks the rules to correctly parse JSX, producing misleading errors that waste debugging time.

## Consequences

### Positive

- The "Transfer Money" button now renders with `mt-4 w-full` spacing as intended.
- Clicking "Sign out" properly clears session state instead of crashing.
- ESLint runs cleanly with zero errors.
- The build produces identical output (no regressions).

### Negative

- None identified.

## Alternatives Considered

### Using tailwind-merge

For the `Button` className merging, we considered using `tailwind-merge` for intelligent conflict resolution (e.g., if a passed class conflicts with a default class). This was deferred to a future ADR because the current concatenation approach handles all existing use cases and avoids adding a new dependency.

### Keeping unused React import

We could have kept the import as a defensive measure against future JSX transform changes. We decided against it because:
- The automatic runtime has been stable since React 17.
- `@vitejs/plugin-react` v4.x enables it by default and is unlikely to revert.
- The import sends a misleading signal to new developers about what React features are in use.

## References

| Source | URL |
|--------|-----|
| React JSX Transform (New Runtime) | [react.dev/blog/2020/09/22/introducing-the-new-jsx-transform](https://react.dev/blog/2020/09/22/introducing-the-new-jsx-transform) |
| @vitejs/plugin-react docs | [github.com/vitejs/vite-plugin-react](https://github.com/vitejs/vite-plugin-react) |
| ESLint Flat Config | [eslint.org/docs/latest/use/configure/configuration-files](https://eslint.org/docs/latest/use/configure/configuration-files) |
