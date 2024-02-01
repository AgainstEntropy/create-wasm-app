import {
    greet,
    Universe,
    InitMode,
    Cell,
} from "wasm-game-of-life";
import { memory } from "wasm-game-of-life/wasm_game_of_life_bg";

greet();

const CELL_SIZE = 10; // px
const GRID_COLOR = "#CCCCCC";
const DEAD_COLOR = "#FFFFFF";
const ALIVE_COLOR = "#000000";

let universe = Universe.new(InitMode.Random);
const width = universe.width();
const height = universe.height();

const canvas = document.getElementById("game-of-life-canvas");
canvas.height = (CELL_SIZE + 1) * height + 1;
canvas.width = (CELL_SIZE + 1) * width + 1;

const ctx = canvas.getContext('2d');

let animationId = null;
let animationFPS = 5;
var now, then, elapsed, fpsInterval;

const renderLoop = () => {
    // debugger;

    fpsInterval = 1000 / animationFPS;
    now = Date.now();
    elapsed = now - then;
    if (elapsed > fpsInterval) {
        then = now - (elapsed % fpsInterval);

        universe.tick();
        drawGrid();
        drawCells();
    }

    animationId = requestAnimationFrame(renderLoop);
};

function startLoop() {
    then = Date.now();
    play();
    drawGrid();
    drawCells();
}

// render cells

const drawGrid = () => {
    ctx.beginPath();
    ctx.strokeStyle = GRID_COLOR;

    // Vertical lines.
    for (let i = 0; i <= width; i++) {
        ctx.moveTo(i * (CELL_SIZE + 1) + 1, 0);
        ctx.lineTo(i * (CELL_SIZE + 1) + 1, (CELL_SIZE + 1) * height + 1);
    }

    // Horizontal lines.
    for (let j = 0; j <= height; j++) {
        ctx.moveTo(0, j * (CELL_SIZE + 1) + 1);
        ctx.lineTo((CELL_SIZE + 1) * width + 1, j * (CELL_SIZE + 1) + 1);
    }

    ctx.stroke();
};

const getIndex = (row, column) => {
    return row * width + column;
};

const drawCells = () => {
    const cellsPtr = universe.cells();
    const cells = new Uint8Array(memory.buffer, cellsPtr, width * height);

    ctx.beginPath();

    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            const idx = getIndex(row, col);

            ctx.fillStyle = cells[idx] === Cell.Dead
                ? DEAD_COLOR
                : ALIVE_COLOR;

            ctx.fillRect(
                col * (CELL_SIZE + 1) + 1,
                row * (CELL_SIZE + 1) + 1,
                CELL_SIZE,
                CELL_SIZE
            );
        }
    }

    ctx.stroke();
};

// interactivity

// play and pause control

const playPauseButton = document.getElementById("play-pause");

const play = () => {
    playPauseButton.textContent = "⏸";
    renderLoop();
};

const pause = () => {
    playPauseButton.textContent = "▶";
    cancelAnimationFrame(animationId);
    animationId = null;
};

const isPaused = () => {
    return animationId === null;
};

playPauseButton.addEventListener("click", event => {
    if (isPaused()) {
        play();
    } else {
        pause();
    }
});

// speed control

const speedControl = document.getElementById("speed");

speedControl.addEventListener("input", event => {
    animationFPS = speedControl.value;
});

// click to toggle cell

const getClickedCell = event => {
    const boundingRect = canvas.getBoundingClientRect();
    
    const scaleX = canvas.width / boundingRect.width;
    const scaleY = canvas.height / boundingRect.height;
    
    const canvasLeft = (event.clientX - boundingRect.left) * scaleX;
    const canvasTop = (event.clientY - boundingRect.top) * scaleY;
    
    const row = Math.min(Math.floor(canvasTop / (CELL_SIZE + 1)), height - 1);
    const col = Math.min(Math.floor(canvasLeft / (CELL_SIZE + 1)), width - 1);
    
    return { row, col };
}

canvas.addEventListener("click", event => {
    let clickedCell = getClickedCell(event);
    
    if (event.ctrlKey) {
        universe.insert_glider(clickedCell.row, clickedCell.col);
    } else if (event.shiftKey) {
        universe.insert_pulsar(clickedCell.row, clickedCell.col);
    } else {
        universe.toggle_cell(clickedCell.row, clickedCell.col);
    }
    
    drawGrid();
    drawCells();
});

// reset button

const resetButton = document.getElementById("reset");
resetButton.textContent = "🔁";

resetButton.addEventListener("click", event => {
    universe.set_width(universe.width());

    drawGrid();
    drawCells();
});

const randomButton = document.getElementById("random");
randomButton.textContent = "🎲";

randomButton.addEventListener("click", event => {
    universe = Universe.new(InitMode.Random, 0.3);

    drawGrid();
    drawCells();
});


startLoop();