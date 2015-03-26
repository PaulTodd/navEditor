$('#game').contextmenu({
  onItem: function(context, e) {
      if($(e.target).text() == "Pointer Mode"){
          option = "select";
      }   
      if($(e.target).text() == "Lock/Unlock Mode"){
          option = "lock";
      }   
      if($(e.target).text() == "Draw Collision"){
          option = "collision";
      }
      if($(e.target).text() == "Add Light"){
          option = "light";
      }  
      if($(e.target).text() == "Delete"){
          option = "delete";
      }   
  }
});

var Notify = (function() {
    "use strict";

    var elem,
        hideHandler,
        that = {};

    that.init = function(options) {
        elem = $(options.selector);
    };

    that.show = function(text) {
        clearTimeout(hideHandler);

        elem.find("span").html(text);
        elem.delay(200).fadeIn().delay(4000).fadeOut();
    };

    return that;
}());

Notify.init({"selector": ".bb-alert"});

//File
$('#saveLocal').click(function(){  BasicGame.Game.prototype.save("saveLocal");  });
$('#loadLocal').click(function(){  BasicGame.Game.prototype.load("loadLocal");  });
//save
$('#saveMesh').click(function(){  BasicGame.Game.prototype.save("saveMesh");  });
$('#saveCollision').click(function(){  BasicGame.Game.prototype.save("saveCollision");  });
$('#saveBoth').click(function(){  BasicGame.Game.prototype.save("saveBoth");  });
$('#saveTrigger').click(function(){  BasicGame.Game.prototype.save("saveTrigger");  });
$('#saveAll').click(function(){  BasicGame.Game.prototype.save("saveAll");  });
//email
$('#mailMesh').click(function(){  BasicGame.Game.prototype.save("mailMesh");  });
$('#mailCollision').click(function(){  BasicGame.Game.prototype.save("mailCollision");  });
$('#mailBoth').click(function(){  BasicGame.Game.prototype.save("mailBoth");  });
$('#mailTrigger').click(function(){  BasicGame.Game.prototype.save("mailTrigger");  });
$('#mailAll').click(function(){  BasicGame.Game.prototype.save("mailAll");  });

//Edit Menu
$('#select').click(function(){  option = "select"; Notify.show("Selection Mode Set!");  });
$('#drawColPoints').click(function(){  option = "collision"; Notify.show("Draw Colission Object Mode Set!");  });
$('#drawTrigPoints').click(function(){  option = "trigger"; Notify.show("Draw Trigger Area Mode Set!");  });
$('#delete').click(function(){if(pointGroup.children.length > 0 || collisionGroup.children.length > 0 || triggerGroup.children.length > 0){ option = "delete"; Notify.show("Warning!!!! DELETE Mode Set!!!!");}else{Notify.show("Nothing to delete")}  });
//trash
$('#trashMesh').click(function(){  BasicGame.Game.prototype.trash("trashMesh");  });
$('#trashCollision').click(function(){  BasicGame.Game.prototype.trash("trashCollision");  });
$('#trashTrigger').click(function(){  BasicGame.Game.prototype.trash("trashTrigger");  });
$('#trashAll').click(function(){  BasicGame.Game.prototype.trash("trashAll");  });
$('#trashLocal').click(function(){  BasicGame.Game.prototype.trash("trashLocal");  });

//View
$('#levelSettings').click(function(){
    bootbox.dialog({
        title: "Level Settings",
        message: function() {
            var content = $("#f_level").clone(true);
            $(content).css('visibility','visible');
            content.find("[name='smooth']").bootstrapSwitch('state', smooth, true).on('switchChange.bootstrapSwitch', function(event, state) {
                smooth = state;
            });
            content.find("input[name='spacing']").attr('value', spacing).TouchSpin().on("change", function() {
                spacing = $(this).val();
                BasicGame.Game.prototype.calculate();
            });
            content.find("[id='tempname']").attr('id', 'l_name').attr('value', fileName); 
            return content;
        },
        buttons: {
            success: {
                label: "Close",
                className: "btn-success",
                callback: function() {
                    if($('#l_name').val() !== "")
                        fileName = $('#l_name').val();
                    Notify.show("File Name: " + fileName);
                }
            }
        }
    });
});    

