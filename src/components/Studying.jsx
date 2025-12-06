import React, { useState, useRef, useEffect } from 'react';
import clickSound from '../assets/click.mp3';
import './Studying.css';
import table from '../assets/table.png';
import stickynote1 from '../assets/stickynote1.png';
import stickynote2 from '../assets/stickynote2.png';
import stickynote3 from '../assets/stickynote3.png';
import stickynote4 from '../assets/stickynote4.png';
import yellowstickynote from '../assets/yellowstickynote.png';
import bluestickynote from '../assets/bluestickynote.png';
import pinkstickynote from '../assets/pinkstickynote.png';
import greenstickynote from '../assets/greenstickynote.png';
import digitalClock from '../assets/digitalClock.png';
// --- Configuration for Text/Drawing area relative to the 100% note size ---
const CONTENT_AREA = {
  // Percentage from the left/top edge of the sticky note container (400x400 editor size used for reference).
  EDITOR_LEFT_PERCENT: 15,
  EDITOR_TOP_PERCENT: 15,
  EDITOR_WIDTH_PERCENT: 70,
  EDITOR_HEIGHT_PERCENT: 70,

  // For the small 120x120 note on the main screen, we calculate pixel values
  PREVIEW_SIZE: 120, // The height/width of the displayed note image
  PREVIEW_LEFT_OFFSET: 18, 
  PREVIEW_TOP_OFFSET: 18, 
  PREVIEW_WIDTH: 84, 
  PREVIEW_HEIGHT: 84 
};

// 🗑️ TRASH BIN DIMENSIONS (Using fixed positioning relative to viewport)
const TRASH_BIN_DIMENSIONS = {
    left: 550, // 550px from left edge
    bottom: 50, // 50px from bottom edge
    width: 150,
    height: 100,
};

// =======================================================================
// === 1. Studying Component (Main App) ===
// =======================================================================

