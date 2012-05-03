(function (window) {
	slippymap.debug(document.querySelectorAll("html")[0].getAttribute("manifest"));

	var status = function(cache){
		
		switch (cache.status) {
			case cache.UNCACHED: // UNCACHED == 0
				return 'UNCACHED';
				break;
			case cache.IDLE: // IDLE == 1
				return 'IDLE';
				break;
			case cache.CHECKING: // CHECKING == 2
				return 'CHECKING';
				break;
			case cache.DOWNLOADING: // DOWNLOADING == 3
				return 'DOWNLOADING';
				break;
			case cache.UPDATEREADY:  // UPDATEREADY == 4
				return 'UPDATEREADY';
				break;
			case cache.OBSOLETE: // OBSOLETE == 5
				return 'OBSOLETE';
				break;
			default:
				return 'UKNOWN CACHE STATUS';
				break;
		};
	}


	window.addEventListener('load', function(e) {
		var appCache = window.applicationCache;
		if (navigator.onLine) {
			if(appCache){
				appCache.addEventListener('updateready', function(e) {
					slippymap.debug("application update ready");
					if (appCache.status == appCache.UPDATEREADY) {
						appCache.swapCache();
						if (confirm('A new version of this application is available. Load it?')) {
							window.location.reload();
						}
					}
				}, false);
				appCache.addEventListener('checking', function() {
					slippymap.debug("checking applicationCache available", status(appCache));
				}, false);
				appCache.addEventListener('cached', function() {
					slippymap.debug("application cached");
				}, false);
				appCache.addEventListener('downloading', function() {
					slippymap.debug("downloading application");
				}, false);
				appCache.addEventListener('error', function(e) {
					slippymap.debug("error downloading application",e, event);
				}, false);
				appCache.addEventListener('noupdate', function() {
					slippymap.debug("no update", status(appCache));
				}, false);
				appCache.addEventListener('obsolete', function() {
					slippymap.debug("applicationCache obsolete");
				}, false);
				appCache.addEventListener('progress', function(e) {
					slippymap.debug("downloading application in progress", (e.loaded+1)+"/"+e.total);
				}, false);
//				slippymap.debug("applicationCache status", status(appCache));
			} else {
				slippymap.debug("no applicationCache available");
			}
		} else {
			slippymap.debug("navigator offline");	
		}
	}, false);
})(window);