$('#viewSettings').click(function(){
    bootbox.dialog({
        title: "View Settings",
        message: function(){
            var content = $("#f_view").clone(true);
            $(content).css('visibility','visible');
            content.find("input[name='pWidth']").attr('value', pWidth).TouchSpin().on("change", function() {
                pWidth = $(this).val();
            });
            content.find("input[name='nWidth']").attr('value', nWidth).TouchSpin().on("change", function() {
                nWidth = $(this).val();
            });
            content.find("[name='vNavMesh']").bootstrapSwitch('state', vNavMesh, true).on('switchChange.bootstrapSwitch', function(event, state) {
                vNavMesh = state;
            });
            content.find("[name='vNavMeshCollision']").bootstrapSwitch('state', vNavMeshCollision, true).on('switchChange.bootstrapSwitch', function(event, state) {
                vNavMeshCollision = state;
            });
            content.find("[name='vCollision']").bootstrapSwitch('state', vCollision, true).on('switchChange.bootstrapSwitch', function(event, state) {
                vCollision = state;
            });
            content.find("[name='vTrigger']").bootstrapSwitch('state', vTrigger, true).on('switchChange.bootstrapSwitch', function(event, state) {
                vTrigger = state;
            });
            content.find("[name='vPath']").bootstrapSwitch('state', vPath, true).on('switchChange.bootstrapSwitch', function(event, state) {
                vPath = state;
            });
            content.find("[name='vText']").bootstrapSwitch('state', vText, true).on('switchChange.bootstrapSwitch', function(event, state) {
                vText = state;
            });
            content.find("[name='vSmallestCircle']").bootstrapSwitch('state', vSmallestCircle, true).on('switchChange.bootstrapSwitch', function(event, state) {
                vSmallestCircle = state;
            });
            return content;
        },
        buttons: {
            success: {
                label: "Close",
                className: "btn-success",
                callback: function() {
                    Notify.show("View Settings Changed!");
                }
            }
        }
    });
});

$('#colors').click(function(){
    bootbox.dialog({
        title: "Color Settings",
        message: function(){
            var content = $("#f_color").clone(true);
            $(content).css('visibility','visible');
            content.find("input[name='cNavMesh']").attr('value', cNavMesh).ColorPickerSliders({
                size: 'sm',
                placement: 'bottom',
                swatches: false,
                sliders: false,
                hsvpanel: true,
                onchange: function(container, color) {
                    cNavMesh = color.tiny.toRgbString();
                }
            });
            content.find("input[name='cNavMeshBoarder']").attr('value', cNavMeshBoarder).ColorPickerSliders({
                size: 'sm',
                placement: 'bottom',
                swatches: false,
                sliders: false,
                hsvpanel: true,
                onchange: function(container, color) {
                    cNavMeshBoarder = color.tiny.toRgbString();
                }
            });
            content.find("input[name='cNavMeshCollision']").attr('value', cNavMeshCollision).ColorPickerSliders({
                size: 'sm',
                placement: 'bottom',
                swatches: false,
                sliders: false,
                hsvpanel: true,
                onchange: function(container, color) {
                    cNavMeshCollision = color.tiny.toRgbString();
                }
            }); 
            content.find("input[name='cPointLine']").attr('value', cPointLine).ColorPickerSliders({
                size: 'sm',
                placement: 'bottom',
                swatches: false,
                sliders: false,
                hsvpanel: true,
                onchange: function(container, color) {
                    cPointLine = color.tiny.toRgbString();
                }
            }); 
            content.find("input[name='cCollision']").attr('value', cCollision).ColorPickerSliders({
                size: 'sm',
                placement: 'bottom',
                swatches: false,
                sliders: false,
                hsvpanel: true,
                onchange: function(container, color) {
                    cCollision = color.tiny.toRgbString();
                }
            }); 
            content.find("input[name='cTrigger']").attr('value', cTrigger).ColorPickerSliders({
                size: 'sm',
                placement: 'bottom',
                swatches: false,
                sliders: false,
                hsvpanel: true,
                onchange: function(container, color) {
                    cTrigger = color.tiny.toRgbString();
                }
            }); 
            content.find("input[name='cPath']").attr('value', cPath).ColorPickerSliders({
                size: 'sm',
                placement: 'bottom',
                swatches: false,
                sliders: false,
                hsvpanel: true,
                onchange: function(container, color) {
                    cPath = color.tiny.toRgbString();
                }
            }); 
            content.find("input[name='cText']").attr('value', cText).ColorPickerSliders({
                size: 'sm',
                placement: 'bottom',
                swatches: false,
                sliders: false,
                hsvpanel: true,
                onchange: function(container, color) {
                    cCollision = color.tiny.toRgbString();
                }
            }); 
            content.find("input[name='cSmallestCircle']").attr('value', cSmallestCircle).ColorPickerSliders({
                size: 'sm',
                placement: 'bottom',
                swatches: false,
                sliders: false,
                hsvpanel: true,
                onchange: function(container, color) {
                    cSmallestCircle = color.tiny.toRgbString();
                }
            }); 
            return content;
        },
        buttons: {
            success: {
                label: "Close",
                className: "btn-success",
                callback: function() {
                    Notify.show("Color Settings Changed!");
                }
            }
        }
    });
});

//New Path
$('#refreshPath').click(function(){ BasicGame.Game.prototype.refreshPath(); Notify.show("New Path Created!"); return false; });

//Help
$('#about').click(function(){
    bootbox.dialog({
      title: "About",
      message: '<div class="row">' +
                  '<div class="col-sm-2">Author:</div>' +
                  '<div class="col-sm-10"><b>Paul Todd</b></div>' +
                '</div>' +
                '<div class="row">' +
                  '<div class="col-sm-2">Email:</div>' +
                  '<div class="col-sm-10"><b> MyEmail</b></div>' +
                '</div>' +
                '<div class="row">' +
                  '<div class="col-sm-2">Version:</div>' +
                  '<div class="col-sm-10"><b>1.0</b></div>' +
                '</div>'
    });
});