"use strict";
const TETRIS_ROWS = 24;
const TETRIS_COLS = TETRIS_ROWS/2;
const START_STEP_INTERVAL = 50;


function createSquare(x, y, cellSide, topCorner, color) {

    let square = new paper.Path.Rectangle({
        point: [topCorner.x+1 + (cellSide*x), topCorner.y+1 + (cellSide*y)],
        size: [cellSide-2, cellSide-2],
        radius: 1,
        strokeColor: 'black',
        fillColor: color
    });

    return square;
}


function Stick(paper, cellSide, topCorner, invert) {

    this.cells = new Array();
    this.squares = new Array();
    for (let i = 0; i < 4; i++) {
        this.cells.push({x: i, y: 0});
        this.squares.push(createSquare(i, 0, cellSide, topCorner, 'red'));
    }

    // choose a center point for the rotation
    this.canRotate = true;
    this.axisIdx = 2;
    this.axis = this.cells[this.axisIdx];
}

function Square(paper, cellSide, topCorner, invert) {

    this.cells = new Array();
    this.squares = new Array();
    for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 2; j++) {
            this.cells.push({x: i, y: j});
            this.squares.push(createSquare(i, j, cellSide, topCorner, 'orangered'));
        }
    }

    this.canRotate = false;
}

function TBone(paper, cellSide, topCorner, invert) {

    this.cells = new Array();
    this.squares = new Array();
    for (let i = 0; i < 3; i++) {
        this.cells.push({x: i, y: 0});
        this.squares.push(createSquare(i, 0, cellSide, topCorner, 'teal'));
    }
    this.cells.push({x: 1, y: 1});
    this.squares.push(createSquare(1, 1, cellSide, topCorner, 'teal'));

    // choose a center point for the rotation
    this.canRotate = true;
    this.axisIdx = 1;
    this.axis = this.cells[this.axisIdx];
}

function Squiggle(paper, cellSide, topCorner, invert) {

    let color = invert ? 'lime' : 'navy';

    this.cells = new Array();
    this.squares = new Array();
    let yOffset = 0;
    for (let i = 0; i < 2; i++) {
        yOffset = (invert ? 1 : 0);
        this.cells.push({x: 0, y: i + yOffset});
        this.squares.push(createSquare(0, i + yOffset, cellSide, topCorner, color));
        yOffset = (invert ? 0 : 1);
        this.cells.push({x: 1, y: i + yOffset});
        this.squares.push(createSquare(1, i + yOffset, cellSide, topCorner, color));
    }

    this.canRotate = true;
    this.axisIdx = 1;
    this.axis = this.cells[this.axisIdx];
}

function BendyGuy(paper, cellSide, topCorner, invert) {

    let color = invert ? 'darkgreen' : 'purple';
    let bend = invert ? -1 : 1;

    this.cells = new Array();
    this.squares = new Array();
    for (let i = 0; i < 3; i++) {
        this.cells.push({x: 0, y: i});
        this.squares.push(createSquare(0, i, cellSide, topCorner, color));
    }
    this.cells.push({x: bend, y: 0});
    this.squares.push(createSquare(bend, 0, cellSide, topCorner, color));

    this.canRotate = true;
    this.axisIdx = 0;
    this.axis = this.cells[this.axisIdx];
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
            if (cell.y == TETRIS_ROWS-1 && yIncrement != 0) {
                return false;
            }
        }
        return true;
    }

    function moveShape(shape, xDirection, yDirection) {
        for (let square of shape.squares) {
            square.position.x += (xDirection * cellSide);
            square.position.y += (yDirection * cellSide);
        }
        for (let cell of shape.cells) {
            cell.x += xDirection;
            cell.y += yDirection;
        }
    }

    function getRotatedCells(shape) {
        let xAdjust = 0;
        let yAdjust = 0;
        let newCells = new Array();
        for (let i = 0; i < shape.cells.length; i++) {
            // dont move our axis
            if (i == shape.axisIdx) {
                continue;
            }

            let cell = shape.cells[i];
            let square = shape.squares[i];

            let xDiff = cell.x - shape.axis.x;
            let yDiff = cell.y - shape.axis.y;

            // Apply 90 degree rotation matrix
            let x = shape.axis.x + -1*yDiff;
            let y = shape.axis.y + xDiff;

            // make sure that our shape stays within bounds
            if (x < 0 && (0 - x) >  xAdjust) {
                xAdjust = 0 - x;
            }
            if (y < 0 && (0 - y) > yAdjust) {
                yAdjust = 0 - y;
            }
            if (x >= TETRIS_COLS-1 && (TETRIS_COLS-1-x) < xAdjust) {
                xAdjust = TETRIS_COLS - 1 - x;
            }
            if (y >= TETRIS_ROWS-1 && (TETRIS_ROWS-1-y) < yAdjust) {
                yAdjust = TETRIS_ROWS - 1 - y;
            }

            newCells.push({x: x, y: y});
        }

        return {newCells: newCells, xAdjust: xAdjust, yAdjust: yAdjust};
    }

    function rotateShape(shape) {
        if (!shape.canRotate) {
            return;
        }

        let rotated = getRotatedCells(shape);
        let newCells = rotated.newCells;
        let xAdjust = rotated.xAdjust;
        let yAdjust = rotated.yAdjust;

        // make sure this move is valid
        for (let cell of rotated.newCells) {
            if (isCellOccupied(cell.x+xAdjust, cell.y+yAdjust)) {
                return;
            }
        }

        let j = 0;
        for (let i = 0; i < shape.cells.length; i++) {
            let square = shape.squares[i];

            // we still need to account for adjustments to the axis, even
            // thought it doesn't rotate
            if (i == shape.axisIdx) {
                shape.cells[i].x += xAdjust;
                shape.cells[i].y += yAdjust;
            }
            else {
                shape.cells[i].x = newCells[j].x + xAdjust;
                shape.cells[i].y = newCells[j].y + yAdjust;
                j++;
            }

            square.position.x = topCorner.x + cellSide*shape.cells[i].x + cellSide/2;
            square.position.y = topCorner.y + cellSide*shape.cells[i].y + cellSide/2;
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

    let shapes = new Array( Stick, Square, TBone, Squiggle, BendyGuy);
    function shapeFactory() {
        let index = Math.floor( Math.random() * shapes.length );
        let invert = Math.floor( Math.random() * 2 );
        return new shapes[index](paper, cellSide, topCorner, (invert == 1));
    }

    let gameOn = true;
    let stepInterval = START_STEP_INTERVAL;
    let stepGame = function(event) {
        if (activeShape != null) {
            if (event.count > 0 && event.count % stepInterval == 0) {
                if (isValidMove(activeShape, 0, 1)) {
                    moveShape(activeShape, 0, 1);
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
                moveShape(activeShape, 1, 0);
                return false;
            }
            if (event.key == 'left' && isValidMove(activeShape, -1, 0)) {
                moveShape(activeShape, -1, 0);
                return false;
            }
            if (event.key == 'space') {
                rotateShape(activeShape);
                return false;
            }
            if (event.key == 'down' && isValidMove(activeShape, 0, 1)) {
                moveShape(activeShape, 0, 1);
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
