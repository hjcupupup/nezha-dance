/**
 * 哪吒3D模型管理类 - 使用GLTF加载器加载Blender导出模型
 */
class NahaoModel {
  constructor(containerId) {
    console.log(`开始初始化模型，容器ID: ${containerId}`);
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error(`未找到容器: ${containerId}`);
      return;
    }

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.model = null;
    this.mixer = null;
    this.clock = new THREE.Clock();
    this.animations = {
      idle: null,
      up: null,
      down: null,
      left: null,
      right: null,
      space: null
    };

    // 骨骼动画映射配置
    this.animationConfig = {
      idleNames: ['idle', 'Idle', 'IDLE', 'stand', 'Stand', '待机'],
      upNames: ['up', 'Up', 'jump', 'Jump', '上跳', '跳跃'],
      downNames: ['down', 'Down', 'crouch', 'Crouch', '下蹲', '蹲下'],
      leftNames: ['left', 'Left', 'turnLeft', 'TurnLeft', '左转', '向左'],
      rightNames: ['right', 'Right', 'turnRight', 'TurnRight', '右转', '向右'],
      spaceNames: ['space', 'Space', 'special', 'Special', 'dance', 'Dance', '舞蹈', '特殊']
    };

    // 确保THREE.js已正确加载
    if (typeof THREE === 'undefined') {
      console.error('THREE.js 未加载');
      return;
    }

    // 检查GLTFLoader是否可用
    if (typeof THREE.GLTFLoader === 'undefined') {
      console.error('THREE.GLTFLoader 未加载，将尝试使用简化模型');
      this.useSimpleModel = true;
    } else {
      console.log('THREE.GLTFLoader 已加载，将尝试加载GLB模型');
      this.useSimpleModel = false;
    }

