Phaser.Plugin.navPath = function (parent)
{
    /**
    * @property {Any} parent - The parent of this plugin. If added to the PluginManager the parent will be set to that, otherwise it will be null.
    */
    this.parent = parent;
    
    /**
    * @property {array} _nodes - The nodes that make up the walkable area.
    */
	this._nodes = [];
    
    /**
    * @property {array} _collisionObjects - The objects that can be collided against. Used for smoothing the path.
    */
    this._collisionObjects = [];
    
    /**
    * @property {array} _portals - {left : p1, right: p2} - left and right points used for the string pull algorithm.
    */
	this._portals = [];
    
    /**
    * @property {array} _path - The points that make up the found path.
    */
	this._path = [];
    
    /**
    * @property {array} _nodePath - The nodes that make up the found path.
    */
	this._nodePath = [];
};

Phaser.Plugin.navPath.prototype = Object.create(Phaser.Plugin.prototype);
Phaser.Plugin.navPath.prototype.constructor = Phaser.Plugin.navPath;

/** 
* Node is an object that stores node value.
* @class Phaser.Plugin.navPath.Node 
* @constructor 
* @param {number} id - The id of the node. 
* @param {array} points - the points that define the node. 
*/ 
Phaser.Plugin.navPath.Node = function(id, points, type)
{
    //unique id to help find the node
	this.id = id;
    //the z index of the node
	this.z = (points[0].z === undefined) ? 0 : points[0].z;
    //the points that make up a node
	this.points = [];
    this.points[0] = new Phaser.Point(points[0].x, points[0].y);
    this.points[1] = new Phaser.Point(points[1].x, points[1].y);
    this.points[2] = new Phaser.Point(points[2].x, points[2].y);
    //the centroid of the node
	this.nodeLoc = {
		x: (points[0].x+points[1].x+points[2].x)/3,
		y: (points[0].y+points[1].y+points[2].y)/3,
		z: this.z
	};
    //any neighbors of the node
	this.neighbors = [];
    this.distanceToNeighbors = [];
    this.parent; 
};

/** 
* NodeInfo is an object that stores node information for pathfinding.
* @class Phaser.Plugin.navPath.NodeInfo 
* @constructor 
* @param {Phaser.Plugin.navPath.Node} n - The node. 
* @param {number} sW - cost of the node 
* @param {number} tW - distance to the goal. 
* @param {Phaser.Plugin.navPath.Node} pI - current node. 
*/ 
Phaser.Plugin.navPath.NodeInfo = function(n, sW, tW, pI) {
    this.node = n;
    this.sw = sW;
    this.tw = tW;
    this.pi = pI;
}; 

/** 
* create the nodes and add their neighbors
* @method Phaser.Plugin.navPath.setNavMesh 
* @param {array} nodesPoints - The nodes as points.
* @param {array} extraLinks - the extra links between nodes
*/ 
Phaser.Plugin.navPath.prototype.setNavMesh = function(nodesPoints, extraLinks)
{
    this._nodes = [];
    this._collisionObjects = [];
	this._portals = [];
	this._path = [];
    
	var numPoints = nodesPoints.length;
	for(var i = 0; i < numPoints; i++){ //go through each triangle
		this._nodes.push(new Phaser.Plugin.navPath.Node(i, nodesPoints[i]));
	}
    
	this.linkNodes(extraLinks);
	
    for(var i = 0; i < this._nodes.length; i++){ //go through each Node
        var currNode = this._nodes[i];
        if(currNode.neighbors.length < 3){
            for(var k = 0; k < 3; k++){
                var empty = true;            
                for(var j = 0; j < currNode.neighbors.length; j++){ //go through each triangle                
                    var currNeighbor = currNode.neighbors[j];                    
                    if(							
                    (this.isOneOfPoints(currNode.points[k], currNeighbor.points[0], currNeighbor.points[1]) &&
                     this.isOneOfPoints(currNode.points[(k+1)%3], currNeighbor.points[0], currNeighbor.points[1])) ||
                    (this.isOneOfPoints(currNode.points[k], currNeighbor.points[1], currNeighbor.points[2]) &&
                     this.isOneOfPoints(currNode.points[(k+1)%3], currNeighbor.points[1], currNeighbor.points[2])) ||
                    (this.isOneOfPoints(currNode.points[k], currNeighbor.points[2], currNeighbor.points[0]) &&
                     this.isOneOfPoints(currNode.points[(k+1)%3], currNeighbor.points[2], currNeighbor.points[0]))
                    ){                        
                        empty = false;
                        break;
                    }
                }            
                if(empty){
                    this._collisionObjects.push({start: currNode.points[k], end: currNode.points[(k+1)%3]});
                }
            }
        }
    }
    
    //TODO: Set CollisionObjects where side of node that doesnt have a neighbor
    
    return this;
};

