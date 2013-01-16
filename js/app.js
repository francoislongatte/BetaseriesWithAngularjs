var interval = null;// Initiation d'un timer pour l'animation du spinner.
// creation d'un service afin de savoir quand on active ou desactive l'animation du spinner
angular.module('SharedServices', [])
    .config(function ($httpProvider) {
        $httpProvider.responseInterceptors.push('myHttpInterceptor');
        var spinnerFunction = function (data, headersGetter) {
            // demarage du spinner ici.
            $('#loading').show();
			
			
			var counter = 0;
			var $this = $('.icon-spin6');
		
			interval = setInterval(function(){
				if (counter != -9999) {
					counter -= 1;
					$this.css({
						MozTransform: 'rotate(-' + -counter + 'deg)',
						WebkitTransform: 'rotate(' + -counter + 'deg)',
						transform: 'rotate(' + -counter + 'deg)'
					});
				}
			}, 10);

            return data;
        };
        $httpProvider.defaults.transformRequest.push(spinnerFunction);
    })
// enregistrer l'intercepteur comme un service, intercepte toutes requete ajax http par angular.
    .factory('myHttpInterceptor', function ($q, $window) {
        return function (promise) {
            return promise.then(function (response) {
                // Faire quelque chose quand c'est un success.
                // arret du spinner ici.
                $('#loading').hide();
                // vidage du timer.
                clearInterval(interval);

                return response;

            }, function (response) {
                // Faire quelque chose quand c'est une erreur.
                // arret du spinner ici.
                $('#loading').hide();
                 // vidage du timer.
                clearInterval(interval);

                return $q.reject(response);
            });
        };
    });

var appViewSeries = angular.module('viewSeries', ['ngResource','SharedServices']);
appViewSeries.config(function($routeProvider, $locationProvider, $httpProvider) {
	// creation du routage angular -  Navigation
	
	$routeProvider.
	when('/search', {
		templateUrl: './partials/search.html',
		controller: searchCtrl
	}).
	when('/list/:serie', {
		templateUrl: './partials/list.html',
		controller: listCtrl
	}).
	when('/listEpisode/:serie/:season/:episode', {
		templateUrl: './partials/listEpisode.html',
		controller: listEpisodeCtrl
	}).
	when('/planning', {
		templateUrl: './partials/planning.html',
		controller: planningCtrl
	}).
	otherwise({
		redirectTo: '/home',
		templateUrl: './partials/home.html',
		controller: HomeCtrl
	});
});
// creation d'une directive pour l'effet entre les pages . - Fadeout.
appViewSeries.directive('slide', function ($timeout) {
        return {
            restrict:'EAC',
            link:function (scope, element, attrs) {
				scope.$watch(element[0].localName,function(){
					$timeout(function(){
						$('#'+ element[0].id).addClass('fade');
					},140);
				});
            }
        };
    });

