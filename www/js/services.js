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

.constant('FIREBASE_URL', 'https://firstappionic-d7c91.firebaseio.com')

.factory('firebaseRef', function($firebase, FIREBASE_URL) {

  var config = {
    apiKey: "AIzaSyCj1fDqGPSAcCPW0yYDH2lk9Dgy_vvfbkU",
    authDomain: "firstappionic-d7c91.firebaseapp.com",
    databaseURL: "https://firstappionic-d7c91.firebaseio.com",
    storageBucket: "firstappionic-d7c91.appspot.com",
    messagingSenderId: "437025536494"
  };
  firebase.initializeApp(config);

  // Returns a Reference to the Query's location.
  var firebaseRef = firebase.database().ref();

  return firebaseRef;

})

.factory('userServce', function(firebaseRef) {

  var login = function(user) {
    firebase.auth().signInWithEmailAndPassword(user.email, user.password).catch(function(error) {

      var errorCode = error.code;
      var errorMessage = error.message;
      console.log("Error logging in user: " + errorCode + ': ' + errorMessage);

    });
  };

  var signup = function(user) {

    // firebaseRef.createUser({
    //   email    : user.email,
    //   password : user.password
    // }, function(error, userData) {
    //   if (error) {
    //     console.log("Error creating user:", error);
    //   } else {
    //     console.log("Successfully created user account with uid:", userData.uid);
    //   }
    // });

    firebase.auth().createUserWithEmailAndPassword(user.email, user.password).catch(function(error) {

      var errorCode = error.code;
      var errorMessage = error.message;
      console.log("Error creating user: " + errorCode + ': ' + errorMessage);
    }
  );

  };

  var logout = function(user) {

  };

  return {
    login: login,
    signup: signup,
    logout: logout
  };

})