/** 
* adds neighbors to each node and links up extra links between nodes
* @method Phaser.Plugin.navPath.linkNodes 
* @param {array} extraLinks - the extra links between nodes 
*/ 
Phaser.Plugin.navPath.prototype.linkNodes = function(extraLinks) {
	var numNodes = this._nodes.length;
	for(var i = 0; i < numNodes; i++){ //go through each Node
		var currNode = this._nodes[i];
		
		if(currNode.neighbors.length < 3){
			for(var j = i+1; j < numNodes && currNode.neighbors.length != 3; j++){ //go through each triangle
				for(var k = 0; k < 3; k++){
					if(							
					(this.isOneOfPoints(currNode.points[k], this._nodes[j].points[0], this._nodes[j].points[1]) &&
                     this.isOneOfPoints(currNode.points[(k+1)%3], this._nodes[j].points[0], this._nodes[j].points[1])) ||
					(this.isOneOfPoints(currNode.points[k], this._nodes[j].points[1], this._nodes[j].points[2]) &&
                     this.isOneOfPoints(currNode.points[(k+1)%3], this._nodes[j].points[1], this._nodes[j].points[2])) ||
					(this.isOneOfPoints(currNode.points[k], this._nodes[j].points[2], this._nodes[j].points[0]) &&
                     this.isOneOfPoints(currNode.points[(k+1)%3], this._nodes[j].points[2], this._nodes[j].points[0]))
					){
						this.addNeighbor(currNode, this._nodes[j]);
						break;
					}
				}
			}
		}
	}
	for (var i = 0; i < numNodes; i++) {
        for(var j = 0; j < this._nodes[i].neighbors.length; j++){
		  var neighbor = this._nodes[i].neighbors[j];
          var diff = {
					x: this._nodes[i].nodeLoc.x-neighbor.nodeLoc.x,
					y: this._nodes[i].nodeLoc.y-neighbor.nodeLoc.y,
					z: this._nodes[i].nodeLoc.z-neighbor.nodeLoc.z
				}
          this._nodes[i].distanceToNeighbors.push(Math.sqrt((diff.x*diff.x)+(diff.y*diff.y)+(diff.z*diff.z)));
        }
	}
	if(extraLinks != undefined && extraLinks != null){ //array of array of points
		var Node1;
		var Node2;
		for(var h = 0; h < extraLinks.length; h++){
			for(var i = 0; i < numNodes && (Node1 == undefined || Node2 == undefined); i++){ //go through each Node find node 1 and 2
				if(this.nodes[h].neighbors.length != 3 && Node1 == undefined){ //go through each triangle
					for(var k = 0; k < 3; k++){
						if(							
						(this.isOneOfPoints(extraLinks[h][0][k], this._nodes[i].points[0], this._nodes[i].points[1]) &&
                         this.isOneOfPoints(extraLinks[h][0][(k+1)%3], this._nodes[i].points[0], this._nodes[i].points[1])) &&
						(this.isOneOfPoints(extraLinks[h][0][k], this._nodes[i].points[1], this._nodes[i].points[2]) &&
                         this.isOneOfPoints(extraLinks[h][0][(k+1)%3], this._nodes[i].points[1], this._nodes[i].points[2])) &&
						(this.isOneOfPoints(extraLinks[h][0][k], this._nodes[i].points[2], this._nodes[i].points[0]) &&
                         this.isOneOfPoints(extraLinks[h][0][(k+1)%3], this._nodes[i].points[2], this._nodes[i].points[0]))
						){
							Node1 = this._nodes[i];
							break;
						}
					}
				}
				if(this.nodes[h].neighbors.length != 3 && Node2 == undefined){ //go through each triangle
					for(var k = 0; k < 3; k++){
						count += 1;
						if(							
						(this.isOneOfPoints(extraLinks[h][1][k], this._nodes[i].points[0], this._nodes[i].points[1]) &&
                         this.isOneOfPoints(extraLinks[h][1][(k+1)%3], this._nodes[i].points[0], this._nodes[i].points[1])) &&
						(this.isOneOfPoints(extraLinks[h][1][k], this._nodes[i].points[1], this._nodes[i].points[2]) &&
                         this.isOneOfPoints(extraLinks[h][1][(k+1)%3], this._nodes[i].points[1], this._nodes[i].points[2])) &&
						(this.isOneOfPoints(extraLinks[h][1][k], this._nodes[i].points[2], this._nodes[i].points[0]) &&
                         this.isOneOfPoints(extraLinks[h][1][(k+1)%3], this._nodes[i].points[2], this._nodes[i].points[0]))
						){
							Node2 = this._nodes[i];
							break;
						}
					}
				}
			}
		}
		if(Node1 != undefined && Node2 != undefined){
			this.addNeighbor(Node1, Node2);	
		}
	}
};

