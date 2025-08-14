import React, { useState, useEffect, useRef } from 'react'
import './App.css'
import GlobalKeyListener from './components/GlobalKeyListener.jsx'


const audio_koro = new Audio('/korobeiniki.ogg');
audio_koro.volume = 0.10;
audio_koro.loop = true;

const audio_clear = new Audio('/clear.ogg');
audio_clear.volume = 0.30;
const audio_drop = new Audio('/drop.ogg');
audio_drop.volume = 0.30;
const audio_move = new Audio('/move.ogg');
audio_move.volume = 0.30;
const audio_rotate = new Audio('/rotate.ogg');
audio_rotate.volume = 0.30;
const audio_landing = new Audio('/landing.ogg');
audio_landing.volume = 0.30;
const audio_game_over = new Audio('/game-over.ogg');
audio_game_over.volume = 0.30;


const pieceMap = [
    [[0,0,0,0],
     [0,1,1,0],
     [0,1,1,0],
     [0,0,0,0]],
    [[0,2,0,0],
     [0,2,0,0],
     [0,2,0,0],
     [0,2,0,0]],
    [[0,3,0],
     [0,3,3],
     [0,3,0]],
    [[0,4,0],
     [0,4,4],
     [0,0,4]],
    [[0,0,5],
     [0,5,5],
     [0,5,0]],
    [[0,0,0,0,0],
     [0,0,0,0,0],
     [0,0,6,6,0],
     [0,0,6,0,0],
     [0,0,6,0,0]],
    [[0,0,7,0,0],
     [0,0,7,0,0],
     [0,0,7,7,0],
     [0,0,0,0,0],
     [0,0,0,0,0]],
];


///////////////////////////
// Piece Generator State //
///////////////////////////

const pieceSequence1 = [0, 1, 2, 3, 4, 5, 6];
const pieceSequence2 = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6];
let chosenPieceSequence = pieceSequence1;

let curPieceSequence = null;
let curPieceSequenceIdx = null;


/////////////////////////
// Current Piece State //
/////////////////////////

let curPieceIndex = null;
let curPieceMap = null;
let curPieceX = null;
let curPieceY = null;

let curPieceX_hardSet = null;
let curPieceY_hardSet = null;

let curPieceIndex_hold = null;
let canHold = null;


////////////////
// Grid State //
////////////////

let gridState = null;
let textBoardHtmlRows = [];

let scoreHtml = null;
let curLevel = null;
let curScore = null;
let gameOver = null;

let widthHold = null;
let heightHold = null;
let ctxHold = null;

let widthNext = null;
let heightNext = null;
let ctxNext = null;

let widthNext2 = null;
let heightNext2 = null;
let ctxNext2 = null;



function hold() {
    if (canHold) {
        canHold = false;
        if (curPieceIndex_hold === null) {
            curPieceIndex_hold = curPieceIndex;
            genRandCurPiece();
            rerender();
        } else {
            const temp = curPieceIndex;
            setCurPiece(curPieceIndex_hold);
            curPieceIndex_hold = temp;
            rerender();
        }
    }
}

function lockCurPieceIntoGridState() {
    embedPieceIntoGridState(gridState, curPieceX, curPieceY, curPieceMap);
    const linesCleared = clearLines(gridState);
    if (linesCleared > 0) {
        audio_clear.play();
    }
    updateScore(linesCleared);
    genRandCurPiece();
    canHold = true;
    rerender();

    if (isCollision(gridState, curPieceX, curPieceY + 1, curPieceMap)) {
        gameOverHandler();
    }
}

function gameOverHandler() {
    gameOver = true;
    audio_game_over.play();
    gameEngineStepCounter_Stop();
    renderGameOver();
}

function stepCounter() {
    if (isCollision(gridState, curPieceX, curPieceY + 1, curPieceMap)) {
        audio_landing.play();
        lockCurPieceIntoGridState();
    } else {
        curPieceY++;
        rerender();
    }
}

function updateScore(linesCleared) {
    switch (linesCleared) {
        case 1:
            curScore = curScore + (40) * (curLevel + 1)
            break;
        case 2:
            curScore = curScore + (100) * (curLevel + 1)
            break;
        case 3:
            curScore = curScore + (300) * (curLevel + 1)
            break;
        case 4:
            curScore = curScore + (1200) * (curLevel + 1)
            break;
        default:
            // Code to execute if no case matches
    }
    renderScore();
}

function renderScore() {
    scoreHtml.innerHTML = curScore;
}

