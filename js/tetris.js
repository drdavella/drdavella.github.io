"use strict";
const TETRIS_ROWS = 24;
const TETRIS_COLS = TETRIS_ROWS/2;
const START_STEP_INTERVAL = 40;
const STEP_SCALE_FACTOR = 0.90;
const SCORE_DIVISOR = 750;

const TETRIS_CANVAS_ID = "tetris-canvas"
const NEXTSHP_CANVAS_ID = "next-shape-canvas"


function createSquare(paper, x, y, cellSide, topCorner, color) {

    let square = new paper.Path.Rectangle({
        point: [topCorner.x+1 + (cellSide*x), topCorner.y+1 + (cellSide*y)],
        size: [cellSide-2, cellSide-2],
        radius: 1,
        strokeColor: 'black',
        fillColor: color
    });

    return square;
}


function Stick(paper, cellSide, topCorner, xStart, invert) {

    xStart = Math.max(xStart - 2, 0);
    this.cells = new Array();
    this.squares = new Array();
    for (let i = xStart; i < xStart+4; i++) {
        this.cells.push({x: i, y: 0});
        this.squares.push(
                createSquare(paper, i, 0, cellSide, topCorner, 'cyan'));
    }

    // choose a center point for the rotation
    this.canRotate = true;
    this.axisIdx = 2;
    this.axis = this.cells[this.axisIdx];
}

function Square(paper, cellSide, topCorner, xStart, invert) {

    xStart = xStart - 1;
    this.cells = new Array();
    this.squares = new Array();
    for (let i = xStart; i < xStart+2; i++) {
        for (let j = 0; j < 2; j++) {
            this.cells.push({x: i, y: j});
            this.squares.push(
                    createSquare(paper, i, j, cellSide, topCorner, 'yellow'));
        }
    }

    this.canRotate = false;
}

function TBone(paper, cellSide, topCorner, xStart, invert) {

    xStart = Math.max(xStart - 2, 0);
    this.cells = new Array();
    this.squares = new Array();
    for (let i = xStart; i < xStart+3; i++) {
        this.cells.push({x: i, y: 0});
        this.squares.push(
                createSquare(paper, i, 0, cellSide, topCorner, 'teal'));
    }
    this.cells.push({x: xStart+1, y: 1});
    this.squares.push(
            createSquare(paper, xStart+1, 1, cellSide, topCorner, 'teal'));

    // choose a center point for the rotation
    this.canRotate = true;
    this.axisIdx = 1;
    this.axis = this.cells[this.axisIdx];
}

function Squiggle(paper, cellSide, topCorner, xStart, invert) {

    xStart = xStart - 1;
    let color = invert ? 'lime' : 'navy';

    this.cells = new Array();
    this.squares = new Array();
    let yOffset = 0;
    for (let i = 0; i < 2; i++) {
        yOffset = (invert ? 1 : 0);
        this.cells.push({x: xStart, y: i + yOffset});
        this.squares.push(
                createSquare(
                    paper,
                    xStart,
                    i+yOffset,
                    cellSide,
                    topCorner,
                    color));
        yOffset = (invert ? 0 : 1);
        this.cells.push({x: xStart+1, y: i + yOffset});
        this.squares.push(
                createSquare(
                    paper,
                    xStart+1,
                    i+yOffset,
                    cellSide,
                    topCorner,
                    color));
    }

    this.canRotate = true;
    this.axisIdx = 1;
    this.axis = this.cells[this.axisIdx];
}

function BendyGuy(paper, cellSide, topCorner, xStart, invert) {

    let color = invert ? 'red' : 'purple';
    let bend = xStart + (invert ? -1 : 1);

    this.cells = new Array();
    this.squares = new Array();
    for (let i = 0; i < 3; i++) {
        this.cells.push({x: xStart, y: i});
        this.squares.push(
                createSquare(paper, xStart, i, cellSide, topCorner, color));
    }
    this.cells.push({x: bend, y: 0});
    this.squares.push(createSquare(paper, bend, 0, cellSide, topCorner, color));

    this.canRotate = true;
    this.axisIdx = 0;
    this.axis = this.cells[this.axisIdx];
}