/** 
* adds neighbors to each node and links up extra links between nodes
* @method Phaser.Plugin.navPath.linkNodes 
* @param {Phaser.Plugin.navPath.Node} node - The current node
* @param {Phaser.Plugin.navPath.Node} neighbor - the neighbor to the cuurent node
* @param {boolean} auto - automatically add neighbor
*/ 
Phaser.Plugin.navPath.prototype.addNeighbor = function (node, neighbor, auto)
{
	node.neighbors.push(neighbor);
	if ( auto || (auto == undefined) ) {
		this.addNeighbor(neighbor, node, false);
	}
};

/** 
* Find a path between 2 points
* @method Phaser.Plugin.navPath#find
* @public 
* @param {Phaser.Point} startPoint - The start point x, y in world coordinates to search a path. 
* @param {Phaser.Point} endPoint - The end point x, y in world coordinates that you trying to reach. 
* @param {number} zs - The z index of the start point. 
* @param {number} ze - the z index of the end point. 
* @param {boolean} smooth - smooth the path
* @param {boolean} log - keeps the nodes that are found.
* @return {array} points of the path
*/ 
Phaser.Plugin.navPath.prototype.find = function(startPoint, endPoint, zs, ze, smooth, log) {
	this._path = [];
    this._portals = [];
    this._nodePath = [];
    var diff = {};
    var diff1 = {};
    var diff2 = {};
    var diff3 = {};
	var ret = [];
    smooth = (smooth === undefined) ? false : smooth;
    log = (log === undefined) ? false : log;
    zs = (zs === undefined) ? 0 : zs;
    ze = (ze === undefined) ? 0 : ze;
	var sn = this.getNearest(startPoint.x, startPoint.y, zs);
	var en = this.getNearest(endPoint.x, endPoint.y, ze);

    var ol = [new Phaser.Plugin.navPath.NodeInfo(sn, 0, 0, null)];
	var yol = [];
	var cl = [];
	var found = false;
	var gScore;
	var gScoreIsBest;
    
    if(smooth){
        var isCollision = false;
        for(var i = 0; i < this._collisionObjects.length; i++){
            var currPoly = this._collisionObjects[i];
            if(this.intersectLineLineSmooth(startPoint, endPoint, currPoly.start, currPoly.end)){
                isCollision = true;
                break;
            }
        }
        if(!isCollision){
            this._path.push(startPoint);
            this._path.push(endPoint);
            return this._path;
        }
    }
    
	var curr = null;
	while ( (!found) && (ol.length) ) {
		curr = ol.shift();
		if (curr.node === en) {
			found = true;
			continue;
		}
		for (var c = 0; c < curr.node.neighbors.length; c++) {
			var tn = curr.node.neighbors[c];
			var tnoid = tn.id;
			if ( (!yol[tnoid]) && (!cl[tnoid]) ) {
				var gv = 1;
                //Center of Triangle
//              diff = {
//					x: tn.nodeLoc.x-endPoint.x,
//					y: tn.nodeLoc.y-endPoint.y,
//					z: tn.nodeLoc.z-ze
//				}
//                var hv = Math.sqrt((diff.x*diff.x)+(diff.y*diff.y)+(diff.z*diff.z));
                //Closest point of triangle
                diff1 = {
					x: tn.points[0].x-endPoint.x,
					y: tn.points[0].y-endPoint.y,
					z: tn.z-ze
				}
                diff2 = {
					x: tn.points[1].x-endPoint.x,
					y: tn.points[1].y-endPoint.y,
					z: tn.z-ze
				}
                diff3 = {
					x: tn.points[2].x-endPoint.x,
					y: tn.points[2].y-endPoint.y,
					z: tn.z-ze
				}
                var hv = Math.min(Math.min(Math.sqrt((diff1.x*diff1.x)+(diff1.y*diff1.y)+(diff1.z*diff1.z)), Math.sqrt((diff2.x*diff2.x)+(diff2.y*diff2.y)+(diff2.z*diff2.z))), Math.sqrt((diff3.x*diff3.x)+(diff3.y*diff3.y)+(diff3.z*diff3.z)));
				
				var nWeight = curr.sw+gv+hv;
				var ins = false;
				for (var oi = 0; oi < ol.length && ins === false; oi++) {
					if (ol[oi].sw+ol[oi].tw > nWeight) {
						ol.splice(oi, 0, new Phaser.Plugin.navPath.NodeInfo(tn, curr.sw+gv, hv, curr));
						yol[tnoid] = true;
						ins = true;
					}
				}
				if (!ins) {
					ol.push(new Phaser.Plugin.navPath.NodeInfo(tn, curr.sw+gv, hv, curr));
					yol[tnoid] = true;
				}
			}
		}
		cl[curr.node.id] = true;
	}

	if (found) {
		while (curr.pi !== null) {
			ret.unshift(curr.node);
			curr = curr.pi;
		}
		ret.unshift(curr.node);
	}

	if(log){
        this._nodePath = ret;
    }
    
	this.setPortals(startPoint, endPoint, ret);
    
    this.stringPull();
    
    if(smooth){
        this.smooth(this._path);
    }
    
	return this._path
};

