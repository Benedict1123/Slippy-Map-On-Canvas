Slippy Map On Canvas
=============

Implemenation of a slippy tiles map using <canvas> HTML5.

It should run on most webkit browsers, eg. iOS, android, bada.

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