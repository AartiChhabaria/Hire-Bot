"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getJobsFromLinkedin = void 0;
var rxjs_1 = require("rxjs");
var internal_compatibility_1 = require("rxjs/internal-compatibility");
var operators_1 = require("rxjs/operators");
var scraper_utils_1 = require("./scraper.utils");
var fromArray_1 = require("rxjs/internal/observable/fromArray");
var data_1 = require("./data");
var urlQueryPage = function (search) {
    return "https://linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=".concat(search.searchText, "&start=").concat(search.pageNumber * 25).concat(search.locationText ? '&location=' + search.locationText : '');
};
function getJobsFromLinkedinPage(page) {
    return (0, rxjs_1.defer)(function () { return (0, internal_compatibility_1.fromPromise)(page.evaluate(function (pageEvalData) {
        var _a;
        var collection = document.body.children;
        var results = [];
        var _loop_1 = function (i) {
            var _b;
            try {
                var item = collection.item(i);
                var title = item.getElementsByClassName('base-search-card__title')[0].textContent.trim();
                var imgSrc = item.getElementsByTagName('img')[0].getAttribute('data-delayed-url') || '';
                var remoteOk = !!title.match(/remote|No office location/gi);
                var url = (item.getElementsByClassName('base-card__full-link')[0]
                    || item.getElementsByClassName('base-search-card--link')[0]).href;
                var companyNameAndLinkContainer = item.getElementsByClassName('base-search-card__subtitle')[0];
                var companyUrl = (_a = companyNameAndLinkContainer === null || companyNameAndLinkContainer === void 0 ? void 0 : companyNameAndLinkContainer.getElementsByTagName('a')[0]) === null || _a === void 0 ? void 0 : _a.href;
                var companyName = companyNameAndLinkContainer.textContent.trim();
                var companyLocation = item.getElementsByClassName('job-search-card__location')[0].textContent.trim();
                var toDate = function (dateString) {
                    var _a = dateString.split('-'), year = _a[0], month = _a[1], day = _a[2];
                    return new Date(parseFloat(year), parseFloat(month) - 1, parseFloat(day));
                };
                var dateTime = (item.getElementsByClassName('job-search-card__listdate')[0]
                    || item.getElementsByClassName('job-search-card__listdate--new')[0] // less than a day. TODO: Improve precision on this case.
                ).getAttribute('datetime');
                var postedDate = toDate(dateTime).toISOString();
                /**
                 * Calculate minimum and maximum salary
                 *
                 * Salary HTML example to parse:
                 * <span class="job-result-card__salary-info">$65,000.00 - $90,000.00</span>
                 */
                var currency = '';
                var salaryMin = -1;
                var salaryMax = -1;
                var salaryCurrencyMap = (_b = {},
                    _b['€'] = 'EUR',
                    _b['$'] = 'USD',
                    _b['£'] = 'GBP',
                    _b);
                var salaryInfoElem = item.getElementsByClassName('job-search-card__salary-info')[0];
                if (salaryInfoElem) {
                    var salaryInfo = salaryInfoElem.textContent.trim();
                    if (salaryInfo.startsWith('€') || salaryInfo.startsWith('$') || salaryInfo.startsWith('£')) {
                        var coinSymbol = salaryInfo.charAt(0);
                        currency = salaryCurrencyMap[coinSymbol] || coinSymbol;
                    }
                    var matches = salaryInfo.match(/([0-9]|,|\.)+/g);
                    if (matches && matches[0]) {
                        // values are in USA format, so we need to remove ALL the comas
                        salaryMin = parseFloat(matches[0].replace(/,/g, ''));
                    }
                    if (matches && matches[1]) {
                        // values are in USA format, so we need to remove ALL the comas
                        salaryMax = parseFloat(matches[1].replace(/,/g, ''));
                    }
                }
                // const jobDescription = item.getElementsByClassName('jobs-description__content')[0].textContent!.trim();
                // console.log('jobDescription', jobDescription);
                // Calculate tags
                var stackRequired_1 = [];
                title.split(' ').concat(url.split('-')).forEach(function (word) {
                    if (!!word) {
                        var wordLowerCase = word.toLowerCase();
                        if (pageEvalData.stacks.includes(wordLowerCase)) {
                            stackRequired_1.push(wordLowerCase);
                        }
                    }
                });
                // Define uniq function here. remember that page.evaluate executes inside the browser, so we cannot easily import outside functions form other contexts
                var uniq = function (_array) { return _array.filter(function (item, pos) { return _array.indexOf(item) == pos; }); };
                stackRequired_1 = uniq(stackRequired_1);
                var result = {
                    id: item.children[0].getAttribute('data-entity-urn'),
                    city: companyLocation,
                    url: url,
                    companyUrl: companyUrl || '',
                    img: imgSrc,
                    date: new Date().toISOString(),
                    postedDate: postedDate,
                    title: title,
                    company: companyName,
                    location: companyLocation,
                    salaryCurrency: currency,
                    salaryMax: salaryMax || -1,
                    salaryMin: salaryMin || -1,
                    countryCode: '',
                    countryText: '',
                    descriptionHtml: '',
                    remoteOk: remoteOk,
                    stackRequired: stackRequired_1
                };
                console.log('result', result);
                results.push(result);
            }
            catch (e) {
                console.error("Something when wrong retrieving linkedin page item: ".concat(i, " on url: ").concat(window.location), e.stack);
            }
        };
        for (var i = 0; i < collection.length; i++) {
            _loop_1(i);
        }
        return results;
    }, { stacks: data_1.stacks })); });
}
function getJobDescription(page, job) {
    return (0, rxjs_1.defer)(function () {
        console.log('goto', job.url);
        return (0, rxjs_1.defer)(function () { return (0, internal_compatibility_1.fromPromise)(page.setExtraHTTPHeaders({ 'accept-language': 'en-US,en;q=0.9' })); })
            .pipe(
        // https://pptr.dev/api/puppeteer.puppeteerlifecycleevent
        (0, operators_1.switchMap)(function () { return (0, rxjs_1.defer)(function () { return (0, internal_compatibility_1.fromPromise)(page.goto(job.url, { waitUntil: 'networkidle2' })); }); }));
    })
        .pipe((0, operators_1.tap)(function (response) {
        var status = response === null || response === void 0 ? void 0 : response.status();
        console.log('RESPONSE STATUS', status);
        if (status === 429) {
            throw Error('Status 429 (Too many requests)');
        }
    }), (0, operators_1.switchMap)(function () { return (0, scraper_utils_1.getPageLocationOperator)(page).pipe((0, operators_1.tap)(function (locationHref) {
        console.log("LocationHref: ".concat(locationHref));
        if (locationHref.includes('linkedin.com/authwall')) {
            console.log('AUTHWALL');
            throw Error('Linkedin authwall href: ' + locationHref);
        }
    })); }), (0, operators_1.catchError)(function (error) {
        console.log('Error', error);
        return (0, rxjs_1.throwError)(error);
    }), (0, operators_1.retryWhen)((0, scraper_utils_1.genericRetryStrategy)({
        maxRetryAttempts: 4
    })), (0, operators_1.switchMap)(function () {
        return (0, rxjs_1.defer)(function () { return (0, internal_compatibility_1.fromPromise)(page.evaluate(function (sel) {
            console.log("location ".concat(location.href));
            var descriptionContainerClassName = 'show-more-less-html__markup';
            var descriptionContainer = document.getElementsByClassName(descriptionContainerClassName)[0];
            // console.log('innerHtml', descriptionContainer.innerHTML);
            return descriptionContainer && descriptionContainer.innerHTML ? descriptionContainer.innerHTML : '';
        })); });
    }), (0, operators_1.map)(function (descriptionHtml) {
        // console.log('descriptionHtml', descriptionHtml);
        return __assign(__assign({}, job), { descriptionHtml: descriptionHtml });
    }), (0, operators_1.catchError)(function (error) {
        console.log('Linkedin getJobDescription Error', error);
        return (0, rxjs_1.of)(__assign(__assign({}, job), { descriptionHtml: '' }));
    }));
}
var cookies = [
    {
        'name': 'lang',
        'value': 'v=2&lang=en-us'
    }
];
var AUTHWALL_PATH = 'linkedin.com/authwall';
var STATUS_TOO_MANY_REQUESTS = 429;
var JOB_SEARCH_SELECTOR = '.job-search-card';
function goToLinkedinJobsPageAndExtractJobs(page, searchParams) {
    return (0, rxjs_1.defer)(function () { return (0, internal_compatibility_1.fromPromise)(page.setExtraHTTPHeaders({ 'accept-language': 'en-US,en;q=0.9' })); })
        .pipe((0, operators_1.switchMap)(function () { return navigateToLinkedinJobsPage(page, searchParams); }), (0, operators_1.tap)(function (response) { return checkResponseStatus(response); }), (0, operators_1.switchMap)(function () { return throwErrorIfAuthwall(page); }), (0, operators_1.switchMap)(function () { return waitForJobSearchCard(page); }), (0, operators_1.switchMap)(function () { return getJobsFromLinkedinPage(page); }), (0, operators_1.retryWhen)((0, scraper_utils_1.retryStrategyByCondition)({
        maxRetryAttempts: 4,
        retryConditionFn: function (error) { return error.retry === true; }
    })), (0, operators_1.map)(function (jobs) { return Array.isArray(jobs) ? jobs : []; }), (0, operators_1.take)(1));
}
/**
 * Navigate to the LinkedIn search page, using the provided search parameters.
 */