/** 
* Sets the portals the string pulling algorithm uses
* @method Phaser.Plugin.navPath.setPortals
* @param {Phaser.Point} currNode - The start node in path path. 
* @param {Phaser.Point} endNode - The end node in path. 
* @param {number} nodes - path of nodes. 
*/ 
Phaser.Plugin.navPath.prototype.setPortals = function (currNode, endNode, nodes) {
    this._portals.push({left : currNode, right: currNode})
	var nextNode = new Phaser.Point(nodes[0].nodeLoc.x, nodes[0].nodeLoc.y);
	for(var h = 0; h < nodes.length-1; h++){
		//check which points match next triangle
		for(var k = 0; k < 3; k++){
			if(this.intersectLineLine(currNode, nextNode, nodes[h].points[k], nodes[h].points[(k+1)%3])){
                this._portals.push({left : nodes[h].points[k], right: nodes[h].points[(k+1)%3]})
				break;
			}
		}
		currNode = nextNode;
		nextNode = new Phaser.Point(nodes[h+1].nodeLoc.x, nodes[h+1].nodeLoc.y);				
	}
    this._portals.push({left : endNode, right: endNode})
};

/** 
* String pulling algorithm borrowed from http://pastebin.com/7jwrmw1i which is an implementation of
* http://digestingduck.blogspot.com/2010/03/simple-stupid-funnel-algorithm.html
* @method Phaser.Plugin.navPath.stringPull
*/ 
Phaser.Plugin.navPath.prototype.stringPull = function() {
	var portals = this._portals;
	// Init scan state
	var portalApex, portalLeft, portalRight;
	var apexIndex = 0, leftIndex = 0, rightIndex = 0;
	
	portalApex  = portals[0].left;
	portalLeft  = portals[0].left;
	portalRight = portals[0].right;

	// Add start point.
	this._path.push(portalApex);
	
	for (var i = 1; i < portals.length; i++) {
		var left  = portals[i].left;
		var right = portals[i].right;

		// Update right vertex.
		if (this.triArea(portalApex, portalRight, right) <= 0.0) {
			if (portalApex.distance(portalRight) < 0.000001 || this.triArea(portalApex, portalLeft, right) > 0.0) {
				// Tighten the funnel.
				portalRight = right;
				rightIndex = i;
			} else {
				// Right over left, insert left to path and restart scan from portal left point.
				this._path.push(portalLeft);
				// Make current left the new apex.
				portalApex = portalLeft;
				apexIndex = leftIndex;
				// Reset portal
				portalLeft = portalApex;
				portalRight = portalApex;
				leftIndex = apexIndex;
				rightIndex = apexIndex;
				// Restart scan
				i = apexIndex;
				continue;
			}
		}

		// Update left vertex.
		if (this.triArea(portalApex, portalLeft, left) >= 0.0) {
			if (portalApex.distance(portalLeft) < 0.000001 || this.triArea(portalApex, portalRight, left) < 0.0) {
				// Tighten the funnel.
				portalLeft = left;
				leftIndex = i;
			} else {
				// Left over right, insert right to path and restart scan from portal right point.
				this._path.push(portalRight);
				// Make current right the new apex.
				portalApex = portalRight;
				apexIndex = rightIndex;
				// Reset portal
				portalLeft = portalApex;
				portalRight = portalApex;
				leftIndex = apexIndex;
				rightIndex = apexIndex;
				// Restart scan
				i = apexIndex;
				continue;
			}
		}
	}
	
	if ((this._path.length == 0) || !(this._path[this._path.length - 1].distance(portals[portals.length - 1].left) < 0.000001)) {
		// Append last point to path.
		this._path.push(portals[portals.length - 1].left);
	}	
};

