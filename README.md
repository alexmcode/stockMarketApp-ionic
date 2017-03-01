# stockMarketApp-ionic
A simple stock market display for testing ionic purposes.
Below you can see the features that the app has and what elements I used to build them:

# Thing I worked with in this project
##### Ionic project structure:
The project has only five main JS files:
- app.js: contains, among other, the routes of the app;
- controllers.js: the logic behind every view;
- directives.js: the main Angular directive;
- filters.js: implementation of 2 custom filters using 2 gists;
- services.js: all the services that the app needs. User registration,
getting data from API and from Firebase database, caching service and others;

##### D3 Library (NVD3)
- used Bower for install
- customized data from YAHOO YQL endpoint to match the input for the chart

##### Working with YAHOO Finance API

##### Custom Filter
- shrink large numbers
  Created a custom numbers filter by adjusting a gist called megaNumber. We used the filter service within our filter, to round numbers >-1000 and <1000 to 3 digits.

##### Added Cache System
- Installed Angular-cache and configured caching for chart and market data.
- Implemented services for each cache to configure their default settings and make referencing them easy.
- Made cached data to be loaded into the view by adding if-else statements to the chart and details data service methods

##### Styling
The current styling is clean and minimalist using only CSS. I'm planning that in the near future to add SCSS.

##### Added Notes Functionality
Added Ionic pop ups to the StockCtrl. Used Ionic's popup service's show method to create notes, which I cache when saved. In order to save the data in the controller, I used ng-model directives in the note's template, which correspond to the values in a note scope object.

##### Angular-x2js Library
Used third party JavaScript library that converts XML data to JSON

##### Search Functionality
- used Angular Modal
- debounce to delay the initialization of the search method each time the modal's input changes
- used ng-if, ng-hide, and ng-show to display the results

##### Pull to refresh functionality
using an ion-refresher component

##### Firebase integration
- log in, log out, sign up functionalities
- used Firebase user authentication
- writing and reading data to and from Firebase
