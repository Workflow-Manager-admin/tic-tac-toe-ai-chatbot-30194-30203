import React, { useState, useEffect, useRef } from "react";
import "./App.css";

/**
 * PUBLIC_INTERFACE
 * Main App for Tic Tac Toe AI Chat game.
 *
 * Features:
 * - Header with title
 * - Responsive board and chat layout
 * - Move history
 * - Restart/Reset controls
 * - Modern light theme with accent/primary/secondary colors
 * - Chat-based interaction with AI
 */
function App() {
  const [theme] = useState("light"); // only light theme per requirements
  const [board, setBoard] = useState(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);
  const [history, setHistory] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [messages, setMessages] = useState([
    { from: "ai", text: "Hi! I'm your Tic Tac Toe AI. Go ahead, send me your move by typing a position (1-9) or click the board. X always starts!" },
  ]);
  const [inputValue, setInputValue] = useState("");
  const chatEndRef = useRef(null);

  // Scroll chat to bottom when new messages
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Check board for winner or draw
  useEffect(() => {
    const w = calculateWinner(board);
    if (w) {
      setGameOver(true);
      setWinner(w);
      setMessages((msgs) => [
        ...msgs,
        {
          from: "ai",
          text: w === "draw" ? "It's a draw! Type restart to play again." : `Player ${w} wins! Type restart to play again.`,
        },
      ]);
    }
  }, [board]);

  // AI makes a move after player (O is always AI)
  useEffect(() => {
    if (!xIsNext && !gameOver) {
      // AI "thinking" delay
      const timeout = setTimeout(() => {
        const aiMove = chooseAIMove(board);
        if (aiMove != null) {
          handleMove(aiMove, "ai");
        }
      }, 700);
      return () => clearTimeout(timeout);
    }
  }, [xIsNext, gameOver, board]);

  // Handle player making a move by clicking board or typing number in chat
  function handleMove(i, source = "user") {
    if (board[i] || gameOver) return;
    const player = xIsNext ? "X" : "O";
    const newBoard = board.slice();
    newBoard[i] = player;

    setBoard(newBoard);
    setXIsNext((prev) => !prev);

    // Add to history
    setHistory((h) => [
      ...h,
      {
        board: newBoard,
        move: player,
        position: i,
      },
    ]);

    // Update chat if move was user
    if (source === "user") {
      setMessages((msgs) => [
        ...msgs,
        { from: "user", text: `Move: ${i + 1}` },
        { from: "ai", text: "AI is thinking..." },
      ]);
    }
    if (source === "ai") {
      setMessages((msgs) => [
        ...msgs.slice(0, msgs.length - 1),
        { from: "ai", text: `I play at position ${i + 1}` },
      ]);
    }
  }

  // Handle chat input (move or command)
  function handleInputSubmit(e) {
    e.preventDefault();
    const val = inputValue.trim();
    if (!val) return;

    // Handle restart/reset command (also from AI prompt or after game)
    if (/^(restart|reset)$/i.test(val)) {
      restartGame();
      setMessages((msgs) => [
        ...msgs,
        { from: "user", text: val },
        { from: "ai", text: "Game restarted! X goes first." },
      ]);
      setInputValue("");
      return;
    }

    // Parse numeric move (1-9)
    const moveIdx = parseMoveInput(val, board);
    if (moveIdx == null) {
      setMessages((msgs) => [
        ...msgs,
        { from: "user", text: val },
        { from: "ai", text: "Please type a number (1-9) for your move, or 'restart' to play again." },
      ]);
      setInputValue("");
      return;
    }
    if (!xIsNext) {
      setMessages((msgs) => [
        ...msgs,
        { from: "user", text: val },
        { from: "ai", text: "It's not your turn. Please wait for the AI to move." },
      ]);
      setInputValue("");
      return;
    }
    handleMove(moveIdx, "user");
    setInputValue("");
  }

  // Restart game logic
  function restartGame() {
    setBoard(Array(9).fill(null));
    setXIsNext(true);
    setHistory([]);
    setGameOver(false);
    setWinner(null);
  }

  // Reset chat and history as well as game
  function resetAll() {
    restartGame();
    setMessages([
      { from: "ai", text: "Game has been reset. X goes first! Type a position (1-9) or click the board to move." },
    ]);
  }

  // Render helpers
  function renderBoard() {
    return (
      <div className="board-container">
        {Array(3)
          .fill(null)
          .map((_, row) => (
            <div className="board-row" key={row}>
              {Array(3)
                .fill(null)
                .map((_, col) => {
                  const idx = row * 3 + col;
                  return (
                    <button
                      key={idx}
                      className="square"
                      style={{
                        color:
                          board[idx] === "X"
                            ? "var(--accent-color)"
                            : board[idx] === "O"
                            ? "var(--primary-color)"
                            : undefined,
                        cursor: board[idx] || gameOver || (!xIsNext && !gameOver)
                          ? "not-allowed"
                          : "pointer",
                      }}
                      disabled={Boolean(board[idx]) || gameOver || (!xIsNext && !gameOver)}
                      aria-label={`Square ${idx + 1}`}
                      onClick={() => {
                        if (xIsNext) handleMove(idx, "user");
                      }}
                    >
                      {board[idx]}
                    </button>
                  );
                })}
            </div>
          ))}
      </div>
    );
  }

  function renderHistory() {
    if (!history.length) {
      return <div className="history-empty">No moves yet.</div>;
    }
    return (
      <ol className="history-list">
        {history.map((h, i) => (
          <li key={i}>
            <span style={{ color: h.move === "X" ? "var(--accent-color)" : "var(--primary-color)" }}>
              {h.move}
            </span>{" "}
            to <strong>{h.position + 1}</strong>
          </li>
        ))}
      </ol>
    );
  }

  function renderChat() {
    return (
      <div className="chat-panel">
        <div className="chat-header">Chat</div>
        <div className="chat-history" data-testid="chat-history">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={msg.from === "user" ? "chat-msg user" : "chat-msg ai"}
            >
              {msg.from === "user" ? (
                <span className="user-badge">You:</span>
              ) : (
                <span className="ai-badge">AI:</span>
              )}
              <span>{msg.text}</span>
            </div>
          ))}
          <div ref={chatEndRef}></div>
        </div>
        <form className="chat-input-form" onSubmit={handleInputSubmit} autoComplete="off">
          <input
            className="chat-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder='Type move (1-9) or "restart"...'
            disabled={gameOver && winner !== null}
            aria-label="Chat move or command"
          />
          <button
            type="submit"
            className="chat-send-btn"
            style={{ background: "var(--accent-color)" }}
            disabled={inputValue === ""}
            aria-label="Send"
          >
            Send
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="App" data-theme={theme}>
      <header className="header-bar">
        <span className="header-emoji">🎮</span>
        <span className="header-title">Tic Tac Toe (AI Chat Edition)</span>
      </header>

      <main className="main-container">
        {/* Game + Chat split: row for desktop, column for mobile */}
        <div className="game-chat-flex">
          <section className="board-section">
            <div className="subhead" style={{ color: "var(--accent-color)" }}>
              {gameOver
                ? winner === "draw"
                  ? "Draw! 🤝"
                  : `Winner: ${winner} 🏆`
                : `Next: ${xIsNext ? "X (You)" : "O (AI)"}`}
            </div>
            {renderBoard()}
            <div className="history-block">
              <div className="history-head" style={{ color: "var(--primary-color)" }}>
                Game History
              </div>
              {renderHistory()}
            </div>
          </section>
          {renderChat()}
        </div>
      </main>
      <footer className="footer">
        <button className="footer-btn" onClick={restartGame} aria-label="Restart game">
          Restart Game
        </button>
        <button className="footer-btn" onClick={resetAll} aria-label="Full reset">
          Reset All
        </button>
        <span className="footer-brand" style={{ color: "var(--primary-color)" }}>
          Powered by AI | Modern React
        </span>
      </footer>
    </div>
  );
}

