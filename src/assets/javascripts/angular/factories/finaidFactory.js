'use strict';

var angular = require('angular');

/**
 * Financial Aid Factory
 */
angular.module('calcentral.factories').factory('finaidFactory', function(apiService, $http) {
  var urlAwards = '/api/campus_solutions/financial_aid_funding_sources';
  var urlFinaidYear = '/api/campus_solutions/financial_aid_data';
  // var urlFinaidYear = '/dummy/json/financial_aid_data.json';
  var urlSummary = '/api/campus_solutions/aid_years';
  // var urlSummary = '/dummy/json/finaid_summary.json';

  var urlPostTC = '/api/campus_solutions/terms_and_conditions';
  var urlPostT4 = '/api/campus_solutions/title4';

  var getAwards = function(options) {
    return apiService.http.request(options, urlAwards + '?aid_year=' + options.finaidYearId);
  };
  var getFinaidYearInfo = function(options) {
    return apiService.http.request(options, urlFinaidYear + '?aid_year=' + options.finaidYearId);
  };
  var getSummary = function(options) {
    return apiService.http.request(options, urlSummary);
  };

  var postTCResponse = function(finaidYearId, response) {
    return $http.post(urlPostTC, {
      aidYear: finaidYearId,
      response: response
    });
  };
  var postT4Response = function(response) {
    return $http.post(urlPostT4, {
      response: response
    });
  };

  return {
    getAwards: getAwards,
    getFinaidYearInfo: getFinaidYearInfo,
    getSummary: getSummary,
    postTCResponse: postTCResponse,
    postT4Response: postT4Response
  };
});