//rethink this, maybe with rays and phaser bodies
Phaser.Plugin.navPath.prototype.smooth = function(path) {
    if(path.length > 2){
        this._path = [];
        this._path.push(path[0]);
        for(var a = 0; a < path.length - 2; a++){
            for(var b = path.length-1; b > a; b--){ 
                var isCollision = false;
                for(var i = 0; i < this._collisionObjects.length; i++){
                    var currPoly = this._collisionObjects[i];
                    if(this.intersectLineLineSmooth(path[a], path[b], currPoly.start, currPoly.end)){
                        isCollision = true;
                        break;
                    }
                }
                if(!isCollision){
                    this._path.push(path[b]);
                    a = b;
                }
            }
        }
        this._path.push(path[path.length-1]);
    }
    
/*    if(path.length > 2){
		this._path = [];
		for(var a = 0; a < path.length - 2; a++){
			var isCollision = false;
			for(var b = a+1; b < path.length; b++){
				for(var i = 0; i < this._collisionObjects.length; i++){
					var currPoly = this._collisionObjects[i];
					
					if(this.intersectLineLineSmooth(path[a], path[b], currPoly.start, currPoly.end)){
						isCollision = true;
						break;
					}
				}
				if(isCollision){
					this._path.push(path[b-1]);
                    break;
				}
			}
		}
		this._path.push(path[path.length-1]);	
	}*/
    //Go through path, remove duplicate points
    if(this._path.length > 2){
        var seen = {};
        var out = [];
        var len = path.length;
        var j = 0;
        for(var i = 0; i < len; i++) {
             var item = path[i];
             if(seen[item] !== 1) {
                   seen[item] = 1;
                   out[j++] = item;
             }
        }
        this._path = out;    
    }
};

