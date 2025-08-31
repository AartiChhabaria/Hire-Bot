"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pageAddLogs = exports.formatDate = void 0;
var chalk = require("chalk");
function formatDate(date) {
    var d = new Date(date);
    var month = '' + (d.getMonth() + 1);
    var day = '' + d.getDate();
    var year = d.getFullYear();
    if (month.length < 2) {
        month = '0' + month;
    }
    if (day.length < 2) {
        day = '0' + day;
    }
    return [year, month, day].join('-');
}
exports.formatDate = formatDate;
function describe(jsHandle) {
    return jsHandle.executionContext().evaluate(function (obj) {
        // serialize |obj| however you want
        return 'beautiful object of type ' + (typeof obj);
    }, jsHandle);
}
function pageAddLogs(page, pageId) {
    /*
    See: https://github.com/puppeteer/puppeteer/issues/2083
    page.on('console', async msg => {
        const args = await Promise.all(msg.args().map(arg => describe(arg)));
        console.log(msg.text(), ...args);
      });
    */
    page.on('console', function (message) {
        if (message.type() === 'warning') {
            return;
        }
        var type = message.type().substr(0, 3).toUpperCase();
        var colors = {
            LOG: function (text) { return text; },
            ERR: chalk.red,
            WAR: chalk.yellow,
            INF: chalk.cyan
        };
        var color = colors[type] || chalk.blue;
        console.log("".concat(pageId), color("".concat(type, " ").concat(message.text())));
    })
        .on('pageerror', function (error) { return console.log("".concat(pageId, " pageerror: "), error); })
        // .on('response', response => console.log(`${pageId} response: ${response.status()} ${response.url()}`))
        // .on('request', request => console.log(`${pageId} request: ${request.url()} headers: ${JSON.stringify(request.headers())} response: ${request.response()}`))
        .on('requestfailed', function (request) { return console.log("".concat(pageId, " requestfailed: ").concat(request.failure().errorText, " ").concat(request.url())); });
}
exports.pageAddLogs = pageAddLogs;
