#!/usr/bin/env node

import chalk from 'chalk';
import newman from 'newman';
import path from 'path';
import { glob } from 'glob';
import fs from 'fs';
import {successString, failureString, truncateString} from './text-helper.js';

const collectionPath = process.argv[2]
if (collectionPath === undefined) {
	throw new Error(chalk.red("collectionName parameter required"));
}

const cwd = process.cwd();
const reportsFolderName = 'newman-reports';
const parsedCollectionFilePath = path.parse(collectionPath);

const environmentFileName = 'Local.postman_environment.json';
const environmentFilePath = path.join(cwd, parsedCollectionFilePath.dir, environmentFileName);

const iterationDataFullPath = path.join(cwd, '/postman/collections/iteration-data/Students/');

const collection = readJSONFileSync(path.join(cwd, collectionPath));
// TODO make this json optional
const foldersToTest = readJSONFileSync(path.join(cwd, 'folders-to-run.json'));

console.log(chalk.white('\nCollection folders to run: '), chalk.greenBright.bold(`\n\t${foldersToTest.join(', \n\t')}`));

const dataFiles = await glob('**/*.{json,csv}', { cwd: iterationDataFullPath, nodir: true });
console.log("Data files discovered:",  dataFiles);

const matchingFolderDataFileMappings = getMatchingFolderDataFileMappings(dataFiles, foldersToTest);

console.log(chalk.white('\nRunning collection: '), chalk.cyanBright.bold(collectionPath));
const allNewmanPromises = [];
const allNewmanSummaries = [];

// iterate matchingFolderDataFileMappings nd run newman for each folder and data file combination
for (const folderPath in matchingFolderDataFileMappings) {
    const dataFileNames = matchingFolderDataFileMappings[folderPath];
    
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
            allNewmanSummaries.push({folderName, summary});

            const statusString = (summary.run.failures.length === 0 ? chalk.greenBright.bold('SUCCESS') : chalk.redBright('FAILURE'));
            console.log(chalk.whiteBright(`\nSummary for folder: `), chalk.blueBright.bold(folderName), 'completed with status: ', statusString);

            console.log(chalk.whiteBright('Run stats:'));
            console.table(summary.run.stats)

            console.log(chalk.whiteBright('Run timings:'));
            console.table(getSummaryTimings(summary));

            if (summary.run.failures.length > 0) {
                console.log(chalk.redBright('Run failures:'));
                const runFailures = summary.run.failures.map((failure, index) => {
                    return {
                        index: index,
                        error: JSON.stringify(failure.error.name, null, 2),
                        errorMessage: JSON.stringify(failure.error.message, null, 2),
                        name: JSON.stringify(failure.source.name, null, 2),
                    }
                });
                console.table(runFailures)
            }

            //console.log(chalk.whiteBright('Run executions:'));
            //console.debug(summary.run.executions)
        });
        allNewmanPromises.push(newmanPromise);
    }
}

// await all newman promises and handle results
console.log(chalk.blue.bgWhite('\n--- INDIVIDUAL FOLDER RUN RESULTS ---'));
await Promise.all(allNewmanPromises).then(() => {
    writeSummariesToLogFile(allNewmanSummaries);

    const folderResultsSummaryHeaderString = `\n--- FOLDER RESULTS SUMMARY ---`
    console.log(chalk.blue.bgWhite(folderResultsSummaryHeaderString))
    console.log('\n', chalk.white('Total folders run: '), chalk.whiteBright.bold(allNewmanSummaries.length));

    allNewmanSummaries.forEach((summary, index) => {
        const folderName = summary.folderName;
        const statusString = (summary.summary.run.failures.length === 0 ? chalk.greenBright.bold('SUCCESS') : chalk.redBright('FAILURE'));

        const truncatedFolderName = truncateString(folderName, 60).padEnd(60, ' ');
        console.log(chalk.whiteBright(`\nFolder: `), chalk.blueBright.bold(truncatedFolderName), ' status: ', statusString);
    });
    console.log('');

    const overallResultHeaderString = `--- OVERALL RESULT FOR COLLECTION ---`
    const allSummaryFailures = allNewmanSummaries.reduce((acc, summary) => acc + summary.summary.run.failures.length, 0);
    if (allSummaryFailures === 0) {
        console.log(chalk.greenBright(overallResultHeaderString, successString));
        process.exit(0);
    }
    else {
        console.error(chalk.redBright(overallResultHeaderString, failureString));
        process.exit(1);
    }
}).catch((err) => {
    console.error(chalk.redBright('Error running newman:'));
    console.error(chalk.redBright(err));
    process.exit(1);
});

