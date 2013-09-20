(function(ng, $){
            var path = require('path');
            var flashTrust = require('nw-flash-trust');

            
            var appName = 'soundManager';

            try {
                // initialization and parsing config file for given appName (if already exists)
                var trustManager = flashTrust.initSync(appName);
                trustManager.add('./assets/bower_components/soundmanager/script/soundmanager2.swf');
                trustManager.add('./assets/bower_components/soundmanager/script/soundmanager2_debug.swf');
                trustManager.add('./assets/bower_components/soundmanager/script/soundmanager2_flash9.swf');
                trustManager.add('./assets/bower_components/soundmanager/script/soundmanager2_flash9_debug.swf');
            } catch(err) {
                if (err.message === 'Flash Player config folder not found.') {
                    // Directory needed to do the work does not exist.
                    // Probbably Flash Player is not installed, there is nothing I can do.
                }
            }
            
            
            
            var gui = require('nw.gui');
            var tray = new gui.Tray({ title: 'Tray', icon: './assets/img/vk.png' });
            
            var menu = new gui.Menu();
			menu.append(new gui.MenuItem({ type: 'checkbox', label: 'box1' }));
			tray.menu = menu;

			// Remove the tray
			//tray.remove();
			//tray = null;
            
            
            
            trustManager.add('./plugins/soundmanager2_debug.swf');
            
            var list = trustManager.list();
            //console.log(trustManager.isTrusted('./assets/bower_components/soundmanager/swf/soundmanager2_debug.swf'));            
            
})(angular, jQuery);