//controller principal du script - defini les lien du routage.
function MainCtrl($scope, $location, $resource ,$route) {
	// Activation de la navigation principal.
	$scope.setRoute = function(route) {
		$location.path(route);
	};
}
//controller De la home page . fonction supprimer,affichage des series selectionner.
function HomeCtrl($scope, $resource, $location, $routeParams, $timeout) {
	//fonction action de supprimer la serie.
	$scope.deleteSerie = function(index,a){ 
		localStorage.removeItem('S_' + a);
		$('.infoEvent').fadeOut();
			$('#container ul>li').eq(index).animate({height: 0}, 140,function()
			{
				$(this).hide();
				
			}
		);
    };
    //fonction affichage boite de confirmation de supprimer.
    $scope.windowDel = function(index,a){
	    $('.infoEvent').fadeIn();
	    $scope.titleDel = a;
	    $scope.index = index;
    }
    //fonction annuler supprimer et retour a la liste.
    $scope.back = function(){
	    $('.infoEvent').fadeOut();
    }
    
	var data = {};
	
	var reg = new RegExp("(^S_.*)");
	for (var key in localStorage) {
		if(reg.test(key)){
			data[key] = JSON.parse(localStorage[key]);
		}
	}

	$scope.datas = data;
	
	
}
//controller De la search page . fonction rechercher une serie dans la base de betaseries.
function searchCtrl($scope, $resource, $location, $http) {
	$scope.compteur = 0;
	// creation de la requete resource pour la recherche de serie.
	$scope.betaseries = $resource('http://api.betaseries.com/shows/:action', {
		action: 'search.json',
		title: 'vampire',
		key: 'b57dfde6b181',
		callback: 'JSON_CALLBACK'
	}, {
		get: {
			method: 'JSONP'
		}
	});
	
	// modification de la requete ressource avec la valeur tape dans l'input. Title remplacer par valeur input.
	$scope.doSearch = function() {
		// vidage de la variable d'erreur.
			$scope.error = '';
		$scope.betaseriesResult = $scope.betaseries.get({title: $scope.betaSearch});
	};
	// fonction qui affiche la description avant d'ajouter dans le localStorage.
	$scope.viewChoice = function(ind){
		$http.jsonp('http://api.betaseries.com/shows/display/' + ind.url + '.json?key=b57dfde6b181&callback=JSON_CALLBACK').success(function(data) {
			$scope.viewSerie = data;
			$('#container').hide();
			$('#pageInfo').fadeIn(140);
			
		});
	};
	// fonction qui sert a revenir a la page search sans la recharger.
	$scope.back = function(){
		$('#pageInfo').hide();
		$('#container').fadeIn(140);
	};
	//fonction affichage boite de confirmation de supprimer.
    $scope.windowAjout = function(serie){
	    $('.infoEvent').fadeIn();
	    $scope.serie = serie;
    }
    //fonction annuler supprimer et retour a la liste.
    $scope.windowback = function(){
	    $('.infoEvent').fadeOut();
    }
	// validation dans le localstorage de la serie selectionner.
	$scope.doChoice = function(ind) {
		$http.jsonp('http://api.betaseries.com/shows/display/' + ind.url + '.json?key=b57dfde6b181&callback=JSON_CALLBACK').success(function(data) {
			
			// verification de la serie dans le localstorage et si pas L'ajouter. Si elle y est mettre message d'erreur.
			if (!localStorage.getItem('S_' + ind.url)) {
				localStorage.setItem('S_' + ind.url, JSON.stringify(data));
				$location.path("/home");
			} else {
				$scope.error = 'Faite attention, vous l avez déja selectionner';
				$('.infoEvent').fadeOut();
			}
		}).error(function(data) {
			$scope.error = 'Une erreur est survenue lors de la recuperation des données';
		});
	};
	
}
//controller De la list page d'une serie en particulier. fonction affichage details series + saisons + episodes.
function listCtrl($scope, $http, $routeParams) {

	// initiation du parametre url, recuperation de la chaine du localstorage de cette serie, d'un compteur, verification true ou false(boolLocalStorage).
	var url = $routeParams.serie,
	localObj = JSON.parse(localStorage['S_'+url]),
	boolLocalStorage;
	// initiation de la requete de recuperation d'une serie .
	$http.jsonp('http://api.betaseries.com/shows/episodes/' + $routeParams.serie + '.json?key=b57dfde6b181&callback=JSON_CALLBACK').success(function(data) {
		if(localObj.root.show.seasons.constructor == Object){ //verification dans le localStorage des seasons et series.
			localObj.root.show.seasons = data.root.seasons;
			localStorage['S_' + url] = JSON.stringify(localObj);
		}
		var Seasons = localObj.root.show.seasons; //recuperation des saisons
		$scope.nbSeasons = Seasons.length; //affiche le nombre de saisons
		var number = 0; // initiation d'un compteur pour le nombre d'episode Total.
		for(var i= 0; i < Seasons.length ; i++)
		{
				number = number + parseInt(Seasons[i].episodes.length, null);
		}
		$scope.nbEpisodes = number; // affectation du nombre total d'episode. 
		$scope.currentSerie = JSON.parse(localStorage['S_' + url]); // affectation de la serie selectionnée.
		
          //regarde si tout les episodes a bien un objet bool sinon l'ajout pour toute episode de chaque serie.
	var reg = new RegExp("(^S_.*)");
			for (var key in localStorage) {
				if(reg.test(key)){
					boolLocalStorage = JSON.parse(localStorage[key]);
					for(var l = 0 ; l < boolLocalStorage.root.show.seasons.length ; l++){
						for( i = 0 ; i < boolLocalStorage.root.show.seasons[l].episodes.length ; i++){
							if(!boolLocalStorage.root.show.seasons[l].episodes[i].bool){
								boolLocalStorage.root.show.seasons[l].episodes[i].bool = 'false';
								boolLocalStorage.root.show.seasons[l].episodes[i].season = l + 1;
								localStorage[key] = JSON.stringify(boolLocalStorage);
							}
						}
					}
				}
			}
	});
	
	
	$scope.url = url; // affectation d'url de la serie courrante dans le scope.
	
	// function qui active ou desactive un episode si vu ou pas vu . est afficher grace a true ou false.
	$scope.isCompleted = function(stat,value,mIndex,mIndexParent){
		var scope = this;
		var localStorageParse = JSON.parse(localStorage['S_' + url]);
		if( stat.episode.bool === 'false'){  
			localStorageParse.root.show.seasons[mIndexParent].episodes[mIndex].bool = 'false';
		}else{
			localStorageParse.root.show.seasons[mIndexParent].episodes[mIndex].bool = 'true';
		}
		localStorage['S_' + url] = JSON.stringify(localStorageParse); // affecte la nouvel valeur dans le localStorage.
	};
}
//controller De la listEpisode page d'une serie en particulier. fonction affichage details de l'episode.
function listEpisodeCtrl($scope, $http, $routeParams){
	// initiation de la requete pour afficher l'episode et sa description , image , ect...
	$http.jsonp('http://api.betaseries.com/shows/episodes/' + $routeParams.serie + '.json?' + 'season=' + $routeParams.season + '&episode=' +  $routeParams.episode  + '&key=b57dfde6b181&callback=JSON_CALLBACK').success(function(data) {
		$scope.currentEpisode = data.root.seasons[0].episodes;
	});
	
	
}
	
