import React, { useState, useRef, useLayoutEffect } from "react";
import "./App.css";
import tickSound from './assets/tick.mp3';
import buzzerSound from './assets/buzzer.mp3';

const levels = {
  easy: [
    {
      questions: ["Capital of France?", "2 + 2 = ?", "Color of the sky?"],
      answers: ["4", "Blue", "Paris"],
      correctPairs: { 0: 2, 1: 0, 2: 1 }
    },
    {
      questions: ["Largest planet?", "Opposite of hot?", "First letter of alphabet?"],
      answers: ["A", "Jupiter", "Cold"],
      correctPairs: { 0: 1, 1: 2, 2: 0 }
    }
  ],
  medium: [
    {
      questions: [
        "Color of grass?",
        "Day after Monday?",
        "Shape with 3 sides?",
        "Animal that barks?",
        "Fruit that's yellow and curved?"
      ],
      answers: [
        "Banana",
        "Dog",
        "Green",
        "Tuesday",
        "Triangle"
      ],
      correctPairs: { 0: 2, 1: 3, 2: 4, 3: 1, 4: 0 }
    },
    {
      questions: [
        "Color of the sun?",
        "Animal that purrs?",
        "Shape with 4 equal sides?",
        "Vehicle with two wheels?",
        "Fruit that's red and round?"
      ],
      answers: [
        "Cat",
        "Yellow",
        "Bicycle",
        "Apple",
        "Square"
      ],
      correctPairs: { 0: 1, 1: 0, 2: 4, 3: 2, 4: 3 }
    }
  ],
  hard: [
    {
      questions: [
        "Color of the ocean?",
        "Animal that quacks?",
        "Shape with no corners?",
        "Fruit that's orange and round?",
        "Vehicle that flies?",
        "Number after 9?"
      ],
      answers: [
        "Duck",
        "10",
        "Blue",
        "Airplane",
        "Orange",
        "Circle"
      ],
      correctPairs: { 0: 2, 1: 0, 2: 5, 3: 4, 4: 3, 5: 1 }
    }
  ]
};

const difficulties = ["easy", "medium", "hard"];

