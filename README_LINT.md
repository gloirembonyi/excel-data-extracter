# Linting and Formatting Setup

## Overview

This project has been upgraded to Next.js 16 and configured with ESLint and Prettier for code quality and formatting.

## Commands

### Format Code

```bash
npm run format
```

Formats all code files using Prettier.

### Check Linting

```bash
npm run lint
```

Checks for linting errors using Next.js ESLint.

### Fix All (Format + Lint)

```bash
npm run fix
```

Runs Prettier to format all files. This is automatically run before build.

### Build

```bash
npm run build
```

Automatically runs formatting before building the project.

## Configuration Files

- `.prettierrc` - Prettier configuration
- `.prettierignore` - Files to ignore during formatting
- `eslint.config.mjs` - ESLint configuration

## Notes

- The `fix` command currently only runs Prettier formatting
- Linting is handled separately via `next lint`
- All files are automatically formatted before building


