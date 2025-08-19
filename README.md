# Harri.SchoolDemoAPI.Postman Collection

**Postman Collection & Newman Pipeline for the [Harri.SchoolDemoAPI REST API](https://github.com/HarrisonSlater/Harri.SchoolDemoAPI)**

This repository provides a Postman Collection alongside a Newman-based collection runner setup to streamline automated postman API testing for the `Harri.SchoolDemoAPI` project (a .NET 8-based CRUD REST API).

## Features

* **Postman Collection**: Pre-configured requests for all key API endpoints.
																										   
																									  
* **Automation-Ready**: Easily run the collection via Newman in CI pipelines, facilitating automated testing.

## Quick Start (StudentDemoAPI.postman_collection.json)

1. **Import** the '/postman/collections/StudentDemoAPI.postman_collection.json' collection into your Postman app.
2. **Configure** your environment variables (`baseUrl`) or import the Local.postman_environment.json.
3. Use **Newman** to execute the collection programmatically or within a build pipeline.
		  
  > `newman run StudentDemoAPI.postman_collection.json --env-var "baseUrl=localhost:8080" --reporters "cli,junit" --reporter-junit-export results.xml --suppress-exit-code`
	  
## Data Driven Collections (StudentDemoAPI - Students Tests - Data Driven.postman_collection.json)
You can run the data driven postman collection manually in the Postman app or by writing a newman command.

Iteration data files are found under **/postman/collections/iteration-data** and match the folder structure found in the collection

### Automated Script For Data Driven Collections
Using the included node script **newman-folder-runner** you can run a series of `newman run` commands against folders in a postman collection and auto include iteration data files found on the file system matching the same folder structure.

### Setup
Navigate to 
> \newman-folder-runner
and run `npm install`

### Running on windows
`./run '.\postman\collections\StudentDemoAPI - Students Tests - Data Driven.postman_collection.json'`

### Running on linux
`./run.sh "./postman/collections/StudentDemoAPI - Students Tests - Data Driven.postman_collection.json"`

All these scripts do is call the `node ./newman-folder-runner/newman-folder-runner.js` and pass through arguments

### Command line expected output

Expected output before the collection is run logs the values read from the provided folders-to-run.json, postman collection, and the data files in folders:
```
Collection folders to run:
        GET - 200 OK,
        GET - 404 Not Found,
        GET - 400 Bad Request,
        PUT - 200 OK,
        PUT - 412 Precondition Failed,
        PUT - 428 Precondition Required,
        PUT - 404 Not Found,
        PUT - 400 Bad Request
Data files discovered: [
  'PUT\\PUT - 428 Precondition Required\\ifMatchHeaders.csv',
  'PUT\\PUT - 412 Precondition Failed\\ifMatchHeaders.csv',
  'PUT\\PUT - 400 Bad Request\\badRequests.json',
  'PUT\\PUT - 200 OK\\data.json',
  'GET\\GET - 404 Not Found\\studentIds.csv',
  'GET\\GET - 400 Bad Request\\studentIds.csv',
  'GET\\GET - 200 OK\\studentIds.csv'
]

Folder to json/csv data file mapping:
        {
  "PUT\\PUT - 428 Precondition Required": [
    "ifMatchHeaders.csv"
  ],
  "PUT\\PUT - 412 Precondition Failed": [
    "ifMatchHeaders.csv"
  ],
  "PUT\\PUT - 400 Bad Request": [
    "badRequests.json"
  ],
  "PUT\\PUT - 200 OK": [
    "data.json"
  ],
  "GET\\GET - 404 Not Found": [
    "studentIds.csv"
  ],
  "GET\\GET - 400 Bad Request": [
    "studentIds.csv"
  ],
  "GET\\GET - 200 OK": [
    "studentIds.csv"
  ]
}

Running collection:  .\postman\collections\StudentDemoAPI - Students Tests - Data Driven.postman_collection.json
```
Then the newman run commands will be kicked off and as they complete will print out something like:

```
--- COLLECTION FOLDER RUN RESULTS ---

Collection run for folder:  GET - 404 Not Found completed with status:  SUCCESS

Collection run for folder:  GET - 200 OK completed with status:  SUCCESS

Collection run for folder:  PUT - 428 Precondition Required completed with status:  SUCCESS

Collection run for folder:  PUT - 412 Precondition Failed completed with status:  SUCCESS
Collection run for folder:  PUT - 400 Bad Request completed with status:  SUCCESS

Collection run for folder:  PUT - 200 OK completed with status:  SUCCESS
```

#### Folder And Collection Structure:
Data files folder structure example: 
```
└───iteration-data
    └───Students
        ├───GET
        │   ├───GET - 200 OK
        │   │       studentIds.csv
        │   │
        │   ├───GET - 400 Bad Request
        │   │       studentIds.csv
        |   |       studentIds_2.csv
        │   │
        │   └───GET - 404 Not Found
        │           studentIds.csv
        │
        └───PUT
            ├───PUT - 200 OK
            │       data1.json
            │       data2.json
            │       data3.json
            │       data4.json
            │
            ├───PUT - 400 Bad Request
            │       badRequests.json
            │
            ├───PUT - 412 Precondition Failed
            │       ifMatchHeaders.csv
            │
            └───PUT - 428 Precondition Required
                    ifMatchHeaders.csv
```

Postman collection matching folder structure:
```
└───Postman Collection
    └───Students
        ├───GET
        │   ├───GET - 200 OK
        │   │       GET Student request
        │   │
        │   ├───GET - 400 Bad Request
        │   │       GET Student request
        │   │
        │   └───GET - 404 Not Found
        │           GET Student request
```
Complex structure:
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

There is also the required folders-to-run.json:
```
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

Which dictates which folders from the postman collection to actually run.

### Test results

Results after newman-folder-runner have been run are stored under the `newman-reports` folder like:
```
└───StudentDemoAPI - Students Tests - Data Driven.postman_collection
    ├───GET
    │       GET - 200 OK-studentIds.csv.results.xml
    │       GET - 400 Bad Request-studentIds.csv.results.xml
    │       GET - 404 Not Found-studentIds.csv.results.xml
    │
    └───PUT
            PUT - 200 OK-data.json.results.xml
            PUT - 400 Bad Request-badRequests.json.results.xml
            PUT - 412 Precondition Failed-ifMatchHeaders.csv.results.xml
            PUT - 428 Precondition Required-ifMatchHeaders.csv.results.xml
```
					   
																		   
																					  
