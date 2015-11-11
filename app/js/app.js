angular.module('stackui', ['ngRoute','ngSanitize'])
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
		when('/history',{
			templateUrl: 'partial/history.html'
		}).
		when('/bookmark',{
			templateUrl: 'partial/bookmark.html',
			controller: 'BookmarkCtrl'
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
.provider('markdownConverter', function () {
  var opts = {};
  return {
    config: function (newOpts) {
      opts = newOpts;
    },
    $get: function () {
      return new showdown.Converter(opts);
    }
  };
})
.directive('markdown', ['$sanitize', 'markdownConverter', function ($sanitize, markdownConverter) {
  return {
    restrict: 'AE',
    link: function (scope, element, attrs) {
      if (attrs.markdown) {
        scope.$watch(attrs.markdown, function (newVal) {
          var html = newVal ? $sanitize(markdownConverter.makeHtml(newVal)) : '';
          element.html(html);
        });
      } else {
        var html = $sanitize(markdownConverter.makeHtml(element.text()));
        element.html(html);
      }
    }
  };
}])
.factory('bookmark', function() {
	var service = {};
	service.exists = function(question) {
		if(!localStorage.getItem("favourite")){
			localStorage.setItem("favourite", JSON.stringify([]));
		}
		var favoutites = JSON.parse(localStorage.getItem("favourite"));
		var ret = favoutites.filter(function(item){if(item.question_id == question.question_id){return item}});
		if(ret.length > 0){
			return true;
		}else{
			return false;
		}
	}

	service.addBookmark = function(question, $event) {
		if(!localStorage.getItem("favourite")){
			localStorage.setItem("favourite", JSON.stringify([]));
		}
		var favoutites = JSON.parse(localStorage.getItem("favourite"));
		favoutites.push(question);
		localStorage.setItem("favourite", JSON.stringify(favoutites));

		$event.stopPropagation();
	}

	service.removeBookmark = function(question, $event) {
		if(!localStorage.getItem("favourite")){
			localStorage.setItem("favourite", JSON.stringify([]));
		}
		var favoutites = JSON.parse(localStorage.getItem("favourite"));
		var ret = favoutites.filter(function(item){if(item.question_id != question.question_id){return item}});
		favoutites = ret;
		localStorage.setItem("favourite", JSON.stringify(favoutites));

		$event.stopPropagation();
	}

	service.getBookmarks = function() {
		if(!localStorage.getItem("favourite")){
			localStorage.setItem("favourite", JSON.stringify([]));
		}
		return JSON.parse(localStorage.getItem("favourite"));
	}

	return service;
})
.controller('HomeCtrl',function($scope, $location, bookmark) {

	var quota_remaining = localStorage.getItem("quota_remaining");
	var quota_max = localStorage.getItem("quota_max");
	if(quota_remaining && quota_max){
		$scope.quota_remaining = quota_remaining;
		$scope.quota_max = quota_max;
		$scope.quota_percent = quota_remaining / quota_max * 100 ;
	}

	$scope.view = function(question){
		$location.path("/question/" + question.question_id);
	}

	$scope.isFavourite = bookmark.exists;
	$scope.addToFavourite = bookmark.addBookmark;
	$scope.removeFromFavourite = bookmark.removeBookmark;

	$scope.search = function() {
		//$location.path("/search").search('q', $scope.query);
		if(localStorage.getItem($scope.query)){
			$scope.questions = JSON.parse(localStorage.getItem($scope.query));
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
				q : $scope.query,
				site : "stackoverflow",
				filter : "withbody"
			},
			"headers": {
				//"content-type": "application/json"
			}
		}).done(function (response) {
			console.log(response)
			$scope.questions = response.items;

			localStorage.setItem($scope.query,JSON.stringify($scope.questions))
			$scope.$digest();

			localStorage.setItem("quota_remaining", response.quota_remaining);
			localStorage.setItem("quota_max", response.quota_max);
		});
	}
})
.controller('QueryCtrl', function($scope, $location, $routeParams, bookmark) {
	console.log($routeParams)
	$scope.view = function(question){
		$location.path("/question/" + question.question_id);
	}

	$scope.isFavourite = bookmark.exists;
	$scope.addToFavourite = bookmark.addBookmark;
	$scope.removeFromFavourite = bookmark.removeBookmark;

	if(localStorage.getItem($routeParams.q)){
		$scope.questions = JSON.parse(localStorage.getItem($routeParams.q));
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

		localStorage.setItem("quota_remaining", response.quota_remaining);
		localStorage.setItem("quota_max", response.quota_max);
	});
})
.controller('QuestionCtrl', function($scope, $routeParams, $location, $anchorScroll){
	$scope.gotoAnchor = function(hash,$event) {
		var old = $location.hash();
		$location.hash(hash);
		$anchorScroll();
		//reset to old to keep any additional routing logic from kicking in
		$location.hash(old);
	}

	// $('#nav').affix({
	//     offset: {
	//         top: $('#nav').offset().top
	//     }
	// });

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
		console.log("question", $scope.question);
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
		$scope.answers = response.items;
		console.log("answers", $scope.answers);
		$scope.$digest();
	});
})
.controller('BookmarkCtrl', function($scope, $location, $routeParams, bookmark) {
	$scope.view = function(question){
		$location.path("/question/" + question.question_id);
	}

	$scope.isFavourite = bookmark.exists;
	$scope.addToFavourite = bookmark.addBookmark;
	$scope.removeFromFavourite = bookmark.removeBookmark;

	$scope.questions = bookmark.getBookmarks();
});