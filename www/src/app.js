(function () {

    //  Create your Phaser game and inject it into the game div.
    //  We did it in a window.onload event, but you can do it anywhere (requireJS load, anonymous function, jQuery dom ready, - whatever floats your boat)
    var game = new Phaser.Game(800, 800, Phaser.AUTO, 'game');

    //  Add the States your game has.
    //  You don't have to do this in the html, it could be done in your Game state too, but for simplicity I'll keep it here.
    game.state.add('Game', BasicGame.Game);

    //  Now start the Game state.
    game.state.start('Game');

})();