/**
    * @module ngContextMenu
    * @author Ionescu victor
    * @profilelink https://github.com/ionescuvictor
    * @projectlink https://github.com/ionescuvictor/ngContextMenu

    * @ I was inspired by Adam Timberlake contextmenu plugin.
    * @ https://github.com/Wildhoney
    * @ fixed various bugs such as memory leaks and added tons new capabilities. 
    */
   
var module = angular.module('ngContextMenu', []);

module.factory('contextMenu', ['$rootScope', function contextMenuService($rootScope) {

/**
    * @method cancelAll
    * @return {void}
    */
function cancelAll() {
    $rootScope.$broadcast('context-menu/close');
}

return { cancelAll: cancelAll, eventBound: false };

}]);


module.directive('contextMenu', ['$http', '$timeout', '$interpolate', '$compile', 'contextMenu',

function contextMenuDirective($http, $timeout, $interpolate, $compile, contextMenu) {

    return {

        /**
            * @property restrict
            * @type {String}
            */
        restrict: 'EA',

        /**
            * @property scope
            * @type {Boolean}
            * @fn contextaction
            * @in the callback you get the ngmodel plus whatever you passed in. example: contextClickAction('hello world') will get in callback(hellworld, ngmodel (if any specified.))
            */
        scope: { 
            contextaction: '=',
            contextmenustring: '@',
            contextmenuvalue: '='
        },

        /**
            * @property require
            * @type {String}
            */
        require: '?ngModel',

        /**
            * @method link
            * @param {Object} scope
            * @param {angular.element} element
            * @param {Object} attributes
            * @param {Object} model
            * @return {void}
            */
        link: function link(scope, element, attributes, model) {


            var contextMenuPath;

            if (scope.contextmenustring)
            {
                contextMenuPath = scope.contextmenustring;
            } else if (scope.contextmenuvalue) {
                contextMenuPath = scope.contextmenuvalue
            }
            else {
                throw 'no path has been set for the context menu';
            }

            if (!contextMenu.eventBound) {

                // Bind to the `document` if we haven't already.
                document.addEventListener('click', function click() {
                    contextMenu.cancelAll();
                    scope.$apply();
                });

                contextMenu.eventBound = true;

            }

            scope.contextClickAction = function (data) {
                if (model.$modelValue)
                {
                    scope.contextaction(data,model.$modelValue);
                }
                else {
                    scope.contextaction(data);
                }
             
            }

                    
            /**
                * @method closeMenu
                * @return {void}
                */
            function closeMenu() {

                if (scope.menu) {
                    scope.menu.remove();
                    scope.menu = null;
                    scope.position = null;
                }

            }

            scope.$on('context-menu/close', closeMenu);

            /**
                * @method getModel
                * @return {Object}
                */
            function getModel() {
                return model ? angular.extend(scope, model.$modelValue) : scope;
            }

            /**
                * @method render
                * @param {Object} event
                * @param {String} [strategy="append"]
                * @return {void}
                */
            function render(event, strategy) {

                strategy = strategy || 'append';

                if ('preventDefault' in event) {

                    contextMenu.cancelAll();
                    event.stopPropagation();
                    event.preventDefault();
                    scope.position = { x: event.clientX, y: event.clientY };

                } else {

                    if (!scope.menu) {
                        return;
                    }

                }



                $http.get(contextMenuPath, { cache: true }).then(function then(response) {
                    var compiled = $compile(response.data)(angular.extend(getModel()));
                    var menu = angular.element(compiled); 

                    // Determine whether to append new, or replace an existing.
                    switch (strategy) {
                        case ('append'): element.append(menu); break;
                        default: scope.menu.replaceWith(menu); break;
                    }

                    menu.css({

                        position: 'fixed',
                        top: 0,
                        left: 0,
                        transform: $interpolate('translate({{x}}px, {{y}}px)')({
                            x: scope.position.x, y: scope.position.y
                        })

                    });

                    scope.menu = menu;
                    scope.menu.bind('click', closeMenu);

                });

            }
                                  
            element.bind(attributes.contextEvent || 'contextmenu', render);


            //cleanup
            scope.$on("$destroy", function () {
                document.removeEventListener('click');
                scope.menu.unbind('click');
                element.unbind(attributes.contextEvent || 'contextmenu');
            });

        }

    }

}]);


