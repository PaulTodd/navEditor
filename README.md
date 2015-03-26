#navEditor

This is an editor to demonstrate how to use the navigation mesh plugin for Phaser.

I took insperation from http://www.byronknoll.com/visibility.html and started work on a phaser plugin to do visibility polygons.  Currently, it's pretty limited, but now that I actually have the code working for the most part, I will start to try and clean it up.  Basically, to see it in action, load an image, right click on the image and select Add Light.

TODO:
* Fix Bugs:
* Editor:
* Debug render issue when game area past certain width
* Hit area of collision objects not always accurate when moved
* Sprites need to only allow drag on texture
* Add documentation 

* Nav Mesh Plugin:
* Path sometimes goes through collision objects
* Not always shortest path

* Lights Plugin:
* Need to figure the best way to move the point away from the start point so that it is inside the visibility polygon.

* Features:
* Editor:
* Make lights draggable
* Add ability to load tilemaps
* Add localStorage of Trigger areas and collision objects
* Add options for visibility polygons (adjust size, color, angle, etc...)

* Nav Mesh Plugin:

* Lights Plugin:
* Work on the flexability of the visibility polygon plugin
* Make lights draggable
* Clean up code!!!
* Optimize array storage and manipulation. I think I'm using too many Json.stringifies. Was worried the arrays were getting manipulated when I didn't want them to be.  Will need to reduce them and see if any thing breaks.
*  