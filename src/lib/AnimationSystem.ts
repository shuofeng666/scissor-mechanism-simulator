// src/lib/AnimationSystem.ts
export interface AnimationConfig {
  curvatureWave?: {
    enabled: boolean;
    amplitude: number;
    frequency: number;
    baseValue: number;
  };
  lengthPulse?: {
    enabled: boolean;
    amplitude: number;
    frequency: number;
    baseValue: number;
  };
  segmentShift?: {
    enabled: boolean;
    range: [number, number];
    frequency: number;
  };
  autoRotate?: {
    enabled: boolean;
    speed: number;
  };
}

export interface AnimationState {
  isRunning: boolean;
  startTime: number;
  config: AnimationConfig;
}

export class AnimationSystem {
  private animationState: AnimationState;
  private animationFrame: number | null = null;
  private onParameterUpdate?: (params: Partial<any>) => void;
  private onViewUpdate?: (viewState: Partial<any>) => void;

  constructor() {
    this.animationState = {
      isRunning: false,
      startTime: 0,
      config: {
        curvatureWave: {
          enabled: true,
          amplitude: 0.8,
          frequency: 0.3,
          baseValue: 1.0
        },
        lengthPulse: {
          enabled: false,
          amplitude: 50,
          frequency: 0.2,
          baseValue: 300
        },
        segmentShift: {
          enabled: false,
          range: [3, 8],
          frequency: 0.1
        },
        autoRotate: {
          enabled: false,
          speed: 0.1
        }
      }
    };
  }

  setParameterUpdateCallback(callback: (params: Partial<any>) => void) {
    this.onParameterUpdate = callback;
  }

  setViewUpdateCallback(callback: (viewState: Partial<any>) => void) {
    this.onViewUpdate = callback;
  }

  start() {
    if (this.animationState.isRunning) return;
    
    this.animationState.isRunning = true;
    this.animationState.startTime = performance.now();
    this.animate();
  }

  stop() {
    this.animationState.isRunning = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  updateConfig(config: Partial<AnimationConfig>) {
    this.animationState.config = {
      ...this.animationState.config,
      ...config
    };
  }

  private animate = () => {
    if (!this.animationState.isRunning) return;

    const currentTime = performance.now();
    const elapsed = (currentTime - this.animationState.startTime) / 1000; // 转换为秒

    const params: any = {};
    const viewState: any = {};

    // 1. 曲率波动动画
    if (this.animationState.config.curvatureWave?.enabled) {
      const wave = this.animationState.config.curvatureWave;
      params.curvature = wave.baseValue + Math.sin(elapsed * wave.frequency * Math.PI * 2) * wave.amplitude;
    }

    // 2. 长度脉冲动画
    if (this.animationState.config.lengthPulse?.enabled) {
      const pulse = this.animationState.config.lengthPulse;
      params.curveLength = pulse.baseValue + Math.sin(elapsed * pulse.frequency * Math.PI * 2) * pulse.amplitude;
    }

    // 3. 段数变化动画
    if (this.animationState.config.segmentShift?.enabled) {
      const shift = this.animationState.config.segmentShift;
      const normalizedSin = (Math.sin(elapsed * shift.frequency * Math.PI * 2) + 1) / 2;
      params.segments = Math.round(shift.range[0] + normalizedSin * (shift.range[1] - shift.range[0]));
    }

    // 4. 自动旋转动画
    if (this.animationState.config.autoRotate?.enabled) {
      const rotate = this.animationState.config.autoRotate;
      const angle = elapsed * rotate.speed;
      viewState.offsetX = Math.cos(angle) * 50;
      viewState.offsetY = Math.sin(angle) * 30;
    }

    // 发送更新
    if (Object.keys(params).length > 0) {
      this.onParameterUpdate?.(params);
    }
    if (Object.keys(viewState).length > 0) {
      this.onViewUpdate?.(viewState);
    }

    this.animationFrame = requestAnimationFrame(this.animate);
  };

  // 缓动函数工具
  static easing = {
    linear: (t: number) => t,
    easeInOut: (t: number) => t * t * (3 - 2 * t),
    easeOutBounce: (t: number) => {
      if (t < 1 / 2.75) {
        return 7.5625 * t * t;
      } else if (t < 2 / 2.75) {
        return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
      } else if (t < 2.5 / 2.75) {
        return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
      } else {
        return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
      }
    },
    elastic: (t: number) => {
      if (t === 0 || t === 1) return t;
      const p = 0.3;
      const s = p / 4;
      return Math.pow(2, -10 * t) * Math.sin((t - s) * (2 * Math.PI) / p) + 1;
    }
  };

  // 平滑参数过渡
  animateToValue(
    currentValue: number,
    targetValue: number,
    duration: number,
    easing: (t: number) => number = AnimationSystem.easing.easeInOut,
    onUpdate: (value: number) => void,
    onComplete?: () => void
  ) {
    const startTime = performance.now();
    const startValue = currentValue;
    const deltaValue = targetValue - startValue;

    const animate = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easing(progress);
      
      const currentValue = startValue + deltaValue * easedProgress;
      onUpdate(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        onComplete?.();
      }
    };

    animate();
  }

  getConfig(): AnimationConfig {
    return { ...this.animationState.config };
  }

  isRunning(): boolean {
    return this.animationState.isRunning;
  }
}

// 预设动画配置
export const AnimationPresets = {
  gentle: {
    curvatureWave: {
      enabled: true,
      amplitude: 0.3,
      frequency: 0.2,
      baseValue: 1.0
    },
    lengthPulse: {
      enabled: false,
      amplitude: 20,
      frequency: 0.15,
      baseValue: 300
    }
  },
  
  dynamic: {
    curvatureWave: {
      enabled: true,
      amplitude: 0.8,
      frequency: 0.5,
      baseValue: 1.2
    },
    lengthPulse: {
      enabled: true,
      amplitude: 60,
      frequency: 0.3,
      baseValue: 320
    },
    segmentShift: {
      enabled: true,
      range: [4, 7] as [number, number],
      frequency: 0.08
    }
  },
  
  crazy: {
    curvatureWave: {
      enabled: true,
      amplitude: 1.2,
      frequency: 0.8,
      baseValue: 1.5
    },
    lengthPulse: {
      enabled: true,
      amplitude: 100,
      frequency: 0.6,
      baseValue: 350
    },
    segmentShift: {
      enabled: true,
      range: [3, 10] as [number, number],
      frequency: 0.12
    },
    autoRotate: {
      enabled: true,
      speed: 0.2
    }
  },

  breathing: {
    curvatureWave: {
      enabled: true,
      amplitude: 0.4,
      frequency: 0.1,
      baseValue: 1.0
    },
    lengthPulse: {
      enabled: true,
      amplitude: 30,
      frequency: 0.1,
      baseValue: 300
    }
  }
};