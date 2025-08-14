# Harri.SchoolDemoAPI.Postman Collection

**Postman Collection & Newman Pipeline for the [Harri.SchoolDemoAPI REST API](https://github.com/HarrisonSlater/Harri.SchoolDemoAPI)**

This repository provides a Postman Collection alongside a Newman-based collection runner setup to streamline automated postman API testing for the `Harri.SchoolDemoAPI` project (a .NET 8-based CRUD REST API).

## Features

* **Postman Collection**: Pre-configured requests for all key API endpoints
* **Automation-Ready**: Easily run the collection via Newman in CI pipelines, facilitating automated testing.
  > `newman run StudentDemoAPI.postman_collection.json --env-var "baseUrl=localhost:8080" --reporters "cli,junit" --reporter-junit-export results.xml --suppress-exit-code`

## Quick Start

1. **Import** the Postman Collection into your Postman app.
2. **Configure** your environment variables (`baseUrl`) or import the Local.postman_environment.json 
3. Use **Newman** to execute the collection programmatically or within a build pipeline.

---
