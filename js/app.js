angular.module('stackui', ['ngRoute'])
.config(['$routeProvider', function($routeProvider) {
	$routeProvider.
		when('/', {
			templateUrl: 'partial/home.html',
			controller: 'HomeCtrl'
		}).
		when('/search',{
			templateUrl: 'partial/search.html',
			controller: 'QueryCtrl'
		}).
		when('/question/:question_id', {
			templateUrl: 'partial/question.html',
			controller: 'QuestionCtrl'
		}).
		when('/favourite',{
			templateUrl: 'partial/favourite.html'
		}).
		when('/about', {
			templateUrl: 'partial/about.html'
		}).
		otherwise({
			redirectTo: '/'
		});
}])
.filter('trustHtml', function ($sce) {
        return function (input) {
            return $sce.trustAsHtml(input);
        }
 })
.controller('HomeCtrl',function($scope, $location) {
	$scope.$watch('query', function(argument) {
		//console.log($scope.query);
	})

	$scope.search = function() {
		console.log($scope.query)
		$location.path("/search").search('q', $scope.query);
	}
})
.controller('QueryCtrl', function($scope, $location, $routeParams) {
	console.log($routeParams)
	$scope.view = function(question){
		$location.path("/question/" + question.question_id);
	}

	if(localStorage.getItem($routeParams.q)){
		$scope.questions = JSON.parse(localStorage.getItem($routeParams.q));
		//$scope.$digest();
		return
	}

	$.ajax({
		"async": true,
		//"crossDomain": true,
		"url": "https://api.stackexchange.com/2.2/search/advanced",
		"method": "GET",
		"data":{
			page : 1,
			pagesize : 8,
			order: "desc",
			sort: "relevance",
			q : $routeParams.q,
			site : "stackoverflow",
			filter : "withbody"
		},
		"headers": {
			//"content-type": "application/json"
		}
	}).done(function (response) {
		console.log(response)
		$scope.questions = response.items;

		localStorage.setItem($routeParams.q,JSON.stringify($scope.questions))
		$scope.$digest();
	});
})
.controller('QuestionCtrl', function($scope, $routeParams){
	$.ajax({
		"async": true,
		//"crossDomain": true,
		"url": "https://api.stackexchange.com/2.2/questions/" + $routeParams.question_id,
		"method": "GET",
		"data":{
			order: "desc",
			sort: "votes",
			site : "stackoverflow",
			filter : "withbody"
		},
		"headers": {
			//"content-type": "application/json"
		}
	}).done(function (response) {
		$scope.question = response.items[0];
		console.log($scope.question);
		$scope.$digest();
	});

	$.ajax({
		"async": true,
		//"crossDomain": true,
		"url": "https://api.stackexchange.com/2.2/questions/" + $routeParams.question_id + "/answers",
		"method": "GET",
		"data":{
			order: "desc",
			sort: "votes",
			site : "stackoverflow",
			filter : "withbody"
		},
		"headers": {
			//"content-type": "application/json"
		}
	}).done(function (response) {
		console.log(response);
		$scope.answers = response.items;
		$scope.$digest();
	});
});