    this.init();
  }

  init() {
    try {
      console.log('初始化3D场景');
      // 创建场景
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x16213e);

      // 获取容器尺寸
      const containerWidth = this.container.clientWidth || 800;
      const containerHeight = this.container.clientHeight || 300;
      console.log(`容器尺寸: ${containerWidth}x${containerHeight}`);

      // 创建相机 - 调整相机位置，拉远一些以便显示更多场景
      this.camera = new THREE.PerspectiveCamera(45, containerWidth / containerHeight, 0.1, 1000);
      this.camera.position.set(0, 2, 8); // 位置调整，y轴抬高，z轴拉远
      this.camera.lookAt(0, 1.5, 0); // 看向模型的上半部分

      // 创建渲染器
      this.renderer = new THREE.WebGLRenderer({ antialias: true });
      this.renderer.setSize(containerWidth, containerHeight);
      this.renderer.setPixelRatio(window.devicePixelRatio);
      this.renderer.shadowMap.enabled = true;
      this.container.appendChild(this.renderer.domElement);

      console.log('渲染器添加到DOM');

      // 添加光源 - 增强光照效果
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.7); // 增加环境光强度
      this.scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0); // 增加直射光强度
      directionalLight.position.set(2, 10, 10); // 调整光源位置
      directionalLight.castShadow = true;
      this.scene.add(directionalLight);

      // 添加补光
      const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
      fillLight.position.set(-2, 5, -5);
      this.scene.add(fillLight);

      console.log('光源添加完成');

      // 检查THREE和GLTFLoader
      console.log('THREE可用状态:', typeof THREE !== 'undefined');
      console.log('GLTFLoader可用状态:', typeof THREE !== 'undefined' && typeof THREE.GLTFLoader !== 'undefined');

      // 根据加载器可用性选择模型加载方式
      if (typeof THREE !== 'undefined' && typeof THREE.GLTFLoader !== 'undefined') {
        console.log('尝试加载GLB模型');
        this.loadGLTFModel();
      } else {
        console.log('GLTFLoader不可用，使用简化模型');
        this.useSimpleModel = true;
        this.createSimpleNahaoModel();
      }

      // 处理窗口大小变化
      window.addEventListener('resize', () => this.onWindowResize());

      // 开始动画循环
      this.animate();

      console.log('动画循环开始');
    } catch (error) {
      console.error('3D场景初始化失败:', error);
      // 错误恢复：如果初始化失败，尝试创建简单模型
      this.createSimpleNahaoModel();
    }
  }

  loadGLTFModel() {
    console.log('开始加载GLTF模型 - 将使用Three.js直接创建动画');

    // 创建加载器
    const loader = new THREE.GLTFLoader();

    // 显示加载提示
    const loadingEl = document.createElement('div');
    loadingEl.style.position = 'absolute';
    loadingEl.style.top = '50%';
    loadingEl.style.left = '50%';
    loadingEl.style.transform = 'translate(-50%, -50%)';
    loadingEl.style.color = 'white';
    loadingEl.style.fontSize = '18px';
    loadingEl.textContent = '加载模型中...';
    this.container.appendChild(loadingEl);

    // 尝试加载所有可用的模型文件，以防一个不行
    const fallbackModels = ['./assets/hunyuan-nezha-blender-modify.glb', './assets/nezha-hunyuan.glb', './assets/nezha.glb', './assets/nezha_updated.glb'];

    // 尝试加载第一个模型
    this.tryLoadModelWithoutAnimation(loader, fallbackModels, 0, loadingEl);
  }

  // 新函数：加载模型但不使用其骨骼动画
  tryLoadModelWithoutAnimation(loader, modelPaths, index, loadingEl) {
    if (index >= modelPaths.length) {
      console.error('所有模型都加载失败，使用备用模型');
      this.createSimpleNahaoModel();
      if (loadingEl && loadingEl.parentNode) {
        this.container.removeChild(loadingEl);
      }
      return;
    }

    const currentPath = modelPaths[index];
    console.log(`尝试加载模型文件 (${index + 1}/${modelPaths.length}): ${currentPath}`);

    loader.load(
      // 模型URL
      currentPath,

      // 加载成功回调
      gltf => {
        console.log('GLTF模型加载成功', gltf);

        // 移除加载提示
        if (loadingEl && loadingEl.parentNode) {
          this.container.removeChild(loadingEl);
        }

        // 保存模型引用
        this.model = gltf.scene;

        // 调整模型位置和比例
        this.model.position.set(0, 0, 0);
        this.model.scale.set(1.5, 1.5, 1.5);

        // 添加到场景
        this.scene.add(this.model);
        console.log('模型已添加到场景');

        // 忽略GLB中的骨骼动画，直接创建基于Three.js的动画
        console.log('跳过骨骼动画，创建基于Three.js的简单动画');
        this.createThreeJsAnimations();
      },

      // 加载进度回调
      xhr => {
        if (xhr.total > 0) {
          const progress = Math.floor((xhr.loaded / xhr.total) * 100);
          console.log(`模型加载进度: ${progress}%`);
          loadingEl.textContent = `加载模型中... ${progress}%`;
        } else {
          loadingEl.textContent = `加载模型中...`;
        }
      },

      // 加载错误回调
      error => {
        console.error(`加载模型 ${currentPath} 失败:`, error);

        // 尝试下一个模型
        this.tryLoadModelWithoutAnimation(loader, modelPaths, index + 1, loadingEl);
      }
    );
  }

  // 新函数：使用Three.js动画系统创建简单动画
  createThreeJsAnimations() {
    console.log('创建基于Three.js的简单动画');

    // 创建动画混合器 - 使用场景中的模型
    this.mixer = new THREE.AnimationMixer(this.model);

    // 定义可以用于动画的目标属性和关键帧
    const modelPosition = this.model.position.clone();
    const modelRotation = this.model.rotation.clone();
    const modelScale = this.model.scale.clone();

    // 创建KV对象存储所有动画，键为动画名称，值为AnimationClip
    const animClips = {};

    // 1. 创建待机动画（轻微上下移动）
    const idleTracks = [];
    // 位置轨道 - 上下浮动
    idleTracks.push(
      new THREE.KeyframeTrack(
        '.position[y]',
        [0, 1, 2], // 时间点
        [modelPosition.y, modelPosition.y + 0.1, modelPosition.y] // 对应值
      )
    );
    // 旋转轨道 - 轻微摇摆
    idleTracks.push(new THREE.KeyframeTrack('.rotation[y]', [0, 1, 2], [modelRotation.y, modelRotation.y + 0.05, modelRotation.y]));

    // 创建动画剪辑
    animClips.idle = new THREE.AnimationClip('idle', 2, idleTracks);

    // 2. 创建向上跳跃动画
    const upTracks = [];
    // 位置轨道 - 向上跳
    upTracks.push(new THREE.KeyframeTrack('.position[y]', [0, 0.3, 0.6, 1], [modelPosition.y, modelPosition.y + 0.5, modelPosition.y + 0.3, modelPosition.y]));
    // 缩放轨道 - 跳跃时稍微拉伸
    upTracks.push(new THREE.KeyframeTrack('.scale[y]', [0, 0.3, 0.6, 1], [modelScale.y, modelScale.y * 1.1, modelScale.y * 1.05, modelScale.y]));

    animClips.up = new THREE.AnimationClip('up', 1, upTracks);

    // 3. 创建向下蹲动画
    const downTracks = [];
    // 位置轨道 - 下蹲
    downTracks.push(new THREE.KeyframeTrack('.position[y]', [0, 0.3, 0.6, 1], [modelPosition.y, modelPosition.y - 0.3, modelPosition.y - 0.2, modelPosition.y]));
    // 缩放轨道 - 下蹲时压缩
    downTracks.push(new THREE.KeyframeTrack('.scale[y]', [0, 0.3, 0.6, 1], [modelScale.y, modelScale.y * 0.8, modelScale.y * 0.9, modelScale.y]));

    animClips.down = new THREE.AnimationClip('down', 1, downTracks);

    // 4. 创建向左转动画
    const leftTracks = [];
    // 旋转轨道 - 向左转
    leftTracks.push(new THREE.KeyframeTrack('.rotation[y]', [0, 0.4, 0.8, 1], [modelRotation.y, modelRotation.y + Math.PI / 4, modelRotation.y + Math.PI / 8, modelRotation.y]));
    // 位置轨道 - 向左微移
    leftTracks.push(new THREE.KeyframeTrack('.position[x]', [0, 0.3, 0.7, 1], [modelPosition.x, modelPosition.x - 0.2, modelPosition.x - 0.1, modelPosition.x]));

    animClips.left = new THREE.AnimationClip('left', 1, leftTracks);

    // 5. 创建向右转动画
    const rightTracks = [];
    // 旋转轨道 - 向右转
    rightTracks.push(new THREE.KeyframeTrack('.rotation[y]', [0, 0.4, 0.8, 1], [modelRotation.y, modelRotation.y - Math.PI / 4, modelRotation.y - Math.PI / 8, modelRotation.y]));
    // 位置轨道 - 向右微移
    rightTracks.push(new THREE.KeyframeTrack('.position[x]', [0, 0.3, 0.7, 1], [modelPosition.x, modelPosition.x + 0.2, modelPosition.x + 0.1, modelPosition.x]));

    animClips.right = new THREE.AnimationClip('right', 1, rightTracks);

    // 6. 创建特殊动画（空格键）- 旋转一周
    const spaceTracks = [];
    // 旋转轨道 - 旋转一圈
    spaceTracks.push(new THREE.KeyframeTrack('.rotation[y]', [0, 0.5, 1], [modelRotation.y, modelRotation.y + Math.PI, modelRotation.y + Math.PI * 2]));
    // 位置轨道 - 上下跳跃
    spaceTracks.push(new THREE.KeyframeTrack('.position[y]', [0, 0.25, 0.5, 0.75, 1], [modelPosition.y, modelPosition.y + 0.3, modelPosition.y + 0.1, modelPosition.y + 0.3, modelPosition.y]));
    // 缩放轨道 - 忽大忽小
    spaceTracks.push(new THREE.KeyframeTrack('.scale', [0, 0.25, 0.5, 0.75, 1], [modelScale.x, modelScale.y, modelScale.z, modelScale.x * 1.2, modelScale.y * 1.2, modelScale.z * 1.2, modelScale.x * 0.9, modelScale.y * 0.9, modelScale.z * 0.9, modelScale.x * 1.1, modelScale.y * 1.1, modelScale.z * 1.1, modelScale.x, modelScale.y, modelScale.z]));

    animClips.space = new THREE.AnimationClip('space', 1, spaceTracks);

    // 为每个动画创建AnimationAction对象
    this.animations = {};

    for (const [name, clip] of Object.entries(animClips)) {
      this.animations[name] = this.mixer.clipAction(clip);

      // 设置动画属性
      if (name === 'idle') {
        this.animations[name].setLoop(THREE.LoopRepeat);
      } else {
        this.animations[name].setLoop(THREE.LoopOnce);
        this.animations[name].clampWhenFinished = true;
      }

      console.log(`创建了 ${name} 动画`);
    }

    // 启动idle动画
    if (this.animations.idle) {
      this.animations.idle.play();
      console.log('开始播放idle动画');
    }
  }

  // 播放特定动画
  playAnimation(name) {
    console.log(`播放动画: ${name}`);
    if (this.animations[name]) {
      // 淡出其他动画，淡入新动画
      for (const anim in this.animations) {
        if (anim !== name && this.animations[anim] && this.animations[anim].isRunning()) {
          this.animations[anim].fadeOut(0.2);
        }
      }

      // 确保混合器速度正常
      if (this.mixer) {
        this.mixer.timeScale = 1;
      }

      this.animations[name].reset();
      this.animations[name].fadeIn(0.2);
      this.animations[name].play();

      // 如果是非idle动画，设置一个计时器在动画结束后回到idle
      if (name !== 'idle') {
        setTimeout(() => {
          if (this.animations[name]) {
            this.animations[name].fadeOut(0.2);
          }
          if (this.animations.idle) {
            this.animations.idle.fadeIn(0.2);
            this.animations.idle.play();
          }
        }, 800);
      }
    } else {
      console.warn(`动画不存在: ${name}`);
    }
  }

  onWindowResize() {
    if (!this.camera || !this.renderer || !this.container) return;

    const containerWidth = this.container.clientWidth || 800;
    const containerHeight = this.container.clientHeight || 300;

    this.camera.aspect = containerWidth / containerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(containerWidth, containerHeight);

    console.log(`窗口大小调整为: ${containerWidth}x${containerHeight}`);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    // 更新动画混合器
    const delta = this.clock.getDelta();
    if (this.mixer) {
      this.mixer.update(delta);
    }

    // 渲染场景
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }
}
