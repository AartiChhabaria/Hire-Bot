import * as path from 'path';
import * as fs from 'fs';
import * as puppeteer from 'puppeteer';
import { concatMap, map } from 'rxjs/operators';
import { defer } from 'rxjs';
import { formatDate } from './utils';
import yargs from 'yargs';
import { getJobsFromLinkedin } from './linkedin';
import { fromPromise } from 'rxjs/internal-compatibility';
import Job from '../models/JobSchema';
import mongoose from 'mongoose';

const argv = yargs(process.argv)
    .option('headless', {
        alias: 'hdl',
        type: 'boolean',
        description: 'Whether or not execute puppeteer in headless mode. Defaults to true'
    })
    .argv;

const PUPPETEER_HEADLESS = argv.headless ?? true;

const todayDate = formatDate(new Date());

console.log('Today date: ', todayDate);

// Read scrapper file to check if there is a previous state
const jobsDataFolder: string = `data`;
const rootDirectory = path.resolve(__dirname, '..');
var initialSkill = '';
var initialModel = mongoose.models['jobs'] ? mongoose.model('jobs') : mongoose.model('jobs', Job);

// Make log directory if there isn't
fs.mkdirSync(path.join(rootDirectory, jobsDataFolder), {recursive: true});

(async () => {
    console.log('Launching Chrome...')
    const browser = await puppeteer.launch({
        headless: PUPPETEER_HEADLESS,
        // devtools: true,
        // slowMo: 250, // slow down puppeteer script so that it's easier to follow visually
        args: [
            '--disable-gpu',
            '--disable-dev-shm-usage',
            '--disable-setuid-sandbox',
            '--no-first-run',
            '--no-sandbox',
            '--no-zygote',
            '--single-process',
        ],
    });

    // Connect to MongoDB
    try {
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) {
            throw new Error('MongoDB URI not set in environment variables (MONGO_URI)');
        }
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');
    } catch (error) {
        console.log('Error connecting to MongoDB', error);
        process.exit(1);
    }

    let isClosed = false;
    function safeCloseBrowserAndExit(code = 0) {
        if (!isClosed) {
            isClosed = true;
            browser.close().then(() => {
                console.log('PROCESS EXIT');
                process.exit(code);
            });
        }
    }

    getJobsFromLinkedin(browser).pipe(
        concatMap(({jobs, searchParams}) => {
            return defer(async () => {
                // Save jobs to database
                if (initialSkill !== searchParams.searchText) {
                    initialSkill = searchParams.searchText;
                    const collectionName = `jobs_${searchParams.searchText}`;
                    let newModel;
                    if (mongoose.models[collectionName]) {
                        newModel = mongoose.model(collectionName);
                    } else {
                        newModel = mongoose.model(collectionName, Job.schema);
                    }
                    await newModel.insertMany(jobs);
                    initialModel = newModel;
                } else {
                    await initialModel.insertMany(jobs);
                }
                const fileName = `linkedin_${searchParams.searchText}_${searchParams.locationText}_${searchParams.pageNumber}.json`;
                const logJobDataFile: string = path.join(rootDirectory, jobsDataFolder, fileName);
                await fs.promises.writeFile(logJobDataFile, JSON.stringify(jobs, null, 2), 'utf-8');
                return {jobs, searchParams};
            });
        })
    ).subscribe({
        next: () => {},
        error: (error) => {
            console.log('Major error, closing browser...', error);
            safeCloseBrowserAndExit(1);
        },
        complete: () => {
            console.log('FINISHED');
            safeCloseBrowserAndExit(0);
        }
    });

})();
