(function() {
	'use strict';

	angular.module('iTravelApp')
	.controller('LoginCtrl', ['$scope', '$location', 'User', function($scope, $location, User) {
		$scope.uiModel = {
			email: '',
			password: ''
		};

		$scope.login = function() {
			var email = $scope.uiModel.email;
			var password = $scope.uiModel.password;

			User.login(email, password)
				.then(function success() {
					console.log('user logged in successfully');
					$location.url('/');
				}, function fail(err) {
					console.log('user login failed. res:', err);
				});
		};
	}]);
})();