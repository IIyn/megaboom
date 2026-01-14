import { useEffect, useRef, useState } from 'react';
import { GameEngine } from "./Game/GameEngine";
import "./index.css";

function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<GameEngine | null>(null);
  const [gameState, setGameState] = useState({
    hp: 100,
    isGameOver: false,
    xp: 0,
    xpToNextLevel: 100,
    level: 1,
  });

  const [isMenuOpen, setIsMenuOpen] = useState(true);

  useEffect(() => {
    if (containerRef.current && !gameRef.current && !isMenuOpen) {
      gameRef.current = new GameEngine(containerRef.current, (state) => {
        setGameState(state);
      });
    }

    return () => {
      if (gameRef.current) {
        gameRef.current.dispose();
        gameRef.current = null;
      }
    };
  }, [isMenuOpen]);

  const handleRestart = () => {
    window.location.reload();
  };

  if (isMenuOpen) {
    return (
      <div className="menu">
        <h1>Megaboom</h1>
        <button className="start-button" onClick={() => setIsMenuOpen(false)}>
          Start
        </button>
      </div>
    );
  }

  return (
    <div className="app">
      <div id="game-container" ref={containerRef} />
      <div className="xp-bar-container">
        <div
          className="xp-bar-fill"
          style={{ width: `${(gameState.xp / gameState.xpToNextLevel) * 100}%` }}
        />
        <div className="level-badge">LVL {gameState.level}</div>
      </div>
      <div className="hud">
        <div className="hp-bar-container">
          <div
            className="hp-bar-fill"
            style={{ width: `${gameState.hp}%` }}
          />
        </div>
        <div className="hp-text">HP: {gameState.hp}</div>
      </div>

      <div className="controls-hint">
        WASD / ZQSD: Move | Auto-fire in range
      </div>
      {
        gameState.isGameOver && (
          <div className="game-over-overlay">
            <h1>Game Over</h1>
            <button className="restart-button" onClick={handleRestart}>
              Restart
            </button>
          </div>
        )
      }
    </div >
  );
}

export default App;