(function(ng, $){
            

            
            
            
            var VKAccess = 2 + 4 + 8 + 4096, VKID = 3873196 ;
            VKAccess = "friends, photos, audio, messages";
            
            
            function toJSON(str) {
                var parts = str.split("&"), out = {};
                parts.forEach(function(e, i){
                    var eParts = e.split('=');
                    out[eParts[0]] = eParts[1];
                });
                
                return out;
            }
            
            var app = ng.module("vkchat", ['ngCookies'])
            , gui = require('nw.gui');

            app.factory('User', function($cookies, $q, $cookieStore, $rootScope, $timeout){
                //console.log($cookies.user);
                var data = $cookieStore.get("User");
                
                
                
                /*if (data !== undefined && data.isLogged) {
                        $rootScope.$broadcast('UserLogin', data);
                }*/
                
                return {
                    data : data || { data : {}, isLogged : false },
                    login : function($scope){
                        var deferred = $q.defer();                 
                        
                        var fp = "https://oauth.vk.com/authorize?client_id=" + VKID +"&scope=" + VKAccess + "&redirect_uri=https://oauth.vk.com/blank.html&display=popup&v=5&response_type=token";
                        var w  = window.open(fp , "Авторизация в ВК", "menubar=yes,location=no,resizable=no,scrollbars=no,status=no");
                        
                        var stop = false, me = this, timer = setInterval(function(){                        
                            if(!stop && w.location  != null) {
                                var parts = w.location.toString().split("#");
                                
                                switch(parts[0]) {
                                    case "https://oauth.vk.com/blank.html":
                                        stop = true;
                                        break;
                                }
                                // добавить rejected в случае неудачи
                                if (stop) {
                                    me.data = { data : toJSON(parts[1]), isLogged : true };
                                    $timeout(function() {
                                                $cookieStore.put('User', me.data);
                                                deferred.resolve(me.data);
                                    
                                    }, 120);
                                    w.close();
                                }
                            } else   clearInterval(timer);
                        }, 50);               
                        
                        return deferred.promise;
                    }
                };
            });
            
            
            app.factory('GlobalSettings', function($rootScope, $cookies, User){
                /*if ($cookies.user) {
                    console.log($rootScope);
                    User.data = toJSON($cookies.user);
                    $rootScope.$broadcast("UserLogin");
                }*/
            
                return {
                    close : function($event){
                        gui.App.quit();
                        $event.preventDefault();
                    },
                    minimize : function($event){
                        gui.Window.get().minimize();                       
                        $event.preventDefault();
                        
                    }
                }
            });
            
            
            app.factory('musicService', ['$q', '$http', 'User', function($q, $http, User){

                return {
                    music : [],
                    refresh : function(){
                        var deffered = $q.defer(), me = this;

                        $http.get('https://api.vk.com/method/audio.get',
                        { params : { access_token : User.data.data.access_token }})
                        .success(function(data){
                            me.music = _.map(data.response, function(item, i){
                                item.index = i;
                                return item;
                            });

                            deffered.resolve(me.music);
                        })
                        .error(function(err){ 
                            deferred.reject(err); 
                        });

                        return deffered.promise;
                    }
                }

            }]);
            
            
            
            
            
            app.factory('Frends', function($http, $q, $cookieStore, User){
                        
                
                return {
                    frends : [],
                    getFrends : function(){
                        var deferred = $q.defer();
                        
                        var me = this;                        
                        $http.get('https://api.vk.com/method/friends.get', { params : {
                            fields : 'uid, first_name, last_name, nickname, sex, bdate, city, country, timezone, photo, photo_medium, photo_big, domain, has_mobile, rate, contacts, education',
                            access_token : User.data.access_token
                        }}).success(function(data){
                            me.frends = data.response;   
                            deferred.resolve(data.response); 
                        }).error(function(err){ deferred.reject(err); });
                        
                        return deferred.promise;
                    }
                }
            });


            
            
            app.factory('Messages', function(){
            
            });
            
            
            
            

            app.controller('userListCtrl', function($scope, Frends){               
                $scope.$on('UserLogin', function(){                   
                    Frends.getFrends().then(function(data){
                        $scope.frends = data;
                    });
                    
                });
                
                $scope.selectUser = function(uid){
                    //$rootScope.active = uid;
                    //console.log(uid);
                
                }
            
            });
            
            app.controller('chatCtrl', function($scope, $rootScope){
            
            });
            
            
            
            app.controller('mainCtrl', [ '$scope', '$rootScope',   'User',
                function($scope, $rootScope, User){
                    
                    $scope.user = User.data;
                    
                    $scope.login = function(){
                        User.login().then(function(data){
                            $scope.user = data;                            
                            $rootScope.$broadcast('UserLogin');
                        });
                    }
            } ]);
            
            
            
            
            app.directive("nicescroll", function(){
                return {
                    restricted : 'A',
                    link : function(scope, element) {
                        element.niceScroll();
                    }
                }
            });
            
            
            


            app.factory("playerService", function(musicService){
                var sm = soundManager.setup({
                  url: "./plugins",
                  //url: "http://autoparts-europe.ru/static/assets/swf/",
                  //debugFlash : true,
                  onready: function() { soundManager.createSound({  id: 'aSound' }); },
                  onplay : function(){ } ,
                  onstop : function(){ }
                });


                return {
                    player : {
                        pause : true,
                        index : -1,
                        duration : 0,
                        position : 0
                    },
                    play : function(index){
                        if(this.player.index === index || index === undefined) sm.resume();
                        else  {
                            sm.play("aSound", musicService.music[index]);
                            this.player.index = index;
                            this.player.pause = false;
                        }

                        
                    },
                    pause : function(){
                        sm.pause("aSound");
                        console.log("Pause");
                        this.player.pause = true;
                    },
                    next : function(){

                    },
                    prev : function(){

                    }
                }
            });

            
            app.directive("audio", function(musicService, playerService, $rootScope){
                        return {
                                    scope : { audio : "=" },
                                    restricted : 'E',
                                    link : function(scope, element, params){

                                        scope.status = scope.audio.index === playerService.player.index && !playerService.player.pause ;

                                        scope.cmd = function($event){
                                                if(scope.status) playerService.pause();
                                                else {
                                                    playerService.play(scope.audio.index);
                                                    $rootScope.$broadcast("startPlay", scope.audio.index);
                                                }

                                                scope.status = (scope.audio.index === playerService.player.index) && !playerService.player.pause ;
                                                //console.log(scope.status, (scope.audio.index === playerService.player.index) &&  !playerService.player.pause);


                                                $event.preventDefault();
                                                return false;
                                        }

                                        $rootScope.$on('startPlay', function(event, index){
                                            scope.status = scope.audio.index === index;
                                        });

                                    }
                        }            
            })






            
            
            app.controller('audioPlayerCtrl', ['$scope', '$rootScope', '$http', 'User', 'musicService', function($scope, $rootScope, $http, User, musicService){
                        $scope.audioList = [];

                        $scope.user = User.data;
                        
                        $scope.q = {
                            page : 0,
                            items : 100,
                            filter : ''
                        };

                        $scope.total = 0;
                        $scope.pages = [];


                        $scope.$watch("q", function(){
                           var items = musicService.music;

                           fRegexp = new RegExp('(' + $scope.q.filter.split(' ').join('|') + ')', 'gim');

                           items = _.filter(items, function(item){
                                if($scope.q.filter.length === 0) return true;
                                else return item.title.match(fRegexp) || item.artist.match(fRegexp);
                           });
                           $scope.q.page = 0;
                           
                           $scope.total = items.length;

                           items = items.slice($scope.q.page * $scope.q.items, ($scope.q.page + 1) * $scope.q.items);
                           $scope.audioList = items;
                           getPages();
                        }, true);

                        function getPages(){
                           var pages = _.range($scope.q.page  - 3, $scope.q.page + 3, 1);
                           pages = _.filter(pages, function(i){ return i >= 0; });
                           pages = _.map(pages, function(i){ return i+1 });
                           $scope.pages = pages;
                        }

                        var getList = function(){                                    
                            musicService.refresh().then(function(data){
                                    var items = data.slice($scope.q.page * $scope.q.items, ($scope.q.page + 1) * $scope.q.items);
                                    $scope.audioList = items;
                                    $scope.total = data.length;
                                    getPages();
                                    $scope.show = true;
                            });
                        }

                        $scope.setPage = function($index){
                            console.log("Change page");
                            $scope.q.page = $scope.pages[$index] - 1 ;
                        }

                        $scope.prevPage = function($event){
                            if($scope.q.page > 0) $scope.q.page -= 1;
                            $event.preventDefault();
                            return false;
                        }


                        $scope.nextPage = function($event){
                            if($scope.q.page < (musicService.music.length / $scope.q.items) + 1 ) 
                                $scope.q.page += 1;
                            $event.preventDefault();
                            return false;
                        }
                        
                        if (User.data.isLogged) getList();                      
                        
                        $rootScope.$on('UserLogin', getList);                        
            
            }]);
            
            app.controller('topBarCtrl', function($scope, GlobalSettings){ 
				$scope.close = GlobalSettings.close; 
				$scope.minimize = GlobalSettings.minimize; 
            
            });
            
            
            app.run(function($rootScope, $cookieStore, User){
                
            });
        
        })(angular, jQuery);