//controller De la planning page des series selectionner. fonction affichage des series avenir de ceux selectionner.	
function planningCtrl($scope, $http, $routeParams){
	//initiation de la requete pour le planning de toute les series .
	$http.jsonp('http://api.betaseries.com/planning/general.json?&key=b57dfde6b181&callback=JSON_CALLBACK').success(function(data) {
		//initiation des variable afin de tester si une valeur du localStorage correspond a une valeur des series plannifier.
		var valStorage = [],
		i = 0,
		j = 0,
		k = 0,
		date = [],
		dateverif = [],
		splitValue,
		date = new Date();
		date = date.getTime();
		$scope.resultPlanning = [],
		reg = new RegExp("(^S_.*)");
		//recuperation du nom dans le localStorage sans le S_.
		for (var key in localStorage) {
			if(reg.test(key)){
				splitValue = key.split('_');
				valStorage.push(splitValue[1]);
				i++;
			}
		}
		console.log(date/1000);
		// boucle qui verifie si une valeur du localStorage correspond au serie du planning.
		angular.forEach(data.root.planning,function(){
			if(jQuery.inArray(data.root.planning[j].url, valStorage) !='-1'){
				data.root.planning[j].banner = JSON.parse(localStorage['S_'+ data.root.planning[j].url]).root.show.banner;
				data.root.planning[j].network = JSON.parse(localStorage['S_'+ data.root.planning[j].url]).root.show.network;
				
				console.log(data.root.planning[j-1].date == data.root.planning[j].date);
				if(data.root.planning[j-1].date != data.root.planning[j].date){
					data.root.planning[j].date = '';
					data.root.planning[j].hide = 'hide'; 
				}else{
					if(data.root.planning[j].date < date/1000){
						data.root.planning[j].etat = 'before';
						data.root.planning[j].sorti = '- sorti';
					}else{
						data.root.planning[j].etat = 'next';
						data.root.planning[j].sorti = '- bientôt';
					}
					data.root.planning[j].date = new Date(data.root.planning[j].date * 1000);
				}
				
				console.log(data.root.planning[j]);
				$scope.resultPlanning.push(data.root.planning[j]);
			}
			j++;
		});
		$scope.date = dateverif;
	});
}
//creation de filtre 1. Savoir si c'est le premier ou pas 2. savoir si il y a une image ou pas et renvoyer une image de substitution 3. le verifcontent affiche si il y a du contenu sinon une erreur.
appViewSeries.filter('FirstOrNot', function () {
        return function (number) {
			if(number <= 1){
				return  number + ' er';
			}else{
				return number + ' ème';
			}
        };
    }).filter('isOrNot',function (){
		return function (data) {
			if(data){
				return data;
			}else{
				return './images/betaseries.png';
			}
		};
    }).filter('verifContent', function(){
		return function(data){
			if(data == ''){
				return 'Aucun resultat';
			}
		};
    });