barcodeApp.config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {

  $urlRouterProvider.otherwise('/home');

  $stateProvider

    .state('home', {
      url: '/home',
      views: {

              main: {templateUrl: '/templates/home.html',
                      controller: 'BarcodeController'
                    }
            },
    })
    .state('generateBarcodes', {
      url: '/generateBarcodes',
      views: {

              main: {templateUrl: '/templates/generateBarcodes.html',
                      controller: 'BarcodeController'
                    }
            }
    })
    .state('checkInOut', {
      url: '/checkInOut',
      views: {

              main: {templateUrl: '/templates/checkInOut.html',
                      controller: 'BarcodeController'
                    }
            }
    })
    .state('loanerInventory', {
      url: '/loanerInventory',
      views: {

              main: {templateUrl: '/templates/loanerInventory.html',
                      controller: 'LoanerController'
                    }
            }
    })
    .state('loanerCheckInOut', {
      url: '/loanerCheckInOut',
      views: {

              main: {templateUrl: '/templates/loanerCheckInOut.html',
                      controller: 'LoanerController'
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
