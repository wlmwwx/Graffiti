class HandTrackingDrawingApp {
  constructor() {
    this.initializeElements();
    this.initializeState();
    this.initializeEventListeners();
    this.initializeMediaPipe();
    this.initializeCamera();
    this.startPerformanceMonitoring();
  }

  initializeElements() {
    // 视频和画布元素
    this.videoElement = document.getElementById("videoElement");
    this.videoCanvas = document.getElementById("videoCanvas");
    this.drawingCanvas = document.getElementById("drawingCanvas");
    this.videoCtx = this.videoCanvas.getContext("2d");
    this.drawingCtx = this.drawingCanvas.getContext("2d");

    // UI控制元素
    this.brushSizeSlider = document.getElementById("brushSize");
    this.brushSizeValue = document.getElementById("brushSizeValue");
    this.colorOptions = document.querySelectorAll(".color-option");
    this.toolButtons = document.querySelectorAll(".tool-btn[data-tool]");
    this.clearButton = document.getElementById("clearCanvas");
    this.saveButton = document.getElementById("saveImage");
    this.toggleTrackingButton = document.getElementById("toggleTracking");

    // 调试和性能控制元素
    this.toggleDebugButton = document.getElementById("toggleDebug");
    this.performanceModeButton = document.getElementById("performanceMode");
    this.debugPanel = document.getElementById("debugPanel");
    this.debugInfo = document.getElementById("debugInfo");
    this.performanceStatus = document.getElementById("performanceStatus");

    // 调试面板内的元素
    this.mediapipeTimeSpan = document.getElementById("mediapipeTime");
    this.canvasTimeSpan = document.getElementById("canvasTime");
    this.drawingLatencySpan = document.getElementById("drawingLatency");
    this.frameSkipsSpan = document.getElementById("frameSkips");

    // 状态显示元素
    this.handStatus = document.getElementById("handStatus");
    this.gestureStatus = document.getElementById("gestureStatus");
    this.currentTool = document.getElementById("currentTool");
    this.currentColor = document.getElementById("currentColor");
    this.permissionStatus = document.getElementById("permissionStatus");
    this.permissionText = document.getElementById("permissionText");
  }

  initializeState() {
    // 绘画状态
    this.isDrawing = false;
    this.currentBrushSize = 5;
    this.currentBrushColor = "#000000";
    this.currentTool = "brush";
    this.lastDrawPoint = null;

    // 手部追踪状态
    this.handLandmarks = null;
    this.isHandDetected = false;
    this.currentGesture = "none";
    this.gestureStartTime = 0;
    this.gestureStableTime = 200; // 手势稳定时间（毫秒）

    // 性能优化变量
    this.lastDrawTime = 0;
    this.isRedrawing = false;
    this.showHandTracking = false; // 默认不显示手部追踪，提高性能
    this.handTrackingPending = false; // 防止重复调度
    this.lastClearTime = 0; // 防止频繁清除画布
    this.lastGestureTime = 0; // 手势检测节流

    // 调试和性能监控变量
    this.debugMode = false;
    this.performanceMode = false; // 高性能模式开关
    this.debugMetrics = {
      mediapipeTime: 0,
      canvasTime: 0,
      drawingLatency: 0,
      frameSkips: 0,
      lastDrawStart: 0,
    };

    // 画布尺寸设置
    this.resizeCanvases();
    this.optimizeCanvasSize();
    window.addEventListener("resize", () => {
      this.resizeCanvases();
      this.optimizeCanvasSize();
    });

    // 创建虚拟光标
    this.createVirtualCursor();
  }

  createVirtualCursor() {
    this.cursor = document.createElement("div");
    this.cursor.className = "drawing-cursor";
    this.cursor.style.display = "none";
    document.body.appendChild(this.cursor);
  }

  resizeCanvases() {
    const container = document.querySelector(".camera-drawing-container");

    // 设置所有画布为相同尺寸
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 视频画布 (手部追踪显示)
    this.videoCanvas.width = width;
    this.videoCanvas.height = height;

    // 绘画画布 (用户绘画)
    this.drawingCanvas.width = width;
    this.drawingCanvas.height = height;

    // 设置绘画上下文属性
    this.drawingCtx.lineCap = "round";
    this.drawingCtx.lineJoin = "round";

    console.log(`画布尺寸设置为: ${width}x${height}`);
  }

  initializeEventListeners() {
    // 画笔大小控制
    this.brushSizeSlider.addEventListener("input", (e) => {
      this.currentBrushSize = parseInt(e.target.value);
      this.brushSizeValue.textContent = this.currentBrushSize;
    });

    // 颜色选择
    this.colorOptions.forEach((option) => {
      option.addEventListener("click", (e) => {
        this.colorOptions.forEach((opt) => opt.classList.remove("active"));
        e.target.classList.add("active");
        this.currentBrushColor = e.target.dataset.color;
        this.currentColor.style.backgroundColor = this.currentBrushColor;
      });
    });

    // 工具选择
    this.toolButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        this.toolButtons.forEach((btn) => btn.classList.remove("active"));
        e.target.classList.add("active");
        this.currentTool = e.target.dataset.tool;
        this.currentTool.textContent =
          this.currentTool === "brush" ? "画笔" : "橡皮擦";
        this.updateCursor();
      });
    });

    // 清除画布
    this.clearButton.addEventListener("click", () => {
      this.clearCanvas();
    });

    // 保存图片
    this.saveButton.addEventListener("click", () => {
      this.saveImage();
    });

    // 切换手部追踪显示
    this.toggleTrackingButton.addEventListener("click", () => {
      this.toggleHandTracking();
    });

    // 调试面板控制
    this.toggleDebugButton.addEventListener("click", () => {
      this.toggleDebugMode();
    });

    // 性能模式控制
    this.performanceModeButton.addEventListener("click", () => {
      this.togglePerformanceMode();
    });

    // 错误弹窗控制
    this.errorModal = document.getElementById("errorModal");
    this.errorMessage = document.getElementById("errorMessage");
    this.retryButton = document.getElementById("retryButton");
    this.closeButton = document.querySelector(".close");

    this.closeButton.addEventListener("click", () => {
      this.hideError();
    });

    this.retryButton.addEventListener("click", () => {
      this.hideError();
      this.initializeCamera();
    });

    // 点击弹窗外部关闭
    this.errorModal.addEventListener("click", (e) => {
      if (e.target === this.errorModal) {
        this.hideError();
      }
    });

    // 键盘快捷键
    document.addEventListener("keydown", (e) => {
      switch (e.key) {
        case "c":
        case "C":
          this.clearCanvas();
          break;
        case "b":
        case "B":
          this.switchTool("brush");
          break;
        case "e":
        case "E":
          this.switchTool("eraser");
          break;
        case "F12":
          e.preventDefault();
          this.toggleDebugMode();
          break;
      }

      // Ctrl+D 开启调试模式
      if (e.ctrlKey && e.key === "d") {
        e.preventDefault();
        this.toggleDebugMode();
      }
    });
  }

  async initializeMediaPipe() {
    try {
      this.hands = new Hands({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        },
      });

      this.hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 0, // 降低模型复杂度，提高性能
        minDetectionConfidence: 0.8, // 提高检测阈值，减少误检
        minTrackingConfidence: 0.7, // 提高追踪阈值，更稳定
        selfieMode: true, // 启用自拍模式，提高镜像体验
      });

      this.hands.onResults((results) => this.onHandResults(results));

      console.log("MediaPipe 手部追踪初始化成功");
    } catch (error) {
      console.error("MediaPipe 初始化失败:", error);
      this.showError(
        "MediaPipe 手部追踪库加载失败",
        "请检查网络连接或刷新页面重试"
      );
    }
  }

  async initializeCamera() {
    try {
      // 检查浏览器是否支持摄像头
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("UNSUPPORTED_BROWSER");
      }

      // 检查当前协议
      const isSecureContext =
        window.isSecureContext ||
        location.protocol === "https:" ||
        location.hostname === "localhost" ||
        location.hostname === "127.0.0.1";

      if (!isSecureContext) {
        throw new Error("INSECURE_CONTEXT");
      }

      // 先检查权限状态
      await this.checkCameraPermission();

      // 请求摄像头权限，降低分辨率和帧率
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 }, // 降低分辨率
          height: { ideal: 480 }, // 降低分辨率
          frameRate: { ideal: 15, max: 20 }, // 限制帧率
          facingMode: "user",
        },
      });

      this.videoElement.srcObject = stream;

      this.videoElement.addEventListener("loadeddata", () => {
        this.startHandTracking();
        this.handStatus.textContent = "摄像头已连接，等待手部检测...";
      });

      console.log("摄像头初始化成功");
    } catch (error) {
      console.error("摄像头访问失败:", error);
      this.handleCameraError(error);
    }
  }

  async checkCameraPermission() {
    try {
      if (navigator.permissions) {
        const permission = await navigator.permissions.query({
          name: "camera",
        });
        console.log("摄像头权限状态:", permission.state);

        switch (permission.state) {
          case "granted":
            this.showPermissionStatus("granted", "✅ 摄像头权限已授权");
            break;
          case "prompt":
            this.showPermissionStatus("prompt", "⚠️ 即将请求摄像头权限");
            break;
          case "denied":
            this.showPermissionStatus("denied", "❌ 摄像头权限被拒绝");
            throw new Error("PERMISSION_DENIED");
        }

        // 监听权限变化
        permission.addEventListener("change", () => {
          console.log("权限状态变化:", permission.state);
          switch (permission.state) {
            case "granted":
              this.showPermissionStatus("granted", "✅ 摄像头权限已授权");
              this.hideError();
              this.initializeCamera();
              break;
            case "denied":
              this.showPermissionStatus("denied", "❌ 摄像头权限被拒绝");
              break;
          }
        });
      }
    } catch (error) {
      console.log("无法检查摄像头权限状态:", error);
    }
  }

  handleCameraError(error) {
    let title = "摄像头访问失败";
    let message = "";
    let showInstructions = false;

    switch (error.name || error.message) {
      case "NotAllowedError":
      case "PERMISSION_DENIED":
        title = "摄像头权限被拒绝";
        message = "请按照以下步骤允许摄像头权限：";
        showInstructions = true;
        break;

      case "NotFoundError":
        title = "未找到摄像头";
        message =
          "请确保：\n• 计算机已连接摄像头\n• 摄像头驱动正常工作\n• 摄像头未被其他应用占用";
        break;

      case "NotReadableError":
        title = "摄像头被占用";
        message =
          "摄像头正在被其他应用使用，请：\n• 关闭其他使用摄像头的应用\n• 刷新页面重试";
        break;

      case "INSECURE_CONTEXT":
        title = "需要安全连接";
        message =
          "摄像头需要HTTPS连接，请：\n• 使用 https:// 访问\n• 或使用 localhost 进行本地开发\n• 或使用本地服务器（见下方说明）";
        showInstructions = true;
        break;

      case "UNSUPPORTED_BROWSER":
        title = "浏览器不支持";
        message =
          "请使用支持摄像头的现代浏览器：\n• Chrome 88+\n• Firefox 85+\n• Safari 14+\n• Edge 88+";
        break;

      default:
        message = `错误详情：${
          error.message || error.name || "未知错误"
        }\n\n请尝试：\n• 刷新页面\n• 检查摄像头连接\n• 使用其他浏览器`;
        break;
    }

    this.showCameraError(title, message, showInstructions);
  }

  startHandTracking() {
    let lastProcessTime = 0;
    let frameSkipCount = 0;
    // 优化处理间隔：在性能和响应性之间找到平衡
    const processInterval = 40; // 调整为25fps，减少处理负担

    const camera = new Camera(this.videoElement, {
      onFrame: async () => {
        const now = Date.now();
        // 限制MediaPipe处理频率，优化性能
        if (now - lastProcessTime >= processInterval) {
          try {
            const sendStart = Date.now();
            await this.hands.send({ image: this.videoElement });
            const sendTime = Date.now() - sendStart;

            // 更新调试指标
            this.debugMetrics.mediapipeTime = sendTime;

            if (sendTime > 40) {
              // 降低警告阈值
              console.warn(`[MediaPipe性能] 处理耗时: ${sendTime}ms`);
            }

            if (frameSkipCount > 0) {
              this.debugMetrics.frameSkips += frameSkipCount;
              frameSkipCount = 0;
            }

            lastProcessTime = now;
          } catch (error) {
            console.warn("MediaPipe处理错误:", error);
          }
        } else {
          frameSkipCount++;
        }
      },
      width: 640, // 保持较低分辨率以提高性能
      height: 480,
    });
    camera.start();
    console.log(
      "[初始化] 手部追踪已启动，分辨率: 640x480, 处理间隔: 40ms (25fps)"
    );
  }

  onHandResults(results) {
    // 性能计数和调试日志
    const now = Date.now();
    if (this.performanceMetrics) {
      this.performanceMetrics.frameCount++;
      // 添加详细的性能日志
      if (this.performanceMetrics.frameCount % 30 === 0) {
        console.log(
          `[性能监控] 处理帧数: ${this.performanceMetrics.frameCount}, 当前FPS: ${this.performanceMetrics.fps}`
        );
      }
    }

    // 记录处理间隔
    if (this.lastProcessTime) {
      const interval = now - this.lastProcessTime;
      if (interval > 50) {
        // 如果间隔超过50ms，记录警告
        console.warn(`[性能警告] MediaPipe处理间隔过长: ${interval}ms`);
      }
    }
    this.lastProcessTime = now;

    // 优化节流机制：统一处理频率为30fps，减少冲突
    if (this.lastDrawTime && now - this.lastDrawTime < 33) {
      // 统一为30fps，与MediaPipe处理频率一致
      return;
    }
    this.lastDrawTime = now;

    // 处理手部检测
    const hasHands =
      results.multiHandLandmarks && results.multiHandLandmarks.length > 0;

    if (hasHands) {
      this.isHandDetected = true;
      this.handLandmarks = results.multiHandLandmarks[0];
      this.handStatus.textContent = "手部检测: 正常";

      // 检测手势
      this.detectGesture();

      // 处理绘画逻辑
      this.handleDrawing();

      // 只有启用追踪显示时才重绘手部标注，且使用防抖
      if (this.showHandTracking) {
        this.scheduleHandTracking(results);
      }
    } else {
      // 只在状态改变时更新
      if (this.isHandDetected) {
        this.isHandDetected = false;
        this.handLandmarks = null;
        this.handStatus.textContent = "等待手部检测...";
        this.gestureStatus.textContent = "手势: 无";
        this.cursor.style.display = "none";
        this.stopDrawing();

        // 清除手部追踪显示
        if (this.showHandTracking) {
          this.clearHandAnnotations();
        }
      }
    }
  }

  // 新的手部追踪调度器，防止频繁重绘
  scheduleHandTracking(results) {
    if (this.handTrackingPending) {
      console.log("[调试] 手部追踪重绘被跳过 - 上次重绘仍在进行");
      return;
    }

    this.handTrackingPending = true;
    const startTime = Date.now();
    setTimeout(() => {
      if (this.showHandTracking && this.isHandDetected) {
        const drawStart = Date.now();
        this.drawHandAnnotations(results);
        const drawTime = Date.now() - drawStart;
        if (drawTime > 10) {
          console.warn(`[性能警告] 手部标注绘制耗时: ${drawTime}ms`);
        }
      }
      this.handTrackingPending = false;
      const totalTime = Date.now() - startTime;
      if (totalTime > 120) {
        console.warn(`[性能警告] 手部追踪调度总耗时: ${totalTime}ms`);
      }
    }, 100); // 降低手部追踪显示频率到10fps
  }

  drawHandAnnotations(results) {
    // 优化清除操作：只在必要时清除，减少闪烁
    if (
      !this.lastHandAnnotationTime ||
      Date.now() - this.lastHandAnnotationTime > 100
    ) {
      this.videoCtx.clearRect(
        0,
        0,
        this.videoCanvas.width,
        this.videoCanvas.height
      );
      this.lastHandAnnotationTime = Date.now();
    }

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0];

      // 优化绘制：保存和恢复上下文状态，减少线宽提高性能
      this.videoCtx.save();

      // 绘制手部连接线 - 减少线宽提高性能
      drawConnectors(this.videoCtx, landmarks, HAND_CONNECTIONS, {
        color: "#00FF00",
        lineWidth: 1, // 从2减少到1
      });

      // 绘制关键点 - 减少半径提高性能
      drawLandmarks(this.videoCtx, landmarks, {
        color: "#FF0000",
        lineWidth: 1,
        radius: 2, // 从3减少到2
      });

      this.videoCtx.restore();
    }
  }

  clearHandAnnotations() {
    // 避免频繁清除，只在必要时清除
    if (this.lastClearTime && Date.now() - this.lastClearTime < 100) {
      return;
    }

    this.lastClearTime = Date.now();
    // 使用高效的清除方法
    this.videoCtx.clearRect(
      0,
      0,
      this.videoCanvas.width,
      this.videoCanvas.height
    );
  }

  detectGesture() {
    if (!this.handLandmarks) return;

    // 手势检测也需要节流，避免过度计算
    const now = Date.now();
    if (this.lastGestureTime && now - this.lastGestureTime < 100) {
      return;
    }
    this.lastGestureTime = now;

    const landmarks = this.handLandmarks;

    // 获取关键手指的关键点
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const indexPip = landmarks[6];
    const middleTip = landmarks[12];
    const middlePip = landmarks[10];
    const ringTip = landmarks[16];
    const ringPip = landmarks[14];
    const pinkyTip = landmarks[20];
    const pinkyPip = landmarks[18];

    // 检测手指是否伸直
    const isIndexStraight = indexTip.y < indexPip.y;
    const isMiddleStraight = middleTip.y < middlePip.y;
    const isRingStraight = ringTip.y < ringPip.y;
    const isPinkyStraight = pinkyTip.y < pinkyPip.y;

    // 计算伸直的手指数量
    const straightFingers = [
      isIndexStraight,
      isMiddleStraight,
      isRingStraight,
      isPinkyStraight,
    ].filter(Boolean).length;

    let detectedGesture = "unknown";

    // 手势识别逻辑
    if (straightFingers === 0) {
      detectedGesture = "fist"; // 握拳
    } else if (straightFingers === 1 && isIndexStraight) {
      detectedGesture = "point"; // 指向（绘画）
    } else if (straightFingers === 2 && isIndexStraight && isMiddleStraight) {
      detectedGesture = "peace"; // 和平手势（点击/选择）
    } else if (straightFingers >= 3) {
      detectedGesture = "open"; // 张开手掌（移动光标）
    }

    // 手势稳定性检查
    const currentTime = Date.now();
    if (detectedGesture !== this.currentGesture) {
      this.gestureStartTime = currentTime;
      this.currentGesture = detectedGesture;
    } else if (currentTime - this.gestureStartTime > this.gestureStableTime) {
      this.updateGestureStatus(detectedGesture);
    }
  }

  updateGestureStatus(gesture) {
    const gestureNames = {
      fist: "握拳 - 停止",
      point: "指向 - 绘画",
      peace: "胜利 - 选择",
      open: "张开 - 移动",
      unknown: "未知手势",
    };

    this.gestureStatus.textContent = `手势: ${
      gestureNames[gesture] || gesture
    }`;
  }

  handleDrawing() {
    if (!this.handLandmarks) return;

    const indexTip = this.handLandmarks[8];

    // 获取容器尺寸
    const container = document.querySelector(".camera-drawing-container");
    const containerRect = container.getBoundingClientRect();

    // 由于视频是镜像的，但绘画不镜像，需要正确转换坐标
    // 视频坐标: 0(左) -> 1(右)，转换为绘画坐标: 0(左) -> width(右) (不镜像)
    const x = indexTip.x * containerRect.width;
    const y = indexTip.y * containerRect.height;

    // 更新虚拟光标位置 (相对于屏幕的绝对位置)
    const screenX = containerRect.left + x;
    const screenY = containerRect.top + y;
    this.updateCursorPosition(screenX, screenY);

    // 根据手势执行相应动作 (使用容器内的相对坐标)
    switch (this.currentGesture) {
      case "point":
        this.startDrawing(x, y);
        break;
      case "peace":
        this.handleClick(x, y);
        break;
      case "open":
      case "fist":
      default:
        this.stopDrawing();
        break;
    }
  }

  updateCursorPosition(screenX, screenY) {
    this.cursor.style.display = "block";
    this.cursor.style.left = screenX - 10 + "px";
    this.cursor.style.top = screenY - 10 + "px";
  }

  updateCursor() {
    if (this.currentTool === "eraser") {
      this.cursor.classList.add("erasing");
      this.cursor.classList.remove("drawing");
    } else {
      this.cursor.classList.add("drawing");
      this.cursor.classList.remove("erasing");
    }
  }

  startDrawing(x, y) {
    const drawStart = Date.now();
    this.debugMetrics.lastDrawStart = drawStart;

    if (!this.isDrawing) {
      this.isDrawing = true;
      this.lastDrawPoint = { x, y };
      this.cursor.classList.add(
        this.currentTool === "eraser" ? "erasing" : "drawing"
      );

      // 绘制起始点
      this.drawPoint(x, y);
    } else {
      this.draw(x, y);
    }

    // 更新调试指标
    const drawTime = Date.now() - drawStart;
    this.debugMetrics.drawingLatency = drawTime;
  }

  drawPoint(x, y) {
    // 优化绘制单点，减少阴影效果提高性能
    this.drawingCtx.save(); // 保存上下文状态

    this.drawingCtx.globalCompositeOperation =
      this.currentTool === "eraser" ? "destination-out" : "source-over";

    if (this.currentTool === "brush") {
      this.drawingCtx.strokeStyle = this.currentBrushColor;
      this.drawingCtx.fillStyle = this.currentBrushColor;
      this.drawingCtx.lineWidth = this.currentBrushSize;

      // 简化阴影效果，减少性能消耗
      if (this.currentBrushSize > 5) {
        this.drawingCtx.shadowColor = "rgba(255, 255, 255, 0.3)"; // 降低透明度
        this.drawingCtx.shadowBlur = 1; // 减少模糊半径
      }
    } else {
      this.drawingCtx.fillStyle = "rgba(0,0,0,1)"; // 橡皮擦用黑色
      this.drawingCtx.lineWidth = this.currentBrushSize;
    }

    this.drawingCtx.beginPath();
    this.drawingCtx.arc(x, y, this.currentBrushSize / 2, 0, Math.PI * 2);
    this.drawingCtx.fill();

    this.drawingCtx.restore(); // 恢复上下文状态
  }

  draw(x, y) {
    if (!this.isDrawing || !this.lastDrawPoint) return;

    // 优化距离计算，提高阈值减少绘制频率
    const dx = x - this.lastDrawPoint.x;
    const dy = y - this.lastDrawPoint.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // 提高距离阈值，减少过密绘制
    if (distance < 3) return; // 从2提高到3

    this.drawingCtx.save(); // 保存上下文状态

    this.drawingCtx.globalCompositeOperation =
      this.currentTool === "eraser" ? "destination-out" : "source-over";

    // 简化绘画效果，提高性能
    if (this.currentTool === "brush") {
      this.drawingCtx.strokeStyle = this.currentBrushColor;
      this.drawingCtx.lineWidth = this.currentBrushSize;

      // 只对较粗的画笔添加轻微阴影
      if (this.currentBrushSize > 8) {
        this.drawingCtx.shadowColor = "rgba(255, 255, 255, 0.2)";
        this.drawingCtx.shadowBlur = 1;
      }
    } else {
      this.drawingCtx.lineWidth = this.currentBrushSize;
    }

    // 使用简单直线替代贝塞尔曲线，提高性能
    this.drawingCtx.beginPath();
    this.drawingCtx.moveTo(this.lastDrawPoint.x, this.lastDrawPoint.y);
    this.drawingCtx.lineTo(x, y);
    this.drawingCtx.stroke();

    this.drawingCtx.restore(); // 恢复上下文状态
    this.lastDrawPoint = { x, y };
  }

  stopDrawing() {
    this.isDrawing = false;
    this.lastDrawPoint = null;
    this.cursor.classList.remove("drawing", "erasing");
  }

  handleClick(x, y) {
    // 和平手势用于点击工具栏，这里暂时不处理画布内的点击
    // 可以在未来扩展为选择工具等功能
    console.log(`点击位置: ${x}, ${y}`);
  }

  switchTool(tool) {
    this.toolButtons.forEach((btn) => btn.classList.remove("active"));
    const targetButton = document.querySelector(`[data-tool="${tool}"]`);
    if (targetButton) {
      targetButton.classList.add("active");
      this.currentTool = tool;
      document.getElementById("currentTool").textContent =
        tool === "brush" ? "画笔" : "橡皮擦";
      this.updateCursor();
    }
  }

  clearCanvas() {
    this.drawingCtx.clearRect(
      0,
      0,
      this.drawingCanvas.width,
      this.drawingCanvas.height
    );
  }

  saveImage() {
    const link = document.createElement("a");
    link.download = `hand-drawing-${new Date().getTime()}.png`;
    link.href = this.drawingCanvas.toDataURL();
    link.click();
  }

  // 错误处理方法
  showError(title, message) {
    this.errorMessage.textContent = message;
    this.errorModal.style.display = "block";
  }

  showCameraError(title, message, showInstructions = false) {
    const modal = this.errorModal;
    const modalContent = modal.querySelector(".modal-content");

    // 清除之前的内容
    modalContent.innerHTML = `
            <span class="close">&times;</span>
            <h3>${title}</h3>
            <p class="error-message">${message.replace(/\n/g, "<br>")}</p>
        `;

    if (showInstructions) {
      modalContent.innerHTML += this.createPermissionInstructions();
    }

    modalContent.innerHTML += `
            <div class="button-group">
                <button id="retryButton" class="tool-btn">重试</button>
                <button id="settingsButton" class="tool-btn">打开浏览器设置</button>
            </div>
        `;

    // 重新绑定事件
    this.bindErrorModalEvents();
    modal.style.display = "block";
  }

  createPermissionInstructions() {
    const userAgent = navigator.userAgent;
    let instructions = "";

    if (userAgent.includes("Chrome")) {
      instructions = `
                <div class="permission-guide">
                    <h4>Chrome 浏览器权限设置：</h4>
                    <ol>
                        <li>点击地址栏左侧的 🔒 或 📷 图标</li>
                        <li>选择"允许"摄像头权限</li>
                        <li>刷新页面</li>
                    </ol>
                    <p><strong>或者：</strong></p>
                    <ol>
                        <li>点击右上角 ⋮ → 设置</li>
                        <li>隐私设置和安全性 → 网站设置</li>
                        <li>摄像头 → 找到本网站 → 允许</li>
                    </ol>
                </div>
            `;
    } else if (userAgent.includes("Firefox")) {
      instructions = `
                <div class="permission-guide">
                    <h4>Firefox 浏览器权限设置：</h4>
                    <ol>
                        <li>点击地址栏左侧的 🔒 图标</li>
                        <li>点击摄像头权限 → 允许</li>
                        <li>刷新页面</li>
                    </ol>
                    <p><strong>或者：</strong></p>
                    <ol>
                        <li>右上角 ☰ → 设置</li>
                        <li>隐私与安全 → 权限</li>
                        <li>摄像头 → 设置 → 允许</li>
                    </ol>
                </div>
            `;
    } else if (userAgent.includes("Safari")) {
      instructions = `
                <div class="permission-guide">
                    <h4>Safari 浏览器权限设置：</h4>
                    <ol>
                        <li>Safari → 偏好设置</li>
                        <li>网站 → 摄像头</li>
                        <li>找到本网站 → 选择"允许"</li>
                        <li>刷新页面</li>
                    </ol>
                </div>
            `;
    } else {
      instructions = `
                <div class="permission-guide">
                    <h4>通用权限设置：</h4>
                    <ol>
                        <li>查找地址栏附近的摄像头图标</li>
                        <li>点击并选择"允许"</li>
                        <li>如果没有找到，请在浏览器设置中查找"摄像头权限"</li>
                        <li>刷新页面</li>
                    </ol>
                </div>
            `;
    }

    // 添加本地开发服务器说明
    if (location.protocol === "file:") {
      instructions += `
                <div class="local-server-guide">
                    <h4>本地开发解决方案：</h4>
                    <div class="server-options">
                        <div class="server-option">
                            <strong>Python:</strong>
                            <code>python -m http.server 8000</code>
                            <small>然后访问 http://localhost:8000</small>
                        </div>
                        <div class="server-option">
                            <strong>Node.js:</strong>
                            <code>npx serve .</code>
                            <small>或 npx http-server</small>
                        </div>
                        <div class="server-option">
                            <strong>PHP:</strong>
                            <code>php -S localhost:8000</code>
                        </div>
                    </div>
                </div>
            `;
    }

    return instructions;
  }

  bindErrorModalEvents() {
    const closeBtn = this.errorModal.querySelector(".close");
    const retryBtn = this.errorModal.querySelector("#retryButton");
    const settingsBtn = this.errorModal.querySelector("#settingsButton");

    if (closeBtn) {
      closeBtn.onclick = () => this.hideError();
    }

    if (retryBtn) {
      retryBtn.onclick = () => {
        this.hideError();
        this.initializeCamera();
      };
    }

    if (settingsBtn) {
      settingsBtn.onclick = () => {
        // 尝试打开浏览器设置
        if (navigator.userAgent.includes("Chrome")) {
          window.open("chrome://settings/content/camera");
        } else if (navigator.userAgent.includes("Firefox")) {
          window.open("about:preferences#privacy");
        } else {
          alert("请手动打开浏览器设置，找到摄像头权限设置");
        }
      };
    }

    // 点击外部关闭
    this.errorModal.onclick = (e) => {
      if (e.target === this.errorModal) {
        this.hideError();
      }
    };
  }

  hideError() {
    this.errorModal.style.display = "none";
  }

  // 性能监控
  startPerformanceMonitoring() {
    this.performanceMetrics = {
      frameCount: 0,
      lastTime: Date.now(),
      fps: 0,
    };

    setInterval(() => {
      const currentTime = Date.now();
      const deltaTime = currentTime - this.performanceMetrics.lastTime;
      this.performanceMetrics.fps = Math.round(
        (this.performanceMetrics.frameCount * 1000) / deltaTime
      );
      this.performanceMetrics.frameCount = 0;
      this.performanceMetrics.lastTime = currentTime;

      // 更新性能显示
      if (this.performanceStatus) {
        this.performanceStatus.textContent = `FPS: ${this.performanceMetrics.fps}`;

        // 根据FPS设置颜色
        if (this.performanceMetrics.fps >= 25) {
          this.performanceStatus.style.color = "#4CAF50"; // 绿色
        } else if (this.performanceMetrics.fps >= 15) {
          this.performanceStatus.style.color = "#FF9800"; // 橙色
        } else {
          this.performanceStatus.style.color = "#F44336"; // 红色
        }
      }

      // 更新调试面板
      if (this.debugMode && this.debugInfo) {
        this.updateDebugPanel();
      }

      // 性能警告
      if (this.performanceMetrics.fps < 15) {
        console.warn(`性能警告：当前FPS仅为 ${this.performanceMetrics.fps}`);
      }
    }, 1000);
  }

  // 切换调试模式
  toggleDebugMode() {
    this.debugMode = !this.debugMode;

    if (this.debugMode) {
      this.debugPanel.style.display = "block";
      this.toggleDebugButton.textContent = "关闭调试";
      console.log("[调试模式] 已开启 - 按F12或Ctrl+D关闭");
    } else {
      this.debugPanel.style.display = "none";
      this.toggleDebugButton.textContent = "开启调试";
      console.log("[调试模式] 已关闭");
    }
  }

  // 切换性能模式
  togglePerformanceMode() {
    this.performanceMode = !this.performanceMode;
    if (this.performanceMode) {
      this.performanceModeButton.textContent = "关闭高性能";
      this.performanceModeButton.classList.add("active");
      console.log("🚀 高性能模式已开启 - 降低检测精度以提升性能");

      // 重新配置MediaPipe以获得更好的性能
      if (this.hands) {
        this.hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 0,
          minDetectionConfidence: 0.3, // 降低检测置信度
          minTrackingConfidence: 0.3, // 降低跟踪置信度
        });
      }
    } else {
      this.performanceModeButton.textContent = "开启高性能";
      this.performanceModeButton.classList.remove("active");
      console.log("🎯 高性能模式已关闭 - 恢复标准检测精度");

      // 恢复标准MediaPipe配置
      if (this.hands) {
        this.hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 0,
          minDetectionConfidence: 0.8,
          minTrackingConfidence: 0.7,
        });
      }
    }
  }

  // 更新调试面板数据
  updateDebugPanel() {
    if (!this.debugMode || !this.debugInfo) return;

    if (this.mediapipeTimeSpan)
      this.mediapipeTimeSpan.textContent =
        this.debugMetrics.mediapipeTime.toFixed(1);
    if (this.canvasTimeSpan)
      this.canvasTimeSpan.textContent = this.debugMetrics.canvasTime.toFixed(1);
    if (this.drawingLatencySpan)
      this.drawingLatencySpan.textContent =
        this.debugMetrics.drawingLatency.toFixed(1);
    if (this.frameSkipsSpan)
      this.frameSkipsSpan.textContent = this.debugMetrics.frameSkips;

    // 重置一些计数器
    this.debugMetrics.frameSkips = 0;
  }

  // 优化画布尺寸
  optimizeCanvasSize() {
    const container = document.querySelector(".camera-drawing-container");
    const maxWidth = 1920;
    const maxHeight = 1080;

    let width = container.clientWidth;
    let height = container.clientHeight;

    if (width > maxWidth) {
      height = height * (maxWidth / width);
      width = maxWidth;
    }

    if (height > maxHeight) {
      width = width * (maxHeight / height);
      height = maxHeight;
    }

    // 应用优化后的尺寸
    this.videoCanvas.width = width;
    this.videoCanvas.height = height;
    this.drawingCanvas.width = width;
    this.drawingCanvas.height = height;

    console.log(`优化后画布尺寸: ${width}x${height}`);
  }

  // 显示权限状态
  showPermissionStatus(status, message) {
    this.permissionStatus.className = `permission-status show ${status}`;
    this.permissionText.textContent = message;

    // 3秒后自动隐藏
    setTimeout(() => {
      this.permissionStatus.classList.remove("show");
    }, 3000);
  }

  // 添加权限申请按钮
  createPermissionButton() {
    const button = document.createElement("button");
    button.textContent = "📷 启用摄像头";
    button.className = "tool-btn permission-btn";
    button.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 10001;
            font-size: 18px;
            padding: 15px 30px;
            background: linear-gradient(135deg, #4CAF50, #45a049);
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        `;

    button.onclick = () => {
      document.body.removeChild(button);
      this.initializeCamera();
    };

    document.body.appendChild(button);
    return button;
  }

  // 切换手部追踪显示
  toggleHandTracking() {
    this.showHandTracking = !this.showHandTracking;

    if (this.showHandTracking) {
      this.toggleTrackingButton.textContent = "隐藏追踪";
      this.toggleTrackingButton.style.background =
        "linear-gradient(135deg, #FF5722, #E64A19)";
    } else {
      this.toggleTrackingButton.textContent = "显示追踪";
      this.toggleTrackingButton.style.background =
        "linear-gradient(135deg, #4CAF50, #45a049)";
      // 清除当前的手部标注
      this.clearHandAnnotations();
    }

    console.log("手部追踪显示:", this.showHandTracking ? "开启" : "关闭");
  }
}

// 当页面加载完成后启动应用
document.addEventListener("DOMContentLoaded", () => {
  // 显示加载动画
  const loadingDiv = document.createElement("div");
  loadingDiv.className = "loading";
  loadingDiv.innerHTML = '<div class="loading-spinner"></div>';
  document.body.appendChild(loadingDiv);

  // 初始化应用
  try {
    window.app = new HandTrackingDrawingApp();

    // 移除加载动画
    setTimeout(() => {
      if (loadingDiv.parentNode) {
        loadingDiv.parentNode.removeChild(loadingDiv);
      }
    }, 2000);

    console.log("手部追踪画图应用初始化成功");
  } catch (error) {
    console.error("应用初始化失败:", error);
    loadingDiv.innerHTML =
      '<div style="color: white; text-align: center;">应用加载失败，请刷新页面重试</div>';
  }
});

// 处理页面可见性变化
document.addEventListener("visibilitychange", () => {
  if (document.hidden && window.app) {
    // 页面隐藏时停止绘画
    window.app.stopDrawing();
  }
});

// 处理错误
window.addEventListener("error", (e) => {
  console.error("应用运行错误:", e.error);
});

// 处理未捕获的Promise错误
window.addEventListener("unhandledrejection", (e) => {
  console.error("未处理的Promise错误:", e.reason);
});
