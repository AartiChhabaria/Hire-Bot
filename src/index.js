"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
var path = require("path");
var fs = require("fs");
var puppeteer = require("puppeteer");
var operators_1 = require("rxjs/operators");
var rxjs_1 = require("rxjs");
var utils_1 = require("./utils");
var yargs_1 = require("yargs");
var linkedin_1 = require("./linkedin");
var JobSchema_1 = require("../models/JobSchema");
var mongoose_1 = require("mongoose");
var argv = (0, yargs_1.default)(process.argv)
    .option('headless', {
    alias: 'hdl',
    type: 'boolean',
    description: 'Whether or not execute puppeteer in headless mode. Defaults to true'
})
    .argv;
var PUPPETEER_HEADLESS = (_a = argv.headless) !== null && _a !== void 0 ? _a : true;
var todayDate = (0, utils_1.formatDate)(new Date());
console.log('Today date: ', todayDate);
// Read scrapper file to check if there is a previous state
var jobsDataFolder = "data";
var rootDirectory = path.resolve(__dirname, '..');
var initialSkill = '';
var initialModel = mongoose_1.default.models['jobs'] ? mongoose_1.default.model('jobs') : mongoose_1.default.model('jobs', JobSchema_1.default);
// Make log directory if there isn't
fs.mkdirSync(path.join(rootDirectory, jobsDataFolder), { recursive: true });
(function () { return __awaiter(void 0, void 0, void 0, function () {
    function safeCloseBrowserAndExit(code) {
        if (code === void 0) { code = 0; }
        if (!isClosed) {
            isClosed = true;
            browser.close().then(function () {
                console.log('PROCESS EXIT');
                process.exit(code);
            });
        }
    }
    var browser, mongoUri, error_1, isClosed;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                console.log('Launching Chrome...');
                return [4 /*yield*/, puppeteer.launch({
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
                    })];
            case 1:
                browser = _a.sent();
                _a.label = 2;
            case 2:
                _a.trys.push([2, 4, , 5]);
                mongoUri = process.env.MONGO_URI;
                if (!mongoUri) {
                    throw new Error('MongoDB URI not set in environment variables (MONGO_URI)');
                }
                return [4 /*yield*/, mongoose_1.default.connect(mongoUri)];
            case 3:
                _a.sent();
                console.log('Connected to MongoDB');
                return [3 /*break*/, 5];
            case 4:
                error_1 = _a.sent();
                console.log('Error connecting to MongoDB', error_1);
                process.exit(1);
                return [3 /*break*/, 5];
            case 5:
                isClosed = false;
                (0, linkedin_1.getJobsFromLinkedin)(browser).pipe((0, operators_1.concatMap)(function (_a) {
                    var jobs = _a.jobs, searchParams = _a.searchParams;
                    return (0, rxjs_1.defer)(function () { return __awaiter(void 0, void 0, void 0, function () {
                        var collectionName, newModel, fileName, logJobDataFile;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    if (!(initialSkill !== searchParams.searchText)) return [3 /*break*/, 2];
                                    initialSkill = searchParams.searchText;
                                    collectionName = "jobs_".concat(searchParams.searchText);
                                    newModel = void 0;
                                    if (mongoose_1.default.models[collectionName]) {
                                        newModel = mongoose_1.default.model(collectionName);
                                    }
                                    else {
                                        newModel = mongoose_1.default.model(collectionName, JobSchema_1.default.schema);
                                    }
                                    return [4 /*yield*/, newModel.insertMany(jobs)];
                                case 1:
                                    _a.sent();
                                    initialModel = newModel;
                                    return [3 /*break*/, 4];
                                case 2: return [4 /*yield*/, initialModel.insertMany(jobs)];
                                case 3:
                                    _a.sent();
                                    _a.label = 4;
                                case 4:
                                    fileName = "linkedin_".concat(searchParams.searchText, "_").concat(searchParams.locationText, "_").concat(searchParams.pageNumber, ".json");
                                    logJobDataFile = path.join(rootDirectory, jobsDataFolder, fileName);
                                    return [4 /*yield*/, fs.promises.writeFile(logJobDataFile, JSON.stringify(jobs, null, 2), 'utf-8')];
                                case 5:
                                    _a.sent();
                                    return [2 /*return*/, { jobs: jobs, searchParams: searchParams }];
                            }
                        });
                    }); });
                })).subscribe({
                    next: function () { },
                    error: function (error) {
                        console.log('Major error, closing browser...', error);
                        safeCloseBrowserAndExit(1);
                    },
                    complete: function () {
                        console.log('FINISHED');
                        safeCloseBrowserAndExit(0);
                    }
                });
                return [2 /*return*/];
        }
    });
}); })();
