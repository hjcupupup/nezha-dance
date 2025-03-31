/**
 * 哪吒炫舞游戏主控制类
 */
class NahaoDanceGame {
  constructor() {
    console.log('创建游戏控制器实例');
    // 游戏状态
    this.state = 'start'; // start, play, over
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;

    // 评分系统
    this.scoreValues = {
      perfect: 100,
      good: 50,
      bad: 10,
      miss: 0
    };

    // 连击加成
    this.comboMultiplier = 1;

    // 游戏元素
    this.gameStates = {
      start: document.getElementById('game-start'),
      play: document.getElementById('game-play'),
      over: document.getElementById('game-over')
    };

    // 分数显示
    this.scoreDisplay = document.getElementById('score');
    this.comboDisplay = document.getElementById('combo');
    this.finalScoreDisplay = document.getElementById('final-score').querySelector('span');
    this.maxComboDisplay = document.getElementById('max-combo').querySelector('span');

    // 按钮
    this.startButton = document.getElementById('start-button');
    this.restartButton = document.getElementById('restart-button');

    // 确保游戏容器存在
    this.ensureGameContainers();

    // 创建命令管理器
    this.commandManager = new CommandManager('command-container');

    // 创建舞者角色
    this.dancer = new NahaoDancer('dancer-container');

    // 设置命令处理回调
    this.setupCommandHandlers();

    // 设置按钮事件
    this.setupButtonEvents();

    // 音效管理
    this.sounds = {};
    this.loadSounds();

    // 启动时确保游戏状态正确
    this.switchGameState('start');

    // 显示初始化状态日志
    console.log('游戏初始化完成');
  }

  /**
   * 确保游戏容器存在并可见
   */
  ensureGameContainers() {
    // 检查舞者容器
    const dancerContainer = document.getElementById('dancer-container');
    if (!dancerContainer) {
      console.error('未找到舞者容器');
      // 如果容器不存在，尝试创建一个
      const gamePlayDiv = document.getElementById('game-play');
      if (gamePlayDiv) {
        const newContainer = document.createElement('div');
        newContainer.id = 'dancer-container';
        gamePlayDiv.appendChild(newContainer);
        console.log('创建了舞者容器');
      }
    } else {
      // 确保容器尺寸合适
      dancerContainer.style.height = '60%';
      dancerContainer.style.minHeight = '360px';
      dancerContainer.style.display = 'block';
      console.log('舞者容器尺寸设置完成');
    }

    // 检查命令容器
    const commandContainer = document.getElementById('command-container');
    if (!commandContainer) {
      console.error('未找到命令容器');
      // 如果容器不存在，尝试创建一个
      const gamePlayDiv = document.getElementById('game-play');
      if (gamePlayDiv) {
        const newContainer = document.createElement('div');
        newContainer.id = 'command-container';
        gamePlayDiv.appendChild(newContainer);
        console.log('创建了命令容器');
      }
    } else {
      // 确保容器尺寸合适
      commandContainer.style.height = '40%';
      commandContainer.style.minHeight = '240px';
      commandContainer.style.display = 'block';
      console.log('命令容器尺寸设置完成');
    }
  }

  /**
   * 初始化游戏
   */
  init() {
    // 已在构造函数中初始化
    console.log('游戏控制器初始化');
  }

  /**
   * 设置命令处理回调
   */
  setupCommandHandlers() {
    // 设置命中处理器
    this.commandManager.setCommandHitHandler((commandType, judgment) => {
      // 更新得分
      this.updateScore(judgment);

      // 舞者做出反应
      this.dancer.respondToJudgment(commandType, judgment);

      // 播放音效
      this.playSound(judgment);
    });

    // 设置错过处理器
    this.commandManager.setCommandMissHandler(commandType => {
      // 重置连击
      this.combo = 0;
      this.updateComboDisplay();

      // 播放错过音效
      this.playSound('miss');
    });
  }

  /**
   * 设置按钮事件
   */
  setupButtonEvents() {
    if (this.startButton) {
      this.startButton.addEventListener('click', () => {
        this.startGame();
      });
      console.log('开始按钮事件绑定成功');
    } else {
      console.error('未找到开始按钮');
    }

    if (this.restartButton) {
      this.restartButton.addEventListener('click', () => {
        this.restartGame();
      });
      console.log('重新开始按钮事件绑定成功');
    } else {
      console.error('未找到重新开始按钮');
    }
  }

  /**
   * 加载音效
   */
  loadSounds() {
    const soundFiles = {
      perfect: 'perfect.mp3',
      good: 'good.mp3',
      bad: 'bad.mp3',
      miss: 'miss.mp3',
      start: 'start.mp3',
      over: 'over.mp3'
    };

    // 简单地创建Audio对象，实际项目中可能需要预加载音频
    for (const [name, file] of Object.entries(soundFiles)) {
      this.sounds[name] = new Audio(`assets/${file}`);
    }

    // 使用默认音效，如果文件不存在，不会抛出错误，只会静音
    console.log('音效加载完成');
  }

  /**
   * 播放音效
   * @param {string} soundName - 音效名称
   */
  playSound(soundName) {
    if (this.sounds[soundName]) {
      // 重新开始播放
      this.sounds[soundName].pause();
      this.sounds[soundName].currentTime = 0;
      this.sounds[soundName].play().catch(e => {
        // 浏览器可能会阻止自动播放，忽略错误
        console.log('Sound playback failed:', e);
      });
    }
  }