const Studying = () => {
  const [seconds, setSeconds] = useState(0);
  const [isEditingCountdown, setIsEditingCountdown] = useState(false);
  const countdownInputRef = useRef(null);
  const [countdownInput, setCountdownInput] = useState("00:00:00");
  const [isRunning, setIsRunning] = useState(false);
  const [countdownMode, setCountdownMode] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(0);
  const [draggedNote, setDraggedNote] = useState(null);
  const [draggedNoteIndex, setDraggedNoteIndex] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [selectedNoteIndex, setSelectedNoteIndex] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isDraggingExistingNote, setIsDraggingExistingNote] = useState(false);
  const [isOverTrashBin, setIsOverTrashBin] = useState(false);
  const studyingRef = useRef(null);
  const audioRef = useRef(new Audio(clickSound));
  const [stickyNotes, setStickyNotes] = useState(() => {
    try {
      const saved = localStorage.getItem('stickyNotes');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
useEffect(() => {
    localStorage.setItem('stickyNotes', JSON.stringify(stickyNotes));
  }, [stickyNotes]);
useEffect(()=>{
    let intervalId;
    if(isRunning){
      if(!countdownMode){
      intervalId = setInterval(() => {
        setSeconds((prev)=> prev+1);
      }, 1000);
    }else{
      intervalId = setInterval(() => {
        setCountdownSeconds(prev=>{
          if(prev<=1){
            clearInterval(intervalId);
            setIsRunning(false);
            return 0;
          }
          return prev-1;
        });
      }, 1000);
    }
    }
    return () => {
      if(intervalId) clearInterval(intervalId);
    };
  },[isRunning, countdownMode]);
  useEffect(()=>{
    if(isEditingCountdown && countdownInputRef.current){
      countdownInputRef.current.focus();
      countdownInputRef.current.setSelectionRange(0,1);
    }
  },[isEditingCountdown]);
  const noteMap = {
    stickynote1: greenstickynote,
    stickynote2: pinkstickynote,
    stickynote3: bluestickynote,
    stickynote4: yellowstickynote
  };
  // Helper to get the trash bin's viewport coordinates for collision detection
  const getTrashRect = () => ({
      x: TRASH_BIN_DIMENSIONS.left,
      // Calculate Y coordinate from the bottom anchor
      y: window.innerHeight - TRASH_BIN_DIMENSIONS.bottom - TRASH_BIN_DIMENSIONS.height,
      width: TRASH_BIN_DIMENSIONS.width,
      height: TRASH_BIN_DIMENSIONS.height
  });
  const handleCountdownInputKeyDown = (e) => {
  // ENTER: apply value and start countdown
  if (e.key === "Enter") {
    const totalSeconds = parseTimeString(countdownInput);
    if (totalSeconds == null || totalSeconds <= 0) {
      alert("Please enter a valid time as HH:MM:SS");
      return;
    }
    setCountdownSeconds(totalSeconds);
    setIsEditingCountdown(false);
    setCountdownMode(true);
    setIsRunning(true);
    return;
  }

  // ESC: cancel editing
  if (e.key === "Escape") {
    setIsEditingCountdown(false);
    return;
  }

  // Handle digit input
  if (/^\d$/.test(e.key)) {
    e.preventDefault(); // we will manually update the value

    if (!countdownInputRef.current) return;

    const editablePositions = [0, 1, 3, 4, 6, 7]; // H H : M M : S S
    let pos = countdownInputRef.current.selectionStart ?? 0;

    // Snap caret to a valid editable position
    if (!editablePositions.includes(pos)) {
      // If at a colon or weird place, move to next editable
      pos = editablePositions.find(p => p >= pos) ?? 7;
    }

    // Replace the character at the current position with the digit
    const chars = countdownInput.split("");
    chars[pos] = e.key;
    const newVal = chars.join("");
    setCountdownInput(newVal);

    // Move caret to next editable position
    const currentIndex = editablePositions.indexOf(pos);
    const nextIndex = Math.min(currentIndex + 1, editablePositions.length - 1);
    const nextPos = editablePositions[nextIndex];

    requestAnimationFrame(() => {
      if (countdownInputRef.current) {
        countdownInputRef.current.setSelectionRange(nextPos, nextPos + 1);
      }
    });

    return;
  }

  // Handle Backspace: go back one field and zero it
  if (e.key === "Backspace") {
    e.preventDefault();

    if (!countdownInputRef.current) return;

    const editablePositions = [0, 1, 3, 4, 6, 7];
    let pos = countdownInputRef.current.selectionStart ?? 0;

    // Ensure we're on an editable spot
    if (!editablePositions.includes(pos)) {
      pos = editablePositions.find(p => p < pos) ?? editablePositions[editablePositions.length - 1];
    }

    const index = editablePositions.indexOf(pos);
    const prevIndex = Math.max(index - 1, 0);
    const prevPos = editablePositions[prevIndex];

    const chars = countdownInput.split("");
    chars[prevPos] = "0"; // reset that digit to 0
    const newVal = chars.join("");
    setCountdownInput(newVal);

    requestAnimationFrame(() => {
      if (countdownInputRef.current) {
        countdownInputRef.current.setSelectionRange(prevPos, prevPos + 1);
      }
    });

    return;
  }

  // Block other random characters (like letters, space, etc.)
  if (e.key.length === 1 && !/\d/.test(e.key)) {
    e.preventDefault();
  }
};

  const parseTimeString = (str) =>{
    const parts = str.trim().split(":");
    if(parts.length!=3) return null;
    const [hStr, mStr, sStr] = parts;
    const hours = Number(hStr);
    const minutes = Number (mStr);
    const seconds = Number(sStr);
    if(
      Number.isNaN(hours) || Number.isNaN(minutes) || Number.isNaN(seconds) || hours<0 || minutes<0 || seconds<0 || minutes>59 || seconds> 59
    ){
      return null;
    }
    return hours*3600 + minutes*60 + seconds;
  };
  const handleMouseDown = (noteKey, e, index = null) => {
    e.preventDefault();
    audioRef.current.currentTime = 0;
    audioRef.current.play();
    
    if (index !== null) {
      setDraggedNoteIndex(index);
      setDraggedNote(stickyNotes[index].src);
      setIsDraggingExistingNote(true); // START dragging existing note
    } else {
      setDraggedNote(noteMap[noteKey]);
      setDraggedNoteIndex(null);
      setIsDraggingExistingNote(false);
    }
    
    setMousePos({ x: e.clientX, y: e.clientY });
  };
  const handleMouseMove = (e) => {
    if (draggedNote) {
      setMousePos({ x: e.clientX, y: e.clientY });
      
      // 🗑️ Check for trash bin collision if dragging an existing note
      if (isDraggingExistingNote) {
          const trashRect = getTrashRect();

          const isOver = (
              e.clientX > trashRect.x && 
              e.clientX < trashRect.x + trashRect.width &&
              e.clientY > trashRect.y &&
              e.clientY < trashRect.y + trashRect.height
          );
          setIsOverTrashBin(isOver);
      }
    }
  };
  const handleMouseUp = (e) => {
    if (draggedNote) {
      const containerRect = studyingRef.current.getBoundingClientRect();
      const x = e.clientX - containerRect.left;
      const y = e.clientY - containerRect.top;
      
      // 🗑️ Re-check collision on mouse up using viewport coordinates
      const trashRect = getTrashRect();
      const isDroppedOverTrash = (
          e.clientX > trashRect.x && 
          e.clientX < trashRect.x + trashRect.width &&
          e.clientY > trashRect.y &&
          e.clientY < trashRect.y + trashRect.height
      );

      if (isDraggingExistingNote && isDroppedOverTrash && draggedNoteIndex !== null) {
          // 🗑️ DELETE THE NOTE
          setStickyNotes(prev => prev.filter((_, index) => index !== draggedNoteIndex));
      } else if (draggedNoteIndex !== null) {
        // Repositioning an existing note (not dropped in trash)
        setStickyNotes(prev => 
          prev.map((note, index) => 
            index === draggedNoteIndex ? { ...note, x, y } : note
          )
        );
      } else {
        // Placing a new note
        setStickyNotes((prev) => [
          ...prev,
          { 
            src: draggedNote, 
            x, 
            y,
            text: '',
            drawings: []
          }
        ]);
      }

      setDraggedNote(null);
      setDraggedNoteIndex(null);
      setIsDraggingExistingNote(false); // Reset dragging state
      setIsOverTrashBin(false); // Reset trash bin state
    }
  };
  const handleNoteClick = (index, e) => {
    e.stopPropagation();
    if (!draggedNote) {
      setSelectedNoteIndex(index);
      setIsEditorOpen(true);
    }
  };
  const handleSaveNote = (text, drawings) => {
    if (selectedNoteIndex !== null) {
      setStickyNotes(prev =>
        prev.map((note, index) =>
          index === selectedNoteIndex 
            ? { ...note, text, drawings }
            : note
        )
      );
    }
    setIsEditorOpen(false);
    setSelectedNoteIndex(null);
  };
  const formatTime = (total) =>{
    const h = Math.floor(total/3600);
    const m = Math.floor((total%3600)/60);
    const s = total%60;
    const pad = (n) => n.toString().padStart(2,"0");
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  };
  const handleStart = () => {
    setCountdownMode(false);
    setSeconds(0);
    setIsRunning(true);
  };
  const handlePause = () => {
    setIsRunning(!isRunning);
  };
  const handleStop = () => {
    setIsRunning(false);
    setIsEditingCountdown(false);
    if(countdownMode){
      setCountdownSeconds(0);
      setCountdownMode(false);
    }else{
      setSeconds(0);
    }
  };
  const handleSetCountdown = () =>{
    setIsRunning(false);
    setCountdownMode(true);
    setIsEditingCountdown(true);
    const baseSeconds = countdownSeconds>0? countdownSeconds: 0;
    setCountdownInput(formatTime(baseSeconds));
  };
  return (
    <div
      ref={studyingRef}
      className="studying-container relative"
      style={{
        backgroundColor: '#a97c70ff',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        position: 'relative',
        userSelect: 'none'
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Table */}
      <img
        src={table}
        alt="table"
        draggable="false"
        style={{
          position: 'absolute',
          top: '57%',
          left: '0px',
          height: '300px',
          width: '1270px',
          zIndex: 10
        }}
      />

      {/* Sticky note bundles */}
      <img
        src={stickynote1}
        alt="stickynote1"
        draggable="false"
        onMouseDown={(e) => handleMouseDown('stickynote1', e)}
        style={{
          position: 'absolute',
          top: '58%',
          left: '140px',
          height: '90px',
          width: '90px',
          zIndex: 20,
          cursor: 'grab'
        }}
      />
       <img
        src={stickynote2}
        alt="stickynote2"
        draggable="false"
        onMouseDown={(e) => handleMouseDown('stickynote2', e)}
        style={{
          position: 'absolute',
          top: '64%',
          left: '86px',
          height: '90px',
          width: '90px',
          zIndex: 20,
          cursor: 'grab'
        }}
      />
      <img
        src={stickynote3}
        alt="stickynote3"
        draggable="false"
        onMouseDown={(e) => handleMouseDown('stickynote3', e)}
        style={{
          position: 'absolute',
          top: '64%',
          left: '190px',
          height: '90px',
          width: '90px',
          zIndex: 20,
          cursor: 'grab'
        }}
      />
      <img
        src={stickynote4}
        alt="stickynote4"
        draggable="false"
        onMouseDown={(e) => handleMouseDown('stickynote4', e)}
        style={{
          position: 'absolute',
          top: '70%',
          left: '135px',
          height: '90px',
          width: '90px',
          zIndex: 20,
          cursor: 'grab'
        }}
      />
      <div 
  className="clock-container"
  style={{
    position: 'absolute',
    top: '55%',
    left: '70%',
    height: '110px',
    width: '220px',
    zIndex: 30
  }}
>
  <img
    src={digitalClock}
    alt="digitalClock"
    style={{
      height: '100%',
      width: '100%',
      display: 'block'
    }}
  />
  <div className="clock-display">
    {isEditingCountdown? (
      <input
      ref = {countdownInputRef}
      className="clock-input"
      value = {countdownInput}
      onChange = {()=>{}}
      onKeyDown={handleCountdownInputKeyDown}
      />
    ):(
      countdownMode ? formatTime(countdownSeconds) : formatTime(seconds)
    )}
  </div>
  <button
  className="clock-btn-start"
  onClick={handleStart}
  ></button>
  <button
  className="clock-btn-set"
  onClick={handleSetCountdown}
  ></button>
  <button
  className="clock-btn-pause"
  onClick={handlePause}
  ></button>
  <button
  className="clock-btn-stop"
  onClick={handleStop}
  ></button>
</div>

      {/* 🗑️ TRASH BIN - Positioned at the bottom using fixed coordinates */}
      {isDraggingExistingNote && (
          <div
              style={{
                  position: 'fixed', // Essential for always being visible at bottom
                  left: TRASH_BIN_DIMENSIONS.left,
                  bottom: TRASH_BIN_DIMENSIONS.bottom, 
                  width: TRASH_BIN_DIMENSIONS.width,
                  height: TRASH_BIN_DIMENSIONS.height,
                  backgroundColor: isOverTrashBin ? 'rgba(255, 0, 0, 0.5)' : 'rgba(100, 100, 100, 0.7)',
                  borderRadius: '10px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  fontSize: '20px',
                  color: 'white',
                  zIndex: 50,
                  transition: 'background-color 0.2s'
              }}
          >
              {isOverTrashBin ? '🗑️ Drop to delete' : '🗑️ Trash'}
          </div>
      )}

      {/* Dragging note preview */}
      {draggedNote && (
        <img
          src={draggedNote}
          alt="dragging-note"
          draggable="false"
          style={{
            position: 'fixed',
            left: mousePos.x - 45,
            top: mousePos.y - 45,
            height: '120px',
            width: '120px',
            zIndex: 1000,
            pointerEvents: 'none',
            opacity: 0.9
          }}
        />
      )}

      {/* Placed sticky notes with content (Preview) */}
      {stickyNotes.map((note, index) => (
        <div 
          key={index} 
          style={{
            position: 'absolute',
            left: note.x - 60, 
            top: note.y - 60,  
            height: CONTENT_AREA.PREVIEW_SIZE, 
            width: CONTENT_AREA.PREVIEW_SIZE,  
            zIndex: 15,
          }}
          onMouseDown={(e) => handleMouseDown(null, e, index)}
          onClick={(e) => handleNoteClick(index, e)}
        >
          {/* Sticky Note Image */}
          <img
            src={note.src}
            alt={`note-${index}`}
            draggable="false"
            style={{
              position: 'absolute',
              height: '100%',
              width: '100%',
              cursor: 'pointer'
            }}
          />
          
          {/* Text Content (Using hardcoded pixel values from your last submission) */}
          {note.text && (
            <div
              style={{
                position: 'absolute',
                left: '15px', 
                top: '16px', 
                width: '80px', 
                height: '70px',  
                zIndex: 16,
                fontSize: '8px', 
                fontFamily: 'Arial, sans-serif',
                color: '#000',
                overflow: 'hidden',
                padding: '5px',
                wordWrap: 'break-word',
                pointerEvents: 'none' ,
                whiteSpace: 'pre-wrap',
              }}
            >
              {note.text}
            </div>
          )}
          
          {/* Drawings Canvas (uses CONTENT_AREA) */}
          {note.drawings && note.drawings.length > 0 && (
            <StickyNoteDrawing
              drawings={note.drawings}
              position={{ 
                x: CONTENT_AREA.PREVIEW_LEFT_OFFSET, 
                y: CONTENT_AREA.PREVIEW_TOP_OFFSET 
              }}
              size={CONTENT_AREA.PREVIEW_WIDTH} 
            />
          )}
        </div>
      ))}

      {/* Sticky Note Editor Modal */}
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

// =======================================================================
// === 2. StickyNoteDrawing Component ===
// =======================================================================

const StickyNoteDrawing = ({ drawings, position, size }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current) { 
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      drawings.forEach(drawing => {
        if (drawing.points && drawing.points.length > 1) {
          ctx.beginPath();
          
          const startX = drawing.points[0].x * canvas.width;
          const startY = drawing.points[0].y * canvas.height;
          ctx.moveTo(startX, startY);
          
          for (let i = 1; i < drawing.points.length; i++) {
            const x = drawing.points[i].x * canvas.width;
            const y = drawing.points[i].y * canvas.height;
            ctx.lineTo(x, y);
          }
          
          ctx.stroke();
        }
      });
    }
  }, [drawings, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size} 
      height={size} 
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        width: size,
        height: size,
        zIndex: 16,
        pointerEvents: 'none'
      }}
    />
  );
};
// =======================================================================
// === 3. StickyNoteEditor Component ===
// =======================================================================
const StickyNoteEditor = ({ note, onSave, onClose }) => {
  const [text, setText] = useState(note.text || '');
  const [tool, setTool] = useState('text');
  const [drawing, setDrawing] = useState(false);
  const [drawings, setDrawings] = useState(note.drawings || []);
  const canvasRef = useRef(null);
  
  const editorSize = 400; 
  const canvasSize = editorSize * (CONTENT_AREA.EDITOR_WIDTH_PERCENT / 100); 
  
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 4; 
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      drawings.forEach(drawing => {
        if (drawing.points && drawing.points.length > 1) {
          ctx.beginPath();
          
          const startX = drawing.points[0].x * canvas.width;
          const startY = drawing.points[0].y * canvas.height;
          ctx.moveTo(startX, startY);
          
          for (let i = 1; i < drawing.points.length; i++) {
            const x = drawing.points[i].x * canvas.width;
            const y = drawing.points[i].y * canvas.height;
            ctx.lineTo(x, y);
          }
          
          ctx.stroke();
        }
      });
    }
  }, [drawings, tool, canvasSize]); 

  const handleSave = () => {
    onSave(text, drawings);
  };

  const getRelativeMouseCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    return { x, y };
  }

  const handleMouseDown = (e) => {
    if (tool === 'pen') {
      setDrawing(true);
      const { x, y } = getRelativeMouseCoordinates(e);
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      ctx.beginPath();
      ctx.moveTo(x * canvas.width, y * canvas.height);
      
      setDrawings(prev => [...prev, { type: 'pen', points: [{x, y}] }]);
    }
  };

  const handleMouseMove = (e) => {
    if (drawing && tool === 'pen') {
      const { x, y } = getRelativeMouseCoordinates(e);
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      ctx.lineTo(x * canvas.width, y * canvas.height);
      ctx.stroke();
      
      setDrawings(prev => {
        const newDrawings = [...prev];
        const lastDrawing = newDrawings[newDrawings.length - 1];
        lastDrawing.points.push({x, y});
        return newDrawings;
      });
    }
  };

  const handleMouseUp = () => {
    setDrawing(false);
  };

  const clearCanvas = () => {
    setDrawings([]);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 2000
    }} onClick={onClose}>
      <div style={{
        position: 'relative',
        width: `${editorSize}px`,
        height: `${editorSize}px`
      }} onClick={(e) => e.stopPropagation()}>
        
        {/* Sticky Note Background */}
        <img
          src={note.src}
          alt="sticky-note-editor"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
          }}
        />
        
        {/* Toolbar */}
        <div style={{
          position: 'absolute',
          top: '-50px',
          left: '0',
          right: '0',
          display: 'flex',
          justifyContent: 'center',
          gap: '10px',
          background: 'white',
          padding: '10px',
          borderRadius: '5px',
          boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
        }}>
          <button 
            onClick={() => setTool('pen')}
            style={{ 
              backgroundColor: tool === 'pen' ? '#007bff' : '#f8f9fa',
              color: tool === 'pen' ? 'white' : 'black',
              padding: '5px 10px',
              border: '1px solid #ccc',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            ✏️ Pen
          </button>
          <button 
            onClick={() => setTool('text')}
            style={{ 
              backgroundColor: tool === 'text' ? '#007bff' : '#f8f9fa',
              color: tool === 'text' ? 'white' : 'black',
              padding: '5px 10px',
              border: '1px solid #ccc',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            📝 Text
          </button>
          <button 
            onClick={clearCanvas}
            style={{ 
              backgroundColor: '#dc3545',
              color: 'white',
              padding: '5px 10px',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            🗑️ Clear
          </button>
        </div>

        {/* Text Input Area - Corrected Font Size and Positioning */}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write your note..."
          style={{
            position: 'absolute',
            left: `${CONTENT_AREA.EDITOR_LEFT_PERCENT}%`,
            top: `${CONTENT_AREA.EDITOR_TOP_PERCENT}%`,
            // Using percentages for width/height ensures it scales with the editor container
            width: `${CONTENT_AREA.EDITOR_WIDTH_PERCENT}%`, 
            height: `${CONTENT_AREA.EDITOR_HEIGHT_PERCENT}%`, 
            padding: '10px',
            border: 'none',
            fontSize: '20px', 
            fontFamily: 'Arial, sans-serif',
            resize: 'none',
            backgroundColor: 'transparent',
            outline: 'none',
            lineHeight: '1.4',
            zIndex: 10,
            pointerEvents: tool === 'pen' ? 'none' : 'auto' 
          }}
        />

        {/* Drawing Canvas - Stays visible on top of text input */}
        <canvas
          ref={canvasRef}
          width={canvasSize} 
          height={canvasSize} 
          style={{
            position: 'absolute',
            left: `${CONTENT_AREA.EDITOR_LEFT_PERCENT}%`,
            top: `${CONTENT_AREA.EDITOR_TOP_PERCENT}%`,
            width: `${CONTENT_AREA.EDITOR_WIDTH_PERCENT}%`, 
            height: `${CONTENT_AREA.EDITOR_HEIGHT_PERCENT}%`, 
            cursor: tool === 'pen' ? 'crosshair' : 'default',
            backgroundColor: 'transparent',
            zIndex: tool === 'pen' ? 15 : 5 
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />

        {/* Action Buttons */}
        <div style={{
          position: 'absolute',
          bottom: '-50px',
          left: '0',
          right: '0',
          display: 'flex',
          justifyContent: 'center',
          gap: '10px'
        }}>
          <button 
            onClick={onClose}
            style={{
              padding: '8px 16px',
              border: '1px solid #ccc',
              borderRadius: '5px',
              backgroundColor: '#f8f9fa',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: '5px',
              backgroundColor: '#007bff',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default Studying;