function clearLines(gridState) {
    const rows2Clear = [];

    // find rows to clear
    for (let y = 0; y < 20; y++) {
        let clear = true;
        for (let x = 0; x < 10; x++) {
            if (gridState[y][x] === 0) {
                clear = false;
                break;
            }
        }
        if (clear) {
            rows2Clear.push(y);
        }
    }

    // clear rows and replace
    for (let i = 0; i < rows2Clear.length; i++) {
        gridState.splice(rows2Clear[i], 1);
        gridState.unshift(new Array(10).fill(0));
    }

    return rows2Clear.length;
}

function embedPieceIntoGridState(gridState, curPieceX, curPieceY, curPieceMap) {
    let xSize = curPieceMap.length;
    let ySize = curPieceMap[0].length;

    for (let i = 0; i < xSize; i++) {
        for (let j = 0; j < ySize; j++) {
            if (curPieceMap[i][j] !== 0) {
                let x = curPieceX + i;
                let y = curPieceY + j;

                if (!(x < 0 || x > 9 || y < 0 || y > 19)) {
                    gridState[y][x] = curPieceMap[i][j];
                }
            }
        }
    }
}

let intervalId_gameEngineStepCounter = 0;
function gameEngineStepCounter_Start(stepCounter) {
    if (intervalId_gameEngineStepCounter === 0) {
        intervalId_gameEngineStepCounter = setInterval(stepCounter, 1000);
    }
}
function gameEngineStepCounter_Stop() {
    if (intervalId_gameEngineStepCounter !== 0) {
        clearInterval(intervalId_gameEngineStepCounter);
        intervalId_gameEngineStepCounter = 0;
    }
}

function keydownEC(event) {
    if (gameOver) {
        return;
    }

    if (event.key === "c") {
        hold();
    } else if (event.key === "ArrowLeft") {
        if (!isCollision(gridState, curPieceX - 1, curPieceY, curPieceMap)) {
            curPieceX--;
            audio_move.play();
            rerender();
        }
    } else if (event.key === "ArrowRight") {
        if (!isCollision(gridState, curPieceX + 1, curPieceY, curPieceMap)) {
            curPieceX++;
            audio_move.play();
            rerender();
        }
    } else if (event.key === "ArrowDown") {
        gameEngineStepCounter_Stop();
        if (!isCollision(gridState, curPieceX, curPieceY + 1, curPieceMap)) {
            curPieceY++;
            rerender();
        }
    } else if (event.shiftKey && event.key === "ArrowUp") {
        if (canRotateCounterClockwise(gridState, curPieceX, curPieceY, curPieceMap)) {
            curPieceMap = rotateMatrixCounterClockwise(curPieceMap);
            audio_rotate.play();
            rerender();
        } else if (canRotateCounterClockwise(gridState, curPieceX, curPieceY - 1, curPieceMap)) {
            curPieceY--;
            curPieceMap = rotateMatrixCounterClockwise(curPieceMap);
            audio_rotate.play();
            rerender();
        } else if (canRotateCounterClockwise(gridState, curPieceX, curPieceY + 1, curPieceMap)) {
            curPieceY++;
            curPieceMap = rotateMatrixCounterClockwise(curPieceMap);
            audio_rotate.play();
            rerender();
        } else if (canRotateCounterClockwise(gridState, curPieceX - 1, curPieceY, curPieceMap)) {
            curPieceX--;
            curPieceMap = rotateMatrixCounterClockwise(curPieceMap);
            audio_rotate.play();
            rerender();
        } else if (canRotateCounterClockwise(gridState, curPieceX + 1, curPieceY, curPieceMap)) {
            curPieceX++;
            curPieceMap = rotateMatrixCounterClockwise(curPieceMap);
            audio_rotate.play();
            rerender();
        }
    } else if (event.key === "ArrowUp") {
        if (canRotateClockwise(gridState, curPieceX, curPieceY, curPieceMap)) {
            curPieceMap = rotateMatrixClockwise(curPieceMap);
            audio_rotate.play();
            rerender();
        } else if (canRotateClockwise(gridState, curPieceX, curPieceY - 1, curPieceMap)) {
            curPieceY--;
            curPieceMap = rotateMatrixClockwise(curPieceMap);
            audio_rotate.play();
            rerender();
        } else if (canRotateClockwise(gridState, curPieceX, curPieceY + 1, curPieceMap)) {
            curPieceY++;
            curPieceMap = rotateMatrixClockwise(curPieceMap);
            audio_rotate.play();
            rerender();
        } else if (canRotateClockwise(gridState, curPieceX - 1, curPieceY, curPieceMap)) {
            curPieceX--;
            curPieceMap = rotateMatrixClockwise(curPieceMap);
            audio_rotate.play();
            rerender();
        } else if (canRotateClockwise(gridState, curPieceX + 1, curPieceY, curPieceMap)) {
            curPieceX++;
            curPieceMap = rotateMatrixClockwise(curPieceMap);
            audio_rotate.play();
            rerender();
        }
    } else if (event.key === " " || event.key === "Space") {
        audio_drop.play();
        hardSet();
        lockCurPieceIntoGridState();
    }
}

