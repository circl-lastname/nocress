let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");

let cellSize;

let cross = new Image();
cross.src = "x.svg";

let naught = new Image();
naught.src = "o.svg";

let audioMove = new Audio("move-self.wav");
let audioIllegal = new Audio("illegal.wav");

let initialBoard = [
  [1, 0, 0, 0, 1, 0, 0, 0, 1],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [1, 0, 0, 0, 0, 0, 0, 0, 1],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [2, 0, 0, 0, 0, 0, 0, 0, 2],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [2, 0, 0, 0, 2, 0, 0, 0, 2],
];

let board = [ [], [], [], [], [], [], [], [], [] ];

let selectedCellX;
let selectedCellY;

let currentPlayer;
let winningPlayer;

function resetGame() {
  selectedCellX = -1;
  selectedCellY = -1;
  currentPlayer = 1;
  winningPlayer = 0;
  
  for (let y = 0; y < 9; y++) {
    for (let x = 0; x < 9; x++) {
      board[y][x] = initialBoard[y][x];
    }
  }
  
  console.log("New game:");
}

function playerOpposite() {
  if (currentPlayer == 1) {
    return 2;
  } else {
    return 1;
  }
}

function playerString() {
  if (currentPlayer == 1) {
    return "X";
  } else {
    return "O";
  }
}

function coordsValid(x, y) {
  return x >= 0 && x < 9 && y >= 0 && y < 9;
}

function checkWinning() {
  for (let y = 0; y < 9; y++) {
    for (let x = 0; x < 9; x++) {
      if (coordsValid(x+3, y)) {
        if (board[y][x] != 0 && board[y][x+1] == board[y][x] && board[y][x+2] == board[y][x] && board[y][x+3] == board[y][x]) {
          winningPlayer = board[y][x];
          return;
        }
      }
      
      if (coordsValid(x, y+3)) {
        if (board[y][x] != 0 && board[y+1][x] == board[y][x] && board[y+2][x] == board[y][x] && board[y+3][x] == board[y][x]) {
          winningPlayer = board[y][x];
          return;
        }
      }
      
      if (coordsValid(x+3, y+3)) {
        if (board[y][x] != 0 && board[y+1][x+1] == board[y][x] && board[y+2][x+2] == board[y][x] && board[y+3][x+3] == board[y][x]) {
          winningPlayer = board[y][x];
          return;
        }
      }
      
      if (coordsValid(x-3, y+3)) {
        if (board[y][x] != 0 && board[y+1][x-1] == board[y][x] && board[y+2][x-2] == board[y][x] && board[y+3][x-3] == board[y][x]) {
          winningPlayer = board[y][x];
          return;
        }
      }
    }
  }
}

function handleResize() {
  let preferredSize;
  
  if (window.innerWidth >= window.innerHeight) {
    preferredSize = window.innerHeight - 16;
  } else if (window.innerWidth < window.innerHeight) {
    preferredSize = window.innerWidth - 16;
  }
  
  canvas.width = preferredSize;
  canvas.height = preferredSize;
  
  cellSize = canvas.width / 9;
  
  redraw();
}

function handleMouseDown(e) {
  if (e.buttons != 1) {
    return;
  }
  
  if (winningPlayer) {
    resetGame();
    redraw();
    return;
  }
  
  let x = Math.floor(e.offsetX / cellSize);
  let y = Math.floor(e.offsetY / cellSize);
  
  if (board[y][x] == currentPlayer) {
    selectedCellX = x;
    selectedCellY = y;
    redraw();
  } else if (selectedCellX == -1 || board[y][x] == playerOpposite()) {
    audioIllegal.play();
  } else {
    audioMove.play();
    
    console.log(`${playerString()}: ${selectedCellX},${selectedCellY} -> ${x},${y}`);
    
    board[selectedCellY][selectedCellX] = 0;
    board[y][x] = currentPlayer;
    selectedCellX = -1;
    selectedCellY = -1;
    
    currentPlayer = playerOpposite();
    
    checkWinning();
    
    redraw();
  }
}

function redraw() {
  let colorSwap = false;
  
  for (let y = 0; y < 9; y++) {
    for (let x = 0; x < 9; x++) {
      if (colorSwap) {
        if (selectedCellX == x && selectedCellY == y) {
          ctx.fillStyle = "#bbcc43";
        } else {
          ctx.fillStyle = "#779954";
        }
      } else {
        if (selectedCellX == x && selectedCellY == y) {
          ctx.fillStyle = "#f4f67e";
        } else {
          ctx.fillStyle = "#e9edcc";
        }
      }
      colorSwap = !colorSwap;
      
      ctx.fillRect(x*cellSize, y*cellSize, cellSize, cellSize);
    }
  }
  
  for (let y = 0; y < 9; y++) {
    for (let x = 0; x < 9; x++) {
      if (board[y][x] == 1) {
        ctx.drawImage(cross, x*cellSize+cellSize*0.05, y*cellSize+cellSize*0.05, cellSize*0.9, cellSize*0.9);
      } else if (board[y][x] == 2) {
        ctx.drawImage(naught, x*cellSize+cellSize*0.05, y*cellSize+cellSize*0.05, cellSize*0.9, cellSize*0.9);
      }
    }
  }
  
  if (winningPlayer) {
    ctx.font = `${cellSize*0.5}px sans-serif`;
    let width = ctx.measureText("Winner:").width;
    
    ctx.fillStyle = "#262522";
    ctx.fillRect(0, 0, width+cellSize*0.5, cellSize*0.5);
    
    ctx.fillStyle = "#ffffff";
    ctx.textBaseline = "top";
    ctx.fillText("Winner:", 0, 0);
    
    if (winningPlayer == 1) {
      ctx.drawImage(cross, width+cellSize*0.05, cellSize*0.05, cellSize*0.4, cellSize*0.4);
    } else {
      ctx.drawImage(naught, width+cellSize*0.05, cellSize*0.05, cellSize*0.4, cellSize*0.4);
    }
  }
}

resetGame();
handleResize();
redraw();

window.addEventListener("resize", handleResize);

canvas.addEventListener("mousedown", handleMouseDown);

cross.addEventListener("load", redraw);
naught.addEventListener("load", redraw);