function Tetris(winHeight) {

    /* Set up our canvases */
    let mainPaper = new paper.PaperScope();
    mainPaper.setup(document.getElementById(TETRIS_CANVAS_ID));
    let nextPaper = new paper.PaperScope();
    nextPaper.setup(document.getElementById(NEXTSHP_CANVAS_ID));
    nextPaper.view.setViewSize(100,100);

    /* Keep the main paper canvas active until we need to update the other one */
    mainPaper.activate();

    /* Compute size of the main game's canvas */
    let cellSide = Math.floor(winHeight*0.98 / TETRIS_ROWS);
    let height = cellSide * TETRIS_ROWS;
    let width = cellSide * TETRIS_COLS;
    mainPaper.view.setViewSize(width,height);

    /* Important parameters that we use to determine where shapes get drawn */
    let topCorner = new mainPaper.Point(0,0);
    let bottomCorner = new mainPaper.Point(width,height);
    let border = new mainPaper.Path.Rectangle(topCorner,bottomCorner);
    border.center = mainPaper.view.center;
    border.strokeColor = 'black';

    /* Represents the shape that is currently active on the board */
    let activeShape = null;
    let activeShapeParams = null;
    /* This is the next shape to be drawn (shown in side window) */
    let nextShape = null;
    let nextShapeParams = null;

    /* Associative array to represent all non-active filled squares on the board */
    let tetrisMap = new Array();

    /* A per-row tally of how many cells are filled */
    let filledCellsPerRow = new Array();
    for (let i = 0; i < TETRIS_ROWS; i++) {
        filledCellsPerRow.push(0);
    }

    function getMapIndex(row,col) {
        return ((col * TETRIS_ROWS) + row);
    }

    function isCellOccupied(row,col) {
        let index = getMapIndex(row, col);
        if (index in tetrisMap) {
            if (tetrisMap[index] != null) {
                return true;
            }
        }
        return false;
    }

    function isValidMove(shape, xIncrement, yIncrement) {
        for (let cell of shape.cells) {
            if (xIncrement < 0 && cell.x == 0) {
                return false;
            }
            if (xIncrement > 0 && cell.x == TETRIS_COLS-1) {
                return false;
            }
            if (yIncrement > 0 && cell.y == TETRIS_ROWS-1) {
                return false;
            }
            if (isCellOccupied(cell.x+xIncrement, cell.y+yIncrement)) {
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

            square.position.x =
                        topCorner.x + cellSide*shape.cells[i].x + cellSide/2;
            square.position.y =
                        topCorner.y + cellSide*shape.cells[i].y + cellSide/2;
        }
    }

    function setCellsOccupied(activeShape) {
        for (let i = 0; i < activeShape.cells.length; i++) {
            let cell = activeShape.cells[i];
            let square = activeShape.squares[i];
            tetrisMap[ getMapIndex(cell.x, cell.y) ] = square;
            filledCellsPerRow[ cell.y ] += 1;
        }
    }

    let totalScore = 0;
    let lastScore = 0;
    let scoreElement = document.getElementById('score');
    scoreElement.textContent = totalScore;

    let level = 1;
    let stepInterval = START_STEP_INTERVAL;
    let levelElement = document.getElementById('level');
    levelElement.textContent = level;

    function updateScore(rowsCleared) {
        /* Do nothing if no rows were actually cleared */
        if (rowsCleared == 0) {
            return;
        }

        let thisScore = 10 * TETRIS_ROWS * rowsCleared;
        totalScore += thisScore + Math.floor(lastScore * 0.5);

        /* This is called a tetris */
        if (rowsCleared == 4) {
            totalScore += thisScore + lastScore;
            lastScore = thisScore;
        }
        /* Slightly larger bonus for clearing 3 rows */
        else if (rowsCleared == 2) {
            totalScore += thisScore + Math.floor(lastScore * 0.5);
            lastScore = thisScore;
        }
        /* Small bonus for clearing 2 rows */
        else if (rowsCleared == 2) {
            totalScore += thisScore + Math.floor(lastScore * 0.25);
            lastScore  = thisScore;
        }
        else {
            totalScore += thisScore;
            lastScore = 0;
        }

        scoreElement.textContent = totalScore;
    }

    function updateLevel() {
        /* Let our level grow logarithmically */
        let newLevel = 1 + Math.floor(Math.log(1 + totalScore/SCORE_DIVISOR));
        if (newLevel > level) {
            level = newLevel;
            levelElement.textContent = newLevel;
            /* Decrease the step interval */
            stepInterval = Math.floor(stepInterval * STEP_SCALE_FACTOR);
        }
    }

    function updateRows() {
        let rowsCleared = 0;
        let rowsToMove = new Array();
        for (let i = 0; i < TETRIS_ROWS-1; i++) {
            rowsToMove.push(0);
        }

        // check whether each row is full
        for (let y = 0; y < TETRIS_ROWS; y++) {
            if (filledCellsPerRow[y] == TETRIS_COLS) {
                for (let x = 0; x < TETRIS_COLS; x++) {
                    let index = getMapIndex(x ,y);
                    tetrisMap[index].remove();
                    tetrisMap[index] = null;
                }
                for (let yy = 0; yy < y; yy++) {
                    rowsToMove[yy] += 1;
                }
                filledCellsPerRow[y] = 0;
                rowsCleared += 1;
            }
        }
        for (let y = TETRIS_ROWS-2; y >= 0 ; y--) {
            for (let x = 0; x < TETRIS_COLS; x++) {
                let oldIndex = getMapIndex(x, y);
                let square = tetrisMap[oldIndex];
                if (rowsToMove[y] > 0 && square) {
                    square.position.y += rowsToMove[y] * cellSide;
                    tetrisMap[ getMapIndex(x, y+rowsToMove[y]) ] = square;
                    filledCellsPerRow[y] -= 1;
                    filledCellsPerRow[y+rowsToMove[y]] += 1;
                    tetrisMap[oldIndex] = null;
                }
            }
        }

        updateScore(rowsCleared);
        updateLevel();
    }

    function isGameOver(cellList) {
        for (let cell of cellList) {
            if (cell.y == 0) {
                return true;
            }
        }
        return false;
    }

    let shapes = new Array(Stick, Square, TBone, Squiggle, BendyGuy);
    function getShapeParams() {
        let index = Math.floor( Math.random() * shapes.length );
        let invert = Math.floor( Math.random() * 2 );
        return {index: index, invert: invert};
    }

    function drawShape(paper, shapeParams, xStart) {
        let index = shapeParams.index;
        let invert = shapeParams.invert;
        return new shapes[index](
                            mainPaper,
                            cellSide,
                            topCorner,
                            xStart,
                            (invert == 1));
    }

    let gameOn = true;
    let stepGame = function(event) {
        if (activeShape != null) {
            if (event.count > 0 && event.count % stepInterval == 0) {
                if (isValidMove(activeShape, 0, 1)) {
                    moveShape(activeShape, 0, 1);
                }
                else {
                    setCellsOccupied(activeShape);
                    if (isGameOver(activeShape.cells)) {
                        alert("GAME OVER!");
                        gameOn = false;
                    }
                    updateRows();
                    activeShape = null;
                }
            }
        }
        else {
            /* This should only happen the first time around */
            if (nextShape == null) {
                nextShapeParams = getShapeParams();
            }
            else {
                for (let square of nextShape.squares) {
                    square.remove();
                }
            }

            activeShapeParams = nextShapeParams;
            nextShapeParams = getShapeParams();

            nextPaper.activate();
            nextShape = drawShape(nextPaper, nextShapeParams, 1);

            let xStart = Math.floor(TETRIS_COLS/2);
            mainPaper.activate();
            activeShape = drawShape(mainPaper, activeShapeParams, xStart);
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

    let tool = new mainPaper.Tool();
    mainPaper.view.onFrame = function(event) {
        if (gameOn) {
            stepGame(event);
        }
    }

    tool.onKeyDown = function(event) {
        handleKey(event);
    }
}


window.onload = function(event) {
    let game = new Tetris(window.innerHeight);
}