.service('modalService', function($ionicModal) {

  this.openModal = function(id) {

    var _this = this;

    if (id == 1) {
      $ionicModal.fromTemplateUrl('templates/search.html', {
        scope: null,
        controller: 'SearchCtrl'
      }).then(function(modal) {
        _this.modal = modal;
        _this.modal.show();
      });
    }
    else if (id == 2) {
      $ionicModal.fromTemplateUrl('templates/login.html', {
        scope: null,
        controller: 'LoginSignupCtrl'
      }).then(function(modal) {
        _this.modal = modal;
        _this.modal.show();
      });
    }
    else if (id == 3) {
      $ionicModal.fromTemplateUrl('templates/signup.html', {
        scope: null,
        controller: 'LoginSignupCtrl'
      }).then(function(modal) {
        _this.modal = modal;
        _this.modal.show();
      });
    }

  };

  this.closeModal = function() {

    var _this = this;

    if(!_this.modal) return;
    _this.modal.hide();
    _this.modal.remove();

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

// $q - this service is an implementation of a promise. It help executing async code;
// $http - service for doing requests;
.factory('stockDataService', function($q, $http, encodeURIService, stockDetailsCacheService, stockPriceCacheService) {

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
    cacheKey = ticker,
    url = "http://finance.yahoo.com/webservice/v1/symbols/" + ticker + "/quote?format=json&view=detail";
    // var deferred will contain an object that can resolve or reject the current promise

    $http.get(url)
      .success(function(json) {
          var jsonData = json.list.resources[0].resource.fields;
          deferred.resolve(jsonData);
          stockPriceCacheService.put(cacheKey, jsonData);
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
      storageMode: 'localStorage'
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
    stockDetailsCache = CacheFactory('stockDetailsCache', {
      maxAge: 60 * 1000,
      deleteOnExpire: 'aggressive',
      storageMode: 'localStorage'
    });
  }
  else {
    stockDetailsCache = CacheFactory.get('stockDetailsCache');
  }

  return stockDetailsCache;
})

.factory('stockPriceCacheService', function(CacheFactory) {
  var stockPriceCache;

  if (!CacheFactory.get('stockPriceCache')) {
    stockPriceCache = CacheFactory('stockPriceCache', {
      maxAge: 5 * 1000,
      deleteOnExpire: 'aggressive',
      storageMode: 'localStorage'
    });
  }
  else {
    stockPriceCache = CacheFactory.get('stockPriceCache');
  }

  return stockPriceCache;
})

.factory('chartDataService', function($q, $http, encodeURIService, chartDataCacheService, stockPriceCacheService) {

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

})

.factory('newsService', function($q, $http) {

  return {
    getNews: function(ticker) {
      var deferred = $q.defer(),
      x2js = new X2JS(),
      url = "http://finance.yahoo.com/rss/headline?s=" + ticker;

      $http.get(url)
      .success(function(xml) {
        var xmlDoc = x2js.parseXmlString(xml),
        json = x2js.xml2json(xmlDoc),
        jsonData = json.rss.channel.item;
        // console.log(json);
        deferred.resolve(jsonData);
      })
      .error(function(error) {
        deferred.reject();
        console.log("News error: " + error);
      });

      return deferred.promise;
    }
  };

})

// Insert into myStocksCache an array with the default/followed stocks
.factory('fillMyStocksCacheService', function(CacheFactory) {

  var myStocksCache;

  if(!CacheFactory.get('myStocksCache')) {
    myStocksCache = CacheFactory('myStocksCache', {
      storageMode: 'localStorage'
    });
  }
  else {
    myStocksCache = CacheFactory('myStocksCache');
  }

  var fillMyStocksCache = function() {
    var myStocksArray = [
      {ticker: "AAPL"},
      {ticker: "GPRO"},
      {ticker: "FB"},
      {ticker: "NFLX"},
      {ticker: "TSLA"},
      {ticker: "BRK-A"},
      {ticker: "INTC"},
      {ticker: "MSFT"},
      {ticker: "GE"},
      {ticker: "BAC"},
      {ticker: "C"},
      {ticker: "T"}
    ];

    myStocksCache.put('myStocks', myStocksArray);
  };

  return {
    fillMyStocksCache: fillMyStocksCache
  };
})

.factory('myStocksCacheService', function(CacheFactory) {

  var myStocksCache = CacheFactory.get('myStocksCache');

  return myStocksCache;

})

.factory('myStocksArrayService', function(fillMyStocksCacheService, myStocksCacheService) {

  if (!myStocksCacheService.info('myStocks')) {
    fillMyStocksCacheService.fillMyStocksCache();
  }

  var myStocks = myStocksCacheService.get('myStocks');

  return myStocks;

})

.factory('followStockService', function(myStocksArrayService, myStocksCacheService) {

  return {

    follow: function(ticker) {

      var stockToAdd = {"ticker": ticker};

      myStocksArrayService.push(stockToAdd);
      myStocksCacheService.put('myStocks', myStocksArrayService);

    },
    unfollow: function(ticker) {

      for (var i = 0; i < myStocksArrayService.length; i++) {
        if(myStocksArrayService[i].ticker == ticker) {
          myStocksArrayService.splice(i, 1);
          myStocksCacheService.remove('myStocks');
          myStocksCacheService.put('myStocks', myStocksArrayService);

          break;
        }
      }

    },
    checkFollowing: function(ticker) {

      for (var i = 0; i < myStocksArrayService.length; i++) {
        if (myStocksArrayService[i].ticker == ticker) {
          return true;
        }
      }

      return false;

    }
  };
})

.factory('searchService', function($q, $http) {

  return {

    search: function(query) {

      var deferred = $q.defer(),
      url = 'https://s.yimg.com/aq/autoc?query=' + query + '&region=CA&lang=en-CA&callback=JSON_CALLBACK';

      $http.jsonp(url)
            .success(function(data) {
              var jsonData = data.ResultSet.Result;
              deferred.resolve(jsonData);
            })
            .catch(function(error) {
              console.log(error);
            });

      return deferred.promise;
    }

  };

})

;
