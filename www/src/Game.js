// create BasicGame Class
BasicGame = {

};

// create Game function in BasicGame
BasicGame.Game = function (game) {
    myGame = game;
    background = null;
    dragging = null;
    draggingLight = null;
    pathDragging = false;
    navMesh = [];   
    
    if(store.size() > 0){
        spacing = store("spacing");
        smooth = store("smooth");

        //Visibility
        pWidth = store("pWidth");
        nWidth = store("nWidth");
        vNavMesh = store("vNavMesh");
        vNavMeshCollision = store("vNavMeshCollision");
        vCollision = store("vCollision");
        vTrigger = store("vTrigger");
        vPath = store("vPath");
        vText = store("vText");
        vSmallestCircle = store("vSmallestCircle");

        //Colors
        cNavMesh = store("cNavMesh");
        cNavMeshBoarder = store("cNavMeshBoarder");
        cNavMeshCollision = store("cNavMeshCollision");
        cCollision = store("cCollision");
        cPointLine = store("cPointLine");
        cTrigger = store("cTrigger");
        cPath = store("cPath");
        cText = store("cText");
        cSmallestCircle = store("cSmallestCircle"); 
    }
};

// set Game function prototype
BasicGame.Game.prototype = {

    init: function () {
        this.input.maxPointers = 1;
        this.stage.disableVisibilityChange = true;
        if (this.game.device.desktop)
        {
            this.scale.scaleMode = Phaser.ScaleManager.RESIZE;
            this.scale.pageAlignHorizontally = true;
            this.scale.pageAlignVertically = true;
        }
        else
        {
            this.scale.scaleMode = Phaser.ScaleManager.RESIZE;
            this.scale.pageAlignHorizontally = true;
            this.scale.pageAlignVertically = true;
            this.scale.forceOrientation(true, false);
            this.scale.setResizeCallback(this.gameResized, this);
            this.scale.enterIncorrectOrientation.add(this.enterIncorrectOrientation, this);
            this.scale.leaveIncorrectOrientation.add(this.leaveIncorrectOrientation, this);
        }
    },

    preload: function () {
        this.load.spritesheet('markers', 'asset/markers.png', 10, 10);
    },

    create: function () {
        this.game.add.plugin(Phaser.Plugin.Debug);
        navPath = this.game.add.plugin(Phaser.Plugin.navPath);
        navPath.setNavMesh([]);

        lights = this.game.add.plugin(Phaser.Plugin.lights);
        
        cursors = this.input.keyboard.createCursorKeys();
        
        //setup path markers
        start = this.add.sprite(0, 0, 'markers', 0);
        start.anchor.setTo(0.5,0.5);
        start.inputEnabled = true;
        start.input.enableDrag();
        start.events.onDragStart.add(function(){pathDragging = true;}, start);
        start.events.onDragStop.add(function(){pathDragging = false;}, start);
        end = this.add.sprite(0, 0, 'markers', 1);
        end.anchor.setTo(0.5,0.5);
        end.inputEnabled = true;
        end.input.enableDrag();       
        end.events.onDragStart.add(function(){pathDragging = true;}, end);
        end.events.onDragStop.add(function(){pathDragging = false;}, end);

        start.visible = false;
        end.visible = false; 
        start.z = 99999;
        end.z = 99998;
        
        collisionGroup = this.add.group();        
        triggerGroup = this.add.group();         
        pointGroup = this.add.group(); 
        lightGroup = this.add.group(); 

        //setup keyboard commands
        k_createCollision = this.input.keyboard.addKey(Phaser.Keyboard.C);
        k_createCollision.onUp.add(this.createPolygon, this);
        k_refresh = this.input.keyboard.addKey(Phaser.Keyboard.V);
        k_refresh.onUp.add(this.calculate, this);
        k_rotateLeft = this.input.keyboard.addKey(Phaser.Keyboard.Q);
        k_rotateRight = this.input.keyboard.addKey(Phaser.Keyboard.W);
        k_sizeUp = this.input.keyboard.addKey(Phaser.Keyboard.A);
        k_sizeDown = this.input.keyboard.addKey(Phaser.Keyboard.S);
        k_angleUp = this.input.keyboard.addKey(Phaser.Keyboard.Z);
        k_angleDown = this.input.keyboard.addKey(Phaser.Keyboard.X);
        k_segmentsAdd = this.input.keyboard.addKey(Phaser.Keyboard.E);
        k_segmentsRemove = this.input.keyboard.addKey(Phaser.Keyboard.R);
    },
    
    changeLight: function(type){
        //*********************************************
        //This errors sometimes need to figure out why. Can't find null sprite.
        //*********************************************
        var spriteLight = this.game.input.mousePointer.targetObject.sprite;
        if(spriteLight !== null && this.game.input.mousePointer.targetObject.sprite.name == "light") {
            var light = spriteLight.light;
            switch(type) {
                 case "rotateLeft":
                        light.direction -= rotateAmount;
                    break;
                 case "rotateRight":
                        light.direction += rotateAmount;
                    break;
                 case "sizeUp":
                    light.radius += sizeAmount;
                    break;
                 case "sizeDown":
                    if(light.radius > 0)
                        light.radius -= sizeAmount;
                    break;
                 case "angleUp":
                    if(light.angle < 360)
                        light.angle += angleAmount;
                        light.segAngle = light.angle / light.arcSegments;
                    break;
                 case "angleDown":
                    if(light.angle > 0)
                        light.angle -= angleAmount;
                        light.segAngle = light.angle / light.arcSegments;
                    break;
                 case "segmentsAdd":
                    if(light.arcSegments < 100){
                        light.arcSegments += segAmount;
                        light.segAngle = light.angle / light.arcSegments;
                    }
                    break;
                 case "segmentsRemove":
                    if(light.arcSegments > 3){
                        light.arcSegments -= segAmount;
                        light.segAngle = light.angle / light.arcSegments;
                    }
                    break;
             } 

            this.updateLight(spriteLight);
        }
    },
        
    updateLight: function(spriteLight) {
        var points = lights.compute(spriteLight.light)
        var Shape = new Phaser.Polygon(); 
        Shape.setTo(points);
        var graphics = this.game.add.graphics();
        graphics.boundsPadding = 0;
        graphics.beginFill("0x"+tinycolor(cLight).toHex(), tinycolor(cLight).getAlpha());
        graphics.drawPolygon(Shape);
        graphics.endFill();
        var x = 9999999;
        var y = 9999999;
        for(var i = 0; i < points.length; i++){
            x = Math.min(x, points[i].x);
            y = Math.min(y, points[i].y);
        }

        spriteLight.loadTexture(graphics.generateTexture());
        spriteLight.world = graphics.world;
        spriteLight.x = x;
        spriteLight.y = y;
        spriteLight.hitArea = points;

        graphics.destroy();
    },
    
    update: function() {        
        if (k_rotateLeft.isDown)
        {
            this.changeLight("rotateLeft");
        }
        else if (k_rotateRight.isDown)
        {
            this.changeLight("rotateRight");
        }
        else if (k_sizeUp.isDown)
        {
            this.changeLight("sizeUp");
        }
        else if (k_sizeDown.isDown)
        {
            this.changeLight("sizeDown");
        }
        else if (k_angleUp.isDown)
        {
            this.changeLight("angleUp");
        }
        else if (k_angleDown.isDown)
        {
            this.changeLight("angleDown");
        }
        else if (k_segmentsAdd.isDown)
        {
            this.changeLight("segmentsAdd");
        }
        else if (k_segmentsRemove.isDown)
        {
            this.changeLight("segmentsRemove");
        }
        
        if(dragging !== null){
            for (var j = 0; j < dragging.hitArea.length; j++) {
                dragging.hitArea[j].x = dragging.origin[j].x+dragging.x;
                dragging.hitArea[j].y = dragging.origin[j].y+dragging.y;
            }
            this.calculate();
            this.updateLightCollision();
            for(var k = 0; k < lightGroup.children.length; k++){
                this.updateLight(lightGroup.children[k]);   
            }
        }
        
        if(draggingLight !== null){
            draggingLight.light.point = new Phaser.Point(this.game.input.activePointer.worldX, this.game.input.activePointer.worldY);
            this.updateLight(draggingLight);
        }
        
        if(pathDragging){
            navPath.find(start.world, end.world, 0, 0, smooth, true);   
        }
        
        this.move_camera_by_pointer(this.input.activePointer);
        
        if (cursors.up.isDown)
        {
            this.camera.y -= 4;
        }
        else if (cursors.down.isDown)
        {
            this.camera.y += 4;
        }

        if (cursors.left.isDown)
        {
            this.camera.x -= 4;
        }
        else if (cursors.right.isDown)
        {
            this.camera.x += 4;
        }
    
    },
    
    click: function() {
        if(background !== null && this.game.input.activePointer.button == 0){
            if((option == "collision" || option == "trigger")){
                var point = this.game.add.sprite(this.game.input.activePointer.worldX, this.game.input.activePointer.worldY, 'markers', 4);
                point.name = "point";
                point.anchor.x = 0.5;
                point.anchor.y = 0.5;
                point.inputEnabled = true;
                point.input.enableDrag();
                point.events.onInputUp.add(function(){if(option == "delete"){ this.input.draggable = false; this.destroy();}}, point);
                pointGroup.add(point);
            }
            else if(option == "light"){
                                                                                        //position, angle, direction, radius, arcSegments, color1, color2, type, gradient
                var myLight = lights.addLight(new Phaser.Point(this.game.input.activePointer.worldX, this.game.input.activePointer.worldY), 250, 0, 100, 8);
                var points = lights.compute(myLight)
                var Shape = new Phaser.Polygon(); 
                Shape.setTo(points);                
                var graphics = this.game.add.graphics();
                graphics.boundsPadding = 0;
                graphics.beginFill("0x"+tinycolor(cLight).toHex(), tinycolor(cLight).getAlpha());
                graphics.drawPolygon(Shape);
                graphics.endFill();
                //find smallest x and y
                var x = 9999999;
                var y = 9999999;
                for(var i = 0; i < points.length; i++){
                    x = Math.min(x, points[i].x);
                    y = Math.min(y, points[i].y);
                }
                var sprite = this.game.add.sprite(x, y, graphics.generateTexture());
                sprite.name = "light";
                sprite.light = myLight;
                sprite.world = graphics.world;
                sprite.hitArea = points;
                sprite.inputEnabled = true;
                sprite.input.enableDrag();
                sprite.events.onDragStart.add(function(){draggingLight = this;}, sprite);
                sprite.events.onDragStop.add(function(){draggingLight = null;}, sprite);
                sprite.events.onInputUp.add(function(){if(option == "delete"){ this.input.draggable = false; lights.remove(this.light); this.destroy();}else if(option == "lock"){this.input.draggable = !this.input.draggable;}}, sprite);
                lightGroup.add(sprite); 
                graphics.destroy();        
            }
        }
    },
    
    createPolygon: function(){
        if(pointGroup.children.length > 2){
            var points = [];
            for(var i = 0; i < pointGroup.children.length; i++){
                points.push(new Phaser.Point(pointGroup.children[i].world.x, pointGroup.children[i].world.y));
            }
            var Shape = new Phaser.Polygon(); 
            Shape.setTo(points);
            var graphics = this.add.graphics();
            graphics.boundsPadding = 0;
            graphics.beginFill("0x"+tinycolor(cCollision).toHex(), tinycolor(cCollision).getAlpha());
            graphics.drawPolygon(Shape);
            graphics.endFill();
            //find smallest x and y
            var x = 9999999;
            var y = 9999999;
            for(var i = 0; i < points.length; i++){
                x = Math.min(x, points[i].x);
                y = Math.min(y, points[i].y);
            }
            var sprite = this.add.sprite(x, y, graphics.generateTexture());
            sprite.name = "collision";
            sprite.world = graphics.world;
            sprite.hitArea = points;
            sprite.origin = []
            for(var i = 0; i < points.length; i++){
                sprite.origin.push(new Phaser.Point(points[i].x-x, points[i].y-y));
            }
            sprite.inputEnabled = true;
            sprite.input.enableDrag();
            sprite.events.onDragStart.add(function(){dragging = this;}, sprite);
            sprite.events.onDragStop.add(function(){dragging = null;}, sprite);
            sprite.events.onInputUp.add(function(){if(option == "delete"){ this.input.draggable = false; this.destroy();}else if(option == "lock"){this.input.draggable = !this.input.draggable;}}, sprite);
            if(option == "collision"){
                sprite.events.onDestroy.add(function(){BasicGame.Game.prototype.calculate(); navPath.find(start.world, end.world, 0, 0, smooth, true);}, this);
                collisionGroup.add(sprite);     
                this.calculate();
            }
            else{
                triggerGroup.add(sprite);
            }
            graphics.destroy();
            pointGroup.removeAll();
            this.updateLightCollision();
        }
    },
    
    updateLightCollision: function(){
        var col = [];
        var coltemp = [];
        coltemp.push(new Phaser.Point(background.x-1, background.y-1));
        coltemp.push(new Phaser.Point(background.width+1, background.y-1));
        coltemp.push(new Phaser.Point(background.width+1, background.height+1));
        coltemp.push(new Phaser.Point(background.x-1, background.height+1));
        col.push(coltemp);
        for(var i = 0; i < collisionGroup.children.length; i++){
            col.push(collisionGroup.children[i].hitArea);                    
        }
        lights.createSegments(JSON.parse(JSON.stringify(col)), true);   
    },
    
    calculate: function () {
        if(collisionGroup.children.length > 0){
            //Calculate path/navMesh
            var subj_polygons = [];  // Map
            var cpr = new ClipperLib.Clipper();
            var co = new ClipperLib.ClipperOffset(3, 0); // constructor
            var offsetted_paths = new ClipperLib.Paths(); // empty solution		
            var clip_polygon = new ClipperLib.Path(); //Created Polys
            var scale = 100;

            subj_polygons[0] = new ClipperLib.IntPoint(background.x + spacing, background.y + spacing);
            subj_polygons[1] = new ClipperLib.IntPoint(background.width - spacing, background.y + spacing);
            subj_polygons[2] = new ClipperLib.IntPoint(background.width - spacing, background.height - spacing);
            subj_polygons[3] = new ClipperLib.IntPoint(background.x + spacing, background.height - spacing);

            ClipperLib.JS.ScaleUpPath(subj_polygons, scale);

            cpr.AddPath(subj_polygons, ClipperLib.PolyType.ptSubject, true);
            for(var i = 0; i < collisionGroup.children.length; i++){
                var tmpPoints = collisionGroup.children[i].hitArea;
                clip_polygon.length = 0;
                for (var j = 0; j < tmpPoints.length; j++) {
                    clip_polygon.push(new ClipperLib.IntPoint(tmpPoints[j].x, tmpPoints[j].y));
                }
                if(ClipperLib.Clipper.Orientation(clip_polygon)){
                    tmpPoints = [];
                    clip_polygon.reverse();
                    for (var k = 0; k < clip_polygon.length; k++) {                        
                        tmpPoints.push(new Phaser.Point(clip_polygon[k].X, clip_polygon[k].Y));
                    }
                    collisionGroup.children[i].hitArea = tmpPoints;
                }
                ClipperLib.JS.ScaleUpPath(clip_polygon, scale);
                
                co.AddPath(clip_polygon, ClipperLib.JoinType.jtMiter, ClipperLib.EndType.etClosedPolygon);
            }

            co.Execute(offsetted_paths, spacing*scale);
            cpr.AddPaths(offsetted_paths, ClipperLib.PolyType.ptClip, true);

            var subject_fillType = ClipperLib.PolyFillType.pftNonZero;
            var clip_fillType = ClipperLib.PolyFillType.pftNonZero;
            var clipType = ClipperLib.ClipType.ctDifference;

            var solution = [];
            var succeeded = cpr.Execute(clipType, solution, subject_fillType, clip_fillType);
            ClipperLib.JS.ScaleDownPaths(solution, scale);
            if(succeeded === true && solution.length > 0){
                var contour = [];					
                var tmpPoints = solution[0];
                for (i = 0; i < tmpPoints.length; i++) {
                    contour.push(new poly2tri.Point(tmpPoints[i].X, tmpPoints[i].Y));
                }
                var swctx = new poly2tri.SweepContext(contour);

                for(i = 1; i < solution.length; i++) {			
                    var hole = [];				
                    var tmpPoints = solution[i];
                    for (j = 0; j < tmpPoints.length; j++) {
                        hole.push(new poly2tri.Point(tmpPoints[j].X, tmpPoints[j].Y));
                    }
                    swctx.addHole(hole);
                    hole = [];
                }
                swctx.triangulate();

                var triangles = swctx.getTriangles();
                var points = [];
                navMesh = [];
                
                triangles.forEach(function(t) {
                    points = [];
                    t.getPoints().forEach(function(p) {
                        points.push({x: p.x, y: p.y}); // new point 
                    });
                    navMesh.push(points);
                });	

                navPath.setNavMesh(navMesh);
                
                if(start.visible){
                    navPath.find(start.world, end.world, 0, 0, smooth, true);
                }
            }
        }
    },

    move_camera_by_pointer: function (o_pointer) {
        if(o_pointer.button == 0){
            if (!o_pointer.timeDown && o_pointer.timeDown > 300) {
                return;
            }
            if (o_pointer.isDown && o_pointer.targetObject !== null && o_pointer.targetObject.sprite.key !== null && o_pointer.targetObject.sprite.key == "background") {
                if (this.o_mcamera) {
                    this.game.camera.x += this.o_mcamera.x - o_pointer.position.x;
                    this.game.camera.y += this.o_mcamera.y - o_pointer.position.y;
                }
                this.o_mcamera = o_pointer.position.clone();
            }
            if (o_pointer.isUp) {
                this.o_mcamera = null;
            }
        }
    },

    gameResized: function (width, height) {

    },
    
    render: function() {
        this.game.debug.start();
        if(pointGroup.children.length > 1){
            for(var i = 0; i < pointGroup.children.length; i++){
                this.game.debug.geom(new Phaser.Line(pointGroup.children[i].world.x, pointGroup.children[i].world.y, pointGroup.children[(i+1)%pointGroup.children.length].world.x, pointGroup.children[(i+1)%pointGroup.children.length].world.y), cPointLine);
            }
        }
        else if(pointGroup.children.length < 2){
            this.game.debug.reset();
        }
                if(vSmallestCircle){
        for(var i = 0; i < collisionGroup.children.length; i++){
                var circle;
                circle = makeCircle(collisionGroup.children[i].hitArea);
                this.game.debug.geom(new Phaser.Circle(circle.x, circle.y, circle.r*2), cSmallestCircle);
            }
        }
        this.game.debug.stop();
this.game.debug.lights(lights, 0 ,0);
        this.game.debug.navPath(navPath, 20, 20, nWidth, pWidth, vPath, true, vNavMesh, vCollision, vText, cText, cPath, cNavMeshBoarder, cNavMesh, cNavMeshCollision);
        //navPath, x, y, lineWidth, pathWidth, showPath, showPoints, showNavMesh, showCollisionObjects, showText, textColor, pathColor, lineColor, navColor, navColColor

    },
    
    trash: function(type){
        bootbox.confirm("Are you sure?", function(result) {
            if(result){
                switch(type) {
                    case "trashMesh":
                        break;
                    case "trashCollision":
                        break;
                    case "trashTrigger":
                        break;
                    case "trashAll":
                        pointGroup.removeAll();
                        collisionGroup.removeAll();
                        triggerGroup.removeAll();
                        navPath.setNavMesh([]); 
                        start.visible = false;
                        end.visible = false;
                        break;
                    case "trashLocal":
                        store.clearAll();
                        break;
                    default:
                        return;
                }                 
            }
        });
    },
    
    save: function(type){
        var message = "";
        bootbox.prompt((type.substring(0, 4) == "mail" ? "Email Address" : "File Name?"), function(result) {                
          if (result === null) {                                             
            Notify.show("Save Cancelled");                              
          } else {
            fileName = result;
            if(result == ""){
                Notify.show("Save Cancelled - No " + (type.substring(0, 4) == "mail" ? "Email Address" : "File Name") + "!");
            }
            else{
                var navMeshFile = null;
                var triggerFile = null;
                var collisionFile = null;

                if(type == "saveMesh" || type == "saveBoth" || type == "saveAll" || type == "mailMesh" || type == "mailBoth" || type == "mailAll" || type == "saveLocal"){
                    if(navMesh.length > 0){//[[{x:0, y:0}, ...], ...]		
                        navMeshFile = JSON.stringify(navMesh);
                    }
                }
                if(type == "saveTrigger" || type == "saveAll" || type == "mailTrigger" || type == "mailAll" || type == "saveLocal"){
                    if(triggerGroup.children.length > 0){//[{c:{x:0, y:0}, r:0, p: [{x:0, y:0}, ...]}, ...]	
                        var points = "";
                        triggerFile = "[";
                        for(var i = 0; i < triggerGroup.children.length; i++){
                            var tmpPoints = triggerGroup.children[i].hitArea;
                            points = '"p":' + JSON.stringify(tmpPoints);

                            var circle;
                            circle = makeCircle(tmpPoints);
                            triggerFile = triggerFile + '{"c":{"x":'+ Math.round(circle.x * 100) / 100 + ', "y":'  + Math.round(circle.y * 100) / 100 + '}, "d":' + Math.round((circle.r*2) * 100) / 100 + ", " + points + "}, ";
                        }
                        triggerFile = triggerFile.substring(0, triggerFile.length - 2) + "]";
                    }
                }
                if(type == "saveCollision" || type == "saveBoth" || type == "saveAll" || type == "mailColision" || type == "mailBoth" || type == "mailAll" || type == "saveLocal"){
                    if(collisionGroup.children.length > 0){//[{c:{x:0, y:0}, r:0, p: [{x:0, y:0}, ...]}, ...]
                        var points = "";
                        collisionFile = "[";
                        for(var i = 0; i < collisionGroup.children.length; i++){
                            var tmpPoints = collisionGroup.children[i].hitArea;
                            points = '"p":' + JSON.stringify(tmpPoints);

                            var circle;
                            circle = makeCircle(tmpPoints);
                            collisionFile = collisionFile + '{"c":{"x":'+ Math.round(circle.x * 100) / 100 + ', "y":'  + Math.round(circle.y * 100) / 100 + '}, "d":' + Math.round((circle.r*2) * 100) / 100 + ", " + points + "}, ";
                        }
                        collisionFile = collisionFile.substring(0, collisionFile.length - 2) + "]";
                    }	
                }
                if(type == "saveLocal"){
                    spacing = store("spacing", spacing, true);
                    smooth = store("smooth", smooth, true);

                    //Visibility
                    pWidth = store("pWidth", parseInt(pWidth), true);
                    nWidth = store("nWidth", parseInt(nWidth), true);
                    vNavMesh = store("vNavMesh", vNavMesh, true);
                    vNavMeshCollision = store("vNavMeshCollision", vNavMeshCollision, true);
                    vCollision = store("vCollision", vCollision, true);
                    vTrigger = store("vTrigger", vTrigger, true);
                    vPath = store("vPath", vPath, true);
                    vText = store("vText", vText, true);
                    vSmallestCircle = store("vSmallestCircle", vSmallestCircle, true);

                    //Colors
                    cNavMesh = store("cNavMesh", cNavMesh, true);
                    cNavMeshBoarder = store("cNavMeshBoarder", cNavMeshBoarder, true);
                    cNavMeshCollision = store("cNavMeshCollision", cNavMeshCollision, true);
                    cCollision = store("cCollision", cCollision, true);
                    cPointLine = store("cPointLine", cPointLine, true);
                    cTrigger = store("cTrigger", cTrigger, true);
                    cPath = store("cPath", cPath, true);
                    cText = store("cText", cText, true);
                    cSmallestCircle = store("cSmallestCircle", cSmallestCircle, true);     
                }
                if(type.substring(0, 4) == "mail"){
                    var subject = 'Nav Mesh Points';
                    var body = "";
                    if(navMeshFile !== null){
                       body = ("NAVMESH " + navMeshFile + " ");
                    }
                    if(triggerFile !== null){
                        body += ("TRIGGERS " + triggerFile + " ");
                    }
                    if(collisionFile !== null){
                        body += ("COLLISION " + collisionFile);   
                    }
                    message = "<a href='mailto:" + fileName +
                            "?subject=" + subject +
                            "&body=" + body +
                            "'>Click to email Nav Mesh</a>";
                    bootbox.dialog({
                      title: "Send Info",
                      message: message
                    });

                }
                else if(type !== "sveLocal"){
                    if(navMeshFile !== null){
                        saveAs(new Blob([navMeshFile], {type: "text/plain;charset=utf-8"}), fileName + "-navMesh.txt");
                    }
                    if(triggerFile !== null){
                        saveAs(new Blob([triggerFile], {type: "text/plain;charset=utf-8"}), fileName + "-triggers.txt");
                    }
                    if(collisionGroup !== null){
                        saveAs(new Blob([collisionGroup], {type: "text/plain;charset=utf-8"}), fileName + "-collision.txt");
                    }
                }
                Notify.show("Files Saved!");
            }                            
          }   
        });
    },
    
    load: function(type){
        //TODO:
        //Maybe put a dialog with a dropdown that shows all keys in localStorage. 
        //Also exit if no keys in localStorage
        bootbox.prompt("File Name?", function(result) {                
          if (result === null) {                                             
            Notify.show("Load Cancelled");                              
          } else {
            fileName = result;
            if(result == ""){
                Notify.show("Load Cancelled - No file name!");
            }
            else{
                switch(type) {
                    case "loadLocal":
                        spacing = store("spacing");
                        smooth = store("smooth");

                        //Visibility
                        pWidth = store("pWidth");
                        nWidth = store("nWidth");
                        vNavMesh = store("vNavMesh");
                        vNavMeshCollision = store("vNavMeshCollision");
                        vCollision = store("vCollision");
                        vTrigger = store("vTrigger");
                        vPath = store("vPath");
                        vText = store("vText");
                        vSmallestCircle = store("vSmallestCircle");

                        //Colors
                        cNavMesh = store("cNavMesh");
                        cNavMeshBoarder = store("cNavMeshBoarder");
                        cNavMeshCollision = store("cNavMeshCollision");
                        cCollision = store("cCollision");
                        cPointLine = store("cPointLine");
                        cTrigger = store("cTrigger");
                        cPath = store("cPath");
                        cText = store("cText");
                        cSmallestCircle = store("cSmallestCircle"); 
                        break;
                    default:
                        return;
                } 
                Notify.show("File (" + result + ") Loaded!");
            }                            
          }   
        });        
    },
    
    refreshPath: function(){
        this.calculate();
        if(collisionGroup.children.length > 0){
            start.visible = true;
            end.visible = true;
        }
        else{
            start.visible = false;
            end.visible = false;
        }
        if(start.visible){
            //this.calculate();
            start.x = start.game.rnd.integerInRange(0, start.game.world.width);
            start.y = start.game.rnd.integerInRange(0, start.game.world.height); 
            end.x = end.game.rnd.integerInRange(0, end.game.world.width); 
            end.y = end.game.rnd.integerInRange(0, end.game.world.height); 
            navPath.find(start.world, end.world, 0, 0, smooth, true);
        }        
        //TODO: check not in collision object
        //recreate path    
    }
};

function readImage() {
	if ( this.files && this.files[0] ) {
		var FR= new FileReader();
		FR.onload = function(e) {
            myGame.loader = new Phaser.Loader(myGame);
            myGame.loader.image('background', e.target.result, true);
            myGame.loader.onLoadComplete.addOnce(onLoaded);
            myGame.loader.start();
		};       
		FR.readAsDataURL( this.files[0] );
	}
}

function onLoaded(){
    if(background !== null)
        background.destroy();
    background = myGame.add.sprite(0, 0, 'background');
    background.name = "background";
    myGame.world.setBounds(0, 0, background.width, background.height);
    background.z = 0;
    myGame.world.sort();
    background.inputEnabled = true;
    background.events.onInputUp.add(BasicGame.Game.prototype.click, background);
    BasicGame.Game.prototype.updateLightCollision();
}

document.getElementById("fileUpload").addEventListener("change", readImage, false);
document.getElementById("game").addEventListener('contextmenu', function (event) {
	event.preventDefault();
});