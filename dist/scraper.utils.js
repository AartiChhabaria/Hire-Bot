"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPageLocationOperator = exports.retryStrategyByCondition = exports.genericRetryStrategy = void 0;
var rxjs_1 = require("rxjs");
var internal_compatibility_1 = require("rxjs/internal-compatibility");
var operators_1 = require("rxjs/operators");
var genericRetryStrategy = function (_a) {
    var _b = _a === void 0 ? {} : _a, _c = _b.maxRetryAttempts, maxRetryAttempts = _c === void 0 ? 3 : _c, _d = _b.scalingDuration, scalingDuration = _d === void 0 ? 1000 : _d, _e = _b.excludedStatusCodes, excludedStatusCodes = _e === void 0 ? [] : _e;
    return function (attempts) {
        return attempts.pipe((0, operators_1.mergeMap)(function (error, i) {
            var retryAttempt = i + 1;
            // if maximum number of retries have been met
            // or response is a status code we don't wish to retry, throw error
            if (retryAttempt > maxRetryAttempts ||
                excludedStatusCodes.find(function (e) { return e === error.status; })) {
                return (0, rxjs_1.throwError)(error);
            }
            console.log("Attempt ".concat(retryAttempt, ": retrying in ").concat(retryAttempt *
                scalingDuration, "ms"));
            // retry after 1s, 2s, etc...
            return (0, rxjs_1.timer)(retryAttempt * scalingDuration);
        }), (0, operators_1.finalize)(function () { return console.log('We are done!'); }));
    };
};
exports.genericRetryStrategy = genericRetryStrategy;
var retryStrategyByCondition = function (_a) {
    var _b = _a === void 0 ? {} : _a, _c = _b.maxRetryAttempts, maxRetryAttempts = _c === void 0 ? 3 : _c, _d = _b.scalingDuration, scalingDuration = _d === void 0 ? 1000 : _d, _e = _b.retryConditionFn, retryConditionFn = _e === void 0 ? function (error) { return true; } : _e;
    return function (attempts) {
        return attempts.pipe((0, operators_1.mergeMap)(function (error, i) {
            var retryAttempt = i + 1;
            if (retryAttempt > maxRetryAttempts ||
                !retryConditionFn(error)) {
                return (0, rxjs_1.throwError)(error);
            }
            console.log("Attempt ".concat(retryAttempt, ": retrying in ").concat(retryAttempt *
                scalingDuration, "ms"));
            // retry after 1s, 2s, etc...
            return (0, rxjs_1.timer)(retryAttempt * scalingDuration);
        }), (0, operators_1.finalize)(function () { return console.log('retryStrategyOnlySpecificErrors - finalized'); }));
    };
};
exports.retryStrategyByCondition = retryStrategyByCondition;
function getPageLocationOperator(page) {
    return (0, rxjs_1.defer)(function () { return (0, internal_compatibility_1.fromPromise)(page.evaluate(function (sel) { return location.href; })); });
}
exports.getPageLocationOperator = getPageLocationOperator;
//# sourceMappingURL=scraper.utils.js.map