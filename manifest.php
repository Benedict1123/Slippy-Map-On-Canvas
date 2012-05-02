<?php

header("Content-Type: text/cache-manifest");
print @file_get_contents("map.manifest");