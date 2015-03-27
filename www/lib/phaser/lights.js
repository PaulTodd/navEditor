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

Phaser.Plugin.lights.Segment = function(point1, point2)
{
    //the points that make up a segment
	this.point1 = point1;
    this.point2 = point2;

    //the center of the segment
    //this.c = new Phaser.Point((point1.x + point2.x)*0.5), ((point1.y + point2.y)*0.5));

    //this.radius = Phaser.Point.distance(point1, point2) * 0.5;

    this.parent; 
};

Phaser.Plugin.lights.Light = function(position, angle, radius, arcSegments, color1, color2, type, gradient)
{
    //starting point of the light
	this.point = position || new Phaser.Point(0, 0);
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

    this.color1 = color1 || 'rgb(255,60,60)';
    this.color2 = color2 || 'rgb(255,60,60)';
    
    //types could be light, flicker, fov. 
    this.type = type || "light";

    this.gradient = gradient || false;
    
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
        collisionObjects = this.convertToSegments(collisionObjects);
    }   
    
    for(var i = 0; i < collisionObjects.length; i++){
        this._segments.push(new Phaser.Plugin.lights.Segment(collisionObjects[i][0], collisionObjects[i][1]));
    }
    
    this._segments = this.breakIntersections(this._segments);
    
};

