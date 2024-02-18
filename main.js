let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");

let server;
let serverHeartbeat;

let onlineButton = document.getElementById("onlineButton");
let usernameButton = document.getElementById("usernameButton");
let leaveButton = document.getElementById("leaveButton");
let onlineStatus = document.getElementById("onlineStatus");
let errorStatus = document.getElementById("error");

let cellSize;

let cross = new Image();
cross.src = "x.svg";

let naught = new Image();
naught.src = "o.svg";

let audioStart = new Audio("game-start.wav");
let audioEnd = new Audio("game-end.wav");
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

let waitingMode = false;

let board = [ [], [], [], [], [], [], [], [], [] ];

let selectedCellX;
let selectedCellY;

let currentPlayer;
let winningPlayer;
let onlinePlayer;

function resetGame() {
  selectedCellX = -1;
  selectedCellY = -1;
  
  currentPlayer = 1;
  winningPlayer = 0;
  onlinePlayer = 0;
  
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

function makeMove(fromX, fromY, x, y) {
  audioMove.play();
  
  console.log(`${playerString()}: ${fromX},${fromY} -> ${x},${y}`);
  
  board[fromY][fromX] = 0;
  board[y][x] = currentPlayer;
  
  checkWinning();
  
  currentPlayer = playerOpposite();
}

function findOpponent() {
  waitingMode = true;
  
  onlineStatus.innerText = "Waiting for opponent";
  
  server.send(JSON.stringify({
    action: "findOpponent"
  }));
}

function sendMove(fromX, fromY, x, y) {
  server.send(JSON.stringify({
    action: "move",
    fromX: fromX,
    fromY: fromY,
    x: x,
    y: y,
  }));
}

function handleResize() {
  let size1 = window.innerHeight - 16 - 32;
  let size2 = window.innerWidth - 16;
  
  let preferredSize;
  
  if (size1 < size2) {
    preferredSize = size1;
  } else {
    preferredSize = size2;
  }
  
  canvas.width = preferredSize;
  canvas.height = preferredSize;
  
  cellSize = preferredSize / 9;
  
  redraw();
}

function handleMouseDown(e) {
  if (e.buttons != 1) {
    return;
  }
  
  if (winningPlayer) {
    if (onlinePlayer) {
      findOpponent();
    }
    
    resetGame();
    redraw();
    
    return;
  }
  
  if (currentPlayer == onlinePlayer) {
    audioIllegal.play();
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
    makeMove(selectedCellX, selectedCellY, x, y);
    
    if (onlinePlayer) {
      sendMove(selectedCellX, selectedCellY, x, y);
    }
    
    selectedCellX = -1;
    selectedCellY = -1;
    
    redraw();
  }
}

function handleOnlineButton() {
  if (!server) {
    onlineStatus.innerText = "Connecting";
    onlineButton.innerText = "Stop playing online";
    errorStatus.innerText = "";
    
    server = new WebSocket("wss://172-105-82-118.ip.linodeusercontent.com:6257");
    
    server.addEventListener("open", () => {
      if (localStorage.getItem("username")) {
        server.send(JSON.stringify({
          action: "setUsername",
          username: localStorage.getItem("username")
        }));
      }
      
      serverHeartbeat = setInterval(() => {
        server.send(JSON.stringify({
          action: "keepAlive"
        }));
      }, 5*60*1000);
      
      findOpponent();
      redraw();
    });
    
    server.addEventListener("error", () => {
      errorStatus.innerText = "(couldn't connect, try disabling AdBlock)";
    });
    
    server.addEventListener("close", () => {
      onlineStatus.innerText = "Not connected";
      onlineButton.innerText = "Play online";
      
      if (!waitingMode) {
        resetGame();
      } else {
        waitingMode = false;
      }
      
      redraw();
      
      clearInterval(serverHeartbeat);
      server = undefined;
    });
    
    server.addEventListener("message", handleServer);
  } else {
    server.close();
  }
}

function handleUsernameButton() {
  let newUsername = prompt("Enter new userame");
  
  if (newUsername) {
    localStorage.setItem("username", newUsername);
    usernameButton.innerText = `Change username (${newUsername})`;
    
    if (server) {
      server.send(JSON.stringify({
        action: "setUsername",
        username: newUsername
      }));
    }
  } else {
    localStorage.removeItem("username");
    usernameButton.innerText = "Set username";
    
    if (server) {
      server.send(JSON.stringify({
        action: "setUsername",
        username: "Anonymous"
      }));
    }
  }
}

function handleLeaveButton() {
  if (server && !waitingMode) {
    findOpponent();
    resetGame();
    
    redraw();
  }
}

function handleServer(e) {
  let message = JSON.parse(e.data);
  
  if (message.action == "foundOpponent") {
    onlineStatus.innerText = `Playing against ${message.username}`;
    audioStart.play();
    
    waitingMode = false;
    resetGame();
    onlinePlayer = message.opponent;
    
    redraw();
  } else if (message.action == "gameEnd") {
    if (!winningPlayer) {
      audioEnd.play();
      
      findOpponent();
      resetGame();
      
      redraw();
    } else {
      onlineStatus.innerText = "Game ended";
    }
  } else if (message.action == "move") {
    makeMove(message.fromX, message.fromY, message.x, message.y);
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
  } else if (waitingMode) {
    ctx.font = `${cellSize*0.5}px sans-serif`;
    let width = ctx.measureText("Waiting room").width;
    
    ctx.fillStyle = "#262522";
    ctx.fillRect(0, 0, width, cellSize*0.5);
    
    ctx.fillStyle = "#ffffff";
    ctx.textBaseline = "top";
    ctx.fillText("Waiting room", 0, 0);
  }
}

if (localStorage.getItem("username")) {
  usernameButton.innerText = `Change username (${localStorage.getItem("username")})`;
}

resetGame();
handleResize();

window.addEventListener("resize", handleResize);

canvas.addEventListener("mousedown", handleMouseDown);
onlineButton.addEventListener("click", handleOnlineButton);
usernameButton.addEventListener("click", handleUsernameButton);
leaveButton.addEventListener("click", handleLeaveButton);

cross.addEventListener("load", redraw);
naught.addEventListener("load", redraw);
