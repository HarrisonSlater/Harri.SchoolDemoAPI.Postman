# Harri.SchoolDemoAPI.Postman Collection

**Postman Collection & Newman Pipeline for the [Harri.SchoolDemoAPI REST API](https://github.com/HarrisonSlater/Harri.SchoolDemoAPI)**

This repository provides a Postman Collection alongside a custom Newman-based collection runner setup to streamline automated Postman API testing for the `Harri.SchoolDemoAPI` project (a .NET 8-based CRUD REST API).

## Features

- **Standard Postman Collection**: Pre-configured requests for all key API endpoints.
- **Data Driven Postman Collection**: Extensive data-driven tests for each API endpoint.
- **Newman Folder Runner**: Node script to run the above data-driven collection and other collections with a similar folder structure.
- **Automation-Ready**: Easily run all provided collections via Newman in CI pipelines, facilitating automated testing.

## Quick Start (`StudentDemoAPI.postman_collection.json`)

1. **Import** the collection:  
   `postman/collections/StudentDemoAPI.postman_collection.json` into your Postman app.
2. **Configure** your environment variables (`baseUrl`), or import `Local.postman_environment.json`.
3. **Run with Newman** (example command):  
   ```bash
   newman run StudentDemoAPI.postman_collection.json --env-var "baseUrl=localhost:8080" --reporters "cli,junit" --reporter-junit-export results.xml --suppress-exit-code
   ```

---

## Data Driven Collections

To explore an advanced data-driven testing collection, use:  
`StudentDemoAPI - Students Tests - Data Driven.postman_collection.json`

Iteration data files are found under `/postman/collections/iteration-data`, matching the folder structure found in the collection.

### Automated Script for Data Driven Collections

Using the included Node.js script **newman-folder-runner**, you can run a series of `newman run` commands against folders in a Postman collection and automatically include iteration-data files that match the collection's folder structure.

#### Prerequisites

- **Node.js** and **npm** installed.

#### Setup

Navigate to the `newman-folder-runner` directory and run:
```bash
npm install
```

#### Running

- **On Windows:**
  ```bash
  ./run '.\postman\collections\StudentDemoAPI - Students Tests - Data Driven.postman_collection.json'
  ```
- **On Linux:**
  ```bash
  ./run.sh "./postman/collections/StudentDemoAPI - Students Tests - Data Driven.postman_collection.json"
  ```

These scripts call the underlying Node.js script:  
`node ./newman-folder-runner/newman-folder-runner.js` and pass through arguments.

---

### Command Line Expected Output

On start, the script logs values read from `folders-to-run.json`, the Postman collection, and the data files:

```
Collection folders to run:
    GET - 200 OK,
    GET - 404 Not Found,
    ...
Data files discovered: [ ... ]
Folder to json/csv data file mapping: { ... }
Running collection: ./postman/collections/StudentDemoAPI - Students Tests - Data Driven.postman_collection.json
```

As the Newman runs complete, the status for each folder is displayed:
```
--- COLLECTION FOLDER RUN RESULTS ---
Collection run for folder:  GET - 404 Not Found completed with status:  SUCCESS
...
```

---

### Folder and Collection Structure

**Data files folder structure example:**
```
└───iteration-data
    └───Students
        ├───GET
        │   ├───GET - 200 OK
        │   │       studentIds.csv
        │   ├───GET - 400 Bad Request
        │   │       studentIds.csv
        │   └───GET - 404 Not Found
        │           studentIds.csv
        └───PUT
            ├───PUT - 200 OK
            │       data1.json
            ├───PUT - 400 Bad Request
            │       badRequests.json
            ├───PUT - 412 Precondition Failed
            │       ifMatchHeaders.csv
            └───PUT - 428 Precondition Required
                    ifMatchHeaders.csv
```

**Matching folder structure in Postman collection:**
```
└───Postman Collection
    └───Students
        ├───GET
        │   ├───GET - 200 OK
        │   │       GET Student request
        │   ├───GET - 400 Bad Request
        │   │       GET Student request
        │   └───GET - 404 Not Found
        │           GET Student request
```

**Complex structure example:**
```
└───PUT
    └───PUT - 200 OK 
        ├───Setup
        |    POST Create auth token
        |    POST Create student to update
        |    GET Get student ETag
        ├───Test
        |    PUT Update existing student name
        |    GET Assert student updated
        └───Cleanup
             DEL Delete created student
```

---

### `folders-to-run.json`

This file dictates which folders from the Postman collection to actually run. Example:

```json
[
    "GET - 200 OK",
    "GET - 404 Not Found",
    "GET - 400 Bad Request",
    "PUT - 200 OK",
    "PUT - 412 Precondition Failed",
    "PUT - 428 Precondition Required",
    "PUT - 404 Not Found",
    "PUT - 400 Bad Request"
]
```

---

### Test Results

Results after `newman-folder-runner` runs are stored under the `newman-reports` folder:

```
└───StudentDemoAPI - Students Tests - Data Driven.postman_collection
    ├───GET
    │       GET - 200 OK-studentIds.csv.results.xml
    │       ...
    └───PUT
            PUT - 200 OK-data.json.results.xml
            ...
```
