import chalk from 'chalk';
import newman from 'newman';
import path from 'path';
import { glob, globSync, globStream, globStreamSync} from 'glob'
//import pkg from 'glob';
//const { glob } = pkg;
//import {readdir} from 'fs/promises';

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

const foldersToTest = (await import('file://' + path.join(cwd, 'folders-to-test.json'), { with: { type: 'json' } })).default;
console.log(chalk.white('\nCollection folders to test: '), chalk.greenBright.bold(`\n\t${foldersToTest.join(', \n\t')}`))


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
    const dataFileName = folderDataFileMapping[folderName];
    const parsedFolderName = path.parse(folderName);
    //console.log(parsedFolderName)

    const junitExportFilePath = `./newman-reports/${parsedCollectionFilePath.name}-${folderName}-${dataFileName}.html`

    console.log(chalk.white(`\nRunning folder: `), chalk.blueBright.bold(folderName), chalk.white(`with data file: `), chalk.greenBright.bold(dataFileName), chalk.white(`and junit report export path: `), chalk.yellowBright.bold(junitExportFilePath));


    //console.debug(JSON.parse(collection));
    newman.run({
        collection: collection,
        reporters: ['junit'], //cli doesn't work properly here because of paralel execution
        environment: environmentFilePath,
        iterationData: path.join(iterationDataFullPath, folderName, dataFileName[0]), //TODO: support multiple data files per folder
        folder: parsedFolderName.base,
        reporter: {
            junit: {
                html: true,
                export: junitExportFilePath  
            }
        }
    }, (err, summary) => {
        if (err) {
            console.log(err)
            throw err
        }

        console.log('\nCollection run for folder: ', chalk.greenBright(parsedFolderName.base), 'completed with status: ',
            (summary.run.failures.length === 0 ? chalk.greenBright.bold('SUCCESS') : chalk.redBright('FAILURE')));
    });
}



function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}