/** 
* Returns the nearest node in the node array
* @method Phaser.Plugin.navPath.getNearest
* @param {number} x1 - The x coordinate of the point. 
* @param {number} y1 - The y coordinate of the point. 
* @param {number} z1 - The z coordinate of the point. 
* @return {Phaser.Plugin.navPath.Node} The nearest node to the point
*/ 
Phaser.Plugin.navPath.prototype.getNearest = function(x1, y1, z1) {
	var nearestID = -1;	
	for (var i = 0; i < this._nodes.length; i++) { //go through each triangle
        var planeAB = (this._nodes[i].points[0].x-x1)*(this._nodes[i].points[1].y-y1)-(this._nodes[i].points[1].x - x1)*(this._nodes[i].points[0].y-y1);
        var planeBC = (this._nodes[i].points[1].x-x1)*(this._nodes[i].points[2].y-y1)-(this._nodes[i].points[2].x - x1)*(this._nodes[i].points[1].y-y1);
        var planeCA = (this._nodes[i].points[2].x-x1)*(this._nodes[i].points[0].y-y1)-(this._nodes[i].points[0].x - x1)*(this._nodes[i].points[2].y-y1);
        if((Math.abs(planeAB)/planeAB) == (Math.abs(planeBC)/planeBC) && (Math.abs(planeBC)/planeBC) == (Math.abs(planeCA)/planeCA)){
            nearestID = i;
            break;
        }
	}
    if(nearestID < 0){
        var diff = {};
        var maxDist = Infinity;
        for (var i = 0; i < this._nodes.length; i++) { //go through each triangle
            diff = {
                x: x1-this._nodes[i].nodeLoc.x,
                y: y1-this._nodes[i].nodeLoc.y,
                z: z1-this._nodes[i].nodeLoc.z
            }
            var dist = (diff.x*diff.x)+(diff.y*diff.y)+(diff.z*diff.z);

            if (dist < maxDist) {
                maxDist = dist;
                nearestID = i;
            }
        }   
    }
	if (nearestID >= 0) {
		return this._nodes[nearestID];
	}
	return null;
};	

/** 
* Returns the nearest node in the node array
* @method Phaser.Plugin.navPath.isOneOfPoints
* @param {Phaser.Point} a - The point to check against. 
* @param {Phaser.Point} b - The 1st point. 
* @param {Phaser.Point} c - The 2nd point. 
* @return {boolean} Check if any points match a
*/
Phaser.Plugin.navPath.prototype.isOneOfPoints = function(a, b, c){
	return (a.x == b.x && a.y == b.y) || (a.x == c.x && a.y == c.y);
};

/** 
* Returns a number for the string pulling algorithm
* @method Phaser.Plugin.navPath.triArea
* @param {Phaser.Point} a - The portal Apex. 
* @param {Phaser.Point} b - The 1st point. 
* @param {Phaser.Point} c - The 2nd point. 
* @return {number} Z-component of the cross product of two vectors in a 2D-plane. Two vectors in the XY-plane has its cross product along the Z-axis, and thus the magnitude of the cross product is simply the magnitude of the Z-component.
*/
Phaser.Plugin.navPath.prototype.triArea = function(a, b, c) {
	var ax = b.x - a.x;
	var ay = b.y - a.y;
	var bx = c.x - a.x;
	var by = c.y - a.y;
	
	return bx * ay - ax * by;
};

/** 
* Returns if line a and b intersect
* @method Phaser.Plugin.navPath.intersectLineLine
* @param {number} a1 - The 1st point in line a. 
* @param {number} a2 - The 2nd point in line a. 
* @param {number} b1 - The 1st point in line b. 
* @param {number} b2 - The 2nd point in line b.
* @return {bool} Do lines intersect
*/
Phaser.Plugin.navPath.prototype.intersectLineLine = function(a1, a2, b1, b2) {
    var ua_t = (b2.x - b1.x) * (a1.y - b1.y) - (b2.y - b1.y) * (a1.x - b1.x);
    var ub_t = (a2.x - a1.x) * (a1.y - b1.y) - (a2.y - a1.y) * (a1.x - b1.x);
    var u_b  = (b2.y - b1.y) * (a2.x - a1.x) - (b2.x - b1.x) * (a2.y - a1.y);

    if ( u_b != 0 ) {
        var ua = ua_t / u_b;
        var ub = ub_t / u_b;

        if ( 0 <= ua && ua <= 1 && 0 <= ub && ub <= 1 ) {
            return true;
        }
    } 
	else if ( ua_t == 0 || ub_t == 0 ) {
        return true;
    }

    return false;
};

