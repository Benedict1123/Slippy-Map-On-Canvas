(function (window) {
    if (typeof window.slippymap !== 'undefined') {
    window.slippymap.extension.tiles = window.slippymap.extension.google || {};
		window.slippymap.extension.tiles.gsat = function(map) {
			return {
				init : function(){
					map.tileprovider =	function(x,y,z){
						return "http://khm1.google.de/kh/v=109&src=app&x="+x+"&y="+y+"&z="+z;
					};
				}
			};
		};
	}
})(window);
