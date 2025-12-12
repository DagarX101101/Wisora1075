/* ------------------- IMPORTS ------------------- */

import React, { useState, useRef, useEffect } from "react";
import clickSound from "../assets/click.mp3";
import "./Studying.css";

import table from "../assets/table.png";
import stickynote1 from "../assets/stickynote1.png";
import stickynote2 from "../assets/stickynote2.png";
import stickynote3 from "../assets/stickynote3.png";
import stickynote4 from "../assets/stickynote4.png";

import yellowstickynote from "../assets/yellowstickynote.png";
import bluestickynote from "../assets/bluestickynote.png";
import pinkstickynote from "../assets/pinkstickynote.png";
import greenstickynote from "../assets/greenstickynote.png";

import digitalClock from "../assets/digitalClock.png";

/* ---------------- GLOBAL CONFIG / CONSTANTS ---------------- */

const CONTENT_AREA = {
  EDITOR_LEFT_PERCENT: 15,
  EDITOR_TOP_PERCENT: 15,
  EDITOR_WIDTH_PERCENT: 70,
  EDITOR_HEIGHT_PERCENT: 70,

  PREVIEW_SIZE: 120,
  PREVIEW_LEFT_OFFSET: 18,
  PREVIEW_TOP_OFFSET: 18,
  PREVIEW_WIDTH: 84,
  PREVIEW_HEIGHT: 84,
};

const TRASH_BIN_DIMENSIONS = {
  left: 550,
  bottom: 50,
  width: 150,
  height: 100,
};

/* ---------------- FULL COMPONENT ---------------- */