  /**
   * 开始游戏
   */
  startGame() {
    console.log('开始游戏函数被调用');

    // 切换状态
    this.state = 'play';

    // 重置游戏数据
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;

    // 更新显示
    this.updateScoreDisplay();
    this.updateComboDisplay();

    // 先切换状态，确保游戏界面显示
    this.switchGameState('play');

    // 再次确保容器可见
    const dancerContainer = document.getElementById('dancer-container');
    const commandContainer = document.getElementById('command-container');

    if (dancerContainer) {
      dancerContainer.style.display = 'block';
    }

    if (commandContainer) {
      commandContainer.style.display = 'block';
    }

    // 强制检查其他状态是否被正确隐藏
    this.forceHideOtherStates('play');

    // 开始生成命令
    this.commandManager.startSpawning();

    // 播放开始音效
    this.playSound('start');

    console.log('游戏开始');
  }

  /**
   * 结束游戏
   */
  endGame() {
    console.log('结束游戏函数被调用');

    // 切换状态
    this.state = 'over';

    // 停止生成命令
    this.commandManager.stopSpawning();
    this.commandManager.removeAllCommands();

    // 更新最终分数显示
    this.finalScoreDisplay.textContent = this.score;
    this.maxComboDisplay.textContent = Math.max(this.maxCombo, this.dancer.getMaxCombo());

    // 切换到游戏结束界面
    this.switchGameState('over');

    // 强制检查其他状态是否被正确隐藏
    this.forceHideOtherStates('over');

    // 播放结束音效
    this.playSound('over');

    console.log('游戏结束');
  }

  /**
   * 重新开始游戏
   */
  restartGame() {
    console.log('重新开始游戏函数被调用');

    // 重置舞者
    this.dancer.reset();

    // 确保结束界面被隐藏
    if (this.gameStates.over) {
      this.gameStates.over.classList.remove('active');
      this.gameStates.over.style.display = 'none';
    }

    // 开始新游戏
    this.startGame();

    console.log('游戏重新开始');
  }

  /**
   * 切换游戏状态界面
   * @param {string} stateName - 状态名称
   */
  switchGameState(stateName) {
    console.log(`切换游戏状态到: ${stateName}`);

    // 隐藏所有状态
    for (const [name, state] of Object.entries(this.gameStates)) {
      if (state) {
        state.classList.remove('active');
        state.style.display = 'none'; // 确保使用样式直接隐藏
        console.log(`移除状态: ${name}`);
      } else {
        console.error(`状态元素不存在: ${name}`);
      }
    }

    // 显示指定状态
    const targetState = this.gameStates[stateName];
    if (targetState) {
      targetState.classList.add('active');

      // 根据状态类型选择合适的显示方式
      if (stateName === 'play') {
        targetState.style.display = 'flex';
      } else {
        targetState.style.display = 'flex';
      }

      console.log(`激活状态: ${stateName}`);
    } else {
      console.error(`目标状态不存在: ${stateName}`);
    }

    // 强制回流，确保样式变化被应用
    void targetState.offsetHeight;
  }

  /**
   * 强制隐藏除了指定状态外的所有状态
   * 这是一个额外的安全检查，确保状态切换成功
   */
  forceHideOtherStates(activeStateName) {
    for (const [name, state] of Object.entries(this.gameStates)) {
      if (name !== activeStateName && state) {
        // 使用多种方式确保元素被隐藏
        state.classList.remove('active');
        state.style.display = 'none';
        state.style.visibility = 'hidden';
        state.style.opacity = '0';
        state.style.zIndex = '-1';
        console.log(`强制隐藏状态: ${name}`);
      }
    }
  }

  /**
   * 更新得分
   * @param {string} judgment - 判定结果
   */
  updateScore(judgment) {
    // 基础分数
    const baseScore = this.scoreValues[judgment] || 0;

    // 连击加成
    if (judgment !== 'miss') {
      this.combo++;

      // 更新最大连击
      if (this.combo > this.maxCombo) {
        this.maxCombo = this.combo;
      }

      // 连击乘数（每10连击增加0.1倍，最高2倍）
      this.comboMultiplier = 1 + Math.min(Math.floor(this.combo / 10) * 0.1, 1);
    } else {
      this.combo = 0;
      this.comboMultiplier = 1;
    }

    // 计算总分
    const earnedScore = Math.floor(baseScore * this.comboMultiplier);
    this.score += earnedScore;

    // 更新显示
    this.updateScoreDisplay();
    this.updateComboDisplay();

    // 根据分数调整难度
    this.commandManager.adjustDifficulty(this.score);
  }

  /**
   * 更新分数显示
   */
  updateScoreDisplay() {
    if (this.scoreDisplay) {
      this.scoreDisplay.textContent = this.score;
    } else {
      console.error('分数显示元素不存在');
    }
  }

  /**
   * 更新连击显示
   */
  updateComboDisplay() {
    if (this.comboDisplay) {
      this.comboDisplay.textContent = this.combo;

      // 连击数较高时添加醒目效果
      if (this.combo >= 10) {
        this.comboDisplay.classList.add('highlight');
      } else {
        this.comboDisplay.classList.remove('highlight');
      }
    } else {
      console.error('连击显示元素不存在');
    }
  }
}

// 当文档加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM加载完成，初始化游戏');

  // 先确保THREE.js正确加载
  if (typeof THREE === 'undefined') {
    console.error('THREE.js库未加载，游戏可能无法正常运行');
    alert('游戏资源加载失败，请检查网络连接并使用本地服务器运行游戏');
    return;
  }

  // 初始化游戏
  const game = new NahaoDanceGame();

  // 设置游戏时长（两分钟）
  setTimeout(() => {
    if (game.state === 'play') {
      game.endGame();
    }
  }, 2 * 60 * 1000);

  // 添加键盘控制说明
  console.log('游戏控制方式: 使用键盘方向键(↑↓←→)和空格键跟随节奏做出相应动作');
});
