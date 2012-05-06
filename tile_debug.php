<?php

/* generates blank tiles with x y z coords */

error_reporting(0);
ini_set('display_errors','off');

$tileX = isset($_REQUEST["x"])?intval($_REQUEST["x"]):0;
$tileY = isset($_REQUEST["y"])?intval($_REQUEST["y"]):0;
$tileZ = isset($_REQUEST["z"])?intval($_REQUEST["z"]):0;

$tileSize = 256;
$tileImage = imagecreate($tileSize, $tileSize);

$bgColor = imagecolorallocate($tileImage, 255, 255, 255);
$labelColor = imagecolorallocate($tileImage, 125, 127, 127);
$textColor = imagecolorallocate($tileImage, 0, 0, 0);

$offsetX = floor(($tileSize/2)-70);
$offsetY = floor(($tileSize/2)-20);

$labelText = " z      x      y";
$debugText = sprintf("%2d %6d %6d", $tileZ, $tileX, $tileY);

imagestring($tileImage, 5, $offsetX, $offsetY, $labelText, $labelColor);
imagestring($tileImage, 5, $offsetX, $offsetY+20, $debugText, $textColor);

$borderColor = imagecolorallocate($tileImage, 0, 0, 255);
imagerectangle($tileImage, 0, 0, $tileSize-1, $tileSize-1, $borderColor);
    

header('Content-type: image/png');

imagepng($tileImage);
imagedestroy($tileImage);