Phaser.Plugin.lights = function (parent)
{
    /**
    * @property {Any} parent - The parent of this plugin. If added to the PluginManager the parent will be set to that, otherwise it will be null.
    */
    this.parent = parent;
    
    /**
    * @property {array} _segments - The objects that can be collided against.
    */
    this._segments = [];  
    
    this._lights = [];
    this._points = [];
};

Phaser.Plugin.lights.prototype = Object.create(Phaser.Plugin.prototype);
Phaser.Plugin.lights.prototype.constructor = Phaser.Plugin.lights;

Phaser.Plugin.lights.Light = function(position, angle, direction, radius, arcSegments, color1, color2, type, gradient)
{
    //starting point of the light
	this.point = position || new Phaser.Point(0, 0);
    this.direction = direction || 0;
    this.direction *= -1;
    this.angle = angle || 360;
    if(this.angle == 0){
        this.angle = 360;
    }
    this.radius = radius || 100;
    this.arcSegments = arcSegments || 0;
    if(this.angle == 360 && this.arcSegments < 3){
        if(this.arcSegments > 0){
            this.arcSegments = 3;
        }        
    }
    else if(arcSegments == 0){
        this.arcSegments = 1;
    }
    
    this.segAngle = 0;
    
    if(this.arcSegments > 0){
        this.segAngle = this.angle / this.arcSegments;
    }
    
    this.parent; 
};

Phaser.Plugin.lights.prototype.create = function(collisionObjects, polygons)
{
    this.createSegments(collisionObjects, polygons);
    
    return this;
};

Phaser.Plugin.lights.prototype.createSegments = function(collisionObjects, polygons)
{
    this._segments = [];

    polygons = polygons || false;
    
    if(polygons){
        this._segments = this.convertToSegments(collisionObjects);
    }   
    
    this._segments = this.breakIntersections(this._segments);
    
};

Phaser.Plugin.lights.prototype.addLight = function(position, angle,direction, radius, arcSegments, color1, color2, type, gradient)
{
    var light = new Phaser.Plugin.lights.Light(position, angle, direction, radius, arcSegments, color1, color2, type, gradient);
    this._lights.push(light);
    
    return light;    
};

Phaser.Plugin.lights.prototype.removeLight = function(light)
{
    if(this._lights.length > 0){
        for(var i = 0; i < this._lights.length; i++){
            if(this._lights[i] == light){
                this._lights.splice(i, 1); 
                break;
            } 
        }
        return true;   
    }
    return false;
};