function navigateToLinkedinJobsPage(page, searchParams) {
    return (0, rxjs_1.defer)(function () { return (0, internal_compatibility_1.fromPromise)(page.goto(urlQueryPage(searchParams), { waitUntil: 'networkidle0' })); });
}
/**
 * Check the HTTP response status and throw an error if too many requests have been made.
 */
function checkResponseStatus(response) {
    var status = response === null || response === void 0 ? void 0 : response.status();
    if (status === STATUS_TOO_MANY_REQUESTS) {
        throw { message: 'Status 429 (Too many requests)', retry: true, status: STATUS_TOO_MANY_REQUESTS };
    }
}
/**
 * Check if the current page is an authwall and throw an error if it is.
 */
function throwErrorIfAuthwall(page) {
    return (0, scraper_utils_1.getPageLocationOperator)(page).pipe((0, operators_1.tap)(function (locationHref) {
        if (locationHref.includes(AUTHWALL_PATH)) {
            console.error('Authwall error');
            throw { message: "Linkedin authwall! locationHref: ".concat(locationHref), retry: true };
        }
    }));
}
/**
 * Wait for the job search card to be visible on the page, and handle timeouts or authwalls.
 */
function waitForJobSearchCard(page) {
    return (0, rxjs_1.defer)(function () { return (0, internal_compatibility_1.fromPromise)(page.waitForSelector(JOB_SEARCH_SELECTOR, { visible: true, timeout: 5000 })); }).pipe((0, operators_1.catchError)(function (error) { return throwErrorIfAuthwall(page).pipe((0, operators_1.tap)(function () { throw error; })); }));
}
function getJobsFromAllPages(page, initSearchParams) {
    var getJobs$ = function (searchParams) { return goToLinkedinJobsPageAndExtractJobs(page, searchParams).pipe((0, operators_1.map)(function (jobs) { return ({ jobs: jobs, searchParams: searchParams }); }), (0, operators_1.catchError)(function (error) {
        console.error(error);
        return (0, rxjs_1.of)({ jobs: [], searchParams: searchParams });
    })); };
    return getJobs$(initSearchParams).pipe((0, operators_1.expand)(function (_a) {
        var jobs = _a.jobs, searchParams = _a.searchParams;
        console.log("Linkedin - Query: ".concat(searchParams.searchText, ", Location: ").concat(searchParams.locationText, ", Page: ").concat(searchParams.pageNumber, ", nJobs: ").concat(jobs.length, ", url: ").concat(urlQueryPage(searchParams)));
        if (jobs.length === 0) {
            return rxjs_1.EMPTY;
        }
        else {
            return getJobs$(__assign(__assign({}, searchParams), { pageNumber: searchParams.pageNumber + 1 }));
        }
    }));
}
/**
 * Creates a new page and scrapes LinkedIn job data for each pair of searchText and locationText, recursively retrieving data until there are no more pages.
 * @param browser A Puppeteer instance
 * @returns An Observable that emits scraped job data as ScraperResult
 */
function getJobsFromLinkedin(browser) {
    // Create a new page
    var createPage = (0, rxjs_1.defer)(function () { return (0, internal_compatibility_1.fromPromise)(browser.newPage()); });
    // Iterate through search parameters and scrape jobs
    var scrapeJobs = function (page) {
        return (0, fromArray_1.fromArray)(data_1.searchParamsList).pipe((0, operators_1.concatMap)(function (_a) {
            var searchText = _a.searchText, locationText = _a.locationText;
            return getJobsFromAllPages(page, { searchText: searchText, locationText: locationText, pageNumber: 0 });
        }));
    };
    // Compose sequentially previous steps
    return createPage.pipe((0, operators_1.switchMap)(function (page) { return scrapeJobs(page); }));
}
exports.getJobsFromLinkedin = getJobsFromLinkedin;
