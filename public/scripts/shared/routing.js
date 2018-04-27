barcodeApp.config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {

  $urlRouterProvider.otherwise('/home');

  $stateProvider

    .state('home', {
      url: '/home',
      views: {

              main: {templateUrl: '/templates/home.html',
                      controller: 'Inv_List_Ctrl'
                    }
            },
    })
    .state('generateBarcodes', {
      url: '/generateBarcodes',
      views: {

              main: {templateUrl: '/templates/generateBarcodes.html',
                      controller: 'Generate_Barcode_Ctrl'
                    }
            }
    })
    .state('checkInOut', {
      url: '/checkInOut',
      views: {

              main: {templateUrl: '/templates/checkInOut.html',
                      controller: 'Inv_CheckInOut_Ctrl'
                    }
            }
    })
    .state('loanerInventory', {
      url: '/loanerInventory',
      views: {

              main: {templateUrl: '/templates/loanerInventory.html',
                      controller: 'Loaner_List_Ctrl'
                    }
            }
    })
    .state('loanerCheckInOut', {
      url: '/loanerCheckInOut',
      views: {

              main: {templateUrl: '/templates/loanerCheckInOut.html',
                      controller: 'Loaner_CheckInOut_Ctrl'
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