function keyupEC(event) {
    if (gameOver) {
        return;
    }

    if (event.key === "ArrowDown") {
        gameEngineStepCounter_Start(stepCounter);
    }
}

// Fisher-Yates shuffle
function shuffleArray(array) {
    // Loop backward through the array
    for (let i = array.length - 1; i > 0; i--) {
        // Generate a random index 'j' between 0 and 'i' (inclusive)
        const j = Math.floor(Math.random() * (i + 1));

        // Swap elements at indices 'i' and 'j'
        // This is a concise way to swap using array destructuring
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function initializePieceSequence() {
    curPieceSequence = [...chosenPieceSequence];
    shuffleArray(curPieceSequence);
    curPieceSequenceIdx = 0;
}

function getNextPieceIndex() {
    let t = curPieceSequence[curPieceSequenceIdx];

    curPieceSequenceIdx++;
    if (curPieceSequenceIdx >= curPieceSequence.length - 5) {
        let curPieceSequenceNew = [...chosenPieceSequence];
        shuffleArray(curPieceSequenceNew);
        curPieceSequence.push(...curPieceSequenceNew);
    }

    return t;
}

function calculateCurPieceXY_hardSet(curPieceX, curPieceY, curPieceMap) {
    curPieceX_hardSet = curPieceX;
    curPieceY_hardSet = curPieceY;
    while (!isCollision(gridState, curPieceX_hardSet, curPieceY_hardSet + 1, curPieceMap)) {
        curPieceY_hardSet++;
    }
}

function genRandCurPiece() {
//     nextPieceIndex = Math.floor(Math.random() * 7);
    const nextPieceIndex = getNextPieceIndex();
    setCurPiece(nextPieceIndex);
}

function setCurPiece(nextPieceIndex) {
    curPieceIndex = nextPieceIndex;
    curPieceMap = JSON.parse(JSON.stringify(pieceMap[curPieceIndex]));
    if (curPieceIndex === 5) {
        curPieceX = 1;
        curPieceY = -3;
    } else if (curPieceIndex === 6) {
        curPieceX = 3;
        curPieceY = -3;
    } else {
        curPieceX = 3;
        curPieceY = -2;
    }

    calculateCurPieceXY_hardSet(curPieceX, curPieceY, curPieceMap);
}

function isCollision(gridState, curPieceX, curPieceY, curPieceMap) {
    let xSize = curPieceMap.length;
    let ySize = curPieceMap[0].length;

    for (let i = 0; i < xSize; i++) {
        for (let j = 0; j < ySize; j++) {

            let x = curPieceX + i;
            let y = curPieceY + j;

            if (curPieceMap[i][j] !== 0) {
                if (y > 19 || x < 0 || x > 9) {
                    return true;
                } else {
                    if (y < 0) {
                        // do nothing
                    } else if (gridState[y][x] !== 0) {
                        return true;
                    }
                }
            }
        }
    }
    return false;
}

function transposeMatrix(matrix) {
    const n = matrix.length;
    const transposed = Array.from({ length: n }, () => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            transposed[j][i] = matrix[i][j];
        }
    }
    return transposed;
}

function reverseRows(matrix) {
    for (let i = 0; i < matrix.length; i++) {
        matrix[i].reverse();
    }
    return matrix;
}

function rotateMatrixCounterClockwise(matrix) {
    const transposedMatrix = transposeMatrix(matrix);
    return reverseRows(transposedMatrix);
}

function rotateMatrixClockwise(matrix) {
    const n = matrix.length;

    // Create a new matrix to store the rotated result
    const rotatedMatrix = Array(n).fill(null).map(() => Array(n).fill(null));

    for (let row = 0; row < n; row++) {
        for (let col = 0; col < n; col++) {
            // New position for counter-clockwise rotation: (n - 1 - col, row)
            rotatedMatrix[n - 1 - col][row] = matrix[row][col];
        }
    }

    return rotatedMatrix;
}

function canRotateCounterClockwise(gridState, curPieceX, curPieceY, curPieceMap) {
    let curPieceMapNew = rotateMatrixCounterClockwise(curPieceMap);
    if (curPieceIndex === 0) {
        return false;
    } else {
        return !isCollision(gridState, curPieceX, curPieceY, curPieceMapNew);
    }
}

function canRotateClockwise(gridState, curPieceX, curPieceY, curPieceMap) {
    let curPieceMapNew = rotateMatrixClockwise(curPieceMap);
    if (curPieceIndex === 0) {
        return false;
    } else {
        return !isCollision(gridState, curPieceX, curPieceY, curPieceMapNew);
    }
}

function hardSet() {
    while (!isCollision(gridState, curPieceX, curPieceY + 1, curPieceMap)) {
        curPieceY++;
    }
}

function startGame() {
    curPieceIndex_hold = null;
    canHold = true;
    gridState = Array.from({ length: 20 }, () => new Array(10).fill(0));
    curLevel = 0;
    curScore = 0;
    renderScore();
    gameOver = false;
    gameEngineStepCounter_Start(stepCounter);
    initializePieceSequence();
    genRandCurPiece();
    rerender();
}



//////////////////
// RENDER LOGIC //
//////////////////

function rerender() {
    calculateCurPieceXY_hardSet(curPieceX, curPieceY, curPieceMap);

    const newBoard = generateNewBoard();
    renderGridState(newBoard, gridState);
    renderCurPieceHardSet(newBoard);
    renderCurPiece(newBoard);
    for (let y = 0; y < 20; y++) {
        textBoardHtmlRows[y].innerHTML = newBoard[y].join("");
    }

    renderHoldPiece();
    renderNextPieces();
}


const pieceMapSide = [
    [["⬛🟨🟨⬛"],
     ["⬛🟨🟨⬛"]],
    [["⬛⬛⬛⬛"],
     ["🟦🟦🟦🟦"]],
    [["⬛🟪🟪🟪"],
     ["⬛⬛🟪⬛"]],
    [["⬛🟥🟥⬛"],
     ["⬛⬛🟥🟥"]],
    [["⬛⬛🟩🟩"],
     ["⬛🟩🟩⬛"]],
    [["⬛🟧🟧🟧"],
     ["⬛🟧⬛⬛"]],
    [["⬛🟫🟫🟫"],
     ["⬛⬛⬛🟫"]]
];

function renderHoldPiece() {
    if (curPieceIndex_hold !== null) {
        for (let i = 0; i < 2; i++) {
            holdHtmlRows[i].innerHTML = pieceMapSide[curPieceIndex_hold][i];
        }
    }
}

function renderNextPieces() {
    const nextPieceIndex = curPieceSequence[curPieceSequenceIdx];
    const nextPieceIndex1 = curPieceSequence[curPieceSequenceIdx + 1];
    const nextPieceIndex2 = curPieceSequence[curPieceSequenceIdx + 2];
    const nextPieceIndex3 = curPieceSequence[curPieceSequenceIdx + 3];

    for (let i = 0; i < 2; i++) {
        nextHtmlRows[i].innerHTML = pieceMapSide[nextPieceIndex][i];
        next2HtmlRows[i].innerHTML = pieceMapSide[nextPieceIndex1][i];
        next2HtmlRows[i + 3].innerHTML = pieceMapSide[nextPieceIndex2][i];
        next2HtmlRows[i + 6].innerHTML = pieceMapSide[nextPieceIndex3][i];
    }
}

function generateNewBoard() {
    const newBoard = [];
    for (let i = 0; i < 20; i++) {
        newBoard.push(["⬛","⬛","⬛","⬛","⬛","⬛","⬛","⬛","⬛","⬛"]);
    }
    return newBoard;
}

function mapValue(value) {
    switch (value) {
        case 1:
            return "🟨";
        case 2:
            return "🟦";
        case 3:
            return "🟪";
        case 4:
            return "🟥";
        case 5:
            return "🟩";
        case 6:
            return "🟧";
        case 7:
            return "🟫";
        default:
            return "⬛";
    }
}

function renderGridState(newBoard, gridState) {
    for (let y = 0; y < 20; y++) {
        for (let x = 0; x < 10; x++) {
            if (gridState[y][x] !== 0) {
                newBoard[y][x] = mapValue(gridState[y][x]);
            }
        }
    }
}

function renderCurPieceHardSet(newBoard) {
    let xSize = curPieceMap.length;
    let ySize = curPieceMap[0].length;

    for (let i = 0; i < xSize; i++) {
        let x = i + curPieceX_hardSet;
        if (x < 10 && x >= 0) {
            for (let j = 0; j < ySize; j++) {
                if (curPieceMap[i][j] !== 0) {
                    let x = i + curPieceX_hardSet;
                    let y = j + curPieceY_hardSet;
                    if (y >= 0 && y < 20) {
                        newBoard[y][x] = "⬜";
                    }
                }
            }
        }
    }
}

function renderCurPiece(newBoard) {
    let xSize = curPieceMap.length;
    let ySize = curPieceMap[0].length;

    for (let i = 0; i < xSize; i++) {
        let x = i + curPieceX;
        if (x < 10 && x >= 0) {
            for (let j = 0; j < ySize; j++) {
                if (curPieceMap[i][j] !== 0) {
                    let y = j + curPieceY;
                    if (y >= 0 && y < 20) {
                        newBoard[y][x] = mapValue(curPieceMap[i][j]);
                    }
                }
            }
        }
    }
}



///////////////////////
// ReactJS Component //
///////////////////////

let holdHtmlRows = null;
let nextHtmlRows = null;
let next2HtmlRows = null;

function App() {

    const canvasRefHold = useRef(null);
    const canvasRefNext = useRef(null);
    const canvasRefNext2 = useRef(null);
    const scoreRef = useRef(null);
    const textBoardRef = useRef(null);

    useEffect(() => {
        scoreHtml = scoreRef.current;

        textBoardHtmlRows = textBoardRef.current.children;
        holdHtmlRows = canvasRefHold.current.children;
        nextHtmlRows = canvasRefNext.current.children;
        next2HtmlRows = canvasRefNext2.current.children;

        textBoardRef.current.addEventListener('click', function(event) {
            audio_koro.play();
            startGame();
        });
    }, []);

    return (
        <>
            <div className="flex-container-outer">
                <div className="flex-container-score">
                    <div className="score">SCORE</div>
                    <div className="score-value" ref={scoreRef}>0</div>
                </div>
                <div className="flex-container">
                    <div>
                        <div className="text">HOLD</div>
                        <div className="text-board" ref={canvasRefHold}>
                            <div>⬛⬛⬛⬛</div>
                            <div>⬛⬛⬛⬛</div>
                        </div>
                        <div className="text-instructions">
                            <div>c - hold</div>
                            <div>space - drop</div>
                            <div>↑ - rotate</div>
                            <div>← - left</div>
                            <div>→ - right</div>
                            <div>↓ - down</div>
                            <div className="canvas-border-split"></div>
                            <div className="text-instructions-small">OMOLORD I NEED TO STOP</div>
                            <div><a href="https://www.marcuschiu.com/tinkering/2025-08-11/">How it's Coded</a></div>
                            <div className="versions">VERSIONS</div>
                            <div><a href="https://tetris.marcuschiu.com">Canvas</a></div>
                            <div><a href="https://tetris-text.marcuschiu.com">Text</a></div>
                            <div><a href="https://tetris-ascii.marcuschiu.com">ASCII</a></div>
                        </div>
                    </div>
                    <div>
                        <div className="text-board board" width="404" height="804" ref={textBoardRef}>
                            <div>⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛</div>
                            <div>⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛</div>
                            <div>⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛</div>
                            <div>⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛</div>
                            <div>⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛</div>
                            <div>⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛</div>
                            <div>⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛</div>
                            <div>⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛</div>
                            <div>⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛</div>
                            <div>⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛</div>
                            <div>⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛</div>
                            <div>⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛</div>
                            <div>⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛</div>
                            <div>⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛</div>
                            <div>⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛</div>
                            <div>⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛</div>
                            <div>⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛</div>
                            <div>⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛</div>
                            <div>⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛</div>
                            <div>⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛</div>
                        </div>
                        <div className="text-bottom">CLICK BOARD</div>
                        <div className="text-bottom">2</div>
                        <div className="text-bottom">START & RESTART</div>
                    </div>
                    <div>
                        <div className="text">NEXT</div>
                        <div className="text-board" ref={canvasRefNext}>
                            <div>⬛⬛⬛⬛</div>
                            <div>⬛⬛⬛⬛</div>
                        </div>
                        <div className="text-board next-2" ref={canvasRefNext2}>
                            <div>⬛⬛⬛⬛</div>
                            <div>⬛⬛⬛⬛</div>
                            <div>⬛⬛⬛⬛</div>
                            <div>⬛⬛⬛⬛</div>
                            <div>⬛⬛⬛⬛</div>
                            <div>⬛⬛⬛⬛</div>
                            <div>⬛⬛⬛⬛</div>
                            <div>⬛⬛⬛⬛</div>
                        </div>
                    </div>
                </div>
            </div>
            <GlobalKeyListener keydownEC={keydownEC} keyupEC={keyupEC} />
        </>
    );
}

export default App