const Studying = () => {
  const studyingRef = useRef(null);
  const audioRef = useRef(new Audio(clickSound));

  /* ---------------- STICKY NOTES SYSTEM ---------------- */

  const noteMap = {
    stickynote1: greenstickynote,
    stickynote2: pinkstickynote,
    stickynote3: bluestickynote,
    stickynote4: yellowstickynote,
  };

  const [stickyNotes, setStickyNotes] = useState(() => {
    try {
      const saved = localStorage.getItem("stickyNotes");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("stickyNotes", JSON.stringify(stickyNotes));
  }, [stickyNotes]);

  const [draggedNote, setDraggedNote] = useState(null);
  const [draggedNoteIndex, setDraggedNoteIndex] = useState(null);
  const [isDraggingExistingNote, setIsDraggingExistingNote] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isOverTrashBin, setIsOverTrashBin] = useState(false);

  const getTrashRect = () => ({
    x: TRASH_BIN_DIMENSIONS.left,
    y:
      window.innerHeight -
      TRASH_BIN_DIMENSIONS.bottom -
      TRASH_BIN_DIMENSIONS.height,
    width: TRASH_BIN_DIMENSIONS.width,
    height: TRASH_BIN_DIMENSIONS.height,
  });

  const handleMouseDown = (noteKey, e, index = null) => {
    e.preventDefault();
    try {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    } catch {}

    if (index !== null) {
      setDraggedNoteIndex(index);
      setDraggedNote(stickyNotes[index].src);
      setIsDraggingExistingNote(true);
    } else {
      setDraggedNote(noteMap[noteKey]);
      setDraggedNoteIndex(null);
      setIsDraggingExistingNote(false);
    }

    setMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e) => {
    if (!draggedNote) return;
    setMousePos({ x: e.clientX, y: e.clientY });

    if (isDraggingExistingNote) {
      const trashRect = getTrashRect();
      const isOver =
        e.clientX > trashRect.x &&
        e.clientX < trashRect.x + trashRect.width &&
        e.clientY > trashRect.y &&
        e.clientY < trashRect.y + trashRect.height;
      setIsOverTrashBin(isOver);
    }
  };

  const handleMouseUp = (e) => {
    if (!draggedNote) return;

    const rect = studyingRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const trashRect = getTrashRect();
    const isDroppedOverTrash =
      e.clientX > trashRect.x &&
      e.clientX < trashRect.x + trashRect.width &&
      e.clientY > trashRect.y &&
      e.clientY < trashRect.y + trashRect.height;

    if (isDraggingExistingNote && isDroppedOverTrash) {
      setStickyNotes((prev) => prev.filter((_, i) => i !== draggedNoteIndex));
    } else if (isDraggingExistingNote) {
      setStickyNotes((prev) =>
        prev.map((note, i) =>
          i === draggedNoteIndex ? { ...note, x, y } : note
        )
      );
    } else {
      setStickyNotes((prev) => [
        ...prev,
        { src: draggedNote, x, y, text: "", drawings: [] },
      ]);
    }

    setDraggedNote(null);
    setDraggedNoteIndex(null);
    setIsDraggingExistingNote(false);
    setIsOverTrashBin(false);
  };

  const [selectedNoteIndex, setSelectedNoteIndex] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const handleNoteClick = (index, e) => {
    e.stopPropagation();
    if (!draggedNote) {
      setSelectedNoteIndex(index);
      setIsEditorOpen(true);
    }
  };

  const handleSaveNote = (text, drawings) => {
    setStickyNotes((prev) =>
      prev.map((note, i) =>
        i === selectedNoteIndex ? { ...note, text, drawings } : note
      )
    );
    setIsEditorOpen(false);
    setSelectedNoteIndex(null);
  };

  /* -------------------- TIMER SYSTEM -------------------- */

  // TRUE DUAL TIMER MODE ✔
  const [seconds, setSeconds] = useState(0);
  const [isRunningStopwatch, setIsRunningStopwatch] = useState(false);

  const [countdownSeconds, setCountdownSeconds] = useState(0);
  const [isRunningCountdown, setIsRunningCountdown] = useState(false);

  // inline countdown editor
  const [isEditingCountdown, setIsEditingCountdown] = useState(false);
  const countdownInputRef = useRef(null);
  const [countdownInput, setCountdownInput] = useState("00:00:00");

  // LCD display selection
  const [lastInteracted, setLastInteracted] = useState("stopwatch");

  /* STOPWATCH LOOP */
  useEffect(() => {
    let id;
    if (isRunningStopwatch) {
      id = setInterval(() => setSeconds((s) => s + 1), 1000);
    }
    return () => clearInterval(id);
  }, [isRunningStopwatch]);

  /* COUNTDOWN LOOP */
  useEffect(() => {
    let id;
    if (isRunningCountdown) {
      id = setInterval(() => {
        setCountdownSeconds((prev) => {
          if (prev <= 1) {
            setIsRunningCountdown(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(id);
  }, [isRunningCountdown]);

  useEffect(() => {
    if (isEditingCountdown && countdownInputRef.current) {
      countdownInputRef.current.focus();
      countdownInputRef.current.setSelectionRange(0, 1);
    }
  }, [isEditingCountdown]);

  const formatTime = (t) => {
    const h = Math.floor(t / 3600);
    const m = Math.floor((t % 3600) / 60);
    const s = t % 60;
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  };

  const parseTime = (str) => {
    const parts = str.split(":").map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) return null;
    if (parts[1] > 59 || parts[2] > 59) return null;
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  };

  /* DIGIT-BY-DIGIT COUNTDOWN INPUT */
  const handleCountdownInputKeyDown = (e) => {
    if (e.key === "Enter") {
      const parsed = parseTime(countdownInput);
      if (!parsed || parsed <= 0) return alert("Invalid time");

      setCountdownSeconds(parsed);
      setIsEditingCountdown(false);
      setIsRunningCountdown(true);
      setLastInteracted("countdown");
      return;
    }

    if (e.key === "Escape") {
      setIsEditingCountdown(false);
      return;
    }

    if (/^\d$/.test(e.key)) {
      e.preventDefault();
      const editable = [0, 1, 3, 4, 6, 7];
      let pos = countdownInputRef.current.selectionStart ?? 0;

      if (!editable.includes(pos)) {
        pos = editable.find((p) => p >= pos) ?? editable.at(-1);
      }

      const chars = countdownInput.split("");
      chars[pos] = e.key;
      setCountdownInput(chars.join(""));

      const nextIndex = editable.indexOf(pos) + 1;
      const nextPos = editable[Math.min(nextIndex, editable.length - 1)];

      requestAnimationFrame(() =>
        countdownInputRef.current.setSelectionRange(nextPos, nextPos + 1)
      );
      return;
    }

    if (e.key === "Backspace") {
      e.preventDefault();
      const editable = [0, 1, 3, 4, 6, 7];
      let pos = countdownInputRef.current.selectionStart ?? 0;

      if (!editable.includes(pos)) {
        pos = editable.find((p) => p < pos) ?? editable.at(-1);
      }

      const idx = editable.indexOf(pos);
      const prevPos = editable[Math.max(idx - 1, 0)];

      const chars = countdownInput.split("");
      chars[prevPos] = "0";
      setCountdownInput(chars.join(""));

      requestAnimationFrame(() =>
        countdownInputRef.current.setSelectionRange(prevPos, prevPos + 1)
      );
      return;
    }

    if (e.key.length === 1 && !/\d/.test(e.key)) {
      e.preventDefault();
    }
  };

  /* -------------------- TIMER BUTTONS -------------------- */

  const handleStart = () => {
    setIsRunningStopwatch(true);
    setLastInteracted("stopwatch");
  };

  const handleSetCountdown = () => {
    setIsEditingCountdown(true);
    setCountdownInput(formatTime(countdownSeconds || 0));
    setLastInteracted("countdown");
  };

  const handlePause = () => {
    if (lastInteracted === "stopwatch") {
      setIsRunningStopwatch((p) => !p);
    } else {
      setIsRunningCountdown((p) => !p);
    }
  };

  const handleStop = () => {
    if (lastInteracted === "stopwatch") {
      setIsRunningStopwatch(false);
      setSeconds(0);
    } else {
      setIsRunningCountdown(false);
      setCountdownSeconds(0);
    }
    setIsEditingCountdown(false);
  };

  /* ---------------- PRIMARY DISPLAY ---------------- */

  const primaryDisplay = () => {
    if (isEditingCountdown) return countdownInput;
    if (lastInteracted === "stopwatch") return formatTime(seconds);
    return formatTime(countdownSeconds);
  };

  /* -------------------- RENDER SECTION -------------------- */

  return (
    <div
      ref={studyingRef}
      style={{
        backgroundColor: "#a97c70",
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
        position: "relative",
        userSelect: "none",
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* TABLE */}
      <img
        src={table}
        style={{
          position: "absolute",
          top: "57%",
          width: "1270px",
          height: "300px",
          zIndex: 10,
        }}
        draggable="false"
      />

      {/* ================== STICKY BUNDLES ================== */}

      <StickyBundle
        src={stickynote1}
        top={58}
        left={140}
        handler={handleMouseDown}
        id="stickynote1"
      />
      <StickyBundle
        src={stickynote2}
        top={64}
        left={86}
        handler={handleMouseDown}
        id="stickynote2"
      />
      <StickyBundle
        src={stickynote3}
        top={64}
        left={190}
        handler={handleMouseDown}
        id="stickynote3"
      />
      <StickyBundle
        src={stickynote4}
        top={70}
        left={135}
        handler={handleMouseDown}
        id="stickynote4"
      />

      {/* ================== CLOCK UNIT ================== */}

      <div
        style={{
          position: "absolute",
          top: "55%",
          left: "70%",
          width: "220px",
          height: "110px",
          zIndex: 50,
        }}
      >
        <img
          src={digitalClock}
          style={{ width: "100%", height: "100%" }}
          draggable="false"
        />

        {/* MAIN LCD DISPLAY */}
        <div
          style={{
            position: "absolute",
            top: "43px",
            left: "27px",
            width: "145px",
            height: "33px",
            color: "#00ff66",
            fontFamily: "monospace",
            fontSize: "30px",
            fontWeight: "700",
            textAlign: "center",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            pointerEvents: "none", // input overrides this
          }}
        >
          {isEditingCountdown ? (
            <input
              ref={countdownInputRef}
              value={countdownInput}
              onChange={(e) => setCountdownInput(e.target.value)}
              onKeyDown={handleCountdownInputKeyDown}
              style={{
                width: "100%",
                height: "100%",
                fontFamily: "monospace",
                fontSize: "30px",
                fontWeight: "700",
                textAlign: "center",
                background: "transparent",
                border: "none",
                color: "#00ff66",
                outline: "none",
                padding: 0,
                margin: 0,
                pointerEvents: "auto",
              }}
            />
          ) : (
            primaryDisplay()
          )}
        </div>

        {/* BUTTON HITZONES — you adjust manually */}
        <button
          onClick={handleStart}
          style={{
            position: "absolute",
            top: 22,
            left: 20,
            width: 45,
            height: 17,
            background: "transparent",
            border: "none",
            cursor: "pointer",
          }}
        />
        <button
          onClick={handleSetCountdown}
          style={{
            position: "absolute",
            top: 22,
            left: 65,
            width: 45,
            height: 17,
            background: "transparent",
            border: "none",
            cursor: "pointer",
          }}
        />
        <button
          onClick={handlePause}
          style={{
            position: "absolute",
            top: 22,
            left: 145,
            width: 35,
            height: 17,
            background: "transparent",
            border: "none",
            cursor: "pointer",
          }}
        />
        <button
          onClick={handleStop}
          style={{
            position: "absolute",
            top: 22,
            left: 105,
            width: 35,
            height: 17,
            background: "transparent",
            border: "none",
            cursor: "pointer",
          }}
        />
      </div>

      {/* DRAG PREVIEW */}
      {draggedNote && (
        <img
          src={draggedNote}
          style={{
            position: "fixed",
            top: mousePos.y - 45,
            left: mousePos.x - 45,
            width: "90px",
            height: "90px",
            pointerEvents: "none",
            opacity: 0.85,
            zIndex: 5000,
          }}
        />
      )}

      {/* RENDER STICKY NOTES */}
      {stickyNotes.map((note, index) => (
        <div
          key={index}
          onMouseDown={(e) => handleMouseDown(null, e, index)}
          onClick={(e) => handleNoteClick(index, e)}
          style={{
            position: "absolute",
            left: note.x - 60,
            top: note.y - 60,
            width: CONTENT_AREA.PREVIEW_SIZE,
            height: CONTENT_AREA.PREVIEW_SIZE,
            cursor: "grab",
            zIndex: 40,
          }}
        >
          <img
            src={note.src}
            style={{ width: "100%", height: "100%", position: "absolute" }}
            draggable="false"
          />

          {note.text && (
            <div
              style={{
                position: "absolute",
                left: 15,
                top: 16,
                width: 80,
                height: 70,
                fontSize: 8,
                overflow: "hidden",
                whiteSpace: "pre-wrap",
              }}
            >
              {note.text}
            </div>
          )}

          {note.drawings?.length > 0 && (
            <StickyNoteDrawing
              drawings={note.drawings}
              position={{
                x: CONTENT_AREA.PREVIEW_LEFT_OFFSET,
                y: CONTENT_AREA.PREVIEW_TOP_OFFSET,
              }}
              size={CONTENT_AREA.PREVIEW_WIDTH}
            />
          )}
        </div>
      ))}

      {/* EDITOR */}
      {isEditorOpen && selectedNoteIndex !== null && (
        <StickyNoteEditor
          note={stickyNotes[selectedNoteIndex]}
          onSave={handleSaveNote}
          onClose={() => {
            setIsEditorOpen(false);
            setSelectedNoteIndex(null);
          }}
        />
      )}
    </div>
  );
};

/* ---------------- Sticky Note Bundle ---------------- */

const StickyBundle = ({ src, top, left, handler, id }) => (
  <img
    src={src}
    onMouseDown={(e) => handler(id, e)}
    style={{
      position: "absolute",
      top: `${top}%`,
      left: `${left}px`,
      width: "90px",
      height: "90px",
      cursor: "grab",
      zIndex: 20,
    }}
    draggable="false"
  />
);

/* ---------------- StickyNoteDrawing ---------------- */

const StickyNoteDrawing = ({ drawings, position, size }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#000";

    drawings.forEach((drawing) => {
      if (drawing.points.length < 2) return;

      ctx.beginPath();
      ctx.moveTo(
        drawing.points[0].x * canvas.width,
        drawing.points[0].y * canvas.height
      );

      drawing.points.forEach((pt) => {
        ctx.lineTo(pt.x * canvas.width, pt.y * canvas.height);
      });

      ctx.stroke();
    });
  }, [drawings, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{
        position: "absolute",
        left: position.x,
        top: position.y,
        pointerEvents: "none",
      }}
    />
  );
};

/* ---------------- StickyNoteEditor ---------------- */

const StickyNoteEditor = ({ note, onSave, onClose }) => {
  const [text, setText] = useState(note.text || "");
  const [tool, setTool] = useState("text");
  const [drawing, setDrawing] = useState(false);
  const [drawings, setDrawings] = useState(note.drawings || []);
  const canvasRef = useRef(null);

  const editorSize = 400;
  const canvasSize = Math.round(
    editorSize * (CONTENT_AREA.EDITOR_WIDTH_PERCENT / 100)
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 4;

    drawings.forEach((d) => {
      if (d.points.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(d.points[0].x * canvas.width, d.points[0].y * canvas.height);
      d.points.forEach((pt) =>
        ctx.lineTo(pt.x * canvas.width, pt.y * canvas.height)
      );
      ctx.stroke();
    });
  }, [drawings]);

  const getCoords = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    };
  };

  const handleDrawStart = (e) => {
    if (tool !== "pen") return;
    setDrawing(true);
    const { x, y } = getCoords(e);
    setDrawings((prev) => [...prev, { points: [{ x, y }] }]);
  };

  const handleDrawMove = (e) => {
    if (!drawing || tool !== "pen") return;
    const { x, y } = getCoords(e);

    setDrawings((prev) => {
      const updated = [...prev];
      updated[updated.length - 1].points.push({ x, y });
      return updated;
    });
  };

  const handleDrawEnd = () => setDrawing(false);

  const clearCanvas = () => setDrawings([]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 2000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          width: editorSize,
          height: editorSize,
        }}
      >
        <img
          src={note.src}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
          }}
        />

        {/* Toolbar */}
        <div
          style={{
            position: "absolute",
            top: -50,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            gap: 10,
            background: "white",
            padding: 10,
            borderRadius: 5,
          }}
        >
          <button onClick={() => setTool("pen")}>✏️ Pen</button>
          <button onClick={() => setTool("text")}>📝 Text</button>
          <button
            onClick={clearCanvas}
            style={{ color: "white", background: "red" }}
          >
            🗑️ Clear
          </button>
        </div>

        {/* Textarea */}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{
            position: "absolute",
            left: `${CONTENT_AREA.EDITOR_LEFT_PERCENT}%`,
            top: `${CONTENT_AREA.EDITOR_TOP_PERCENT}%`,
            width: `${CONTENT_AREA.EDITOR_WIDTH_PERCENT}%`,
            height: `${CONTENT_AREA.EDITOR_HEIGHT_PERCENT}%`,
            background: "transparent",
            border: "none",
            resize: "none",
            fontSize: 20,
            outline: "none",
            zIndex: 5,
          }}
        />

        {/* Canvas */}
        <canvas
          ref={canvasRef}
          width={canvasSize}
          height={canvasSize}
          onMouseDown={handleDrawStart}
          onMouseMove={handleDrawMove}
          onMouseUp={handleDrawEnd}
          onMouseLeave={handleDrawEnd}
          style={{
            position: "absolute",
            left: `${CONTENT_AREA.EDITOR_LEFT_PERCENT}%`,
            top: `${CONTENT_AREA.EDITOR_TOP_PERCENT}%`,
            width: `${CONTENT_AREA.EDITOR_WIDTH_PERCENT}%`,
            height: `${CONTENT_AREA.EDITOR_HEIGHT_PERCENT}%`,
            zIndex: 4,
          }}
        />

        {/* Controls */}
        <div
          style={{
            position: "absolute",
            bottom: -50,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            gap: 10,
          }}
        >
          <button onClick={onClose}>Cancel</button>
          <button
            onClick={() => onSave(text, drawings)}
            style={{ background: "#007bff", color: "white" }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default Studying;
