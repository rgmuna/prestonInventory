barcodeApp.config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {

  $urlRouterProvider.otherwise('/inventory-list');

  $stateProvider

    .state('inventory-list', {
      url: '/inventory-list',
      views: {

              main: {templateUrl: '/templates/inventory-list.html',
                      controller: 'InventoryListController'
                    }
            },
    })
    .state('barcode-generator', {
      url: '/barcode-generator',
      views: {

              main: {templateUrl: '/templates/barcode-generator.html',
                      controller: 'GenerateBarcodeController'
                    }
            }
    })
    .state('inventory-scanner', {
      url: '/inventory-scanner',
      views: {

              main: {templateUrl: '/templates/inventory-scanner.html',
                      controller: 'InventoryScannerController'
                    }
            }
    })
    .state('loaner-list', {
      url: '/loaner-list',
      views: {

              main: {templateUrl: '/templates/loaner-list.html',
                      controller: 'LoanerListController'
                    }
            }
    })
    .state('loaner-scanner', {
      url: '/loaner-scanner',
      views: {

              main: {templateUrl: '/templates/loaner-scanner.html',
                      controller: 'LoanerScannerController'
                    }
            }
    })
    .state('generated', {
      url: '/generated',
      views: {

              main: {templateUrl: 'generated.html',
                      controller: 'PrintController as vm'
                    }
            }
    })
}])
