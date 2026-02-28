# Copilot Instructions for Harri.SchoolDemoAPI.Postman

## Project Overview

This repository contains a Postman Collection and a custom Newman-based collection runner for automated API testing of the [Harri.SchoolDemoAPI](https://github.com/HarrisonSlater/Harri.SchoolDemoAPI) (.NET 8 CRUD REST API). It includes standard and data-driven Postman collections, a Node.js runner script, and an Azure DevOps CI pipeline.

## Repository Structure

```
├── postman/collections/                 # Postman collections and supporting files
│   ├── StudentDemoAPI.postman_collection.json                          # Standard collection
│   ├── StudentDemoAPI - Students Tests - Data Driven.postman_collection.json  # Data-driven collection
│   ├── Local.postman_environment.json   # Environment variables (e.g. baseUrl)
│   ├── example-scripts/                 # Example Postman pre-request/post-response scripts
│   └── iteration-data/Students/         # CSV/JSON data files for data-driven tests
│       ├── GET/
│       ├── PUT/
│       ├── PATCH/
│       ├── POST/
│       ├── DELETE/
│       └── QUERY/
├── newman-folder-runner/                # Node.js script for running collection folders
│   ├── newman-folder-runner.js          # Main runner script
│   ├── text-helper.js                   # Text formatting utilities
│   └── package.json                     # Node.js dependencies
├── folders-to-run.json                  # Specifies which collection folders to run
├── run.bat                              # Windows runner script
├── run.sh                               # Linux runner script
├── pipeline/                            # Azure DevOps CI pipeline configuration
│   ├── azure-pipelines.yml
│   ├── scripts/                         # Pipeline helper scripts
│   └── tasks/                           # Pipeline task templates
├── README.md
└── LICENSE.txt                          # Apache 2.0
```

## Tech Stack

- **Postman / Newman**: API testing framework and CLI runner
- **Node.js (ES Modules)**: Runtime for the `newman-folder-runner` script
- **npm**: Package manager
- **Azure DevOps**: CI/CD pipeline (see `pipeline/azure-pipelines.yml`)

### Key Dependencies (`newman-folder-runner/package.json`)

- `newman` – Postman CLI runner
- `newman-reporter-junitfull` – JUnit XML report generation
- `chalk` – Terminal output styling
- `glob` – File pattern matching for iteration data files

## Setup and Running

### Prerequisites

- Node.js and npm installed

### Install Dependencies

```bash
cd newman-folder-runner
npm install
```

### Run the Standard Collection

```bash
newman run "postman/collections/StudentDemoAPI.postman_collection.json" --env-var "baseUrl=localhost:8080" --reporters "cli,junit" --reporter-junit-export results.xml
```

### Run Data-Driven Tests

On Linux:
```bash
./run.sh "./postman/collections/StudentDemoAPI - Students Tests - Data Driven.postman_collection.json"
```

On Windows:
```bash
./run.bat ".\postman\collections\StudentDemoAPI - Students Tests - Data Driven.postman_collection.json"
```

These scripts invoke:
```bash
node ./newman-folder-runner/newman-folder-runner.js <collection-path>
```

### Test Results

JUnit XML results are written to the `newman-reports/` directory (gitignored).

## Coding Conventions

- The `newman-folder-runner` uses **ES Modules** (`"type": "module"` in `package.json`); use `import`/`export` syntax, not `require`.
- Shell scripts (`run.sh`, pipeline scripts) use `#!/usr/bin/env bash`.
- Postman collection folder names follow the pattern: `<HTTP Method> - <Status Code> <Description>` (e.g. `GET - 200 OK`, `PUT - 400 Bad Request`).
- Iteration data files (CSV/JSON) are stored under `postman/collections/iteration-data/` and must mirror the collection's folder structure.
- `folders-to-run.json` at the repository root controls which collection folders are executed by the runner.

## CI/CD Pipeline

The Azure DevOps pipeline (`pipeline/azure-pipelines.yml`) triggers on pushes to `main` and:
1. Pulls and runs Docker containers for the SQL database and REST API
2. Waits for the API container to become healthy
3. Runs the standard Postman collection via Newman
4. Runs all data-driven test folders via `run.sh` and `newman-folder-runner`
5. Publishes JUnit test results and build artifacts
6. Posts a commit status check to GitHub

## Important Notes

- The API under test (`Harri.SchoolDemoAPI`) is a separate repository and is run as a Docker container during CI.
- The `newman-folder-runner.js` script reads `folders-to-run.json` to determine which folders to run, discovers matching iteration data files, and runs Newman for each folder/data-file combination.
- Data-driven test folders can contain `Setup`, `Test`, and `Cleanup` subfolders to structure complex test workflows.