/**
 * PUBLIC_INTERFACE
 * Returns winner ('X','O'), 'draw', or null
 */
function calculateWinner(squares) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (let [a, b, c] of lines) {
    if (
      squares[a] &&
      squares[a] === squares[b] &&
      squares[a] === squares[c]
    ) {
      return squares[a];
    }
  }
  if (squares.every((x) => x)) return "draw";
  return null;
}

/**
 * PUBLIC_INTERFACE
 * AI chooses a move: win, block, center, empty corner/side
 * Returns board index
 */
function chooseAIMove(board) {
  // Find available moves
  const empty = [];
  for (let i = 0; i < 9; ++i) if (!board[i]) empty.push(i);
  // First, try to win
  for (const i of empty) {
    const copy = board.slice();
    copy[i] = "O";
    if (calculateWinner(copy) === "O") return i;
  }
  // Block X
  for (const i of empty) {
    const copy = board.slice();
    copy[i] = "X";
    if (calculateWinner(copy) === "X") return i;
  }
  // Take center
  if (empty.includes(4)) return 4;
  // Random corner
  const corners = [0, 2, 6, 8].filter((idx) => empty.includes(idx));
  if (corners.length) return corners[Math.floor(Math.random() * corners.length)];
  // Any side
  return empty[Math.floor(Math.random() * empty.length)];
}

/**
 * PUBLIC_INTERFACE
 * Parse move input (expects 1-9), returns 0-based idx or null if invalid
 */
function parseMoveInput(inp, board) {
  const m = inp.match(/^\s*(?:move\s+)?(\d)\s*$/i);
  if (!m) return null;
  const idx = parseInt(m[1], 10) - 1;
  if (idx < 0 || idx > 8 || board[idx]) return null;
  return idx;
}

export default App;
