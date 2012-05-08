Slippy Map On Canvas
=============

Implemenation of a slippy tiles map using <canvas> HTML5.

It should run on most webkit browsers, eg. iOS, android, bada.

Minified and gzipped ~ 6kB.

Quickstart
----------

    <!DOCTYPE html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />     
            <link href="css/map.css" rel="stylesheet" type="text/css" media="all" />
            <script src="js/map.js" type="text/javascript"></script>
            <script type="text/javascript">
                document.addEventListener('DOMContentLoaded', function(){
                    var map =  slippymap().init();
                }, false);
            </script>   
        </head>
        <body>
            <canvas id="map">
                Your  browser doesn't support canvas elements.          
            </canvas>
        </body>
    </html>
    
    
Public Functions
----------

*   init(function)

    function is optional. called before plugins are initialized.
    has access to entire slippymap object/ internal api.

        var map =  slippymap().init();

*   center({x, y, z}) - parameter object optional - unit pixel

        get: map.center();
        set: map.center({x: 1, y: 2, z: 3});
    
*   coords({lon, lat, zoom}) - parameter object optional - unit deg

        get: map.coords();
        set: map.center({lon: 1, lat: 2, zoom: 3});

*   zoom(z) - parameter number optional

        get: map.zoom();
        set: map.zoom(18);

*   zoomIn() - no parameters
*   zoomOut() - no parameters
*   width(width) - parameter number optional

        get: map.width();
        set: map.width(1024);

*   height(height) - parameter number optional

        get: map.height();
        set: map.height(800);

*   markers(markers) - parameter object optional

        get: map.markers();
        set: map.markers({  
                        'Berlin' : 
                        {   src : "../images/marker.png",
                            lon : 13.409500,
                            lat : 52.522488,
                            offsetX : -11,
                            offsetY : -25
                        },
                        'Moskva' : 
                        {   src : "../images/marker.png",
                            lon : 37.617633,
                            lat : 55.755786,
                            offsetX : -11,
                            offsetY : -25
                        },
                        'Hong Kong' : 
                        {   src : "../images/marker.png",
                            lon : 114.10494,
                            lat : 22.381111,
                            offsetX : -11,
                            offsetY : -25
                        }
                });

*   marker(id, marker) - parameters number, object optional

        get: map.marker('Berlin');
        set: map.marker('Berlin',{  
                            src : "../images/alex.png",
                            lon : 13.409500,
                            lat : 52.522488,
                            offsetX : -11,
                            offsetY : -25
                        });

*   tracks(tracks) - parameter object optional

        get: map.tracks();
        set: map.tracks({
                    'berlin-hongkong' : {
                        strokeStyle : "#f00",
                        lineWidth : 4,
                        alpha : 1,
                        points : [[13.409500,52.522488],[37.617633, 55.755786],[114.10494,22.381111]]
                    }
                })      

*   bounds(left, top, right, bottom)
*   bounds()
*   maxZ(zoom)- parameter number optional

        get: map.maxZ();
        set: map.maxZ(10);

*   minZ(zoom) - parameter number optional

        get: map.minZ();
        set: map.minZ(10);

*   tileSize(size) - parameter number optional

        get: map.tileSize();
        set: map.tileSize(512);

*   fractionalZoom(true/false) - parameter boolean optional

        get: map.fractionalZoom();
        set: map.fractionalZoom(false);

*   scrollMomentum(true/false) - parameter boolean optional

        get: map.scrollMomentum();
        set: map.scrollMomentum(false);

*   addMovedListeners(listener)
*   addMoveEndListeners(listener)
*   addZoomedListeners(listener)
*   tileProvider(provider) - parameter function optional

        get: map.tileProvider();
        set: map.tileProvider(
                function (x, y, z) {
                    var rand = function (n) {
                        return Math.floor(Math.random() * n);
                    };
                    var sub = ["a", "b", "c"];
                    var url = "http://" + sub[rand(3)] + ".tile.openstreetmap.org/" + z + "/" + x + "/" + y + ".png";
                    return url;
                }
            );

        set: map.tileProvider( // multiple layers
                {
                    'osm' : {
                        alpha : 1,
                        url :   function (x, y, z) {
                                    var rand = function (n) {
                                    return Math.floor(Math.random() * n);
                                };
                                var sub = ["a", "b", "c"];
                                var url = "http://" + sub[rand(3)] + ".tile.openstreetmap.org/" + z + "/" + x + "/" + y + ".png";
                                return url;
                        }
                    },
                    'hill' : {
                        alpha : 1,
                        url :   function(x,y,z){
                                    return "http://www.wanderreitkarte.de/hills/" + z + "/" + x + "/" + y + ".png";
                        }
                    }
                }
            );

*   refresh()