angular.module('firstApp.services', [])

// Function that has the purpose to generate an object/function that will represent
// this service - stockDataService - to the entire application. This object/function
// will then be injected into outer components, functions, services etc.
.factory('stockDataService', function($q, $http, encodeURIService) {
// $q - this service is an implementation of a promise. It help executing async code;
// $http - service for doing requests;

  var getDetailsData = function(ticker) {
    var deferred = $q.defer(),
    url = 'https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20yahoo.finance.quotes%20where%20symbol%20in%20(%22' + ticker + '%22)&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys&callback=';
    // query = 'select * from yahoo.finance.quotes where symbol IN ("' + ticker + '")',
    // url = 'http://query.yahooapis.com/v1/public/yql?q=' + encodeURIService.encode(query) + '&format=json&env=http://datatables.org/alltables.env';

    $http.get(url)
      .success(function(json) {
          var jsonData = json.query.results.quote;
          deferred.resolve(jsonData);
      })
      .error(function(error) {
        console.log("Details data error: " + error);
        deferred.reject();
      });

      return deferred.promise;

  };

  var getPriceData = function(ticker) {
    var deferred = $q.defer(),
    url = "http://finance.yahoo.com/webservice/v1/symbols/" + ticker + "/quote?format=json&view=detail";
    // var deferred will contain an object that can resolve or reject the current promise

    $http.get(url)
      .success(function(json) {
          var jsonData = json.list.resources[0].resource.fields;
          deferred.resolve(jsonData);
      })
      .error(function(error) {
        console.log("Price data error: " + error);
        deferred.reject();
      });

      return deferred.promise;

  };

  return {
    getPriceData: getPriceData,
    getDetailsData: getDetailsData
  };
  // The service will return a promise, that will return a valid/not valid result

})

.factory('encodeURIService', function() {
  return {
    encode: function(string) {
      return encodeURIComponent(string).replace(/\"/g, "%22").replace(/\ /g, "%20").replace(/[!'()]/g, escape);
    }
  };
});
