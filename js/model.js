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
    console.log('开始加载GLTF模型');

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

    // 加载模型 - 使用用户提供的路径
    const modelPath = './assets/nezha-hunyuan.glb';
    console.log(`尝试从路径加载模型: ${modelPath}`);

    // 添加模型路径调试信息
    const absolutePath = new URL(modelPath, window.location.href).href;
    console.log(`模型的绝对路径: ${absolutePath}`);

    loader.load(
      // 模型URL
      modelPath,

      // 加载成功回调
      gltf => {
        console.log('GLTF模型加载成功', gltf);

        // 移除加载提示
        if (loadingEl.parentNode) {
          this.container.removeChild(loadingEl);
        }

        // 保存模型引用
        this.model = gltf.scene;

        // 调整模型位置和比例 - 增大模型比例
        this.model.position.set(0, 0, 0);
        this.model.scale.set(1.5, 1.5, 1.5); // 增大模型比例

        // 添加到场景
        this.scene.add(this.model);
        console.log('模型已添加到场景');

        // 处理骨骼动画
        if (gltf.animations && gltf.animations.length > 0) {
          console.log(`模型包含 ${gltf.animations.length} 个动画`);

          // 打印所有可用动画的名称，帮助调试
          gltf.animations.forEach((anim, index) => {
            console.log(`动画 ${index}: ${anim.name}, 持续时间: ${anim.duration}秒`);
          });

          // 创建动画混合器
          this.mixer = new THREE.AnimationMixer(this.model);

          // 使用增强的动画映射
          this.mapAnimationsEnhanced(gltf.animations);
        } else {
          console.log('模型没有动画，尝试为骨骼创建基本动画');
          // 检查模型是否有骨骼
          let hasSkeleton = false;
          this.model.traverse(object => {
            if (object.isBone || object.isSkinnedMesh) {
              hasSkeleton = true;
              console.log('找到骨骼或蒙皮网格:', object.name);
            }
          });

          if (hasSkeleton) {
            console.log('模型有骨骼但没有动画，将创建基本骨骼动画');
            this.createBasicSkeletonAnimations();
          } else {
            console.log('模型没有骨骼，创建模拟动画');
            this.createSimulatedAnimations();
          }
        }
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
        console.error('加载GLTF模型时出错:', error);
        loadingEl.textContent = '模型加载失败，使用备用模型';

        // 添加详细错误信息
        console.error('模型加载错误详情:', {
          modelPath,
          absolutePath,
          errorMessage: error.message,
          errorStack: error.stack
        });

        // 尝试列出当前网页可访问的资源
        console.log('尝试检查资源是否可访问...');
        fetch(modelPath)
          .then(response => {
            if (!response.ok) {
              throw new Error(`资源获取失败: ${response.status} ${response.statusText}`);
            }
            console.log('资源可以访问!', response);
            return response.blob();
          })
          .then(blob => {
            console.log('模型资源大小:', blob.size);
          })
          .catch(fetchError => {
            console.error('资源检查失败:', fetchError);
          });

        // 加载失败时使用简单几何体创建备用模型
        setTimeout(() => {
          this.createSimpleNahaoModel();
          if (loadingEl.parentNode) {
            this.container.removeChild(loadingEl);
          }
        }, 1500);
      }
    );
  }

  // 增强的动画映射函数，对中文名称也进行支持
  mapAnimationsEnhanced(animations) {
    console.log('使用增强的动画映射函数处理动画');

    // 默认将第一个动画设为idle
    if (animations.length > 0 && !this.animations.idle) {
      console.log(`将第一个动画 "${animations[0].name}" 临时设为idle备用`);
      this.animations.idle = this.mixer.clipAction(animations[0]);
    }

    // 遍历所有动画尝试匹配
    for (const anim of animations) {
      console.log(`处理动画: ${anim.name}`);
      const animName = anim.name.toLowerCase();

      // 检查每种动画类型的匹配
      for (const [gameAnim, possibleNames] of Object.entries(this.animationConfig)) {
        if (possibleNames.some(name => animName.includes(name.toLowerCase()))) {
          console.log(`✓ 将动画 "${anim.name}" 映射到游戏动画 "${gameAnim}"`);
          this.animations[gameAnim] = this.mixer.clipAction(anim);
          // 为动画设置适当的循环方式
          if (gameAnim === 'idle') {
            this.animations[gameAnim].setLoop(THREE.LoopRepeat);
          } else {
            // 非idle动画可以设置为只播放一次
            this.animations[gameAnim].setLoop(THREE.LoopOnce);
            this.animations[gameAnim].clampWhenFinished = true; // 播放结束时保持最后一帧
          }
        }
      }
    }

    // 如果没有找到特定动画，创建替代
    for (const animName in this.animations) {
      if (!this.animations[animName] && this.animations.idle) {
        console.log(`未找到${animName}动画，将尝试创建替代动画`);
        if (animName === 'space' && animations.length > 1) {
          // 对于特殊动画，如果有多个动画，可以使用第二个动画
          console.log('使用另一个动画作为space的替代');
          this.animations.space = this.mixer.clipAction(animations[1]);
        } else {
          // 使用idle的克隆，但调整时间缩放
          this.animations[animName] = this.animations.idle.clone();
          // 对不同动作设置不同的播放速度
          switch (animName) {
            case 'up':
              this.animations[animName].timeScale = 1.5; // 上跳动作更快
              break;
            case 'down':
              this.animations[animName].timeScale = 0.8; // 下蹲动作较慢
              break;
            case 'left':
            case 'right':
              this.animations[animName].timeScale = 1.2; // 转向稍快
              break;
            case 'space':
              this.animations[animName].timeScale = 2.0; // 特殊动作最快
              break;
          }
        }
      }
    }

    // 初始播放idle动画
    if (this.animations.idle) {
      console.log('开始播放idle动画');
      this.animations.idle.play();
    }
  }

  // 为有骨骼但没有动画的模型创建基本骨骼动画
  createBasicSkeletonAnimations() {
    console.log('为骨骼创建基本动画');

    // 首先找到模型中的所有骨骼
    const bones = [];
    this.model.traverse(object => {
      if (object.isBone) {
        bones.push(object);
        console.log(`找到骨骼: ${object.name}`);
      }
    });

    if (bones.length === 0) {
      console.log('未找到骨骼，将创建模拟动画');
      this.createSimulatedAnimations();
      return;
    }

    // 创建一个骨骼动画剪辑
    try {
      // 创建idle动画 - 轻微上下移动和旋转
      const idleTracks = [];

      // 为主体骨骼添加轻微上下移动
      const rootBone = bones[0]; // 通常第一个骨骼是根骨骼
      idleTracks.push(new THREE.KeyframeTrack(`${rootBone.name}.position[y]`, [0, 1, 2], [0, 0.05, 0]));

      // 为某些骨骼添加轻微旋转
      for (let i = 0; i < Math.min(bones.length, 5); i++) {
        const bone = bones[i];
        // 为不同骨骼添加不同轴的轻微旋转
        const rotAxis = i % 3; // 0=x, 1=y, 2=z
        const rotTrack = new THREE.KeyframeTrack(`${bone.name}.rotation[${rotAxis === 0 ? 'x' : rotAxis === 1 ? 'y' : 'z'}]`, [0, 1, 2], [bone.rotation[rotAxis], bone.rotation[rotAxis] + 0.05, bone.rotation[rotAxis]]);
        idleTracks.push(rotTrack);
      }

      // 创建动画剪辑
      const idleClip = new THREE.AnimationClip('idle', 2, idleTracks);
      this.animations.idle = this.mixer.clipAction(idleClip);
      this.animations.idle.play();

      // 创建其他基本动画（简化版）
      this.createSimpleSkeletonAnimation('up', bones, 'jump');
      this.createSimpleSkeletonAnimation('down', bones, 'crouch');
      this.createSimpleSkeletonAnimation('left', bones, 'left');
      this.createSimpleSkeletonAnimation('right', bones, 'right');
      this.createSimpleSkeletonAnimation('space', bones, 'dance');
    } catch (error) {
      console.error('创建基本骨骼动画失败:', error);
      this.createSimulatedAnimations();
    }
  }

  // 创建简单的骨骼动画
  createSimpleSkeletonAnimation(name, bones, type) {
    try {
      const tracks = [];
      const rootBone = bones[0];

      // 根据类型创建不同的动画
      switch (type) {
        case 'jump':
          // 跳跃动画
          tracks.push(new THREE.KeyframeTrack(`${rootBone.name}.position[y]`, [0, 0.5, 1], [0, 0.5, 0]));
          break;

        case 'crouch':
          // 下蹲动画
          tracks.push(new THREE.KeyframeTrack(`${rootBone.name}.position[y]`, [0, 0.5, 1], [0, -0.2, 0]));
          break;

        case 'left':
          // 向左转
          tracks.push(new THREE.KeyframeTrack(`${rootBone.name}.rotation[y]`, [0, 0.5, 1], [0, -Math.PI / 4, 0]));
          break;

        case 'right':
          // 向右转
          tracks.push(new THREE.KeyframeTrack(`${rootBone.name}.rotation[y]`, [0, 0.5, 1], [0, Math.PI / 4, 0]));
          break;

        case 'dance':
          // 舞蹈/特殊动作 - 旋转并跳跃
          tracks.push(new THREE.KeyframeTrack(`${rootBone.name}.position[y]`, [0, 0.25, 0.5, 0.75, 1], [0, 0.3, 0, 0.3, 0]));
          tracks.push(new THREE.KeyframeTrack(`${rootBone.name}.rotation[y]`, [0, 1], [0, Math.PI * 2]));
          break;
      }

      // 如果有足够的骨骼，为其他骨骼添加动作
      if (bones.length > 2) {
        // 为手臂/腿部骨骼添加动作
        for (let i = 1; i < Math.min(bones.length, 5); i++) {
          const bone = bones[i];
          let rotTrack;

          switch (type) {
            case 'jump':
              // 跳跃时手臂上举
              rotTrack = new THREE.KeyframeTrack(`${bone.name}.rotation[x]`, [0, 0.5, 1], [0, -Math.PI / 4, 0]);
              break;

            case 'crouch':
              // 下蹲时手臂前伸
              rotTrack = new THREE.KeyframeTrack(`${bone.name}.rotation[x]`, [0, 0.5, 1], [0, Math.PI / 6, 0]);
              break;

            case 'dance':
              // 舞蹈时手臂摆动
              rotTrack = new THREE.KeyframeTrack(`${bone.name}.rotation[z]`, [0, 0.25, 0.5, 0.75, 1], [0, Math.PI / 4, 0, -Math.PI / 4, 0]);
              break;

            default:
              continue;
          }

          tracks.push(rotTrack);
        }
      }

      // 创建动画剪辑
      const clip = new THREE.AnimationClip(name, 1, tracks);
      this.animations[name] = this.mixer.clipAction(clip);
      this.animations[name].setLoop(THREE.LoopOnce);
      this.animations[name].clampWhenFinished = true;
    } catch (error) {
      console.error(`创建${name}骨骼动画失败:`, error);
    }
  }

  createSimpleNahaoModel() {
    // 创建一个组作为模型容器
    this.model = new THREE.Group();

    // 材质
    const skinMaterial = new THREE.MeshStandardMaterial({ color: 0xf5c0a5 });
    const clothesMaterial = new THREE.MeshStandardMaterial({ color: 0xf72585 });
    const blackMaterial = new THREE.MeshStandardMaterial({ color: 0x111111 });
    const redMaterial = new THREE.MeshStandardMaterial({ color: 0xff6b6b });

    // 头部
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.5, 32, 32), skinMaterial);
    head.position.y = 1.6;

    // 身体
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.2, 1.2, 32), clothesMaterial);
    body.position.y = 0.7;

    // 左眼
    const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 16), blackMaterial);
    leftEye.position.set(0.15, 1.7, 0.35);

    // 右眼
    const rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 16), blackMaterial);
    rightEye.position.set(-0.15, 1.7, 0.35);

    // 第三只眼（哪吒额头的印记）
    const thirdEye = new THREE.Mesh(new THREE.SphereGeometry(0.03, 16, 16), redMaterial);
    thirdEye.position.set(0, 1.9, 0.35);

    // 头发左侧髻
    const leftHair = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.3, 16), blackMaterial);
    leftHair.position.set(0.35, 1.8, 0);

    // 头发右侧髻
    const rightHair = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.3, 16), blackMaterial);
    rightHair.position.set(-0.35, 1.8, 0);

    // 左侧发带
    const leftHairBand = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.02, 16, 32), redMaterial);
    leftHairBand.position.set(0.35, 1.65, 0);
    leftHairBand.rotation.x = Math.PI / 2;

    // 右侧发带
    const rightHairBand = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.02, 16, 32), redMaterial);
    rightHairBand.position.set(-0.35, 1.65, 0);
    rightHairBand.rotation.x = Math.PI / 2;

    // 添加所有部件到模型组
    this.model.add(head);
    this.model.add(body);
    this.model.add(leftEye);
    this.model.add(rightEye);
    this.model.add(thirdEye);
    this.model.add(leftHair);
    this.model.add(rightHair);
    this.model.add(leftHairBand);
    this.model.add(rightHairBand);

    // 添加手臂和腿
    this.addLimbs();

    console.log('简化模型部件创建完成');

    // 添加模型到场景
    this.scene.add(this.model);
    console.log('简化模型添加到场景');

    // 创建动画混合器
    this.mixer = new THREE.AnimationMixer(this.model);

    // 创建模拟动画
    this.createSimulatedAnimations();
  }

  addLimbs() {
    const skinMaterial = new THREE.MeshStandardMaterial({ color: 0xf5c0a5 });
    const pantsMaterial = new THREE.MeshStandardMaterial({ color: 0xb5179e });

    // 左手臂
    const leftArm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.6, 16), skinMaterial);
    leftArm.position.set(0.5, 0.9, 0);
    leftArm.rotation.z = -Math.PI / 6;

    // 右手臂
    const rightArm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.6, 16), skinMaterial);
    rightArm.position.set(-0.5, 0.9, 0);
    rightArm.rotation.z = Math.PI / 6;

    // 左腿
    const leftLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.8, 16), pantsMaterial);
    leftLeg.position.set(0.15, 0, 0);

    // 右腿
    const rightLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.8, 16), pantsMaterial);
    rightLeg.position.set(-0.15, 0, 0);

    // 添加到模型
    this.model.add(leftArm);
    this.model.add(rightArm);
    this.model.add(leftLeg);
    this.model.add(rightLeg);

    // 为动画保存引用
    this.leftArm = leftArm;
    this.rightArm = rightArm;
    this.leftLeg = leftLeg;
    this.rightLeg = rightLeg;
  }

  createSimulatedAnimations() {
    console.log('创建模拟动画');
    try {
      // 检查模型和混合器是否存在
      if (!this.model) {
        console.error('无法创建动画：模型不存在');
        return;
      }

      // 如果mixer不存在，需要先创建
      if (!this.mixer) {
        console.log('混合器不存在，正在创建新的混合器');
        this.mixer = new THREE.AnimationMixer(this.model);
      }

      if (!this.mixer) {
        console.error('无法创建动画混合器，可能THREE.AnimationMixer不可用');
        return;
      }

      console.log('使用混合器创建动画:', this.mixer);

      // 由于没有真实的动画文件，我们模拟一些简单的动画

      // 空闲动画 - 轻微上下移动
      const idleTrack = this.createIdleAnimation();
      if (idleTrack) {
        this.animations.idle = this.mixer.clipAction(idleTrack);
        this.animations.idle.play();
      }

      // 方向键动画
      const upAnim = this.createUpAnimation();
      if (upAnim) this.animations.up = this.mixer.clipAction(upAnim);

      const downAnim = this.createDownAnimation();
      if (downAnim) this.animations.down = this.mixer.clipAction(downAnim);

      const leftAnim = this.createLeftAnimation();
      if (leftAnim) this.animations.left = this.mixer.clipAction(leftAnim);

      const rightAnim = this.createRightAnimation();
      if (rightAnim) this.animations.right = this.mixer.clipAction(rightAnim);

      const spaceAnim = this.createSpaceAnimation();
      if (spaceAnim) this.animations.space = this.mixer.clipAction(spaceAnim);

      console.log('所有模拟动画创建完成');
    } catch (error) {
      console.error('创建模拟动画失败:', error);
      // 记录更多调试信息
      console.error('调试信息:', {
        hasModel: !!this.model,
        hasMixer: !!this.mixer,
        hasThree: typeof THREE !== 'undefined',
        hasAnimationMixer: typeof THREE !== 'undefined' && typeof THREE.AnimationMixer !== 'undefined'
      });
    }
  }

  // 创建简单的姿势动画
  createIdleAnimation() {
    try {
      const times = [0, 0.5, 1];
      const values = [
        0,
        0,
        0, // 起始位置
        0,
        0.05,
        0, // 中间位置（轻微上升）
        0,
        0,
        0 // 结束位置（回到起始）
      ];

      const posTrack = new THREE.KeyframeTrack('.position[y]', times, values);
      return new THREE.AnimationClip('idle', 1, [posTrack]);
    } catch (error) {
      console.error('创建空闲动画失败:', error);
      return null;
    }
  }

  createUpAnimation() {
    try {
      const times = [0, 0.2, 0.4, 0.6, 0.8, 1];

      // 检查是否有部件引用存在
      if (!this.leftArm || !this.rightArm) {
        console.warn('缺少部件引用，创建简化动画');
        // 创建一个简单的位置动画作为替代
        const posTrack = new THREE.KeyframeTrack('.position[y]', [0, 0.5, 1], [0, 0.2, 0]);
        return new THREE.AnimationClip('up', 1, [posTrack]);
      }

      // 手臂向上举
      const leftArmRotation = [-Math.PI / 6, -Math.PI / 3, -Math.PI / 2, -Math.PI / 3, -Math.PI / 6, -Math.PI / 6];
      const rightArmRotation = [Math.PI / 6, Math.PI / 3, Math.PI / 2, Math.PI / 3, Math.PI / 6, Math.PI / 6];

      // 使用部件uuid作为轨道名
      const leftArmTrack = new THREE.KeyframeTrack(`${this.leftArm.uuid}.rotation[z]`, times, leftArmRotation);
      const rightArmTrack = new THREE.KeyframeTrack(`${this.rightArm.uuid}.rotation[z]`, times, rightArmRotation);

      // 身体上升
      const bodyPosTrack = new THREE.KeyframeTrack('.position[y]', [0, 0.3, 0.5, 0.8, 1], [0, 0.2, 0.3, 0.1, 0]);

      return new THREE.AnimationClip('up', 1, [leftArmTrack, rightArmTrack, bodyPosTrack]);
    } catch (error) {
      console.error('创建上升动画失败:', error);
      return null;
    }
  }

  createDownAnimation() {
    try {
      const times = [0, 0.3, 0.6, 1];

      // 检查是否有部件引用存在
      if (!this.leftArm || !this.rightArm) {
        console.warn('缺少部件引用，创建简化动画');
        // 创建一个简单的位置动画作为替代
        const posTrack = new THREE.KeyframeTrack('.position[y]', [0, 0.5, 1], [0, -0.2, 0]);
        return new THREE.AnimationClip('down', 1, [posTrack]);
      }

      // 手臂向下放
      const leftArmRotation = [-Math.PI / 6, 0, 0, -Math.PI / 6];
      const rightArmRotation = [Math.PI / 6, 0, 0, Math.PI / 6];

      // 使用部件uuid作为轨道名
      const leftArmTrack = new THREE.KeyframeTrack(`${this.leftArm.uuid}.rotation[z]`, times, leftArmRotation);
      const rightArmTrack = new THREE.KeyframeTrack(`${this.rightArm.uuid}.rotation[z]`, times, rightArmRotation);

      // 身体下蹲
      const bodyPosTrack = new THREE.KeyframeTrack('.position[y]', [0, 0.3, 0.7, 1], [0, -0.2, -0.2, 0]);

      return new THREE.AnimationClip('down', 1, [leftArmTrack, rightArmTrack, bodyPosTrack]);
    } catch (error) {
      console.error('创建下蹲动画失败:', error);
      return null;
    }
  }

  createLeftAnimation() {
    try {
      const times = [0, 0.3, 0.6, 1];

      // 检查是否有部件引用存在
      if (!this.leftArm) {
        console.warn('缺少左臂引用，创建简化动画');
        // 创建一个简单的旋转动画作为替代
        const rotTrack = new THREE.KeyframeTrack('.rotation[y]', [0, 0.5, 1], [0, -Math.PI / 4, 0]);
        return new THREE.AnimationClip('left', 1, [rotTrack]);
      }

      // 向左转身
      const bodyRotation = [0, -Math.PI / 4, -Math.PI / 4, 0];
      const bodyRotTrack = new THREE.KeyframeTrack('.rotation[y]', times, bodyRotation);

      // 左手臂伸出
      const leftArmRotation = [-Math.PI / 6, -Math.PI / 2, -Math.PI / 2, -Math.PI / 6];
      const leftArmTrack = new THREE.KeyframeTrack(`${this.leftArm.uuid}.rotation[z]`, times, leftArmRotation);

      return new THREE.AnimationClip('left', 1, [bodyRotTrack, leftArmTrack]);
    } catch (error) {
      console.error('创建左转动画失败:', error);
      return null;
    }
  }

  createRightAnimation() {
    try {
      const times = [0, 0.3, 0.6, 1];

      // 检查是否有部件引用存在
      if (!this.rightArm) {
        console.warn('缺少右臂引用，创建简化动画');
        // 创建一个简单的旋转动画作为替代
        const rotTrack = new THREE.KeyframeTrack('.rotation[y]', [0, 0.5, 1], [0, Math.PI / 4, 0]);
        return new THREE.AnimationClip('right', 1, [rotTrack]);
      }

      // 向右转身
      const bodyRotation = [0, Math.PI / 4, Math.PI / 4, 0];
      const bodyRotTrack = new THREE.KeyframeTrack('.rotation[y]', times, bodyRotation);

      // 右手臂伸出
      const rightArmRotation = [Math.PI / 6, Math.PI / 2, Math.PI / 2, Math.PI / 6];
      const rightArmTrack = new THREE.KeyframeTrack(`${this.rightArm.uuid}.rotation[z]`, times, rightArmRotation);

      return new THREE.AnimationClip('right', 1, [bodyRotTrack, rightArmTrack]);
    } catch (error) {
      console.error('创建右转动画失败:', error);
      return null;
    }
  }

  createSpaceAnimation() {
    try {
      const times = [0, 0.2, 0.4, 0.6, 0.8, 1];

      // 检查是否有部件引用存在
      if (!this.leftArm || !this.rightArm) {
        console.warn('缺少部件引用，创建简化动画');
        // 创建一个简单的跳跃动画
        const posTrack = new THREE.KeyframeTrack('.position[y]', [0, 0.3, 0.6, 1], [0, 0.5, 0.2, 0]);
        const rotTrack = new THREE.KeyframeTrack('.rotation[y]', [0, 0.5, 1], [0, Math.PI, Math.PI * 2]);
        return new THREE.AnimationClip('space', 1, [posTrack, rotTrack]);
      }

      // 跳跃动作
      const posY = [0, 0.3, 0.5, 0.5, 0.2, 0];
      const bodyPosTrack = new THREE.KeyframeTrack('.position[y]', times, posY);

      // 同时挥动双臂
      const leftArmRotZ = [-Math.PI / 6, -Math.PI / 3, -Math.PI / 2, -Math.PI / 3, -Math.PI / 4, -Math.PI / 6];
      const rightArmRotZ = [Math.PI / 6, Math.PI / 3, Math.PI / 2, Math.PI / 3, Math.PI / 4, Math.PI / 6];

      const leftArmTrack = new THREE.KeyframeTrack(`${this.leftArm.uuid}.rotation[z]`, times, leftArmRotZ);
      const rightArmTrack = new THREE.KeyframeTrack(`${this.rightArm.uuid}.rotation[z]`, times, rightArmRotZ);

      // 旋转
      const rotY = [0, Math.PI, Math.PI * 2, Math.PI * 2, Math.PI * 2, Math.PI * 2];
      const bodyRotTrack = new THREE.KeyframeTrack('.rotation[y]', times, rotY);

      return new THREE.AnimationClip('space', 1, [bodyPosTrack, leftArmTrack, rightArmTrack, bodyRotTrack]);
    } catch (error) {
      console.error('创建空格动画失败:', error);
      return null;
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