Phaser.Plugin.lights.prototype.addLight = function(position, angle, radius, arcSegments, color1, color2, type, gradient)
{
    var light = new Phaser.Plugin.lights.Light(position, angle, radius, arcSegments, color1, color2, type, gradient);
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

Phaser.Plugin.lights.prototype.compute = function(light, direction) {
    var init_direction = direction || 0;
    init_direction *= -1;
    direction = init_direction;
    
    if(light === null){
        return [];   
    }
    var segments = this._segments;
    
    if(light.arcSegments > 0){
        var boundsPoly = [];
        //this makes direction center of arc
        direction -= (light.angle * 0.5) - (light.segAngle * 0.5);
        boundsPoly.push(new Phaser.Plugin.lights.Segment(light.point, new Phaser.Point(light.point.x + light.radius * Math.cos(direction * Math.PI / 180), light.point.y + light.radius * Math.sin(direction * Math.PI / 180))));
        for(var i = 1; i < light.arcSegments; i++){
            direction += light.segAngle;
            var pos = boundsPoly[i-1].point2;
            var nextPos = new Phaser.Point(light.point.x + light.radius * Math.cos(direction * Math.PI / 180), light.point.y + light.radius * Math.sin(direction * Math.PI / 180));
            boundsPoly.push(new Phaser.Plugin.lights.Segment(pos, nextPos));
        }
        if(light.angle >= 360){
            boundsPoly.splice(0, 1)
             direction += light.segAngle;
            boundsPoly.push(new Phaser.Plugin.lights.Segment(boundsPoly[boundsPoly.length-1].point2, new Phaser.Point(light.point.x + light.radius * Math.cos(direction * Math.PI / 180), light.point.y + light.radius * Math.sin(direction * Math.PI / 180))));
        }
        else{
            boundsPoly.push(new Phaser.Plugin.lights.Segment(new Phaser.Point(light.point.x + light.radius * Math.cos(direction * Math.PI / 180), light.point.y + light.radius * Math.sin(direction * Math.PI / 180)), light.point));
        }
        
        //Reduce amount of segments to process.  Could be slower on small areas, but large segment sets should significantly improve processing.
        var minX = Infinity;
        var minY = Infinity;
        var maxX = 0;
        var maxY = 0;
        for(var i = 0; i < boundsPoly.length; i++){
            var p = boundsPoly[i].point1; 
            minX = p.x < minX ? p.x : minX; 
            minY = p.y < minY ? p.y : minY; 
            maxX = p.x > maxX ? p.x : maxX; 
            maxY = p.y > maxY ? p.y : maxY; 
        }
        var boundsTemp = [];
        boundsTemp.push(new Phaser.Plugin.lights.Segment(new Phaser.Point(minX, minY), new Phaser.Point(maxX, minY)));
        boundsTemp.push(new Phaser.Plugin.lights.Segment(new Phaser.Point(maxX, minY), new Phaser.Point(maxX, maxY)));
        boundsTemp.push(new Phaser.Plugin.lights.Segment(new Phaser.Point(maxX, maxY), new Phaser.Point(minX, maxY)));
        boundsTemp.push(new Phaser.Plugin.lights.Segment(new Phaser.Point(minX, maxY), new Phaser.Point(minX, minY)));
       
        segments = this.getSegments(boundsTemp, segments).concat(boundsPoly);
    }
    
    segments = this.breakIntersections(segments); 
    //for debug
    this._points = segments;
    
    var t = new Phaser.Point(light.point.x + light.radius * Math.cos(init_direction * Math.PI / 180), light.point.y + light.radius * Math.sin(init_direction * Math.PI / 180));
    
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
		var a1 = this.angle(segments[i].point1, position);
		var a2 = this.angle(segments[i].point2, position);
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
			vertex = segments[sorted[i][0]].point1;
		}
		else{
			vertex = segments[sorted[i][0]].point2;
		}
		var old_segment = heap[0];
		do {
			if (map[sorted[i][0]] != -1) {
				if (sorted[i][0] == old_segment) {
					extend = true;
					if(sorted[i][1] == 0){
						vertex = segments[sorted[i][0]].point1;
					}
					else{
						vertex = segments[sorted[i][0]].point2;
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

		if (extend) {
			polygon.push(vertex);
            if(heap[0] !== undefined){
			    var cur = this.intersectLines(segments[heap[0]].point1, segments[heap[0]].point2, position, vertex);
                var pcur = new Phaser.Point(cur[0], cur[1]);
            	if (!this.equal(pcur, vertex)) polygon.push(pcur);
            }
		} else if (shorten) {
            if(segments[old_segment] !== undefined){
            var p = this.intersectLines(segments[old_segment].point1, segments[old_segment].point2, position, vertex);
			polygon.push(new Phaser.Point(p[0], p[1]));
            p = this.intersectLines(segments[heap[0]].point1, segments[heap[0]].point2, position, vertex);
			polygon.push(new Phaser.Point(p[0], p[1]));
            }
		} 

	}
	return polygon;    
};

Phaser.Plugin.lights.prototype.inPolygon = function(position, polygon) {
	var val = 0;
	for (var i = 0; i < polygon.length; ++i) {
		val = Math.min(polygon[i].x, val);
		val = Math.min(polygon[i].y, val);
	}
	var edge = new Phaser.Point(val-1, val-1);
	var parity = 0;
	for (var i = 0; i < polygon.length; ++i) {
		var j = i + 1;
		if (j == polygon.length) j = 0;
		if (this.doLineSegmentsIntersect(edge.x, edge.y, position.x, position.y, polygon[i].x, polygon[i].y, polygon[j].x, polygon[j].y)) {
			var intersect = this.intersectLines(edge, position, polygon[i], polygon[j]);
			var pIntersect = new Phaser.Point(intersect[0], intersect[1]);
			if (this.equal(position, pIntersect)) return true;
			if (this.equal(pIntersect, polygon[i])) {
				if (this.angle2(position, edge, polygon[j]) < 180) ++parity;
			} else if (this.equal(pIntersect, polygon[j])) {
				if (this.angle2(position, edge, polygon[i]) < 180) ++parity;
			} else {
				++parity;
			}
		}
	}
	return (parity%2)!=0;
};

Phaser.Plugin.lights.prototype.convertToSegments = function(polygons) {//[[{x:1,y:0},{0,1},{1,1}],[{2,0},{2,2},{0,2}], ...] i = x j = 3
	var segments = [];
	for (var i = 0; i < polygons.length; ++i) {
		for (var j = 0; j < polygons[i].length; ++j) {
			var k = j+1;
			if (k == polygons[i].length) k = 0;
			segments.push([polygons[i][j], polygons[i][k]]);
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
			if (this.doLineSegmentsIntersect(segments[i].point1.x, segments[i].point1.y, segments[i].point2.x, segments[i].point2.y, segments[j].point1.x, segments[j].point1.y, segments[j].point2.x, segments[j].point2.y)) {
				var intersect = this.intersectLines(segments[i].point1, segments[i].point2, segments[j].point1, segments[j].point2);
                if (intersect.length != 2) continue;
				var pIntersect = new Phaser.Point(intersect[0], intersect[1]);				
				if (this.equal(pIntersect, segments[i].point1) || this.equal(pIntersect, segments[i].point2)) continue;
				intersections.push(pIntersect);
			}
		}
		var start = segments[i].point1;
		while (intersections.length > 0) {
			var endIndex = 0;
			var endDis = this.distance(start, intersections[0]);
			for (var j = 1; j < intersections.length; ++j) {
				var dis = this.distance(start, intersections[j]);
				if (dis < endDis) {
					endDis = dis;
					endIndex = j;
				}
			}
			output.push(new Phaser.Plugin.lights.Segment(start, intersections[endIndex]));
			start = intersections[endIndex];
			intersections.splice(endIndex, 1);
		}
		output.push(new Phaser.Plugin.lights.Segment(start, segments[i].point2));
	}
	return output;
};

Phaser.Plugin.lights.prototype.getSegments = function(boundsTemp, segments) {
	var output = [];
    for (var j = 0; j < segments.length; ++j) {
        if (this.doLineSegmentsIntersect(boundsTemp[0].point1.x, boundsTemp[0].point1.y, boundsTemp[0].point2.x, boundsTemp[0].point2.y, segments[j].point1.x, segments[j].point1.y, segments[j].point2.x, segments[j].point2.y) ||
           this.doLineSegmentsIntersect(boundsTemp[1].point1.x, boundsTemp[1].point1.y, boundsTemp[1].point2.x, boundsTemp[1].point2.y, segments[j].point1.x, segments[j].point1.y, segments[j].point2.x, segments[j].point2.y) ||
           this.doLineSegmentsIntersect(boundsTemp[2].point1.x, boundsTemp[2].point1.y, boundsTemp[2].point2.x, boundsTemp[2].point2.y, segments[j].point1.x, segments[j].point1.y, segments[j].point2.x, segments[j].point2.y) || 
           this.doLineSegmentsIntersect(boundsTemp[3].point1.x, boundsTemp[3].point1.y, boundsTemp[3].point2.x, boundsTemp[3].point2.y, segments[j].point1.x, segments[j].point1.y, segments[j].point2.x, segments[j].point2.y) ||
(segments[j].point1.x >= boundsTemp[0].point1.x && segments[j].point1.x < boundsTemp[2].point1.x && segments[j].point1.y >= boundsTemp[0].point1.y && segments[j].point1.y < boundsTemp[2].point1.y)) {
            output.push(new Phaser.Plugin.lights.Segment(segments[j].point1, segments[j].point2));
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
	var parent = this.lightParent(cur);
	if (cur != 0 && this.lessThan(heap[cur], heap[parent], position, segments, destination)) {
		while (cur > 0) {
			var parent = this.lightParent(cur);
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
			var left = this.child(cur);
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
	var intersect = this.intersectLines(segments[index].point1, segments[index].point2, position, destination);
	if (intersect.length == 0) return;
	var cur = heap.length;
	heap.push(index);
	map[index] = cur;
	while (cur > 0) {
		var parent = this.lightParent(cur);
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
	var inter1 = this.intersectLines(segments[index1].point1, segments[index1].point2, position, destination);
	var pIntersect1 = new Phaser.Point(inter1[0], inter1[1]);
	var inter2 = this.intersectLines(segments[index2].point1, segments[index2].point2, position, destination);
	var pIntersect2 = new Phaser.Point(inter2[0], inter2[1]);
	if (!this.equal(pIntersect1, pIntersect2)) {
		var d1 = this.distance(pIntersect1, position);
		var d2 = this.distance(pIntersect2, position);
		return d1 < d2;
	}
    var a1 = null;
    var a2 = null;
	if (this.equal(pIntersect1, segments[index1].point1)){
        a1 = this.angle2(segments[index1].point2, pIntersect1, position);
    }
    else{
        a1 = this.angle2(segments[index1].point1, pIntersect1, position);
    }
	if (this.equal(pIntersect2, segments[index2].point1)){
        a2 = this.angle2(segments[index2].point2, pIntersect2, position);
    }else {
        a2 = this.angle2(segments[index2].point1, pIntersect2, position);
    }
	if (a1 < 180) {
		if (a2 > 180) return true;
		return a2 < a1;
	}
	return a1 < a2;
};

Phaser.Plugin.lights.prototype.lightParent = function(index) {
	return Math.floor((index-1)/2);
};

Phaser.Plugin.lights.prototype.child = function(index) {
	return 2*index+1;
};

Phaser.Plugin.lights.prototype.angle2 = function(a, b, c) {
	var a1 = this.angle(a,b);
	var a2 = this.angle(b,c);
	var a3 = a1 - a2;
	if (a3 < 0) a3 += 360;
	if (a3 > 360) a3 -= 360;
	return a3;
};

//WORK ON?
Phaser.Plugin.lights.prototype.sortPoints = function(position, segments) {
	var points = new Array(segments.length * 2);
	for (var i = 0; i < segments.length; ++i) {
		points[2*i] = [i, 0, this.angle(segments[i].point1, position)];
		points[2*i+1] = [i, 1, this.angle(segments[i].point2, position)];
	}
	points.sort(function(a,b) {return a[2]-b[2];});
	return points;
};

Phaser.Plugin.lights.prototype.angle = function(a, b) {
	return Math.atan2(b.y-a.y, b.x-a.x) * 180 / Math.PI;
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

Phaser.Plugin.lights.prototype.distance = function(a, b) {
	return (a.x-b.x)*(a.x-b.x) + (a.y-b.y)*(a.y-b.y);
};

Phaser.Plugin.lights.prototype.isOnSegment = function(xi, yi, xj, yj, xk, yk) {
  return (xi <= xk || xj <= xk) && (xk <= xi || xk <= xj) &&
         (yi <= yk || yj <= yk) && (yk <= yi || yk <= yj);
};

Phaser.Plugin.lights.prototype.computeDirection = function(xi, yi, xj, yj, xk, yk) {
  a = (xk - xi) * (yj - yi);
  b = (xj - xi) * (yk - yi);
  return a < b ? -1 : a > b ? 1 : 0;
};

Phaser.Plugin.lights.prototype.doLineSegmentsIntersect = function(x1, y1, x2, y2, x3, y3, x4, y4) {
  d1 = this.computeDirection(x3, y3, x4, y4, x1, y1);
  d2 = this.computeDirection(x3, y3, x4, y4, x2, y2);
  d3 = this.computeDirection(x1, y1, x2, y2, x3, y3);
  d4 = this.computeDirection(x1, y1, x2, y2, x4, y4);
  return (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
          ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) ||
         (d1 == 0 && this.isOnSegment(x3, y3, x4, y4, x1, y1)) ||
         (d2 == 0 && this.isOnSegment(x3, y3, x4, y4, x2, y2)) ||
         (d3 == 0 && this.isOnSegment(x1, y1, x2, y2, x3, y3)) ||
         (d4 == 0 && this.isOnSegment(x1, y1, x2, y2, x4, y4));
};

Phaser.Utils.Debug.prototype.lights = function(lights, x, y)
{
    for(var i = 0; i < lights._points.length; i++){
        this.context.strokeStyle = Phaser.Color.getRandomColor();
        this.context.lineWidth = 2;
        this.context.beginPath();
        this.context.moveTo(lights._points[i].point1.x - this.game.camera.x, lights._points[i].point1.y - this.game.camera.y);
        this.context.lineTo(lights._points[i].point2.x - this.game.camera.x, lights._points[i].point2.y - this.game.camera.y);
        this.context.fill();
        this.context.stroke();
        
        this.context.beginPath();
        this.context.arc(lights._points[i].point1.x - this.game.camera.x, lights._points[i].point1.y - this.game.camera.y, 2, 0, Math.PI*2, true);
        this.context.stroke(); 
    }
};