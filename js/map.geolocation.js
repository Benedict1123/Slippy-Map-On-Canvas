(function (window) {
    if (typeof window.slippymap !== 'undefined') {
        window.slippymap.extension.geolocation = function (map) {
            var geo = {
                gl: {
                    getCurrentPosition: function () {
                        slippymap.debug("no supported geolocation services found");
                    }
                },
                lastUpdate: 0,
                init: function () {
                    try {
                        geo.gl = navigator.geolocation;
                        slippymap.debug("found native geolocation");
                    } catch (e_nogeolocation) {
                        slippymap.debug("no geolocation or gears plugin found");
                    }
                },
                location: function (success, error, options) {
                    slippymap.debug("dispatch getCurrentPosition");
                    try {
                        document.getElementById("geo").setAttribute("dispatched", true);
                    } catch (e) {}
                    geo.gl.getCurrentPosition(
                    success || geo.displayPosition, error || geo.displayError, options || {
                        maximumAge: 600,
                        timeout: 10000,
//                        enableHighAccuracy: false,
//                        responseTime: 2
                    });
                },
                watch: function (success, error, options) {
                    slippymap.debug("dispatch watchPosition");
                    try {
                        document.getElementById("geo").setAttribute("dispatched", true);
                    } catch (e) {}
                    geo.gl.watchPosition(
                    success || geo.displayPosition, error || geo.displayError, options || {
                        maximumAge: 600000,
                        timeout: 3000,
                        enableHighAccuracy: false,
                        responseTime: 2
                    });
                },
                displayError: function (error) {
                    slippymap.debug("getCurrentPosition error: " + (error.message || " - "));
                    try {
                        document.getElementById("geo").removeAttribute("dispatched");
                        document.getElementById("geo").setAttribute("error", true);
                    } catch (e) {}
                },
                displayPosition: function (position) {
                    var now = function () {
                        return (new Date()).getTime();
                    };
                    var metersPerPixel = [156412, 78206, 39103, 19551, 9776, 4888, 2444, 1222, 611, 305, 153, 76, 38, 19, 10, 5, 2, 1, 0.6];
                    if (position.coords && position.coords.accuracy) {
                        for (var z = 0; z < 17 && metersPerPixel[z] * map.renderer.tilesize > position.coords.accuracy; z++) {}
                        if (z) {
                            map.recenter(position.coords.longitude, position.coords.latitude, z);
                        } else {
                            map.recenter(position.coords.longitude, position.coords.latitude);
                        }
                    } else {
                        map.recenter(position.coords.longitude, position.coords.latitude);
                    }
                    geo.lastUpdate = now();
                    try {
                        document.getElementById("geo").removeAttribute("dispatched");
                        document.getElementById("geo").setAttribute("success", true);
                    } catch (e) {}
                }
            };
            return geo;
        };
    }
})(window);