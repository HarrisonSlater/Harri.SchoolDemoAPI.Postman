#!/usr/bin/env node
import chalk from 'chalk';
import newman from 'newman';
import path from 'path';
import { glob } from 'glob';
import fs from 'fs';
import {successString, failureString} from './text-helper.js';

const collectionPath = process.argv[2]
if (collectionPath === undefined) {
	throw new Error(chalk.red("collectionName parameter required"));
}

const cwd = process.cwd();
const reportsFolderName = 'newman-reports';

const collection = (await import('file://' + path.join(cwd, collectionPath), { with: { type: 'json' } })).default;
const parsedCollectionFilePath = path.parse(collectionPath);

const environmentFileName = 'Local.postman_environment.json';
const environmentFilePath = path.join(cwd, parsedCollectionFilePath.dir, environmentFileName);

const iterationDataFullPath = path.join(cwd, '/postman/collections/iteration-data/Students/');

const foldersToTest = (await import('file://' + path.join(cwd, 'folders-to-run.json'), { with: { type: 'json' } })).default;
console.log(chalk.white('\nCollection folders to run: '), chalk.greenBright.bold(`\n\t${foldersToTest.join(', \n\t')}`));


const dataFiles = await glob('**/*.{json,csv}', { cwd: iterationDataFullPath, nodir: true });
console.log("Data files discovered:",  dataFiles);

const folderDataFileMapping = groupDataFilesByFolder(dataFiles);
console.log(chalk.white('\nFolder to json/csv data file mapping: '), chalk.greenBright.bold(`\n\t${JSON.stringify(folderDataFileMapping, null, 2)}`));

console.log(chalk.white('\nRunning collection: '), chalk.cyanBright.bold(collectionPath));
const allNewmanPromises = [];
const allNewmanSummaries = [];

// iterate folderDataFileMapping and run newman for each folder and data file combination
for (const folderPath in folderDataFileMapping) {
    const dataFileNames = folderDataFileMapping[folderPath];
    
    for (const dataFileName of dataFileNames) {
        const parsedFolderPath = path.parse(folderPath);
        const folderName = parsedFolderPath.base;
        
        const junitExportFilePath = `./${reportsFolderName}/${parsedCollectionFilePath.name}/${parsedFolderPath.dir}/${folderName}-${dataFileName}.results.xml`;

        console.log(chalk.white(`\nRunning folder: `), 
            chalk.blueBright.bold(folderPath), 
            chalk.white(`with data file: `), 
            chalk.greenBright.bold(dataFileName), 
            chalk.white(`and junit report export path: `), 
            chalk.yellowBright.bold(junitExportFilePath)
        );

        const config = createNewmanConfig(
            collection,
            environmentFilePath,
            folderPath,
            dataFileName,
            junitExportFilePath
        );
        
        const newmanPromise = newmanRun(config)
        newmanPromise.then(function(summary) {
            allNewmanSummaries.push(summary);
        });
        allNewmanPromises.push(newmanPromise);
    }
}

// await all newman promises and handle results
console.log(chalk.blue.bgWhite('\n--- COLLECTION FOLDER RUN RESULTS ---'));
await Promise.all(allNewmanPromises).then(() => {
    logSummaries(allNewmanSummaries);

    const overallResultHeaderString = `--- OVERALL RESULT FOR COLLECTION ---`
    const allSummaryFailures = allNewmanSummaries.reduce((acc, summary) => acc + summary.run.failures.length, 0);
    if (allSummaryFailures === 0) {
        console.log(chalk.greenBright.bold());
        console.log(chalk.greenBright(overallResultHeaderString, successString));
    }
    else {
        console.error(chalk.redBright(overallResultHeaderString, failureString));
    }
});

function createNewmanConfig(collection, environmentFilePath, folderPath, dataFileName, junitExportFilePath) {
    const parsedFolderName = path.parse(folderPath);
    return {
        collection: collection,
        reporters: ['junit'],
        environment: environmentFilePath,
        iterationData: path.join(iterationDataFullPath, folderPath, dataFileName),
        folder: parsedFolderName.base,
        reporter: {
            junit: {
                html: false,
                export: junitExportFilePath
            }
        }
    };
}

async function newmanRun(config) {
    return new Promise((resolve) => {
        newman.run(config, (err, summary) => {
            if (err) {
                console.error(chalk.red(err));
                throw err;
            }

            const parsedFolderName = path.parse(config.folder);
            console.log('\nCollection run for folder: ', 
                chalk.blueBright.bold(parsedFolderName.base), 
                'completed with status: ',
                (summary.run.failures.length === 0 
                    ? chalk.greenBright.bold('SUCCESS') 
                    : chalk.redBright('FAILURE'))
            );

            resolve(summary);
        });
    });
}

function groupDataFilesByFolder(dataFiles) {
    const folderDataFileMapping = {};
    dataFiles.forEach(fileName => {
        var parsedPath = path.parse(fileName);

        var dataFileName = parsedPath.base;
        var folderPath = parsedPath.dir;

        if (folderDataFileMapping[folderPath] === undefined) folderDataFileMapping[folderPath] = [];
        folderDataFileMapping[folderPath].push(dataFileName);
    });
    return folderDataFileMapping;
}

function logSummaries(summaries) {
    // Write all summaries to a file
    try {
        summaries.forEach((summary, index) => {
            delete summary.collection; //Don't log collection
        });
        const currentDateString = new Date(Date.now()).toISOString().replace(/(:|\.)/g, '-');
        const logFileName = path.join(cwd, reportsFolderName, "logs", currentDateString + ".json");

        fs.mkdirSync(path.dirname(logFileName), { recursive: true });
        fs.writeFileSync(logFileName, JSON.stringify(summaries, null, 2));
        console.debug(chalk.whiteBright('Summaries written to log file:\n'), chalk.yellow(logFileName));
    }
    catch (err) {
        console.error(chalk.redBright('Error writing summary logs to file:\n'));
        console.error(chalk.redBright(err));
    }
}

//TODO improvements for this script:
// add async progress of newman runs especilly when there are failures and timeouts
// html vs xml report export
// add proper cli parameters (using commander package)
    // make 'folders-to-run.json' a parameter
    // make environemnt file a parameter
// add newman parameter customisation / pass through
// extend cli results output
// add checking of folder structure against the postman collection folder structure before running
// configurable concurrency


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}
