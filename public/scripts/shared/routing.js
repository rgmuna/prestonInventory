barcodeApp.config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {

  $urlRouterProvider.otherwise('/inventory-list');

  $stateProvider

  .state('login', {
    url  : '/login',
    views: {
      main: {
        templateUrl: '/templates/home.html'
      }
    }
  })

  // Inventory List
  .state('inventory-list', {
    url  : '/inventory-list',
    views: {
      main: {
        templateUrl: '/templates/inventory-list.html',
        controller : 'InventoryListController'
      }
    },
  })

  // Barcode Generator
  .state('barcode-generator', {
    url  : '/barcode-generator',
    views: {
      main: {
        templateUrl: '/templates/barcode-generator.html',
        controller : 'GenerateBarcodeController'
      }
    }
  })

  // Inventory Scanner
  .state('inventory-scanner', {
    url  : '/inventory-scanner',
    views: {
      main: {
        templateUrl: '/templates/inventory-scanner.html',
        controller : 'InventoryScannerController'
      }
    }
  })

  // Loaner List
  .state('loaner-list', {
    url  : '/loaner-list',
    views: {
      main: {
        templateUrl: '/templates/loaner-list.html',
        controller : 'LoanerListController'
      }
    }
  })

  // Loaner Scanner
  .state('loaner-scanner', {
    url  : '/loaner-scanner',
    views: {
      main: {
        templateUrl: '/templates/loaner-scanner.html',
        controller : 'LoanerScannerController'
      }
    }
  })

  // Generated barcode
  .state('generated', {
    url  : '/generated',
    views: {
      main: {
        templateUrl: 'generated.html',
        controller : 'PrintController as vm'
      }
    }
  })
}])
