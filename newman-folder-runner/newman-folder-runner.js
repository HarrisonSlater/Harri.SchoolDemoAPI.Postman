#!/usr/bin/env node
import chalk from 'chalk';
import newman from 'newman';
import path from 'path';
import { glob } from 'glob'

const collectionPath = process.argv[2]
if (collectionPath === undefined) {
	throw new Error(chalk.red("collectionName parameter required"))
}


const cwd = process.cwd();
console.log(chalk.white('\nCurrent working directory: '), chalk.greenBright.bold(cwd));

//https://learning.postman.com/collection-format/getting-started/structure-of-a-collection/
const collection = (await import('file://' + path.join(cwd, collectionPath), { with: { type: 'json' } })).default;
const parsedCollectionFilePath = path.parse(collectionPath);
//console.log(collection);

const environmentFileName = 'Local.postman_environment.json';
const environmentFilePath = path.join(cwd, parsedCollectionFilePath.dir, environmentFileName);

const iterationDataFullPath = path.join(cwd, '/postman/collections/iteration-data/Students/');
//const collectionPath = `../${collectionName}` 
//import * as collection from collectionPath with { type: 'json' }

/*
console.log(collection.items)

if (!Array.isArray(collection.item))
{
    collection.item = [collection.item];
}

collection.item.array.forEach(item => {
    
    item
});
*/

const foldersToTest = (await import('file://' + path.join(cwd, 'folders-to-run.json'), { with: { type: 'json' } })).default;
console.log(chalk.white('\nCollection folders to run: '), chalk.greenBright.bold(`\n\t${foldersToTest.join(', \n\t')}`))


//const results = await glob(["**/*.{json,csv}"], { cwd: iterationDataPath })
//const results = await glob('**/*.{json,csv}', { cwd: iterationDataPath, nodir: true })
const dataFiles = await glob('**/*.{json,csv}', { cwd: iterationDataFullPath, nodir: true  })
console.log("Data files discovered:",  dataFiles);

const folderDataFileMapping = {}
dataFiles.forEach(fileName => {
    var parsedPath = path.parse(fileName);

    var dataFileName = parsedPath.base;
    var folderName = parsedPath.dir;

    if (folderDataFileMapping[folderName] === undefined) folderDataFileMapping[folderName] = [];
    folderDataFileMapping[folderName].push(dataFileName);

    //console.log(chalk.white(`\nData file: `), chalk.greenBright.bold(dataFile), chalk.white(`in folder: `), chalk.blueBright.bold(folderName));
})

console.log(chalk.white('\nFolder to json/csv data file mapping: '), chalk.greenBright.bold(`\n\t${JSON.stringify(folderDataFileMapping, null, 2)}`))


console.log(chalk.white('\nRunning collection: '), chalk.cyanBright.bold(collectionPath))

// iterate folderDataFileMapping and run newman for each folder and data file combination
// iterationDataPath is the base path for the data folders and files
for (const folderName in folderDataFileMapping) {
    const dataFileNames = folderDataFileMapping[folderName];
    const parsedFolderName = path.parse(folderName);
    //console.log(parsedFolderName)



    // performa a newman run per data file in each folder
    for (const dataFileName of dataFileNames) {

        const junitExportFilePath = `./newman-reports/${parsedCollectionFilePath.name}-${folderName}-${dataFileName}.results.xml`

        console.log(chalk.white(`\nRunning folder: `), chalk.blueBright.bold(folderName), chalk.white(`with data file: `), chalk.greenBright.bold(dataFileName), chalk.white(`and junit report export path: `), chalk.yellowBright.bold(junitExportFilePath));
        newman.run({
            collection: collection,
            reporters: ['junit'], //cli doesn't work properly here because of paralel execution
            environment: environmentFilePath,
            iterationData: path.join(iterationDataFullPath, folderName, dataFileName),
            folder: parsedFolderName.base,
            reporter: {
                junit: {
                    html: false,
                    export: junitExportFilePath  
                }
            }
        }, (err, summary) => {
            if (err) {
                console.Error(chalk.red(err))
                throw err
            }

            console.log('\nCollection run for folder: ', chalk.blueBright.bold(parsedFolderName.base), 'completed with status: ',
                (summary.run.failures.length === 0 ? chalk.greenBright.bold('SUCCESS') : chalk.redBright('FAILURE')));
        });
    }

}
console.log(chalk.blue.bgWhite('\n--- COLLECTION FOLDER RUN RESULTS ---'))


//TODO improvements for this script:
// add async progress of newman runs especilly when there are failures and timeouts
// html vs xml report export
// add proper cli parameters
// add newman parameter customisation / pass through
// extend cli results output
// add checking of folder structure against the postman collection folder structure before running

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}
