/**
 * 游戏指令管理类
 */
class CommandManager {
  constructor(containerId, judgmentLineOffset = 100) {
    console.log(`初始化命令管理器，容器ID: ${containerId}`);
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error(`未找到容器: ${containerId}`);
      return;
    }

    this.judgmentLineOffset = judgmentLineOffset;
    this.commands = [];
    this.gameSpeed = 150; // 降低移动速度（像素/秒）
    this.commandSpawnRate = 2000; // 增加生成间隔（毫秒）
    this.lastSpawnTime = 0;
    this.spawnIntervalId = null;
    this.moveIntervalId = null;
    this.onCommandHit = null;
    this.onCommandMiss = null;
    this.commandTypes = ['up', 'down', 'left', 'right', 'space'];

    // 初始化容器尺寸
    this.containerHeight = this.container.clientHeight || 240;
    this.containerWidth = this.container.clientWidth || 800;
    console.log(`命令容器尺寸: ${this.containerWidth}x${this.containerHeight}`);

    // 键位映射
    this.keyMap = {
      ArrowUp: 'up',
      ArrowDown: 'down',
      ArrowLeft: 'left',
      ArrowRight: 'right',
      ' ': 'space'
    };

    // 创建判定线
    this.judgmentLine = document.getElementById('judgment-line');
    if (!this.judgmentLine) {
      this.judgmentLine = document.createElement('div');
      this.judgmentLine.id = 'judgment-line';
      this.container.appendChild(this.judgmentLine);
    }
    this.judgmentLine.style.bottom = `${this.judgmentLineOffset}px`;

    // 初始化键盘事件监听
    this.setupKeyboardListeners();