/** 
* Returns if line a and b intersect
* @method Phaser.Plugin.navPath.intersectLineLineSmooth
* @param {number} a1 - The 1st point in line a. 
* @param {number} a2 - The 2nd point in line a. 
* @param {number} b1 - The 1st point in line b. 
* @param {number} b2 - The 2nd point in line b.
* @return {bool} Do lines intersect
*/
Phaser.Plugin.navPath.prototype.intersectLineLineSmooth = function(a1, a2, b1, b2) {

    var ua_t = (b2.x - b1.x) * (a1.y - b1.y) - (b2.y - b1.y) * (a1.x - b1.x);
    var ub_t = (a2.x - a1.x) * (a1.y - b1.y) - (a2.y - a1.y) * (a1.x - b1.x);
    var u_b  = (b2.y - b1.y) * (a2.x - a1.x) - (b2.x - b1.x) * (a2.y - a1.y);

    if ( u_b != 0 ) {
        var ua = ua_t / u_b;
        var ub = ub_t / u_b;

        if ( 0 <= ua && ua <= 1 && 0 <= ub && ub <= 1 ) {
            if((Math.ceil(a1.x) == Math.ceil(b1.x) && Math.ceil(a1.y) == Math.ceil(b1.y)) || (Math.ceil(a1.x) == Math.ceil(b2.x) && Math.ceil(a1.y) == Math.ceil(b2.y)) || (Math.ceil(a2.x) == Math.ceil(b1.x) && Math.ceil(a2.y) == Math.ceil(b1.y)) || (Math.ceil(a2.x) == Math.ceil(b2.x) && Math.ceil(a2.y) == Math.ceil(b2.y))){
                return false;
            }
            return true;
        }
    } 
    else if ( ua_t == 0 || ub_t == 0 ) {
        return false;
    }

    return false;
};

/** 
* Returns if line a and polygon points intersect
* @method Phaser.Plugin.navPath.intersectLinePolygon
* @param {number} a1 - The 1st point in line a. 
* @param {number} a2 - The 2nd point in line a. 
* @param {array} points - The 1st point in line b. 
* @return {bool} Does line intersect with polygon
*/
Phaser.Plugin.navPath.prototype.intersectLinePolygon = function(a1, a2, points) {
    var length = points.length;

    for ( var i = 0; i < length; i++ ) {
        var b1 = points[i];
        var b2 = points[(i+1) % length];
        var inter = this.intersectLineLine(a1, a2, b1, b2);
		if (inter)
			return true;
    }

    return false;
};

