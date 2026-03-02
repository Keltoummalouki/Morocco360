CI Pipeline Plan — Morocco360 Monorepo
Context
The Morocco360 project is a monorepo with two independent services:

api/ — NestJS backend (Node.js 22, TypeScript 5.7, Jest 30)
web/ — Next.js 16 frontend (React 19, TypeScript 5, no tests yet)
No GitHub Actions configuration exists yet. The goal is to add a CI workflow that automatically lints, builds, and tests both services on every push/PR to main. CD (deployment) is deferred.

Implementation Plan
File to create: .github/workflows/ci.yml
Single workflow with two parallel jobs (API + Web), triggered on:

push → main
pull_request → main
Job 1 — api
Runs inside api/ directory, Node 20.x, caches npm dependencies.

Steps:

actions/checkout@v4
actions/setup-node@v4 with node-version: '20' and npm cache keyed to api/package-lock.json
npm ci (inside api/)
npm run lint — ESLint v9 flat config
npm run build — nest build
npm run test — Jest unit tests
npm run test:e2e — Jest e2e suite (test/jest-e2e.json)
Job 2 — web
Runs inside web/ directory, Node 20.x, caches npm dependencies.

Steps:

actions/checkout@v4
actions/setup-node@v4 with node-version: '20' and npm cache keyed to web/package-lock.json
npm ci (inside web/)
npm run lint — ESLint v9 flat config (next core-web-vitals)
npm run build — next build
Sets env NEXT_TELEMETRY_DISABLED=1 to suppress Next.js telemetry in CI
Critical files
.github/workflows/ci.yml — new file to create
No existing files need modification.
Verification
After merging or pushing to main, check the "Actions" tab on GitHub. Both api and web jobs should appear and pass.

To test locally before pushing:


# API
cd api && npm ci && npm run lint && npm run build && npm run test && npm run test:e2e

# Web
cd web && npm ci && npm run lint && npm run build
User approved the plan
Update Todos

Create .github/workflows/ci.yml
Bash Create .github/workflows directory
IN
mkdir -p "c:/Users/kelto/OneDrive/Bureau/Projects/Morocco360/.github/workflows"

OUT
0
Write c:\Users\kelto\OneDrive\Bureau\Projects\Morocco360\.github\workflows\ci.yml
73 lines
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  api:
    name: API (NestJS)
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: api/package-lock.json

      - name: Install dependencies
        working-directory: api
        run: npm ci

      - name: Lint
        working-directory: api
        run: npm run lint

      - name: Build
        working-directory: api
        run: npm run build

      - name: Unit tests
        working-directory: api
        run: npm run test

      - name: E2E tests
        working-directory: api
        run: npm run test:e2e

  web:
    name: Web (Next.js)
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: web/package-lock.json

      - name: Install dependencies
        working-directory: web
        run: npm ci

      - name: Lint
        working-directory: web
        run: npm run lint

      - name: Build
        working-directory: web
        env:
          NEXT_TELEMETRY_DISABLED: 1
        run: npm run build
Update Todos

Create .github/workflows/ci.yml
The CI pipeline is ready. Here's what was created:

.github/workflows/ci.yml

Two parallel jobs run on every push/PR to main:

Step	api job	web job
Node	20.x + npm cache	20.x + npm cache
Install	npm ci	npm ci
Lint	npm run lint	npm run lint
Build	npm run build (nest build)	npm run build (next build)
Tests	npm run test + npm run test:e2e	— (no tests yet)
Notes:

NEXT_TELEMETRY_DISABLED=1 is set for the web build to suppress Next.js telemetry output in CI logs
npm ci is used instead of npm install to ensure reproducible installs from the lockfiles
Both jobs run in parallel to save time
When you add tests to web/ later, just add a npm run test step to the web job