Phaser.Plugin.lights.prototype.compute = function(light) {
    if(light === null){
        return [];   
    }
    var direction = light.direction;
    var segments = this._segments;
    
    if(light.arcSegments > 0){
        var boundsPoly = [];
        //this makes direction center of arc
        direction -= (light.angle * 0.5) - (light.segAngle * 0.5);
        var start = light.point;
        var end = new Phaser.Point(light.point.x + light.radius * Math.cos(direction * Math.PI / 180), light.point.y + light.radius * Math.sin(direction * Math.PI / 180));
        boundsPoly.push(new Phaser.Line(start.x, start.y, end.x, end.y));
        for(var i = 1; i < light.arcSegments; i++){
            direction += light.segAngle;
            start = boundsPoly[i-1].end;
            end = new Phaser.Point(light.point.x + light.radius * Math.cos(direction * Math.PI / 180), light.point.y + light.radius * Math.sin(direction * Math.PI / 180));
            boundsPoly.push(new Phaser.Line(start.x, start.y, end.x, end.y));
        }
        if(light.angle >= 360){
            boundsPoly.splice(0, 1)
            direction += light.segAngle;
            start = boundsPoly[boundsPoly.length-1].end;
            end = new Phaser.Point(light.point.x + light.radius * Math.cos(direction * Math.PI / 180), light.point.y + light.radius * Math.sin(direction * Math.PI / 180));
        }
        else{
            start = new Phaser.Point(light.point.x + light.radius * Math.cos(direction * Math.PI / 180), light.point.y + light.radius * Math.sin(direction * Math.PI / 180));
            end = light.point;
        }
        boundsPoly.push(new Phaser.Line(start.x, start.y, end.x, end.y));
        
        //Reduce amount of segments to process.  Could be slower on small areas, but large segment sets should significantly improve processing.
        var minX = Infinity;
        var minY = Infinity;
        var maxX = 0;
        var maxY = 0;
        for(var i = 0; i < boundsPoly.length; i++){
            var p = boundsPoly[i].start; 
            minX = p.x < minX ? p.x : minX; 
            minY = p.y < minY ? p.y : minY; 
            maxX = p.x > maxX ? p.x : maxX; 
            maxY = p.y > maxY ? p.y : maxY; 
        }
        var boundsTemp = [];
        boundsTemp.push(new Phaser.Line(minX, minY, maxX, minY));
        boundsTemp.push(new Phaser.Line(maxX, minY, maxX, maxY));
        boundsTemp.push(new Phaser.Line(maxX, maxY, minX, maxY));
        boundsTemp.push(new Phaser.Line(minX, maxY, minX, minY));
       
        segments = this.getSegments(boundsTemp, segments).concat(boundsPoly);
    }
    
    segments = this.breakIntersections(segments); 
    //for debug
    this._points = segments;
    
    var t = new Phaser.Point(light.point.x + light.radius * Math.cos(light.direction * Math.PI / 180), light.point.y + light.radius * Math.sin(light.direction * Math.PI / 180));
    
    var x = t.x - light.point.x;
    var y = t.y - light.point.y;
    // Get absolute value of each vector
    var ax = Math.abs(x);
    var ay = Math.abs(y);
    // Create a ratio
    var ratio = 1 / Math.max(ax, ay);
    ratio = ratio * (1.29289 - (ax + ay) * ratio * 0.29289)

    //not coming out right!!!!
    var position = new Phaser.Point(light.point.x + (x * ratio), light.point.y + (y * ratio));
    //return position;
	var polygon = [];
	var sorted = this.sortPoints(position, segments);
	var map = new Array(segments.length);
	for (var i = 0; i < map.length; ++i) map[i] = -1;
	var heap = [];
	var start = new Phaser.Point(position.x+1, position.y);
	for (var i = 0; i < segments.length; ++i) {
		var a1 = segments[i].start.angle(position, true);
		var a2 = segments[i].end.angle(position, true);
		var active = false;
		if (a1 > -180 && a1 <= 0 && a2 <= 180 && a2 >= 0 && a2 - a1 > 180) active = true;
		if (a2 > -180 && a2 <= 0 && a1 <= 180 && a1 >= 0 && a1 - a2 > 180) active = true;
		if (active) {
			this.insert(i, heap, position, segments, start, map);
		}
	}
	for (var i = 0; i < sorted.length;) {
		var extend = false;
		var shorten = false;
		var orig = i;
		var vertex = null;
		if(sorted[i][1] == 0){
			vertex = segments[sorted[i][0]].start;
		}
		else{
			vertex = segments[sorted[i][0]].end;
		}
		var old_segment = heap[0];
		do {
			if (map[sorted[i][0]] != -1) {
				if (sorted[i][0] == old_segment) {
					extend = true;
					if(sorted[i][1] == 0){
						vertex = segments[sorted[i][0]].start;
					}
					else{
						vertex = segments[sorted[i][0]].end;
					}
				}
				this.remove(map[sorted[i][0]], heap, position, segments, vertex, map);
			} else {
				this.insert(sorted[i][0], heap, position, segments, vertex, map);
				if (heap[0] != old_segment) {
					shorten = true;
				}
			}
			++i;
			if (i == sorted.length) break;
		} while (sorted[i][2] < sorted[orig][2] + 0.0000001);
        
        //I want to get rid of the intersection code, but using Phaser intersects causes issues.
        if (extend) {
			polygon.push(vertex);
            if(heap[0] !== undefined){
			    var cur = this.intersectLines(segments[heap[0]].start, segments[heap[0]].end, position, vertex);
                var pcur = new Phaser.Point(cur[0], cur[1]);
            	if (!pcur.equals(pcur, vertex)) polygon.push(pcur);
            }
		} else if (shorten) {
            if(segments[old_segment] !== undefined){
                var p = this.intersectLines(segments[old_segment].start, segments[old_segment].end, position, vertex);
                polygon.push(new Phaser.Point(p[0], p[1]));
                p = this.intersectLines(segments[heap[0]].start, segments[heap[0]].end, position, vertex);
                polygon.push(new Phaser.Point(p[0], p[1]));
            }
		} 
	}
	return polygon;    
};

