angular.module('firstApp.services', [])

// .factory(): Function that has the purpose to generate an object/function that will represent
// this service - stockDataService - to the entire application. This object/function
// will then be injected into outer components, functions, services etc.
.factory('encodeURIService', function() {
  return {
    encode: function(string) {
      // console.log(string);
      return encodeURIComponent(string).replace(/\"/g, "%22").replace(/\ /g, "%20").replace(/[!'()]/g, escape);
    }
  };
})

.factory('dateService', function($filter) {
  var currentDate = function() {
    var d = new Date();
    var date = $filter('date')(d, 'yyyy-MM-dd');
    return date;
  };

  var oneYearAgoDate = function() {
    var d = new Date(new Date().setDate(new Date().getDate() - 365));
    var date = $filter('date')(d, 'yyyy-MM-dd');
    return date;
  };

  return {
    currentDate: currentDate,
    oneYearAgoDate: oneYearAgoDate
  };
})

.factory('stockDataService', function($q, $http, encodeURIService, stockDetailsCacheService) {
// $q - this service is an implementation of a promise. It help executing async code;
// $http - service for doing requests;

  var getDetailsData = function(ticker) {
    var deferred = $q.defer(),

    cacheKey = ticker,
    stockDetailsCache = stockDetailsCacheService.get(cacheKey),

    // Non-encoded URL:
    // url = 'https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20yahoo.finance.quotes%20where%20symbol%20in%20(%22' + ticker + '%22)&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys&callback=';

    // Encoded URL: good for cases when working with long and complex URLs
    query = 'select * from yahoo.finance.quotes where symbol IN ("' + ticker + '")',
    url = 'https://query.yahooapis.com/v1/public/yql?q=' + encodeURIService.encode(query) + '&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys&callback=';

    // console.log(url);

    if (stockDetailsCache) {
      deferred.resolve(stockDetailsCache);
    } else {
      $http.get(url)
        .success(function(json) {
            var jsonData = json.query.results.quote;
            deferred.resolve(jsonData);
            stockDetailsCacheService.put(cacheKey, jsonData);
        })
        .error(function(error) {
          console.log("Details data error: " + error);
          deferred.reject();
        });
    }

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

.factory('chartDataCacheService', function(CacheFactory) {
  var chartDataCache;

  if (!CacheFactory.get('chartDataCache')) {
    chartDataCache = CacheFactory('chartDataCache', {
      maxAge: 60 * 60 * 8 * 1000,
      deleteOnExpire: 'aggressive',
      storageModel: 'localStorage'
    });
  }
  else {
    chartDataCache = CacheFactory.get('chartDataCache');
  }

  return chartDataCache;
})

.factory('stockDetailsCacheService', function(CacheFactory) {
  var stockDetailsCache;

  if (!CacheFactory.get('stockDetailsCache')) {
    stockDetailsCache = new CacheFactory('stockDetailsCache', {
      maxAge: 60  * 1000,
      deleteOnExpire: 'aggressive',
      storageModel: 'localStorage'
    });
  }
  else {
    stockDetailsCache = CacheFactory.get('stockDetailsCache');
  }

  return stockDetailsCache;
})

.factory('chartDataService', function($q, $http, encodeURIService, chartDataCacheService) {

  var getHistoricalData = function(ticker, fromDate, todayDate) {

    var deferred = $q.defer(),

    cacheKey = ticker,
    chartDataCache = chartDataCacheService.get(cacheKey),

    query = 'select * from yahoo.finance.historicaldata where symbol = "' + ticker + '" and startDate = "' + fromDate + '" and endDate = "' + todayDate + '"',
    url = 'https://query.yahooapis.com/v1/public/yql?q=' + encodeURIService.encode(query) + '&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys&callback=';

    if (chartDataCache) {
      deferred.resolve(chartDataCache);
    }
    else {
      $http.get(url)
        .success(function(json) {
          // console.log(json);
          var jsonData = json.query.results.quote;

          var priceData = [],
          volumeData = [];

          jsonData.forEach(function(dayDataObject) {
            var dateToMillis = dayDataObject.Date,
            date = Date.parse(dateToMillis),
            price = parseFloat(Math.round(dayDataObject.Close * 100) / 100).toFixed(3),
            volume = dayDataObject.Volume,

            volumeDatum = '[' + date + ',' + volume + ']',
            priceDatum = '[' + date + ',' + price + ']';

            //console.log(volumeDatum, priceDatum);

            volumeData.unshift(volumeDatum);
            priceData.unshift(priceDatum);

          });

          var formattedChartData =
          '[{' +
            '"key":' + '"volume",' +
            '"bar":' + '"true",' +
            '"values":' + '[' + volumeData + ']' +
            '},' +
          '{' +
            '"key":' + '"' + ticker + '",' +
            '"values":' + '[' + priceData + ']' +
          '}]';

          deferred.resolve(formattedChartData);
          chartDataCacheService.put(cacheKey, formattedChartData);
        })
        .error(function(error) {
          console.log('Chart Data Error: ' + error);
          deferred.reject();
        });
    }

    return deferred.promise;

  };

  return {
    getHistoricalData: getHistoricalData
  };

})

.factory('notesCacheService', function(CacheFactory) {
  var notesCache;

  if(!CacheFactory.get('notesCache')) {
    notesCache = CacheFactory('notesCache', {
      storageMode: 'localStorage'
    });
  }
  else {
    notesCache = CacheFactory.get('notesCache');
  }

  return notesCache;
})

.factory('notesService', function(notesCacheService) {

  return {

    getNotes: function(ticker) {
      return notesCacheService.get(ticker);
    },

    addNote: function(ticker, note) {

      var stockNotes = [];

      if (notesCacheService.get(ticker)) {
        stockNotes = notesCacheService.get(ticker);
        stockNotes.push(note);
      }
      else {
        stockNotes.push(note);
      }

      notesCacheService.put(ticker, stockNotes);
    },

    deleteNote: function(ticker, index) {
      var stockNotes = [];
      stockNotes = notesCacheService.get(ticker);
      stockNotes.splice(index, 1);
      notesCacheService.put(ticker, stockNotes);
    }
  };

});
