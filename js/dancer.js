/**
 * 哪吒舞者角色类 - 整合3D模型与游戏互动
 */
class NahaoDancer {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.model = new NahaoModel(containerId);
    this.currentAnimation = 'idle';
    this.combo = 0;
    this.maxCombo = 0;
  }

  /**
   * 初始化舞者
   */
  init() {
    // 模型类已处理初始化
  }

  /**
   * 响应按键执行对应动画
   * @param {string} commandType - 命令类型 (up, down, left, right, space)
   */
  dance(commandType) {
    // 播放对应按键的动画
    this.model.playAnimation(commandType);
  }

  /**
   * 更新连击数
   * @param {string} judgment - 判定结果
   * @returns {number} - 当前连击数
   */
  updateCombo(judgment) {
    if (judgment === 'miss') {
      this.combo = 0;
    } else {
      this.combo++;

      // 更新最大连击数
      if (this.combo > this.maxCombo) {
        this.maxCombo = this.combo;
      }

      // 当连击达到特定值时播放特殊动画或粒子效果
      if (this.combo > 0 && this.combo % 10 === 0) {
        this.playComboEffect();
      }
    }

    return this.combo;
  }

  /**
   * 播放连击特效
   */
  playComboEffect() {
    // 添加闪光效果
    const flash = document.createElement('div');
    flash.classList.add('combo-flash');
    flash.style.position = 'absolute';
    flash.style.width = '100%';
    flash.style.height = '100%';
    flash.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
    flash.style.pointerEvents = 'none';
    this.container.appendChild(flash);

    // 移除闪光效果
    setTimeout(() => {
      if (flash.parentNode) {
        this.container.removeChild(flash);
      }
    }, 300);

    // 播放特殊动画
    this.model.playAnimation('space');
  }

  /**
   * 根据判定结果播放相应反馈动画
   * @param {string} commandType - 命令类型
   * @param {string} judgment - 判定结果
   */
  respondToJudgment(commandType, judgment) {
    // 更新连击
    this.updateCombo(judgment);

    // 根据判定播放不同的动画和效果
    if (judgment === 'perfect') {
      // 完美判定时播放标准动作
      this.dance(commandType);
      this.container.classList.add('pulse');
      setTimeout(() => this.container.classList.remove('pulse'), 500);
    } else if (judgment === 'good') {
      // 良好判定时播放略微迟缓的动作
      this.dance(commandType);
    } else if (judgment === 'bad') {
      // 勉强判定时播放轻微动作
      this.dance('idle');
    } else {
      // miss不触发动作
    }
  }

  /**
   * 重置舞者状态
   */
  reset() {
    this.combo = 0;
    this.maxCombo = 0;
    this.model.playAnimation('idle');
  }

  /**
   * 获取当前最大连击数
   * @returns {number} 最大连击数
   */
  getMaxCombo() {
    return this.maxCombo;
  }
}