Phaser.Plugin.lights.prototype.convertToSegments = function(polygons) {//[[{x:1,y:0},{0,1},{1,1}],[{2,0},{2,2},{0,2}], ...] i = x j = 3
	var segments = [];
	for (var i = 0; i < polygons.length; ++i) {
		for (var j = 0; j < polygons[i].length; ++j) {
			var k = j+1;
			if (k == polygons[i].length) k = 0;            
			segments.push(new Phaser.Line(polygons[i][j].x, polygons[i][j].y, polygons[i][k].x, polygons[i][k].y));
		}
	}
	return segments;
};

Phaser.Plugin.lights.prototype.breakIntersections = function(segments) {
	var output = [];
	for (var i = 0; i < segments.length; ++i) {
		var intersections = [];
		for (var j = 0; j < segments.length; ++j) {
			if (i == j) continue;
            var intersect = segments[i].intersects(segments[j]);
            if (intersect === null) continue;
            if (intersect.equals(segments[i].start) || intersect.equals(segments[i].end)) continue;
            intersections.push(intersect);
		}
		var start = segments[i].start;
		while (intersections.length > 0) {
			var endIndex = 0;
			var endDis = start.distance(intersections[0]);
			for (var j = 1; j < intersections.length; ++j) {
				var dis = start.distance(intersections[j]);
				if (dis < endDis) {
					endDis = dis;
					endIndex = j;
				}
			}
			output.push(new Phaser.Line(start.x, start.y, intersections[endIndex].x, intersections[endIndex].y));
			start = intersections[endIndex];
			intersections.splice(endIndex, 1);
		}
		output.push(new Phaser.Line(start.x, start.y, segments[i].end.x, segments[i].end.y));
	}
	return output;
};

Phaser.Plugin.lights.prototype.getSegments = function(boundsTemp, segments) {
	var output = [];
    var width = boundsTemp[0].end.x - boundsTemp[0].start.x;
    var height = boundsTemp[1].end.y -  boundsTemp[0].end.y;
    for (var j = 0; j < segments.length; ++j) {
        if(boundsTemp[0].intersects(segments[j], false) ||
           boundsTemp[1].intersects(segments[j], false) ||
           boundsTemp[2].intersects(segments[j], false) ||
           boundsTemp[3].intersects(segments[j], false)){
            output.push(new Phaser.Line(segments[j].start.x, segments[j].start.y, segments[j].end.x, segments[j].end.y));
        }
    }
	return output;
};

Phaser.Plugin.lights.prototype.equal = function(a, b) {
	if (Math.abs(a.x - b.x) < 0.0000001 && Math.abs(a.y - b.y) < 0.0000001) return true;
	return false;
};

Phaser.Plugin.lights.prototype.remove = function(index, heap, position, segments, destination, map) {
	map[heap[index]] = -1;
	if (index == heap.length - 1) {
		heap.pop();
		return;
	}
	heap[index] = heap.pop();
	map[heap[index]] = index;
	var cur = index;
	var parent = Math.floor((cur-1)/2);
	if (cur != 0 && this.lessThan(heap[cur], heap[parent], position, segments, destination)) {
		while (cur > 0) {
			var parent = Math.floor((cur-1)/2);
			if (!this.lessThan(heap[cur], heap[parent], position, segments, destination)) {
				break;
			}
			map[heap[parent]] = cur;
			map[heap[cur]] = parent;
			var temp = heap[cur];
			heap[cur] = heap[parent];
			heap[parent] = temp;
			cur = parent;
		}
	} else {
		while (true) {
			var left = 2*cur+1;
			var right = left + 1;
			if (left < heap.length && this.lessThan(heap[left], heap[cur], position, segments, destination) &&
					(right == heap.length || this.lessThan(heap[left], heap[right], position, segments, destination))) {
				map[heap[left]] = cur;
				map[heap[cur]] = left;
				var temp = heap[left];
				heap[left] = heap[cur];
				heap[cur] = temp;
				cur = left;
			} else if (right < heap.length && this.lessThan(heap[right], heap[cur], position, segments, destination)) {
				map[heap[right]] = cur;
				map[heap[cur]] = right;
				var temp = heap[right];
				heap[right] = heap[cur];
				heap[cur] = temp;
				cur = right;
			} else break;
		}
	}
};