/**
* Debug method to draw the path created by navPath
* @method Phaser.Utils.Debug.navPath
* @param {Phaser.Plugin.navPath} navPath- The navPath plugin that you want to debug.
* @param {number} x - X position on camera for debug display.
* @param {number} y - Y position on camera for debug display.
* @param {number} lineWidth - Width of the navMesh boarder.
* @param {number} pathWidth - Width of the path line.
* @param {bool} showPath - Should debugger show the path.
* @param {bool} showPoints - Should debugger show the path points.
* @param {bool} showNavMesh - Should debugger show the Navigation Mesh.
* @param {bool} showCollisionObjects - Should debugger show the collision objects.
* @param {bool} showText - Should debugger show the text.
* @param {color} textColor - Color of the debug text.
* @param {color} pathColor - Color of the path.
* @param {color} lineColor - Color of the navMesh boarder.
* @param {color} navColor - Color to the navMesh.
* @param {color} navColColor - Color to the navMesh Collision area.
* @return {void}
*/
Phaser.Utils.Debug.prototype.navPath = function(navPath, x, y, lineWidth, pathWidth, showPath, showPoints, showNavMesh, showCollisionObjects, showText, textColor, pathColor, lineColor, navColor, navColColor)
{
    if (this.context == null)
    {
        return;
    }
    var pathLength = 0;
    var nodeLength = 0;
    var collisionLength = 0;
    var node = null;
    if(navPath._path)
    {
        pathLength = navPath._path.length;
    }
    if(navPath._nodes)
    {
        nodeLength = navPath._nodes.length;
    }
    if(navPath._collisionObjects)
    {
        collisionLength = navPath._collisionObjects.length;
    }
    
    textColor = textColor || 'rgb(255,60,60)';
    pathColor = pathColor || 'rgb(255,100,0)';
    this.game.debug.start(x, y, textColor);

    if(showNavMesh && nodeLength > 0){
        var pointLength = null;
        lineWidth = lineWidth || 2;
        lineColor = lineColor || 'rgb(0,100,255)';
        navColor = navColor || 'rgba(0,155,255, 0.2)';
        
        for(var i = 0; i < nodeLength; i++){
            this.context.beginPath();
            this.context.moveTo(navPath._nodes[i].points[0].x - this.game.camera.x, navPath._nodes[i].points[0].y - this.game.camera.y);
            this.context.lineTo(navPath._nodes[i].points[1].x - this.game.camera.x, navPath._nodes[i].points[1].y - this.game.camera.y);
            this.context.lineTo(navPath._nodes[i].points[2].x - this.game.camera.x, navPath._nodes[i].points[2].y - this.game.camera.y);
            this.context.closePath();
            this.context.lineWidth = lineWidth;
            this.context.fillStyle = navColor;
            if(navPath._nodePath.length > 0){
                for(var j = 0; j < navPath._nodePath.length; j++){
                    if(navPath._nodes[i] == navPath._nodePath[j]){
                        this.context.fillStyle = 'rgba(0,155,255, 0.5)';
                        break;
                    }
                }                
            }
            this.context.fill();
            this.context.strokeStyle = lineColor;
            this.context.stroke();
            
            var centroid = navPath._nodes[i].nodeLoc;
            this.context.beginPath();
            this.context.arc(centroid.x - this.game.camera.x, centroid.y - this.game.camera.y, 2, 0, Math.PI*2, true);
            this.context.stroke(); 
        }
    }
    
    if(showCollisionObjects && collisionLength > 0)
    {
        navColColor = navColColor || 'rgb(111,222,22)';
        this.context.strokeStyle = navColColor;
        for(var i = 0; i < collisionLength; i++){
            var temp = navPath._collisionObjects[i];
            this.context.beginPath();
            this.context.moveTo(temp.start.x - this.game.camera.x, temp.start.y - this.game.camera.y);
            this.context.lineTo(temp.end.x - this.game.camera.x, temp.end.y - this.game.camera.y);
            this.context.stroke(); 
        }
    }
    
    if(showPath && pathLength > 0)
    {
        pathWidth = pathWidth || 2;
        node = navPath._path[0];
        this.context.strokeStyle = pathColor;
        this.context.beginPath();
        this.context.moveTo(node.x - this.game.camera.x, node.y - this.game.camera.y);

        for(var i = 1; i < pathLength; i++)
        {
            node = navPath._path[i];
            this.context.lineTo(node.x - this.game.camera.x, node.y - this.game.camera.y);
        }
        //this.context.closePath();
        this.context.lineWidth = pathWidth;
        this.context.stroke(); 

        //Draw circles on visited nodes
        if(showPoints !== false)
        {
            var nodePoint;
            for(var j=0; j < navPath._path.length; j++)
            {
                nodePoint = navPath._path[j];
                this.context.beginPath();
                this.context.arc(nodePoint.x - this.game.camera.x, nodePoint.y - this.game.camera.y, 2, 0, Math.PI*2, true);
                this.context.stroke(); 
            }
        }
    }    
    
    if(showText){
        this.game.debug.start(x, y, textColor);
        this.line('Path length: ' + pathLength);
        this.line('Nodes: ' + nodeLength);
        this.line('Collision lines: ' + collisionLength);
    }    
    this.game.debug.stop();

};