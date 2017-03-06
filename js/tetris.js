/*
 *
 */
"use strict";
const TETRIS_ROWS = 10;
const TETRIS_COLS = TETRIS_ROWS/2;
const START_STEP_INTERVAL = 50;


function Tetris(paper,winHeight) {

    var cellSide = Math.floor(winHeight*0.98 / TETRIS_ROWS);
    var height = cellSide * TETRIS_ROWS;
    var width = cellSide * TETRIS_COLS;
    paper.view.setViewSize(width,height);

    var topCorner = new paper.Point(0,0);
    var bottomCorner = new paper.Point(width,height);
    var border = new paper.Path.Rectangle(topCorner,bottomCorner);
    border.center = paper.view.center;
    border.strokeColor = 'black';

    var rightBoundary = width - cellSide/2 - 1;
    var bottomBoundary = height - cellSide/2 - 1;

    var activeShape = null;
    var tetrisMap = new Array();
    var colMaxes = new Array();
    // it's a little confusing that the top of the column is 0
    for (var i = 0; i < TETRIS_COLS; i++) {
        colMaxes.push(TETRIS_ROWS - 1);
    }

    function getMapIndex(row,col) {
        return (row * TETRIS_COLS) + col;
    }

    function isCellOccupied(row,col) {
        return (getMapIndex(row, col) in tetrisMap);
    }

    var gameOn = true;
    var stepInterval = START_STEP_INTERVAL;
    var stepGame = function(event) {
        if (activeShape != null) {
            if (event.count > 0 && event.count % stepInterval == 0) {
                if (activeShape.row < TETRIS_ROWS-1
                        && !isCellOccupied(activeShape.row+1, activeShape.col)) {
                    activeShape.position.y += cellSide;
                    activeShape.row += 1;
                }
                else {

                    tetrisMap[ getMapIndex(activeShape.row,activeShape.col) ] = true;
                    if (activeShape.row == 0) {
                        alert("GAME OVER!");
                        gameOn = false;
                    }
                    if (colMaxes[activeShape.col] > activeShape.row) {
                        colMaxes[activeShape.col] = activeShape.row;
                    }
                    activeShape = null;
                }
            }
        }
        else {
            var square = new paper.Path.Rectangle({
                point: [topCorner.x+1, topCorner.y+1],
                size: [cellSide-2, cellSide-2],
                radius: 1,
                strokeColor: 'black',
                fillColor: 'red'
            });

            activeShape = square;
            // I think I hate javascript
            activeShape.row = 0;
            activeShape.col = 0;
        }
    }

    var handleKey = function(event) {
        if (activeShape) {
            if (event.key == 'right'
                    && activeShape.col < TETRIS_COLS-1
                    && !isCellOccupied(activeShape.row, activeShape.col+1)) {
                activeShape.position.x += cellSide;
                activeShape.col += 1;
                return false;
            }
            if (event.key == 'left'
                    && activeShape.col > 0
                    && !isCellOccupied(activeShape.row, activeShape.col-1)) {
                activeShape.position.x -= cellSide;
                activeShape.col -= 1;
                return false;
            }
            if (event.key == 'space') {
                return false;
            }
            if (event.key == 'down'
                    && activeShape.row < TETRIS_ROWS-1
                    && !isCellOccupied(activeShape.row+1, activeShape.col)) {
                activeShape.position.y += cellSide;
                activeShape.row += 1;
                return false;
            }
        }
    }

    var tool = new paper.Tool();
    paper.view.onFrame = function(event) {
        if (gameOn) {
            stepGame(event);
        }
    }

    tool.onKeyDown = function(event) {
        handleKey(event);
    }
}


window.onload = function(event) {
    var canvas = document.getElementById('tetris');
    paper.setup(canvas);

    var game = new Tetris(paper,window.innerHeight);
}