Phaser.Plugin.lights.prototype.insert = function(index, heap, position, segments, destination, map) {
    if (segments[index].intersects(new Phaser.Line(position.x, position.y, destination.x, destination.y), false) == null) return;
	var cur = heap.length;
	heap.push(index);
	map[index] = cur;
	while (cur > 0) {
		var parent = Math.floor((cur-1)/2);
		if (!this.lessThan(heap[cur], heap[parent], position, segments, destination)) {
			break;
		}
		map[heap[parent]] = cur;
		map[heap[cur]] = parent;
		var temp = heap[cur];
		heap[cur] = heap[parent];
		heap[parent] = temp;
		cur = parent;
	}
};

Phaser.Plugin.lights.prototype.lessThan = function(index1, index2, position, segments, destination) {
    //I want to get rid of the intersection code, but using Phaser intersects causes issues.
	var inter1 = this.intersectLines(segments[index1].start, segments[index1].end, position, destination);
	var pIntersect1 = new Phaser.Point(inter1[0], inter1[1]);
	var inter2 = this.intersectLines(segments[index2].start, segments[index2].end, position, destination);
	var pIntersect2 = new Phaser.Point(inter2[0], inter2[1]);
	if (!this.equal(pIntersect1, pIntersect2)) {
		var d1 = Phaser.Point.distance(pIntersect1, position);
		var d2 = Phaser.Point.distance(pIntersect2, position);
		return d1 < d2;
	}
    var a1 = null;
    var a2 = null;
	if (pIntersect1.equals(segments[index1].start)){
        a1 = this.angle2(segments[index1].end, pIntersect1, position);
    }
    else{
        a1 = this.angle2(segments[index1].start, pIntersect1, position);
    }
	if (pIntersect2.equals(segments[index2].start)){
        a2 = this.angle2(segments[index2].end, pIntersect2, position);
    }else {
        a2 = this.angle2(segments[index2].start, pIntersect2, position);
    }
	if (a1 < 180) {
		if (a2 > 180) return true;
		return a2 < a1;
	}
	return a1 < a2;
};

Phaser.Plugin.lights.prototype.angle2 = function(a, b, c) {
	var r = a.angle(b, true) - b.angle(c, true);
	if (r < 0) r += 360;
	if (r > 360) r -= 360;
	return r;
};

Phaser.Plugin.lights.prototype.sortPoints = function(position, segments) {
	var points = new Array(segments.length * 2);
	for (var i = 0; i < segments.length; ++i) {
		points[2*i] = [i, 0, segments[i].start.angle(position, true)];
		points[2*i+1] = [i, 1, segments[i].end.angle(position, true)];
	}
	points.sort(function(a,b) {return a[2]-b[2];});
	return points;
};

Phaser.Plugin.lights.prototype.intersectLines = function(a1, a2, b1, b2) {
	var ua_t = (b2.x - b1.x) * (a1.y - b1.y) - (b2.y - b1.y) * (a1.x - b1.x);
    var ub_t = (a2.x - a1.x) * (a1.y - b1.y) - (a2.y - a1.y) * (a1.x - b1.x);
    var u_b  = (b2.y - b1.y) * (a2.x - a1.x) - (b2.x - b1.x) * (a2.y - a1.y);

	if (u_b != 0) {
		var ua = ua_t / u_b;
		var ub = ub_t / u_b;
		return [a1.x - ua * (a1.x - a2.x), a1.y - ua * (a1.y - a2.y)];
	}
	return [];
};

Phaser.Utils.Debug.prototype.lights = function(lights, x, y, showSegments, showPoints, showLightPositions, textColor, segmentColor, pointColor, lightPointColor)
{    
    showSegments = showSegments || false;        
    showPoints = showPoints || false;
    showLightPositions = showLightPositions || false;
    textColor = textColor || 'rgb(255,60,60)';
    segmentColor = segmentColor || 'rgb(255,100,200)';
    pointColor = pointColor || 'rgb(255,210,60)';
    lightPointColor = lightPointColor || 'rgb(255,100,60)';
    
    if(showSegments){
        for(var a= 0; a < lights._segments.length; a++){
            this.game.debug.geom(lights._segments[a], segmentColor);
        }
    }
    
    if(showLightPositions){
        for(var a = 0; a < lights._lights.length; a++){       
            this.game.debug.geom(lights._lights[a].point, lightPointColor);    
        }   
    }
    
    if(showPoints){
        for(var i = 0; i < lights._points.length; i++){
            this.game.debug.geom(lights._points[a], pointColor);
        }
    }
};