function getMatchingFolderDataFileMappings(dataFiles, foldersToTest) {
    const folderDataFileMapping = groupDataFilesByFolder(dataFiles);
    console.log(chalk.white('\nFolder to json/csv data file all discovered mappings: '), chalk.grey.bold(`\n\t${JSON.stringify(folderDataFileMapping, null, 2)}`));

    const matchingFolderDataFileMappings = Object.entries(folderDataFileMapping).filter(([folderPath, dataFile]) => {
        const parsedFolderPath = path.parse(folderPath);
        return foldersToTest.includes(parsedFolderPath.base);
    });

    const foundFileDirectories = (Object.keys(folderDataFileMapping).map(folderPath => path.parse(folderPath).base));
    const missingDataFiles = foldersToTest.filter(folder => {
        const parsedFolderPath = path.parse(folder);

        return foundFileDirectories.includes(parsedFolderPath.base) === false;
    });

    if (missingDataFiles.length > 0) {
        console.error(chalk.redBright('\nERROR: Folders to run missing iteration data file/folder'), chalk.yellowBright.bold(`\n\t${missingDataFiles.join(', \n\t')}`));
        throw new Error(chalk.redBright('\nFolders to run missing iteration data file/folder on system at path: ', iterationDataFullPath));
    }

    // data files that exist but will not be run because the folder is not in foldersToTest
    const notMatchingFolderDataFileMappings = Object.entries(folderDataFileMapping).filter(([folderPath, dataFile]) => {
        const parsedFolderPath = path.parse(folderPath);
        return foldersToTest.includes(parsedFolderPath.base) === false;
    });


    console.log(chalk.white('\nFolders to run with data files: '), chalk.greenBright.bold(`\n\t${matchingFolderDataFileMappings.join(', \n\t')}`));
    if (notMatchingFolderDataFileMappings.length > 0) {
        console.warn(chalk.yellow('\nFolders excluded from run with data files: '), chalk.yellowBright.bold(`\n\t${notMatchingFolderDataFileMappings.join(', \n\t')}`));
    }

    return Object.fromEntries(matchingFolderDataFileMappings);
}

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
    return new Promise((resolve, reject) => {
        newman.run(config, (err, summary) => {
            if (err) {
                console.error(chalk.red(err));
                reject(err);
            }

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

function writeSummariesToLogFile(summaries) {
    // Write all summaries to a file
    try {
        summaries.forEach((summary, index) => {
            delete summary.summary.collection; //Don't log collection
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

function getSummaryTimings(summary) {
    return {
        responseAverage: summary.run.timings.responseAverage,
        responseMin: summary.run.timings.responseMin,
        responseMax: summary.run.timings.responseMax,
        responseSd: summary.run.timings.responseSd,
        started: summary.run.timings.started,
        //completed: summary.run.timings.completed,
        totalNewmanRunMs: summary.run.timings.completed - summary.run.timings.started,
    };
}

function readJSONFileSync(fileFullPath) {
    let file;
    try {
        const raw = fs.readFileSync(fileFullPath, 'utf8');
        file = JSON.parse(raw);
    } catch (err) {
        console.error(chalk.redBright('Error reading/parsing collection file:'), chalk.yellow(fileFullPath));
        console.error(err);
        process.exit(2);
    }
    return file;
}
//TODO improvements for this script:
// add async progress of newman runs especilly when there are failures and timeouts
// html vs xml report export
// add proper cli parameters (using commander package)
    // make 'folders-to-run.json' a parameter
    // make environemnt file a parameter
// add newman parameter customisation / pass through
// extend cli results output
// add log for postman collection folders not run
// configurable concurrency


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}