function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function App() {
  const [difficulty, setDifficulty] = useState("easy");
  const [levelIdx, setLevelIdx] = useState(0);
  const [draggingIdx, setDraggingIdx] = useState(null);
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [connections, setConnections] = useState([]); // [{qIdx, aIdx, correct}]
  const [tempArrow, setTempArrow] = useState(null); // {from, to}
  const leftRefs = useRef([]);
  const rightRefs = useRef([]);
  const gameAreaRef = useRef(null);
  const [svgDims, setSvgDims] = useState({ left: 0, top: 0, width: 0, height: 0 });
  const [shuffledQuestions, setShuffledQuestions] = useState([]);
  const [shuffledAnswers, setShuffledAnswers] = useState([]);
  const tickAudio = useRef(null);
  const buzzerAudio = useRef(null);

  // Get current level data
  const { questions, answers, correctPairs } = levels[difficulty][levelIdx];

  // Shuffle on mount or when level/difficulty changes
  useLayoutEffect(() => {
    if (gameAreaRef.current) {
      const rect = gameAreaRef.current.getBoundingClientRect();
      setSvgDims({ left: rect.left, top: rect.top, width: rect.width, height: rect.height });
    }
    // Shuffle questions and answers
    const qIndices = questions.map((_, i) => i);
    const aIndices = answers.map((_, i) => i);
    const shuffledQ = shuffleArray(qIndices);
    const shuffledA = shuffleArray(aIndices);
    setShuffledQuestions(shuffledQ);
    setShuffledAnswers(shuffledA);
    setConnections([]);
    setDraggingIdx(null);
    setHoveredIdx(null);
    setTempArrow(null);
  }, [difficulty, levelIdx, questions, answers, correctPairs]);

  // Helper to get the correct answer index for a shuffled question
  const getCorrectAnswerIdx = (qIdx) => {
    // qIdx is the index in the shuffledQuestions array
    // Find the original question index
    const origQIdx = shuffledQuestions[qIdx];
    // Find the original correct answer index
    const origAIdx = correctPairs[origQIdx];
    // Find the new index of this answer in shuffledAnswers
    return shuffledAnswers.indexOf(origAIdx);
  };

  // Helper to check if a question is already connected
  const isQuestionConnected = (qIdx) =>
    connections.some((c) => c.qIdx === qIdx);

  // Mouse events for drag
  const handleDragStart = (qIdx) => (e) => {
    if (isQuestionConnected(qIdx)) return; // Prevent dragging if already connected
    e.preventDefault();
    setDraggingIdx(qIdx);
    setTempArrow({ from: qIdx, to: null });
    document.body.style.userSelect = "none";
  };

  const handleDrag = (e) => {
    if (draggingIdx !== null) {
      setTempArrow({ from: draggingIdx, to: { x: e.clientX, y: e.clientY } });
    }
  };

  const handleDragEnter = (aIdx) => () => {
    setHoveredIdx(aIdx);
  };

  const handleDragLeave = () => {
    setHoveredIdx(null);
  };

  const handleDrop = (aIdx) => (e) => {
    if (draggingIdx !== null) {
      const correct = getCorrectAnswerIdx(draggingIdx) === aIdx;
      setConnections((prev) => [...prev, { qIdx: draggingIdx, aIdx, correct }]);
      setDraggingIdx(null);
      setHoveredIdx(null);
      setTempArrow(null);
      document.body.style.userSelect = "";
      if (correct && tickAudio.current) {
        tickAudio.current.currentTime = 0;
        tickAudio.current.play();
      } else if (!correct && buzzerAudio.current) {
        buzzerAudio.current.currentTime = 0;
        buzzerAudio.current.play();
      }
    }
  };

  const handleDragEnd = () => {
    setDraggingIdx(null);
    setHoveredIdx(null);
    setTempArrow(null);
    document.body.style.userSelect = "";
  };

  // Change level or difficulty
  const handleSelectDifficulty = (diff) => {
    setDifficulty(diff);
    setLevelIdx(0);
    setConnections([]);
    setDraggingIdx(null);
    setHoveredIdx(null);
    setTempArrow(null);
  };
  const handleSelectLevel = (idx) => {
    setLevelIdx(idx);
    setConnections([]);
    setDraggingIdx(null);
    setHoveredIdx(null);
    setTempArrow(null);
  };

  // Reset handler
  const handleReset = () => {
    // Shuffle questions and answers
    const qIndices = questions.map((_, i) => i);
    const aIndices = answers.map((_, i) => i);
    const shuffledQ = shuffleArray(qIndices);
    const shuffledA = shuffleArray(aIndices);
    setShuffledQuestions(shuffledQ);
    setShuffledAnswers(shuffledA);
    setConnections([]);
    setDraggingIdx(null);
    setHoveredIdx(null);
    setTempArrow(null);
  };

  // Render all arrows in a single SVG overlay
  const renderOverlayArrows = () => {
    const lines = [];
    // Helper to get center of a box relative to SVG
    const getBoxCenter = (ref, isAnswer = false) => {
      if (!ref) return { x: 0, y: 0 };
      const rect = ref.getBoundingClientRect();
      return {
        x: isAnswer ? rect.left - svgDims.left : rect.right - svgDims.left,
        y: rect.top + rect.height / 2 - svgDims.top
      };
    };
    // Draw permanent arrows
    connections.forEach(({ qIdx, aIdx }, i) => {
      const fromRef = leftRefs.current[qIdx];
      const toRef = rightRefs.current[aIdx];
      if (!fromRef || !toRef) return;
      let from = getBoxCenter(fromRef);
      let to = getBoxCenter(toRef, true); // Use left edge for answer
      const correct = getCorrectAnswerIdx(qIdx) === aIdx;
      lines.push({
        x1: from.x,
        y1: from.y,
        x2: to.x,
        y2: to.y,
        color: correct ? "#22c55e" : "#ef4444",
        key: `perm-${i}`
      });
    });
    // Draw temp arrow
    if (draggingIdx !== null && tempArrow && tempArrow.to) {
      const fromRef = leftRefs.current[draggingIdx];
      if (fromRef) {
        let from = getBoxCenter(fromRef);
        let to = { x: tempArrow.to.x - svgDims.left, y: tempArrow.to.y - svgDims.top };
        lines.push({
          x1: from.x,
          y1: from.y,
          x2: to.x,
          y2: to.y,
          color: "#facc15",
          key: "temp-arrow"
        });
      }
    }
    return (
      <svg
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: svgDims.width,
          height: svgDims.height,
          pointerEvents: "none",
          zIndex: 1
        }}
        width={svgDims.width}
        height={svgDims.height}
      >
        <defs>
          <marker id="arrowhead" markerWidth="12" markerHeight="8" refX="12" refY="4" orient="auto" markerUnits="strokeWidth">
            <polygon points="0 0, 12 4, 0 8" fill="#facc15" />
          </marker>
        </defs>
        {lines.map((line) => (
          <line
            key={line.key}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke={line.color}
            strokeWidth={5}
            markerEnd="url(#arrowhead)"
          />
        ))}
      </svg>
    );
  };

  return (
    <div
      className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4"
      onMouseMove={handleDrag}
      onMouseUp={handleDragEnd}
      style={{ userSelect: draggingIdx !== null ? "none" : "auto", position: "relative" }}
    >
      <audio ref={tickAudio} src={tickSound} preload="auto" />
      <audio ref={buzzerAudio} src={buzzerSound} preload="auto" />
      {/* Difficulty and Level Buttons */}
      <div className="flex flex-col items-center mb-6 w-full">
        <div className="flex gap-4 mb-2">
          {difficulties.map((diff) => (
            <button
              key={diff}
              className={`px-4 py-2 rounded font-bold border-2 ${difficulty === diff ? "bg-blue-500 text-white border-blue-700" : "bg-white text-blue-700 border-blue-300"}`}
              onClick={() => handleSelectDifficulty(diff)}
            >
              {diff.charAt(0).toUpperCase() + diff.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {levels[difficulty].map((_, idx) => (
            <button
              key={idx}
              className={`px-3 py-1 rounded font-semibold border ${levelIdx === idx ? "bg-green-500 text-white border-green-700" : "bg-white text-green-700 border-green-300"}`}
              onClick={() => handleSelectLevel(idx)}
            >
              Level {idx + 1}
            </button>
          ))}
        </div>
      </div>
      <div
        ref={gameAreaRef}
        style={{ position: "relative", width: "100%", maxWidth: 1024, minHeight: 400 }}
      >
        {renderOverlayArrows()}
        <div className="flex gap-32 w-full max-w-4xl" style={{ position: "relative", zIndex: 2 }}>
          {/* Questions Column */}
          <div className="flex-1 flex flex-col items-end left-col-pad">
            {shuffledQuestions.map((qIdx, idx) => {
              const connected = isQuestionConnected(idx);
              const boxSizeClass = difficulty === 'hard' ? 'connect-box-small' : 'connect-box-large';
              return (
                <div
                  key={idx}
                  ref={el => (leftRefs.current[idx] = el)}
                  className={`connect-box ${boxSizeClass} connect-box-question select-none${connected ? " connect-box-disabled" : ""}${draggingIdx === idx ? " selected" : ""}`}
                  style={{ marginBottom: 32, pointerEvents: connected ? "none" : "auto", marginTop: idx === 0 ? 0 : undefined }}
                  onMouseDown={handleDragStart(idx)}
                  tabIndex={0}
                >
                  {questions[qIdx]}
                  <span style={{ marginLeft: 8, color: "#facc15", fontWeight: "bold" }}>&#8594;</span>
                </div>
              );
            })}
          </div>
          {/* Answers Column */}
          <div className="flex-1 flex flex-col items-end right-col-pad" style={{ paddingLeft: 96 }}>
            {shuffledAnswers.map((aIdx, idx) => {
              // Find if this answer is already connected
              const connected = connections.find(c => c.aIdx === idx);
              let boxColor = "";
              let isDisabled = !!connected;
              // Find if the connection to this answer is correct
              if (connected) {
                const correct = getCorrectAnswerIdx(connected.qIdx) === idx;
                boxColor = correct ? "bg-green-200" : "bg-red-200";
              } else if (hoveredIdx === idx && draggingIdx !== null) boxColor = "bg-yellow-100";
              const boxSizeClass = difficulty === 'hard' ? 'connect-box-small' : 'connect-box-large';
              return (
                <div
                  key={idx}
                  ref={el => (rightRefs.current[idx] = el)}
                  className={`connect-box ${boxSizeClass} connect-box-answer ${boxColor} select-none${isDisabled ? " connect-box-disabled" : ""}`}
                  style={{ marginBottom: 32, marginTop: idx === 0 ? 0 : undefined, pointerEvents: isDisabled ? "none" : "auto" }}
                  onMouseEnter={!isDisabled ? handleDragEnter(idx) : undefined}
                  onMouseLeave={!isDisabled ? handleDragLeave : undefined}
                  onMouseUp={!isDisabled ? handleDrop(idx) : undefined}
                >
                  {answers[aIdx]}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {/* Reset Button */}
      <div className="flex justify-center mt-8">
        <button
          className="px-6 py-2 bg-red-500 text-white rounded shadow font-bold hover:bg-red-600 transition"
          onClick={handleReset}
        >
          Reset
        </button>
      </div>
    </div>
  );
}

export default App;