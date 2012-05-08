/*  Slippy Map on Canvas - HTML5
 *
 *  Copyright 2010 dFacts Network
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *
 *  inspired by Tim Hutt, http://concentriclivers.com/slippymap.html
 *  added features like touch support, fractional zoom, markers ...
 */
(function (window) {
    "use strict";
    if (typeof window.slippymap === 'undefined') {
        var slippymap = function (options) {
            var $, map, defaults, property;
            $ = window;
            defaults = {
                div: "map",
                fullscreen : true,
                zoom: 1,
                lon: 0,
                lat: 0,
                markers: {},
                tracks: {},
                tileprovider: function (x, y, z) {
                    var rand, sub, url;
                    rand = function (n) {
                        return $.Math.floor($.Math.random() * n);
                    };
                    sub = ["a", "b", "c"];
                    url = "http://" + sub[rand(3)] + ".tile.openstreetmap.org/" + z + "/" + x + "/" + y + ".png";
                    return url;
                },
                useFractionalZoom: true,
                scrollMomentum: true,
                zMin: 0,
                zMax: 18,
                cacheValues: true,
                preloadMargin : 0
            };
            /* merge defaults and options */
            if (typeof options === "object") {
                for (property in defaults) {
                    if (defaults.hasOwnProperty(property)) {
                        if (typeof options[property] !== "undefined") {
                            defaults[property] = options[property];
                        }
                    }
                }
            }
            options = defaults;
            map = {
                markers: options.markers,
                tracks: options.tracks,
                tileprovider: options.tileprovider,
                useFractionalZoom: options.useFractionalZoom,
                scrollMomentum: options.scrollMomentum,
                cache: {},
                cacheValues: options.cacheValues,
                preloadMargin: options.preloadMargin,
                zMin : options.zMin,
                zMax : options.zMax,
                zoomedListeners: [],
                movedListeners: [],
                moveEndListeners: [],
                limitFPS: false,
                init: function () {
                    var coords;
                    if ($.document.getElementById(options.div)) {
                        map.renderer.canvas = $.document.getElementById(options.div);
                        if (options.fullscreen === true) {
                            map.renderer.canvas.width = $.innerWidth;
                            map.renderer.canvas.height = $.innerHeight;
                        }
                        map.renderer.context = map.renderer.canvas.getContext("2d");
                        map.renderer.sortLayers();
                        coords = {
                            z:  (map.pos && map.pos.z) || options.zoom,
                            x: (map.pos && map.pos.x) || map.pos.lon2posX(options.lon),
                            y: (map.pos && map.pos.y) || map.pos.lat2posY(options.lat)
                        };
                        map.pos.center(coords);
                        map.renderer.refresh();
                        map.events.init();
                    } else {
                        $.slippymap.debug("canvas not found");
                    }
                },

                /* keep track of zoom + pans */
                zoomed: function (options) {
                    var i;
                    for (i = 0; i < map.zoomedListeners.length; i = i + 1) {
                        map.zoomedListeners[i](options);
                    }
                },
                moved: function (options) {
                    var i;
                    for (i = 0; i < map.movedListeners.length; i = i + 1) {
                        map.movedListeners[i](options);
                    }
                },
                moveEnded: function (options) {
                    var i;
                    for (i = 0; i < map.moveEndListeners.length; i = i + 1) {
                        map.moveEndListeners[i](options);
                    }
                    map.renderer.garbage();
                },
                resized: function () {
                    if (options.fullscreen !== true) {
                        return;
                    }
                    map.renderer.canvas.width = $.innerWidth;
                    map.renderer.canvas.height = $.innerHeight;
                    map.renderer.refresh();
                },
                /* events */
                events: {
                    lastMouseX: 0,
                    lastMouseY: 0,
                    dragging: false,
                    lastTouchEvent: {},
                    lastTouchEventBeforeLast: {},
                    preventDefault: function (event) {
                        if (typeof event.preventDefault !== 'undefined') {
                            event.preventDefault();
                        }
                    },
                    mouseDown: function (event) {
                        var x, y;
                        map.pos.animation.stop();
                        if (!event) {
                            event = $.event;
                        }
                        x = event.clientX - map.renderer.canvas.offsetLeft;
                        y = event.clientY - map.renderer.canvas.offsetTop;
                        if (event.button === 0) {
                            map.events.dragging = true;
                        }
                        map.events.lastMouseX = x;
                        map.events.lastMouseY = y;
                        map.events.momentumX = 0;
                        map.events.momentumY = 0;
                        map.events.preventDefault(event);
                        return true;
                    },
                    mouseMove: function (event) {
                        var x, y, dX, dY;
                        if (!event) {
                            event = $.event;
                        }
                        x = event.clientX - map.renderer.canvas.offsetLeft;
                        y = event.clientY - map.renderer.canvas.offsetTop;
                        if (map.events.dragging === true) {
                            dX = x - map.events.lastMouseX;
                            dY = y - map.events.lastMouseY;
                            if (map.scrollMomentum) {
                                map.events.momentumX = dX;
                                map.events.momentumY = dY;
                            }
                            map.pos.move(-dX * map.pow(2, map.zMax - map.pos.z), -dY * map.pow(2, map.zMax - map.pos.z));
                            map.renderer.refresh();
                        }
                        map.events.lastMouseX = x;
                        map.events.lastMouseY = y;
                        map.events.preventDefault(event);
                        return true;
                    },
                    mouseUp: function (event) {
                        if (map.events.dragging && map.scrollMomentum && (map.events.momentumX !== 0 || map.events.momentumY !== 0)) {
                            map.events.dragging = false;
                            map.pos.move(-map.events.momentumX * map.pow(2, map.zMax - map.pos.z), -map.events.momentumY * map.pow(2, map.zMax - map.pos.z), {animated: true});
                        } else {
                            map.events.dragging = false;
                            map.moveEnded();
                        }
                        map.events.preventDefault(event);
                        return true;
                    },
                    mouseOut: function (event) {
                        map.events.dragging = false;
                        map.moveEnded();
                        map.events.preventDefault(event);
                        return true;
                    },
                    mouseWheel: function (event) {
                        var delta = 0;
                        map.pos.animation.stop();
                        if (!event) {
                            event = $.event;
                        }
                        if (event.wheelDelta) {
                            delta = event.wheelDelta / 120;
                            if ($.opera) {
                                delta = -delta;
                            }
                        } else if (event.detail) {
                            delta = -event.detail / 3;
                        }
                        if (delta > 0) {
                            map.pos.zoomIn({
                                step: delta / 10,
                                mouseWheel: true
                            });
                        } else if (delta < 0) {
                            map.pos.zoomOut({
                                step: -delta / 10,
                                mouseWheel: true
                            });
                        }
                        map.events.preventDefault(event);
                        return true;
                    },
                    doubleClick: function (event) {
                        var x, y, dX, dY;
                        map.pos.animation.stop();
                        if (!event) {
                            event = $.event;
                        }
                        x = event.clientX - map.renderer.canvas.offsetLeft;
                        y = event.clientY - map.renderer.canvas.offsetTop;
                        dX = (x - map.renderer.canvas.width / 2) / 2;
                        dY = (y - map.renderer.canvas.height / 2) / 2;
                        map.pos.move(dX * map.pow(2, map.zMax - map.pos.z), dY * map.pow(2, map.zMax - map.pos.z), {
                            animated: true
                        });
                        map.events.lastMouseX = x;
                        map.events.lastMouseY = y;
                        map.pos.zoomIn({
                            step: 1,
                            round: true,
                            animated: true
                        });
                        map.events.preventDefault(event);
                        return true;
                    },
                    /* maps touch events to mouse events */
                    touchHandler: function (event) {
                        var now, touches, type, first, simulatedEvent;
                        map.pos.animation.stop();
                        now = function () {
                            return (new $.Date()).getTime();
                        };
                        if (event.type !== 'touchend') {
                            touches = event.targetTouches;
                        } else {
                            touches = event.changedTouches;
                        }
                        first = touches[0];
                        if (touches.length === 1) {
                            switch (event.type) {
                            case 'touchstart':
                                type = 'mousedown';
                                break;
                            case 'touchmove':
                                type = 'mousemove';
                                break;
                            case 'touchcancel':
                            case 'touchend':
                                type = 'mouseup';
                                break;
                            default:
                                return;
                            }
                            if (map.events.lastTouchEventBeforeLast && event.type === 'touchend' && map.events.lastTouchEvent.type === 'touchstart' && map.events.lastTouchEventBeforeLast.type === 'touchend' && event.x === map.events.lastTouchEventBeforeLast.x && event.y === map.events.lastTouchEventBeforeLast.y && now() - map.events.lastTouchEventBeforeLast.timeStamp < 500) {
                                map.events.lastTouchEventBeforeLast = false;
                                map.events.lastTouchEvent.timeStamp = now();
                                type = 'dblclick';
                            }
                            simulatedEvent = $.document.createEvent('MouseEvent');
                            simulatedEvent.initMouseEvent(type, true, true, $, 1, first.screenX, first.screenY, first.clientX, first.clientY, false, false, false, false, 0, null);
                            first.target.dispatchEvent(simulatedEvent);
                            map.events.lastTouchEventBeforeLast = map.events.lastTouchEvent;
                            map.events.lastTouchEvent = event;
                            map.events.preventDefault(event);
                            return true;
                        }
                        map.events.preventDefault(event);
                        return false;
                    },
                    /* minimal pinch support */
                    gestureHandler: function (event) {
                        map.pos.animation.stop();
                        if (event.scale) {
                            if (event.scale > 1) {
                                map.pos.zoomIn({
                                    step: (event.scale - 1) / 10,
                                    round: false,
                                    animated: false,
                                    gesture: true
                                });
                                return true;
                            }
                            if (event.scale < 1) {
                                map.pos.zoomOut({
                                    step: event.scale / 10,
                                    round: false,
                                    animated: false,
                                    gesture: true
                                });
                                return true;
                            }
                        }
                        map.events.preventDefault(event);
                        return false;
                    },
                    /* attaches events to map + window */
                    init: function () {
                        $.addEventListener('resize', map.resized, false);
                        map.renderer.canvas.addEventListener('DOMMouseScroll', map.events.mouseWheel, false);
                        map.renderer.canvas.addEventListener('mousewheel', map.events.mouseWheel, false);
                        map.renderer.canvas.addEventListener('mousedown', map.events.mouseDown, false);
                        map.renderer.canvas.addEventListener('mousemove', map.events.mouseMove, false);
                        map.renderer.canvas.addEventListener('mouseup', map.events.mouseUp, false);
                        map.renderer.canvas.addEventListener('mouseout', map.events.mouseOut, false);
                        map.renderer.canvas.addEventListener('dblclick', map.events.doubleClick, false);
                        map.renderer.canvas.addEventListener('touchstart', map.events.touchHandler, false);
                        map.renderer.canvas.addEventListener('touchmove', map.events.touchHandler, false);
                        map.renderer.canvas.addEventListener('touchend', map.events.touchHandler, false);
                        map.renderer.canvas.addEventListener('touchcancel', map.events.touchHandler, false);
                        map.renderer.canvas.addEventListener('gesturestart', map.events.gestureHandler, false);
                        map.renderer.canvas.addEventListener('gesturechange', map.events.gestureHandler, false);
                        map.renderer.canvas.addEventListener('gestureend', map.events.gestureHandler, false);
                    }
                },
                /* renderer */
                renderer: {
                    canvas: {},
                    context: {},
                    lastRenderTime: 0,
                    tiles: [],
                    tilecount: 0,
                    tilesize: 256,
                    refreshCounter: 0,
                    refreshLastStart: 0,
                    refreshFPS: 50,
                    refreshListeners: {},
                    blank : function (color, x, y, width, height) {
                        map.renderer.context.fillStyle = color;
                        map.renderer.context.fillRect(x, y, width, height);
                    },
                    drawImage : function (image, fallbackColor, sx, sy, sw, sh, dx, dy, dw, dh) {
                        try {
                            map.renderer.context.drawImage(
                                image,
                                sx,
                                sy,
                                sw,
                                sh,
                                dx,
                                dy,
                                dw,
                                dh
                            );
                            return true;
                        } catch (e) {
                            map.renderer.blank(
                                fallbackColor,
                                dx,
                                dy,
                                dw,
                                dh
                            );
                            return false;
                        }
                    },
                    loadImage : function (id, x, y, z, t, tileprovider) {
                        if (typeof map.renderer.tiles[t] === 'undefined') {
                            map.renderer.tiles[t] = [];
                        }
                        map.renderer.tiles[t][id] = new $.Image();
                        map.renderer.tiles[t][id].lastDrawnId = 0;
                        map.renderer.tilecount = map.renderer.tilecount + 1;
                        map.renderer.tiles[t][id].src = tileprovider(x, y, z, id);
                        map.renderer.tiles[t][id].onload = map.renderer.refresh;
                        map.renderer.tiles[t][id].onerror = function () {
                            this.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
                            this.onload = function () {};
                        };
                    },
                    addLayer: function (layer) {
                        map.renderer.layers.push(layer);
                        map.renderer.sortLayers();
                    },
                    sortObject: function (o) {
                        var sorted = {},
                            key,
                            a = [];
                        for (key in o) {
                            if (o.hasOwnProperty(key)) {
                                a.push(key);
                            }
                        }
                        a.sort();
                        for (key = 0; key < a.length; key = key + 1) {
                            sorted[a[key]] = o[a[key]];
                        }
                        return sorted;
                    },
                    sortLayers: function () {
                        function sortZIndex(a, b) {
                            var x, y;
                            x = a.zindex;
                            y = b.zindex;
                            return ((x < y) ? -1 : ((x > y) ? 1 : 0));
                        }
                        map.renderer.layers.sort(sortZIndex);
                    },
                    layers: [
                        {
                            id: 'base',
                            zindex: 0,
                            update: function () {
                                return true;
                            },
                            visible: true,
                            alpha: 1,

                            callback: function (id, viewport, alpha) {
                                map.renderer.context.globalAlpha = alpha;
                                map.renderer.blank("#dddddd", 0, 0, viewport.w, viewport.h);
                            }
                        },
                        { /* repaint canvas, load missing images */
                            id: 'tiles',
                            zindex: 1,
                            update: function () {
                                return true;
                            },
                            visible: true,
                            alpha: 1,
                            callback: function (id, viewport, alpha) {
                                var tileprovider, tileLayers, maxTileNumber, tileDone, preload,
                                    t, x, y, xoff, yoff, tileKey,
                                    tileAboveX, tileAboveY, tileAboveZ, tileKeyAbove,
                                    tilePartOffsetX, tilePartOffsetY, tilePartSize,
                                    tileZdiff,
                                    encodeIndex,
                                    tileLoadingCue = [],
                                    tileLoading, tileLoadingKey;

                                encodeIndex = function (x, y, z) {
                                    return x + "-" + y + "-" + z;
                                };
                                maxTileNumber = map.pow(2, viewport.zi) - 1;
                                preload = map.preloadMargin;
                                if (typeof map.tileprovider === 'function') {
                                    tileLayers = {
                                        base: {
                                            url: map.tileprovider
                                        }
                                    };
                                } else {
                                    tileLayers = map.tileprovider;
                                }

                                for (t in tileLayers) {
                                    if (tileLayers.hasOwnProperty(t)) {
                                        tileprovider = tileLayers[t].url;
                                        map.renderer.context.globalAlpha = tileLayers[t].alpha || alpha;
                                        map.renderer.tiles[t] = map.renderer.tiles[t] || {};
                                        tileDone = [];
                                        for (x = $.Math.floor(viewport.xMin / viewport.sz) - preload; x < $.Math.ceil(viewport.xMax / viewport.sz) + preload; x = x + 1) {
                                            tileDone[x] = [];
                                            xoff = (((x * viewport.sz - viewport.xMin) / viewport.zp) * viewport.zf) - viewport.offsetX;
                                            for (y = $.Math.floor(viewport.yMin / viewport.sz) - preload; y < $.Math.ceil(viewport.yMax / viewport.sz) + preload; y = y + 1) {
                                                yoff = (((y * viewport.sz - viewport.yMin) / viewport.zp) * viewport.zf) - viewport.offsetY;
                                                tileKey = encodeIndex(x, y, viewport.zi);
                                                tileDone[tileKey] = false;
                                                if (x > maxTileNumber || y > maxTileNumber || x < 0 || y < 0) {
                                                    // out of xyz bounds
                                                    map.renderer.blank(
                                                        "#dddddd",
                                                        xoff,
                                                        yoff,
                                                        viewport.tilesize,
                                                        viewport.tilesize
                                                    );
                                                    tileDone[tileKey] = true;
                                                } else {
                                                    if (map.renderer.tiles[t][tileKey] && map.renderer.tiles[t][tileKey].complete) {
                                                        // draw tile
                                                        if (map.renderer.drawImage(
                                                                map.renderer.tiles[t][tileKey],
                                                                "#dddddd",
                                                                0,
                                                                0,
                                                                map.renderer.tilesize,
                                                                map.renderer.tilesize,
                                                                xoff,
                                                                yoff,
                                                                viewport.tilesize,
                                                                viewport.tilesize
                                                            )) {
                                                            map.renderer.tiles[t][tileKey].lastDrawnId = id;
                                                        }
                                                        tileDone[tileKey] = true;
                                                    } else {
                                                        if (typeof map.renderer.tiles[t][tileKey] === 'undefined' &&
                                                                typeof tileLoadingCue[tileKey] === 'undefined') {
                                                            tileLoadingCue[tileKey] = {id: tileKey, x: x, y: y, z: viewport.zi};
                                                        }
                                                        // try tile preview with tile from lower z level
                                                        for (tileAboveZ = viewport.zi - 1; !tileDone[tileKey] && (tileAboveZ > map.zMin); tileAboveZ = tileAboveZ - 1) {
                                                            tileZdiff = viewport.zi - tileAboveZ;
                                                            tileAboveX = $.Math.floor(x / map.pow(2, tileZdiff));
                                                            tileAboveY = $.Math.floor(y / map.pow(2, tileZdiff));
                                                            tileKeyAbove = encodeIndex(tileAboveX, tileAboveY, tileAboveZ);
                                                            if (!tileDone[tileKey] && map.renderer.tiles[t][tileKeyAbove] && map.renderer.tiles[t][tileKeyAbove].complete) {
                                                                // we have a tile from previous z level loaded, let draw it
                                                                tilePartOffsetX = (x - tileAboveX * map.pow(2, tileZdiff));
                                                                tilePartOffsetY = (y - tileAboveY * map.pow(2, tileZdiff));
                                                                tilePartSize = (map.renderer.tilesize / map.pow(2, tileZdiff));
																if (map.renderer.drawImage(
																		map.renderer.tiles[t][tileKeyAbove],
																		"#dddddd",
																		tilePartOffsetX * tilePartSize,
																		tilePartOffsetY * tilePartSize,
																		tilePartSize,
																		tilePartSize,
																		xoff,
																		yoff,
																		viewport.tilesize,
																		viewport.tilesize
																	)) {
																	map.renderer.tiles[t][tileKeyAbove].lastDrawnId = id;
																}
                                                                tileDone[tileKey] = true;
                                                                break;
                                                            }
                                                        }
                                                        if (tileDone[tileKey] === false) {
                                                            map.renderer.blank(
                                                                "#dddddd",
                                                                xoff,
                                                                yoff,
                                                                viewport.tilesize,
                                                                viewport.tilesize
                                                            );
                                                            tileDone[tileKey] = true;
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                        for (tileLoadingKey in tileLoadingCue) {
                                            if (tileLoadingCue.hasOwnProperty(tileLoadingKey)) {
                                                tileLoading = tileLoadingCue[tileLoadingKey];
                                                // get tile above
                                                tileAboveX = $.Math.floor(tileLoading.x / 2);
                                                tileAboveY = $.Math.floor(tileLoading.y / 2);
                                                tileAboveZ = tileLoading.z - 1;
                                                tileKeyAbove = encodeIndex(tileAboveX, tileAboveY, tileAboveZ);
                                                if (typeof map.renderer.tiles[t][tileKeyAbove] === 'undefined' &&
                                                        typeof tileLoadingCue[tileKeyAbove] === 'undefined') {
                                                    tileLoadingCue[tileKeyAbove] = {id: tileKeyAbove, x: tileAboveX, y: tileAboveY, z: tileAboveZ};
                                                }
                                            }
                                        }
                                        tileLoadingCue = map.renderer.sortObject(tileLoadingCue);
                                        for (tileLoadingKey in tileLoadingCue) {
                                            if (tileLoadingCue.hasOwnProperty(tileLoadingKey)) {
                                                tileLoading = tileLoadingCue[tileLoadingKey];
                                                if (!map.renderer.tiles[t][tileLoading.id]) {
                                                    // request tile and dispatch refresh
                                                    map.renderer.loadImage(
                                                        tileLoading.id,
                                                        tileLoading.x,
                                                        tileLoading.y,
                                                        tileLoading.z,
                                                        t,
                                                        tileprovider
                                                    );
                                                }
                                            }
                                        }

                                    }
                                }
                            }
                        },
                        {
                            id: 'markers',
                            zindex: 99,
                            update: function () {
                                if (map.markers) {
                                    return true;
                                }
                                return false;
                            },
                            visible: true,
                            alpha: 1,
                            callback: function (id, viewport, alpha) {
                                var marker, x, y;
                                for (marker in map.markers) {
                                    if (map.markers.hasOwnProperty(marker)) {
                                        if (map.markers[marker].img && map.markers[marker].img.complete) {
                                            x = $.Math.round((map.pos.lon2posX(map.markers[marker].lon) - viewport.xMin) / viewport.zp * viewport.zf) + map.markers[marker].offsetX - viewport.offsetX;
                                            y = $.Math.round((map.pos.lat2posY(map.markers[marker].lat) - viewport.yMin) / viewport.zp * viewport.zf) + map.markers[marker].offsetY - viewport.offsetY;
                                            if (x > -50 && x < viewport.w + 50 && y > -50 && y < viewport.h + 50) {
                                                try {
                                                    map.renderer.context.globalAlpha = map.markers[marker].alpha || alpha;
                                                    map.renderer.context.drawImage(map.markers[marker].img, x, y);
                                                    map.markers[marker].bbox = [x, y + map.markers[marker].img.height, x + map.markers[marker].img.width, y];
                                                } catch (e) {}
                                            }
                                        } else {
                                            map.markers[marker].img = new $.Image();
                                            map.markers[marker].img.src = map.markers[marker].src;
                                            map.markers[marker].img.onload = map.renderer.refresh;
                                        }
                                    }
                                }
                            }
                        },
                        {
                            id: 'tracks',
                            zindex: 1,
                            update: function () {
                                if (map.tracks) {
                                    return true;
                                }
                                return false;
                            },
                            visible: true,
                            alpha: 0.8,
                            callback: function (id, viewport, alpha) {
                                var t, track, i;

                                map.renderer.context.globalAlpha = alpha;

                                function lon2x(lon) {
                                    return Math.round((map.pos.lon2posX(lon) - viewport.xMin) / viewport.zp * viewport.zf) - viewport.offsetX;
                                }

                                function lat2y(lat) {
                                    return Math.round((map.pos.lat2posY(lat) - viewport.yMin) / viewport.zp * viewport.zf) - viewport.offsetY;
                                }
                                for (t in map.tracks) {
                                    if (map.tracks.hasOwnProperty(t)) {
                                        track = map.tracks[t];
                                        map.renderer.context.globalAlpha = track.alpha || alpha;
                                        map.renderer.context.strokeStyle = track.strokeStyle;
                                        map.renderer.context.lineWidth = track.lineWidth;
                                        map.renderer.context.beginPath();
                                        map.renderer.context.moveTo(lon2x(track.points[0][0]), lat2y(track.points[0][1]));
                                        for (i = 1; i < track.points.length; i = i + 1) {
                                            map.renderer.context.lineTo(lon2x(track.points[i][0]), lat2y(track.points[i][1]));
                                        }
                                        map.renderer.context.stroke();
                                        map.renderer.context.closePath();
                                    }
                                }
                            }
                        }
                    ],
                    refresh: function () {
                        var now = function () {
                                return (new $.Date()).getTime();
                            },
                            refreshBeforeFPS,
                            refreshId,
                            viewport,
                            ll,
                            i;

                        if (map.limitFPS && map.renderer.refreshLastStart) {
                            refreshBeforeFPS = 1000 / map.renderer.refreshFPS - (now() - map.renderer.refreshLastStart);
                            if (refreshBeforeFPS > 0) { /* too early - postpone refresh */
                                $.setTimeout(map.renderer.refresh, refreshBeforeFPS);
                                return;
                            }
                        }
                        map.renderer.refreshLastStart = now();
                        map.renderer.refreshCounter = map.renderer.refreshCounter + 1;
                        refreshId = map.renderer.refreshCounter - 1;
                        viewport = map.viewport();
                        for (ll in map.renderer.layers) {
                            if (map.renderer.layers.hasOwnProperty(ll)) {
                                if (map.renderer.layers[ll].visible && map.renderer.layers[ll].update()) {
                                    map.renderer.layers[ll].callback(refreshId, viewport, map.renderer.layers[ll].alpha);
                                }
                            }
                        }
                        for (i = 0; i < map.renderer.refreshListeners.length; i = i + 1) {
                            map.renderer.refreshListeners[i]();
                        }
                        return false;
                    },
                    /* garbage collector, purges tiles if more than 500 are loaded and tile is more than 100 refresh cycles old */
                    garbage: function () {
                        var remove, key, i;
                        if (map.renderer.tilecount > 500) {
                            if (map.renderer.tiles) {
                                remove = [];
                                for (key in map.renderer.tiles) {
                                    if (map.renderer.tiles.hasOwnProperty(key) && map.renderer.tiles[key] && map.renderer.tiles[key].complete && map.renderer.tiles[key].lastDrawnId < (map.renderer.refreshCounter - 100)) {
                                        remove.push(key);
                                    }
                                }
                                for (i = 0; i < remove.length; i = i + 1) {
                                    delete map.renderer.tiles[remove[i]];
                                }
                                map.renderer.tilecount = map.renderer.tilecount - i;
                            }
                        }
                    }
                },
                viewport: function () {
                    if (map.cacheValues && map.cache.viewport &&
                            map.cache.viewport.x === map.pos.x  &&
                            map.cache.viewport.y === map.pos.y  &&
                            map.cache.viewport.zoom === map.pos.z  &&
                            map.cache.viewport.width === map.renderer.canvas.width &&
                            map.cache.viewport.height === map.renderer.canvas.height) {
                        return map.cache.viewport;
                    }
                    var viewport = {};

                    viewport.x = map.pos.x;
                    viewport.y = map.pos.y;
                    viewport.width =  map.renderer.canvas.width;
                    viewport.height =  map.renderer.canvas.height;
                    viewport.zoom = map.pos.z;

                    viewport.zi = parseInt(map.pos.z, 10);
                    viewport.zf = map.useFractionalZoom ? (1 + map.pos.z - viewport.zi) : 1;
                    viewport.zp = map.pow(2, map.zMax - viewport.zi);

                    viewport.w = (map.renderer.canvas.width - map.renderer.canvas.width % 2) * viewport.zp;
                    viewport.h = (map.renderer.canvas.height - map.renderer.canvas.height % 2) * viewport.zp;
                    viewport.sz = map.renderer.tilesize * viewport.zp;
                    viewport.tilesize = (map.renderer.tilesize * viewport.zf);
                    viewport.xMin = (map.pos.x - viewport.w / 2);
                    viewport.yMin = (map.pos.y - viewport.h / 2);
                    viewport.xMax = (map.pos.x + viewport.w / 2);
                    viewport.yMax = (map.pos.y + viewport.h / 2);
                    viewport.offsetX = ((viewport.zf - 1) * (viewport.xMax - viewport.xMin) / viewport.zp / 2);
                    viewport.offsetY = ((viewport.zf - 1) * (viewport.yMax - viewport.yMin) / viewport.zp / 2);
                    map.cache.viewport = viewport;
                    return map.cache.viewport;
                },

                /* positioning, conversion between pixel + lon/lat */
                pos: {
                    setX: function (x) {
                        var viewport, xMin, xMax;
                        if (map.pos.minX && map.pos.maxX) {
                            viewport =  map.viewport();
                            xMin = Math.floor(x - viewport.w / 2);
                            xMax = Math.ceil(x + viewport.w / 2);
                            if (xMin < map.pos.minX) {
                                x = map.pos.minX + viewport.w / 2;
                            } else if (xMax > map.pos.maxX) {
                                x = map.pos.maxX - viewport.w / 2;
                            }
                        }
                        map.pos.x = Math.round(x);
                    },
                    setY: function (y) {
                        var viewport, yMin, yMax;
                        if (map.pos.minY && map.pos.maxY) {
                            viewport =  map.viewport();
                            yMin = Math.floor(y - viewport.h / 2);
                            yMax = Math.ceil(y + viewport.h / 2);
                            if (yMin < map.pos.minY) {
                                y = map.pos.minY + viewport.h / 2;
                            } else if (yMax > map.pos.maxY) {
                                y = map.pos.maxY - viewport.h / 2;
                            }
                        }
                        map.pos.y = Math.round(y);
                    },
                    setZ: function (z, options) {
                        var animated;
                        options = options || {};

                        if (typeof z === 'undefined') {
                            return map.pos.z;
                        }

                        if (typeof z !== 'number') {
                            z = map.pos.z || map.zMin;
                        }
                        if (z < map.zMin) {
                            z = map.zMin;
                        }
                        if (z > map.zMax) {
                            z = map.zMax;
                        }
                        if (!options.animated) {
                            map.pos.z = z;
                            map.renderer.refresh();
                            map.zoomed(options);
                        } else {
                            map.pos.animation.start(false, false, z);
                        }
                        return map.pos.z;
                    },
                    zoomIn: function (options) {
                        var step, round;
                        options = options || {};
                        step = options.step || 1;
                        round = options.round || false;
                        step = step || 1;
                        if (!map.useFractionalZoom) {
                            step = Math.round(step);
                            if (step < 1) {
                                step = 1;
                            }
                        }
                        if (round === false) {
                            map.pos.setZ(map.pos.z + step, options);
                        } else {
                            map.pos.setZ($.Math.round(map.pos.z + step), options);
                        }
                    },
                    zoomOut: function (options) {
                        var step, round;
                        options = options || {};
                        step = options.step || 1;
                        round = options.round || false;
                        step = step || 1;
                        if (!map.useFractionalZoom) {
                            step = Math.round(step);
                            if (step < 1) {
                                step = 1;
                            }
                        }
                        if (round === false) {
                            map.pos.setZ(map.pos.z - step, options);
                        } else {
                            map.pos.setZ($.Math.round(map.pos.z - step), options);
                        }
                    },
                    coords: function (coords, options) {
                        if (typeof coords !== "object") {
                            return {
                                lon: map.pos.tile2lon(map.pos.x / map.renderer.tilesize, map.zMax),
                                lat: map.pos.tile2lat(map.pos.y / map.renderer.tilesize, map.zMax),
                                z: map.pos.z
                            };
                        }
                        coords = {
                            x: map.pos.lon2posX(coords.lon),
                            y: map.pos.lat2posY(coords.lat),
                            z: coords.zoom
                        };
                        map.pos.center(coords, options);
                    },
                    center: function (coords, options) {
                        var animated, zoomChanged;
                        if (typeof coords === 'undefined') {
                            return {
                                x: map.pos.x,
                                y: map.pos.y,
                                z: map.pos.z
                            };
                        }
                        options = options || {};
                        animated = options.animated || false;
                        zoomChanged = false;
                        if (!animated) {
                            map.pos.setX(coords.x);
                            map.pos.setY(coords.y);
                            if (coords.z && map.pos.z !== coords.z) {
                                zoomChanged = true;
                            }
                            map.pos.setZ(coords.z);
                            map.renderer.refresh();
                            if (map.events.dragging || options.animationStep) {
                                options.dragging = map.events.dragging;
                                map.moved(options);
                            } else {
                                map.moveEnded(options);
                            }
                            if (zoomChanged) {
                                map.zoomed(options);
                            }
                        } else {
//                        	map.pos.animation.duration = options.duration || 750;
                            map.pos.animation.start(coords.x, coords.y, coords.z);
                        }
                    },
                    move: function (dx, dy, options) {
                        map.pos.center({
                            x: map.pos.x + dx,
                            y: map.pos.y + dy
                        }, options);
                    },
                    lat2posY: function (lat) {
                        return map.pow(2, map.zMax) * map.renderer.tilesize * (1 - $.Math.log($.Math.tan(lat * $.Math.PI / 180) + 1 / $.Math.cos(lat * $.Math.PI / 180)) / $.Math.PI) / 2;
                    },
                    lon2posX: function (lon) {
                        return map.pow(2, map.zMax) * map.renderer.tilesize * (lon + 180) / 360;
                    },
                    tile2lon: function (x, z) {
                        if (typeof z === 'undefined') {
                            z = map.pos.z;
                        }
                        return (x / map.pow(2, z) * 360 - 180);
                    },
                    tile2lat: function (y, z) {
                        var n;
                        if (typeof z === 'undefined') {
                            z = map.pos.z;
                        }
                        n = $.Math.PI - 2 * $.Math.PI * y / map.pow(2, z);
                        return (180 / $.Math.PI * $.Math.atan(0.5 * ($.Math.exp(n) - $.Math.exp(-n))));
                    },
                    animation: {
                        now: function () {
                            return (new Date()).getTime();
                        },
                        timeoutId: 0,
                        interval: 10,
                        duration: 750,
                        descriptor: {
                            time: 0,
                            from: {},
                            to: {}
                        },
                        ease: function (func) {
                            var state;
                            if (map.pos.animation.descriptor) {
                                state = ((map.pos.animation.descriptor.time - map.pos.animation.now()) / map.pos.animation.duration);
                                if (state < 0) {
                                    state = 0;
                                }
                                if (state > 1) {
                                    state = 1;
                                }
                                if (typeof func !== "function") {
                                    return map.pow(state, 2);
                                }
                                return func(state, 2);
                            }
                        },
                        start: function (x, y, z) {
                            map.pos.animation.descriptor.time = map.pos.animation.now() + map.pos.animation.duration;
                            map.pos.animation.descriptor.from = {
                                x: map.pos.x,
                                y: map.pos.y,
                                z: map.pos.z
                            };
                            if (typeof x !== 'undefined' && x !== false) {
                                map.pos.animation.descriptor.to.x = x;
                            }
                            if (typeof y !== 'undefined' && y !== false) {
                                map.pos.animation.descriptor.to.y = y;
                            }
                            if (typeof z !== 'undefined' && z !== false && z >= 0) {
                                map.pos.animation.descriptor.to.z = z;
                            } else {
                                map.pos.animation.descriptor.to.z = map.pos.z;
                            }
                            map.pos.animation.timeoutId = $.setTimeout(map.pos.animation.step, map.pos.animation.interval);
                        },
                        step: function () {
                            var progressXY, progressZ, destX, destY, destZ;
                            if (!map.pos.animation.descriptor) {
                                return;
                            }
                            if (map.pos.animation.descriptor.time < map.pos.animation.now()) {
                                map.pos.center({
                                    x: map.pos.animation.descriptor.to.x || map.pos.x,
                                    y: map.pos.animation.descriptor.to.y || map.pos.y,
                                    z: map.pos.animation.descriptor.to.z || map.pos.z
                                }, {
                                    animationStep: false
                                });
                            } else {
                                progressXY = map.pos.animation.ease();
                                progressZ = map.pos.animation.ease(function (base, exp) {
                                    return base;
                                });
                                if (typeof map.pos.animation.descriptor.to.x !== 'undefined' && map.pos.animation.descriptor.to.x !== false) {
                                    destX = map.pos.animation.descriptor.from.x * progressXY + map.pos.animation.descriptor.to.x * (1 - progressXY);
                                }
                                if (typeof map.pos.animation.descriptor.to.y !== 'undefined' && map.pos.animation.descriptor.to.y !== false) {
                                    destY = map.pos.animation.descriptor.from.y * progressXY + map.pos.animation.descriptor.to.y * (1 - progressXY);
                                }
                                if (typeof map.pos.animation.descriptor.to.z !== 'undefined' && map.pos.animation.descriptor.to.z !== false) {
                                    destZ = map.pos.animation.descriptor.from.z * progressZ + map.pos.animation.descriptor.to.z * (1 - progressZ);
                                }
                                map.pos.center({
                                    x: destX || map.pos.x,
                                    y: destY || map.pos.y,
                                    z: destZ || map.pos.z
                                }, {
                                    animationStep: true
                                });
                                map.pos.animation.timeoutId = $.setTimeout(map.pos.animation.step, map.pos.animation.interval);
                            }
                        },
                        stop: function () {
                            if (map.pos.animation.timeoutId) {
                                $.clearTimeout(map.pos.animation.timeoutId);
                                map.pos.animation.timeoutId = 0;
                            }
                        }
                    }
                },
                pow: function (base, exp) {
                    if (map.cacheValues) {
                        if (map.cache && map.cache.pow) {
                            if (map.cache.pow[base] && map.cache.pow[base][exp]) {
                                return map.cache.pow[base][exp];
                            }
                            if (!map.cache.pow) {
                                map.cache.pow = [];
                            }
                            if (!map.cache.pow[base]) {
                                map.cache.pow[base] = [];
                            }
                            map.cache.pow[base][exp] = $.Math.pow(base, exp);
                            return map.cache.pow[base][exp];
                        }
                    }
                    return $.Math.pow(base, exp);
                }
            };
            return { /* public functions */
                init: function (config) { /* init extensions first */
                    var e, sub;
                    for (e in slippymap.extension) {
                        if (slippymap.extension.hasOwnProperty(e)) {
                            if (typeof slippymap.extension[e] === 'function') {
                                this[e] = slippymap.extension[e](map);
                                if (typeof this[e].init === 'function') {
                                    this[e].init();
                                }
                            } else {
                                this[e] = {};
                                for (sub in slippymap.extension[e]) {
                                    if (slippymap.extension[e].hasOwnProperty(sub)) {
                                        this[e][sub] = slippymap.extension[e][sub](map);
                                        if (typeof this[e][sub].init === 'function') {
                                            this[e][sub].init();
                                        }
                                    }
                                }
                            }
                        }
                    }
                    if (typeof config === 'function') {
                        config(this);
                    }
                    map.init();
                    return this;
                },
                center: function (coords, options) {
                    if (typeof coords !== 'object') {
                        return {
                            x: map.pos.x,
                            y: map.pos.y,
                            z: map.pos.z
                        };
                    }
                    map.pos.center(coords, options);
                    return this;
                },
                coords: function (coords, options) {
                    if (typeof coords !== 'object') {
                        return map.pos.coords();
                    }
                    map.pos.coords({
                    	lon: parseFloat(coords.lon),
                    	lat: parseFloat(coords.lat),
                    	zoom: parseFloat(coords.zoom)}, 
                    	options
                    );
                    map.renderer.refresh();
                    return this;
                },
                zoom: function (z, options) {
                    if (typeof z !== 'number') {
                        return map.pos.z;
                    }
                    map.pos.setZ(z, options);
                    return this;
                },
                maxZ: function (z) {
                    if (typeof z !== 'number') {
                        return map.zMax;
                    }
                    if (z < map.zMin) {
                        map.zMax = map.zMin;
                    } else {
                        map.zMax = z;
                    }
                    return this;
                },
                minZ: function (z) {
                    if (typeof z !== 'number') {
                        return map.zMin;
                    }
                    if (z < 0) {
                        map.zMin = 0;
                    } else if (z > map.zMax) {
                        map.zMin = map.zMax;
                    } else {
                        map.zMin = z;
                    }
                    return this;
                },
                bounds: function (left, top, right, bottom) {
                    var viewport, bounds;
                    if (typeof left === 'number' && typeof top === 'number' &&
                            typeof right === 'number' && typeof bottom === 'number' &&
                            parseFloat(left) < parseFloat(right) &&
                            parseFloat(bottom) < parseFloat(top)) {
                        map.pos.minX = map.pos.lon2posX(parseFloat(left));
                        map.pos.maxX = map.pos.lon2posX(parseFloat(right));
                        map.pos.minY = map.pos.lat2posY(parseFloat(top));    // NB pixel origin is top left
                        map.pos.maxY = map.pos.lat2posY(parseFloat(bottom)); // NB pixel origin is top left
                        return this;
                    }
                    viewport =  map.viewport();
                    bounds = {};
                    bounds.left = map.pos.tile2lon((map.pos.x - viewport.w / 2) / map.renderer.tilesize, map.zMax);
                    bounds.right = map.pos.tile2lon((map.pos.x + viewport.w / 2) / map.renderer.tilesize, map.zMax);
                    bounds.top = map.pos.tile2lat((map.pos.y - viewport.h / 2) / map.renderer.tilesize, map.zMax);
                    bounds.bottom = map.pos.tile2lat((map.pos.y + viewport.h / 2) / map.renderer.tilesize, map.zMax);
                    return bounds;
                },
                refresh: function () {
                    map.renderer.refresh();
                    return this;
                },
                width: function (width) {
                    if (typeof width !== 'number') {
                        return map.renderer.canvas.width;
                    }
                    map.renderer.canvas.width = width;
                    return this;
                },
                height: function (height) {
                    if (typeof height !== 'number') {
                        return map.renderer.canvas.height;
                    }
                    map.renderer.canvas.height = height;
                    return this;
                },
                addMovedListeners: function (listener) {
                    map.movedListeners.push(listener);
                    return this;
                },
                addMoveEndListeners: function (listener) {
                    map.moveEndListeners.push(listener);
                    return this;
                },
                addZoomedListeners: function (listener) {
                    map.zoomedListeners.push(listener);
                    return this;
                },
                zoomIn: function (event, options) {
                    map.pos.zoomIn(options);
                    if (event.preventDefault) {
                        map.events.preventDefault(event);
                    }
                    if (typeof event !== 'undefined') {
                        return this;
                    }
                    return false;
                },
                zoomOut: function (event, options) {
                    map.pos.zoomOut(options);
                    if (event.preventDefault) {
                        map.events.preventDefault(event);
                    }
                    if (typeof event !== 'undefined') {
                        return this;
                    }
                    return false;
                },
                tileCache: function (tiles) {
                    if (typeof tiles !== 'undefined') {
                        map.renderer.tiles = tiles;
                    } else {
                        if (map.renderer.tiles.length === 1) {
                            return map.renderer.tiles[0];
                        }
                        return map.renderer.tiles;
                    }
                    return this;
                },
                tileProvider: function (provider) {
                    if (typeof provider !== 'function') {
                        return map.tileprovider;
                    }
                    map.tileprovider = provider;
                    delete map.renderer.tiles;
                    map.renderer.tiles = [];
                    map.renderer.refresh();
                    return this;
                },
                markers: function (markers) {
                    if (typeof markers !== 'object') {
                        return map.markers;
                    }
                    map.markers = markers;
                    map.renderer.refresh();
                    return this;
                },
                marker: function (id, marker) {
                    if (id && typeof marker !== 'object') {
                        return map.markers[id];
                    }
                    map.markers[id] = marker;
                    map.renderer.refresh();
                    return this;
                },
                tracks: function (tracks) {
                    if (typeof tracks !== 'object') {
                        return map.tracks;
                    }
                    map.tracks = tracks;
                    map.renderer.refresh();
                    return this;
                },
                tileSize: function (size) {
                    if (typeof size !== 'number') {
                        return map.renderer.tilesize;
                    }
                    map.renderer.tilesize = size;
                    return this;
                },
                fractionalZoom: function (state) {
                    if (state !== true && state !== false) {
                        return map.useFractionalZoom;
                    }
                    map.useFractionalZoom = state;
                    return this;
                },
                scrollMomentum: function (state) {
                    if (state !== true && state !== false) {
                        return map.scrollMomentum;
                    }
                    map.scrollMomentum = state;
                    return this;
                }
            };
        };
        slippymap.debug = function (params) {
            if (typeof window.console !== "undefined") {
                window.console.log(params);
            }
        };
        slippymap.extension = {};
        window.slippymap = slippymap;
    }
}(window));