    console.log('命令管理器初始化完成');
  }

  setupKeyboardListeners() {
    document.addEventListener('keydown', event => {
      const commandType = this.keyMap[event.key];
      if (commandType) {
        console.log(`按下键: ${event.key}, 对应命令类型: ${commandType}`);
        this.handleKeyPress(commandType);
        event.preventDefault();
      }
    });
  }

  handleKeyPress(commandType) {
    // 查找最接近判定线的对应类型指令
    const commandsOfType = this.commands.filter(cmd => cmd.type === commandType);
    if (commandsOfType.length === 0) {
      console.log(`没有类型为 ${commandType} 的命令`);
      // 没有可用命令时也计为miss
      this.showJudgment('miss');
      if (this.onCommandMiss) {
        this.onCommandMiss(commandType);
      }
      return;
    }

    // 找出距离判定线最近的指令
    let closestCommand = null;
    let minDistance = Infinity;

    for (const cmd of commandsOfType) {
      const cmdY = parseInt(cmd.element.style.bottom);
      const distance = Math.abs(cmdY - this.judgmentLineOffset);

      if (distance < minDistance) {
        minDistance = distance;
        closestCommand = cmd;
      }
    }

    if (closestCommand) {
      // 判断命中精度
      let judgment = '';
      if (minDistance <= 15) {
        judgment = 'perfect';
      } else if (minDistance <= 40) {
        judgment = 'good';
      } else if (minDistance <= 70) {
        judgment = 'bad';
      } else {
        judgment = 'miss';
      }

      console.log(`命令判定: ${judgment}, 距离: ${minDistance}px`);

      // 移除被命中的指令
      this.removeCommand(closestCommand);

      // 显示判定结果
      this.showJudgment(judgment);

      // 触发相应的回调
      if (judgment === 'miss') {
        if (this.onCommandMiss) {
          this.onCommandMiss(commandType);
        }
      } else {
        if (this.onCommandHit) {
          this.onCommandHit(commandType, judgment);
        }
      }
    }
  }

  showJudgment(judgment) {
    const judgmentElement = document.createElement('div');
    judgmentElement.className = `judgment ${judgment}`;
    judgmentElement.textContent = judgment.toUpperCase();
    judgmentElement.style.left = `${this.containerWidth / 2}px`;
    judgmentElement.style.bottom = `${this.judgmentLineOffset + 20}px`;

    this.container.appendChild(judgmentElement);

    // 动画结束后移除元素
    setTimeout(() => {
      if (judgmentElement.parentNode) {
        this.container.removeChild(judgmentElement);
      }
    }, 1000);
  }

  startSpawning() {
    console.log('开始生成命令');
    this.lastSpawnTime = Date.now();
    this.spawnIntervalId = setInterval(() => this.spawnRandomCommand(), this.commandSpawnRate);
    this.moveIntervalId = setInterval(() => this.moveCommands(), 16); // 约60fps

    // 立即生成第一个命令，让玩家有反应时间
    setTimeout(() => this.spawnRandomCommand(), 500);
  }

  stopSpawning() {
    console.log('停止生成命令');
    if (this.spawnIntervalId) {
      clearInterval(this.spawnIntervalId);
      this.spawnIntervalId = null;
    }

    if (this.moveIntervalId) {
      clearInterval(this.moveIntervalId);
      this.moveIntervalId = null;
    }
  }

  spawnRandomCommand() {
    const now = Date.now();
    if (now - this.lastSpawnTime < this.commandSpawnRate) return;

    this.lastSpawnTime = now;

    // 随机选择指令类型
    const randomIndex = Math.floor(Math.random() * this.commandTypes.length);
    const commandType = this.commandTypes[randomIndex];

    console.log(`生成命令: ${commandType}`);

    // 创建指令元素
    const commandElement = document.createElement('div');
    commandElement.className = `command ${commandType}`;

    // 设置指令图标
    let icon = '?';
    switch (commandType) {
      case 'up':
        icon = '↑';
        break;
      case 'down':
        icon = '↓';
        break;
      case 'left':
        icon = '←';
        break;
      case 'right':
        icon = '→';
        break;
      case 'space':
        icon = '␣';
        break;
    }
    commandElement.textContent = icon;

    // 随机水平位置（不同指令固定在不同的轨道）
    let horizontalPosition;
    switch (commandType) {
      case 'up':
        horizontalPosition = this.containerWidth * 0.2;
        break;
      case 'down':
        horizontalPosition = this.containerWidth * 0.35;
        break;
      case 'left':
        horizontalPosition = this.containerWidth * 0.5;
        break;
      case 'right':
        horizontalPosition = this.containerWidth * 0.65;
        break;
      case 'space':
        horizontalPosition = this.containerWidth * 0.8;
        break;
      default:
        horizontalPosition = this.containerWidth * 0.5;
    }

    // 设置初始位置
    commandElement.style.left = `${horizontalPosition}px`;
    commandElement.style.bottom = '0px';

    // 增加初始大小动画和闪光效果
    commandElement.style.animation = 'pulse 0.5s';
    commandElement.style.boxShadow = '0 0 20px rgba(255, 255, 255, 0.8)';

    setTimeout(() => {
      if (commandElement.parentNode) {
        commandElement.style.boxShadow = '0 0 10px rgba(67, 97, 238, 0.7)';
      }
    }, 500);

    // 添加到容器
    this.container.appendChild(commandElement);

    // 记录指令
    this.commands.push({
      id: Date.now().toString(),
      type: commandType,
      element: commandElement,
      createdAt: now
    });
  }

  moveCommands() {
    const now = Date.now();
    const commandsToRemove = [];

    // 移动每个指令
    for (const command of this.commands) {
      const elapsedTime = now - command.createdAt;
      const distanceMoved = (elapsedTime / 1000) * this.gameSpeed;

      // 更新位置
      command.element.style.bottom = `${distanceMoved}px`;

      // 如果指令超出屏幕顶部或大幅超过判定线，标记为待移除
      if (distanceMoved > this.containerHeight || (distanceMoved > this.judgmentLineOffset + 100 && !command.passed)) {
        commandsToRemove.push(command);

        // 如果未通过过判定线，触发miss回调
        if (!command.passed && distanceMoved > this.judgmentLineOffset + 50) {
          if (this.onCommandMiss) {
            this.onCommandMiss(command.type);
            console.log(`错过命令: ${command.type}`);
          }
          this.showJudgment('miss');
          command.passed = true;
        }
      }

      // 如果指令接近判定线，增加醒目效果
      if (!command.highlighted && Math.abs(distanceMoved - this.judgmentLineOffset) < 50) {
        command.highlighted = true;
        command.element.style.transform = 'translateX(-50%) scale(1.2)';
        command.element.style.boxShadow = '0 0 15px rgba(255, 255, 255, 0.9)';
      }

      // 如果指令刚好通过判定线，标记为已通过
      if (!command.passed && distanceMoved >= this.judgmentLineOffset) {
        command.passed = true;
      }
    }

    // 移除需要移除的指令
    for (const command of commandsToRemove) {
      this.removeCommand(command);
    }
  }

  removeCommand(command) {
    // 添加淡出动画
    command.element.style.opacity = '0';
    command.element.style.transform = 'translateX(-50%) scale(0.5)';
    command.element.style.transition = 'all 0.3s';

    // 短暂延迟后从DOM中移除
    setTimeout(() => {
      if (command.element.parentNode) {
        this.container.removeChild(command.element);
      }
    }, 300);

    // 从数组中移除
    const index = this.commands.indexOf(command);
    if (index !== -1) {
      this.commands.splice(index, 1);
    }
  }

  removeAllCommands() {
    console.log('移除所有命令');
    // 复制数组以避免循环中修改原数组导致的问题
    const commandsCopy = [...this.commands];
    for (const command of commandsCopy) {
      this.removeCommand(command);
    }
    this.commands = [];
  }

  setSpeed(speed) {
    console.log(`设置游戏速度: ${speed}`);
    this.gameSpeed = speed;
  }

  setSpawnRate(rate) {
    console.log(`设置生成速率: ${rate}ms`);
    this.commandSpawnRate = rate;

    // 重启间隔计时器以应用新的速率
    if (this.spawnIntervalId) {
      clearInterval(this.spawnIntervalId);
      this.spawnIntervalId = setInterval(() => this.spawnRandomCommand(), this.commandSpawnRate);
    }
  }

  // 根据游戏进度调整难度
  adjustDifficulty(score) {
    // 基于分数增加游戏速度和指令生成频率，但设置较低的基线
    if (score > 5000) {
      this.setSpeed(350); // 降低最高速度
      this.setSpawnRate(1200);
    } else if (score > 3000) {
      this.setSpeed(300);
      this.setSpawnRate(1500);
    } else if (score > 1000) {
      this.setSpeed(250);
      this.setSpawnRate(1700);
    } else if (score > 500) {
      this.setSpeed(200);
      this.setSpawnRate(1800);
    }
  }

  // 设置命中回调
  setCommandHitHandler(callback) {
    this.onCommandHit = callback;
    console.log('设置命中处理器');
  }

  // 设置错过回调
  setCommandMissHandler(callback) {
    this.onCommandMiss = callback;
    console.log('设置错过处理器');
  }
}
