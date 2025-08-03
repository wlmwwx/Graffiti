# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **hand tracking drawing application** that enables users to draw directly on their camera feed using hand gestures. The application uses MediaPipe for real-time hand tracking and HTML5 Canvas for AR-style drawing experience.

## Development Commands

### Local Development
```bash
# Quick start (auto-detects Python/Node.js/PHP)
./start-local.sh        # macOS/Linux
start-local.bat         # Windows

# Manual start options
python -m http.server 8000     # Access: http://localhost:8000
npx serve . -p 8001           # Access: http://localhost:8001
npm start                     # Uses package.json script
```

### Deployment
```bash
./deploy.sh                   # Automated deployment script
npm run deploy               # Git add, commit, push
```

**Important**: Application requires HTTPS or localhost for camera permissions. Use local server scripts, never open index.html directly in browser.

## Architecture Overview

### Core Application Structure
- **Single HTML Page**: `index.html` with layered canvas architecture
- **Unified Canvas System**: 4-layer rendering stack:
  1. Video background (z-index: 1) - Camera feed
  2. Hand tracking overlay (z-index: 2) - MediaPipe annotations  
  3. Drawing canvas (z-index: 3) - User artwork
  4. UI elements (z-index: 4) - Controls and status

### Main Application Class: `HandTrackingDrawingApp`

**Initialization Pipeline**:
```javascript
constructor() {
  this.initializeElements()      // DOM element references
  this.initializeState()         // Application state variables
  this.initializeEventListeners() // UI interactions
  this.initializeMediaPipe()     // Hand tracking setup
  this.initializeCamera()        // WebRTC camera access  
  this.startPerformanceMonitoring() // FPS and metrics
}
```

**Core Subsystems**:

1. **MediaPipe Integration** (`initializeMediaPipe()`, `onHandResults()`)
   - Hand detection with configurable complexity (0-2)
   - Gesture recognition: fist, point, peace, open palm
   - Performance optimized: 25fps processing, 640x480 resolution

2. **Gesture-to-Drawing Pipeline** (`detectGesture()`, `handleDrawing()`)
   - Point gesture (👆) = Drawing mode
   - Open palm (✋) = Cursor movement  
   - Peace sign (✌️) = UI interaction
   - Fist (👊) = Stop all actions

3. **Canvas Rendering System** (`draw()`, `drawPoint()`)
   - Bézier curve smoothing for natural strokes
   - Distance-based stroke optimization (skips <2px movements)
   - Shadow effects for visibility over video background
   - Separate eraser mode with destination-out blending

4. **Performance Management**
   - Multi-tier throttling system:
     - Main loop: 60fps (16ms)
     - MediaPipe: 25fps (40ms) 
     - Gesture detection: 10fps (100ms)
     - Hand tracking display: 10fps (100ms)
   - Optional hand tracking visualization toggle
   - Memory-optimized canvas clearing with debouncing

### Coordinate System
- **Video**: Mirrored horizontally for natural user experience
- **Drawing**: Non-mirrored coordinates for proper artwork orientation
- **Conversion**: `indexTip.x * containerRect.width` handles video-to-canvas mapping

### Performance Optimizations
- **Intelligent Throttling**: Different frame rates for different subsystems
- **Conditional Rendering**: Hand tracking display is optional (off by default)
- **Canvas Optimization**: Automatic resolution limiting, efficient clearing
- **Gesture Debouncing**: 200ms stability requirement prevents false triggers

## Key Technical Considerations

### Camera Permissions
- Application includes comprehensive browser-specific permission guidance
- Automatic HTTPS/localhost detection with fallback instructions
- Permission state monitoring with real-time status updates

### Performance Trade-offs
- Hand tracking display can be toggled for performance vs. visual feedback
- MediaPipe complexity configurable (currently set to 0 for best performance)  
- Drawing smoothness vs. accuracy balance through distance thresholding

### Browser Compatibility
- Chrome 88+, Firefox 85+, Safari 14+, Edge 88+ required
- WebRTC getUserMedia API dependency
- MediaPipe CDN integration for cross-browser hand tracking

### Error Handling
- Graceful degradation when MediaPipe fails to load
- Camera access failure recovery with detailed troubleshooting
- Performance monitoring with automatic optimization suggestions

## File Dependencies

- **External CDN**: MediaPipe libraries loaded from jsdelivr CDN
- **No Build Process**: Pure vanilla HTML/CSS/JavaScript
- **Static Assets**: All resources self-contained, suitable for static hosting
- **Cloudflare Ready**: Includes `_headers` file for optimal CDN configuration

## Debugging

The application includes built-in performance monitoring accessible through browser console. Key metrics tracked:
- MediaPipe processing time
- Canvas rendering time  
- Drawing latency
- Frame skip counts
- FPS monitoring

Toggle hand tracking display using the "显示追踪" button to balance performance vs. visual debugging needs.