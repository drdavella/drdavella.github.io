"use strict";
const TETRIS_ROWS = 20;
const TETRIS_COLS = TETRIS_ROWS/2;
const START_STEP_INTERVAL = 50;
const NUM_SHAPES = 2;


function Stick(paper, cellSide, topCorner) {

    this.cells = new Array();
    this.squares = new Array();
    for (let i = 0; i < 4; i++) {
        this.cells.push({x: i, y: 0});
        this.squares.push(
            paper.Path.Rectangle({
                point: [topCorner.x+1 + (cellSide*i), topCorner.y+1],
                size: [cellSide-2, cellSide-2],
                radius: 1,
                strokeColor: 'black',
                fillColor: 'red'
            })
        );
    }

    // Each shape needs to define its own rotate function
    this.rotate = function() {

    }
}

function Square(paper, cellSide, topCorner) {

    this.cells = new Array();
    this.squares = new Array();
    for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 2; j++) {
            this.cells.push({x: i, y: j});
            this.squares.push(
                paper.Path.Rectangle({
                    point: [topCorner.x+1 + (cellSide*i), topCorner.y+1 + (cellSide*j)],
                    size: [cellSide-2, cellSide-2],
                    radius: 1,
                    strokeColor: 'black',
                    fillColor: 'blue'
                })
            );
        }
    }

    // Each shape needs to define its own rotate function
    this.rotate = function() {
        // do nothing!
        return;
    }
}


function Tetris(paper,winHeight) {

    let cellSide = Math.floor(winHeight*0.98 / TETRIS_ROWS);
    let height = cellSide * TETRIS_ROWS;
    let width = cellSide * TETRIS_COLS;
    paper.view.setViewSize(width,height);

    let topCorner = new paper.Point(0,0);
    let bottomCorner = new paper.Point(width,height);
    let border = new paper.Path.Rectangle(topCorner,bottomCorner);
    border.center = paper.view.center;
    border.strokeColor = 'black';

    let rightBoundary = width - cellSide/2 - 1;
    let bottomBoundary = height - cellSide/2 - 1;

    let activeShape = null;
    let tetrisMap = new Array();
    let rowCounts = new Array();
    for (let i = 0; i < TETRIS_ROWS; i++) {
        rowCounts.push(0);
    }

    function getMapIndex(row,col) {
        return (col * TETRIS_COLS) + row;
    }

    function isCellOccupied(row,col) {
        return (getMapIndex(row, col) in tetrisMap);
    }

    function isValidMove(shape, xIncrement, yIncrement) {
        for (let cell of shape.cells) {
            if (isCellOccupied(cell.x+xIncrement, cell.y+yIncrement)) {
                return false;
            }
            if (xIncrement < 0 && cell.x == 0) {
                return false;
            }
            if (xIncrement > 0 && cell.x == TETRIS_COLS-1) {
                return false;
            }
            if (cell.y == TETRIS_ROWS-1) {
                return false;
            }
        }
        return true;
    }

    function moveShape(shape, xDirection, yDirection, cellSide) {
        for (let square of shape.squares) {
            square.position.x += (xDirection * cellSide);
            square.position.y += (yDirection * cellSide);
        }
        for (let cell of shape.cells) {
            cell.x += xDirection;
            cell.y += yDirection;
        }
    }

    function setCellsOccupied(cellList) {
        for (let cell of cellList) {
            tetrisMap[ getMapIndex(cell.x, cell.y) ] = true;
            rowCounts[ cell.y ] += 1;
        }
    }

    function isGameOver(cellList) {
        for (let cell of cellList) {
            if (cell.y == 0) {
                return true;
            }
        }
        return false;
    }

    let shapes = new Array( Stick, Square );
    function shapeFactory() {
        let index = Math.floor( Math.random() * NUM_SHAPES );
        return new shapes[index](paper, cellSide, topCorner);
    }

    let gameOn = true;
    let stepInterval = START_STEP_INTERVAL;
    let stepGame = function(event) {
        if (activeShape != null) {
            if (event.count > 0 && event.count % stepInterval == 0) {
                if (isValidMove(activeShape, 0, 1)) {
                    moveShape(activeShape, 0, 1, cellSide);
                }
                else {
                    setCellsOccupied(activeShape.cells);
                    if (isGameOver(activeShape.cells)) {
                        alert("GAME OVER!");
                        gameOn = false;
                    }
                    activeShape = null;
                }
            }
        }
        else {
            activeShape = shapeFactory();
        }
    }

    let handleKey = function(event) {
        if (activeShape) {
            if (event.key == 'right' && isValidMove(activeShape, 1, 0)) {
                moveShape(activeShape, 1, 0, cellSide);
                return false;
            }
            if (event.key == 'left' && isValidMove(activeShape, -1, 0)) {
                moveShape(activeShape, -1, 0, cellSide);
                return false;
            }
            if (event.key == 'space') {
                return false;
            }
            if (event.key == 'down' && isValidMove(activeShape, 0, 1)) {
                moveShape(activeShape, 0, 1, cellSide);
                return false;
            }
        }
    }

    let tool = new paper.Tool();
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
    let canvas = document.getElementById('tetris');
    paper.setup(canvas);

    let game = new Tetris(paper,window.innerHeight);
}
