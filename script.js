(function (global) {
  'use strict';

  var STATUS_META = {
    occupied: { label: 'Terisi', color: 0x1e4d3b, hex: '#1e4d3b', badgeClass: 'status-occupied', pinClass: 'pin-occupied' },
    ready: { label: 'Kosong siap huni', color: 0x286e51, hex: '#286e51', badgeClass: 'status-ready', pinClass: 'pin-ready' },
    booked: { label: 'Dalam tahap pemesanan', color: 0x9c6514, hex: '#9c6514', badgeClass: 'status-booked', pinClass: 'pin-booked' },
    repair: { label: 'Sedang diperbaiki', color: 0xb84825, hex: '#b84825', badgeClass: 'status-repair', pinClass: 'pin-repair' }
  };

  var ROOM_LAYOUT = [
    { id: 'K-101', floor: 1, x: -3.2, y: 0.15, z: 0.2 },
    { id: 'K-102', floor: 1, x: 0.0, y: 0.15, z: 0.2 },
    { id: 'K-103', floor: 1, x: 3.2, y: 0.15, z: 0.2 },
    { id: 'K-201', floor: 2, x: -3.2, y: 2.75, z: 0.2 },
    { id: 'K-202', floor: 2, x: 0.0, y: 2.75, z: 0.2 },
    { id: 'K-203', floor: 2, x: 3.2, y: 2.75, z: 0.2 }
  ];

  function createCanvasTexture(drawFn, w, h, repeatX, repeatY, isData) {
    var canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    var ctx = canvas.getContext('2d');
    drawFn(ctx, w, h);
    var tex = new global.THREE.CanvasTexture(canvas);
    if (!isData) tex.encoding = global.THREE.sRGBEncoding;
    if (repeatX && repeatY) {
      tex.wrapS = global.THREE.RepeatWrapping;
      tex.wrapT = global.THREE.RepeatWrapping;
      tex.repeat.set(repeatX, repeatY);
    }
    tex.needsUpdate = true;
    return tex;
  }

  function createStudioEnvTexture() {
    var canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    var ctx = canvas.getContext('2d');
    var grad = ctx.createLinearGradient(0, 0, 0, 128);
    grad.addColorStop(0.0, '#eef5fa');
    grad.addColorStop(0.45, '#fffaf0');
    grad.addColorStop(0.55, '#dcd2c0');
    grad.addColorStop(1.0, '#8d8474');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 128);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fillRect(40, 14, 70, 22);
    ctx.fillRect(150, 18, 65, 18);

    var tex = new global.THREE.CanvasTexture(canvas);
    tex.mapping = global.THREE.EquirectangularReflectionMapping;
    tex.encoding = global.THREE.sRGBEncoding;
    tex.needsUpdate = true;
    return tex;
  }

  function createSoftShadowTexture() {
    return createCanvasTexture(function (ctx, w, h) {
      var grad = ctx.createRadialGradient(w / 2, h / 2, w * 0.14, w / 2, h / 2, w * 0.5);
      grad.addColorStop(0, 'rgba(20, 26, 22, 0.34)');
      grad.addColorStop(0.65, 'rgba(20, 26, 22, 0.14)');
      grad.addColorStop(1, 'rgba(20, 26, 22, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    }, 256, 256);
  }

  function createPlasterBumpTexture() {
    return createCanvasTexture(function (ctx, w, h) {
      ctx.fillStyle = '#808080';
      ctx.fillRect(0, 0, w, h);
      for (var i = 0; i < 1800; i += 1) {
        var x = (i * 73) % w;
        var y = (i * 139) % h;
        var v = 112 + ((i * 29) % 34);
        ctx.fillStyle = 'rgb(' + v + ',' + v + ',' + v + ')';
        ctx.fillRect(x, y, 2, 2);
      }
    }, 128, 128, 3, 3, true);
  }

  function createBrickTexture() {
    return createCanvasTexture(function (ctx, w, h) {
      ctx.fillStyle = '#cfc4b6';
      ctx.fillRect(0, 0, w, h);
      var rows = 8;
      var cols = 4;
      var bh = h / rows;
      var bw = w / cols;
      var tones = ['#b54d2b', '#c25732', '#a84424', '#c9623d'];
      for (var r = 0; r < rows; r += 1) {
        var offset = (r % 2) * (bw * 0.5);
        for (var c = -1; c <= cols; c += 1) {
          ctx.fillStyle = tones[(r * 3 + c + 4) % tones.length];
          ctx.fillRect(c * bw + offset + 3, r * bh + 3, bw - 6, bh - 6);
        }
      }
    }, 256, 256, 2, 3);
  }

  function createWoodTexture() {
    return createCanvasTexture(function (ctx, w, h) {
      ctx.fillStyle = '#a47349';
      ctx.fillRect(0, 0, w, h);
      var planks = 6;
      var ph = h / planks;
      for (var i = 0; i < planks; i += 1) {
        ctx.fillStyle = i % 2 === 0 ? '#ad7b50' : '#9b6a42';
        ctx.fillRect(0, i * ph + 1, w, ph - 2);
        ctx.fillStyle = 'rgba(55, 32, 14, 0.12)';
        for (var g = 0; g < 6; g += 1) {
          ctx.fillRect(0, i * ph + 6 + g * 6, w, 1.4);
        }
      }
    }, 256, 256, 1, 1);
  }

  function createTileTexture() {
    return createCanvasTexture(function (ctx, w, h) {
      ctx.fillStyle = '#e7e0d2';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#d3c9b7';
      ctx.lineWidth = 2.5;
      var step = 64;
      for (var x = 0; x <= w; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (var y = 0; y <= h; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
    }, 256, 256, 5, 2.5);
  }

  function createRoofTileTexture() {
    return createCanvasTexture(function (ctx, w, h) {
      ctx.fillStyle = '#8b3a20';
      ctx.fillRect(0, 0, w, h);
      for (var y = 0; y < h; y += 24) {
        ctx.fillStyle = y % 48 === 0 ? '#9c4327' : '#7f331b';
        ctx.fillRect(0, y, w, 22);
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(0, y + 21, w, 3);
      }
      for (var x = 0; x < w; x += 32) {
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.fillRect(x, 0, 2, h);
      }
    }, 256, 256, 4, 2);
  }

  function createSignTexture() {
    return createCanvasTexture(function (ctx, w, h) {
      ctx.fillStyle = '#18221e';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#b84825';
      ctx.lineWidth = 6;
      ctx.strokeRect(7, 7, w - 14, h - 14);
      ctx.fillStyle = '#faf8f3';
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('KOS GRIYA ASRI', w / 2, h / 2 - 12);
      ctx.fillStyle = '#e8c488';
      ctx.font = '600 15px monospace';
      ctx.fillText('6 KAMAR · MODERN', w / 2, h / 2 + 20);
    }, 340, 120);
  }

  function createPlaqueTexture(roomId) {
    return createCanvasTexture(function (ctx, w, h) {
      ctx.fillStyle = '#18221e';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#e8c488';
      ctx.lineWidth = 4;
      ctx.strokeRect(4, 4, w - 8, h - 8);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 34px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(roomId, w / 2, h / 2 + 2);
    }, 160, 72);
  }

  function createContractTexture(confirmed) {
    return createCanvasTexture(function (ctx, w, h) {
      ctx.fillStyle = '#faf8f3';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = confirmed ? '#286e51' : '#18221e';
      ctx.lineWidth = 8;
      ctx.strokeRect(4, 4, w - 8, h - 8);

      ctx.fillStyle = '#18221e';
      ctx.fillRect(18, 20, w - 36, 38);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 17px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('KONTRAK SEWA DIGITAL', w / 2, 44);

      ctx.fillStyle = '#8b928d';
      for (var i = 0; i < 6; i += 1) {
        ctx.fillRect(26, 78 + i * 24, w - 52 - (i % 2) * 32, 8);
      }

      if (confirmed) {
        ctx.strokeStyle = '#286e51';
        ctx.lineWidth = 5;
        ctx.strokeRect(32, 232, w - 64, 44);
        ctx.fillStyle = '#286e51';
        ctx.font = 'bold 19px monospace';
        ctx.fillText('TERKONFIRMASI', w / 2, 260);
      } else {
        ctx.fillStyle = '#b84825';
        ctx.fillRect(22, 232, w - 44, 42);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 15px monospace';
        ctx.fillText('KLIK KONFIRMASI', w / 2, 258);
      }
    }, 256, 310);
  }

  function createQrisTexture(paid) {
    return createCanvasTexture(function (ctx, w, h) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = paid ? '#286e51' : '#9c6514';
      ctx.lineWidth = 10;
      ctx.strokeRect(5, 5, w - 10, h - 10);

      ctx.fillStyle = paid ? '#286e51' : '#18221e';
      ctx.fillRect(16, 16, w - 32, 38);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(paid ? 'LUNAS OTOMATIS' : 'BAYAR QRIS', w / 2, 41);

      var startX = 48;
      var startY = 72;
      var cell = 14;
      ctx.fillStyle = '#18221e';
      for (var r = 0; r < 10; r += 1) {
        for (var c = 0; c < 10; c += 1) {
          var corner = (r < 3 && c < 3) || (r < 3 && c > 6) || (r > 6 && c < 3);
          if (corner || (r * 7 + c * 11) % 3 === 0) {
            ctx.fillRect(startX + c * cell, startY + r * cell, cell - 2, cell - 2);
          }
        }
      }

      ctx.fillStyle = paid ? '#286e51' : '#b84825';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText(paid ? 'Rp 1.950.000 LUNAS' : 'KLIK SIMULASI BAYAR', w / 2, 236);
    }, 240, 265);
  }

  function Kosan3DViewer(options) {
    this.canvas = options.canvas;
    this.pinsContainer = options.pinsContainer;
    this.mode = options.mode || 'studio';
    this.onRoomSelect = options.onRoomSelect || function () {};
    this.onPropAction = options.onPropAction || function () {};
    this.roomsState = options.initialRooms || [];

    this.activeStep = 1;
    this.heroVisualMode = 'digital';
    this.floorFilter = 'all';
    this.statusFilter = 'all';
    this.selectedRoomId = this.mode === 'studio' ? 'K-102' : null;
    this.hoveredRoomId = null;
    this.isNightMode = false;
    this.isRoofClosed = false;

    this.simState = {
      contractConfirmed: false,
      qrisPaid: false,
      complaintStage: 'reported'
    };

    this.isVisible = true;
    this.rafId = null;
    this.clockStart = performance.now();

    if (!global.THREE) {
      this._initFallback2D();
      return;
    }

    try {
      this._initThree();
    } catch (err) {
      this._initFallback2D();
    }
  }

  Kosan3DViewer.prototype._getCameraPreset = function () {
    if (this.mode === 'hero') {
      return { theta: 0.58, phi: 0.96, radius: 17.8, tx: -0.25, ty: 2.1, tz: 0.25 };
    }
    if (this.floorFilter === '1') {
      return { theta: 0.44, phi: 0.88, radius: 13.5, tx: 0.0, ty: 1.15, tz: 0.2 };
    }
    if (this.floorFilter === '2') {
      return { theta: 0.48, phi: 0.84, radius: 13.5, tx: 0.0, ty: 3.45, tz: 0.2 };
    }
    if (this.floorFilter === 'roof') {
      return { theta: 0.6, phi: 0.72, radius: 15.8, tx: -0.2, ty: 4.4, tz: 0.0 };
    }

    switch (this.activeStep) {
      case 1:
        return { theta: 0.54, phi: 0.92, radius: 16.4, tx: 0.0, ty: 2.25, tz: 0.2 };
      case 2:
        return { theta: 0.48, phi: 0.88, radius: 11.4, tx: -3.0, ty: 3.85, tz: 0.45 };
      case 3:
        return { theta: 0.36, phi: 0.88, radius: 11.8, tx: -0.4, ty: 3.6, tz: 0.5 };
      case 4:
        return { theta: -0.34, phi: 0.9, radius: 10.8, tx: 3.1, ty: 1.45, tz: 0.25 };
      case 5:
        return { theta: 0.64, phi: 0.68, radius: 16.2, tx: -0.2, ty: 4.35, tz: -0.1 };
      default:
        return { theta: 0.54, phi: 0.92, radius: 16.4, tx: 0.0, ty: 2.25, tz: 0.2 };
    }
  };

  Kosan3DViewer.prototype._initThree = function () {
    var THREE = global.THREE;
    this.THREE = THREE;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(34, 16 / 10, 0.1, 140);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(global.devicePixelRatio || 1, 2));
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    if (typeof THREE.PMREMGenerator === 'function') {
      var pmrem = new THREE.PMREMGenerator(this.renderer);
      var envTex = createStudioEnvTexture();
      this.scene.environment = pmrem.fromEquirectangular(envTex).texture;
      envTex.dispose();
      pmrem.dispose();
    }

    this.textures = {
      brick: createBrickTexture(),
      wood: createWoodTexture(),
      tile: createTileTexture(),
      roof: createRoofTileTexture(),
      plasterBump: createPlasterBumpTexture(),
      shadow: createSoftShadowTexture()
    };

    var preset = this._getCameraPreset();
    this.camCurrent = Object.assign({}, preset);
    this.camTarget = Object.assign({}, preset);

    this.raycaster = new THREE.Raycaster();
    this.pointerNDC = new THREE.Vector2();
    this.roomMeshes = {};
    this.pickables = [];
    this.actionPickables = [];
    this.pinElements = {};
    this.nightGlowMats = [];
    this.acFans = [];
    this.waterDrops = [];

    this._setupLights();
    this._buildSiteAndBuilding();
    this._buildFlowProps();
    this._buildManualChaosProps();
    if (this.mode === 'studio') {
      this._createPinDOM();
    }
    this._syncRoomsVisuals();
    this._syncStepProps();

    this._bindEvents();
    this._resize();
    this._setupObserver();
    this._startLoop();
  };

  Kosan3DViewer.prototype._setupLights = function () {
    var THREE = this.THREE;
    this.hemiLight = new THREE.HemisphereLight(0xfffcf5, 0xbab09d, 0.85);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xfff4df, 1.15);
    this.sunLight.position.set(12, 19, 13);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 2;
    this.sunLight.shadow.camera.far = 45;
    var d = 11.5;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0005;
    this.scene.add(this.sunLight);

    this.fillLight = new THREE.DirectionalLight(0xdcece8, 0.34);
    this.fillLight.position.set(-10, 8, -9);
    this.scene.add(this.fillLight);

    this.warmNightLight = new THREE.PointLight(0xffb566, 0, 20);
    this.warmNightLight.position.set(0, 3.3, 3.4);
    this.scene.add(this.warmNightLight);
  };

  Kosan3DViewer.prototype._makeBox = function (w, h, d, color, opts) {
    var THREE = this.THREE;
    opts = opts || {};
    var geo = new THREE.BoxGeometry(w, h, d);
    var matProps = {
      color: opts.map ? 0xffffff : color,
      roughness: opts.roughness !== undefined ? opts.roughness : 0.72,
      metalness: opts.metalness !== undefined ? opts.metalness : 0.04,
      envMapIntensity: opts.envMapIntensity !== undefined ? opts.envMapIntensity : 0.75,
      transparent: !!opts.transparent,
      opacity: opts.opacity !== undefined ? opts.opacity : 1.0,
      emissive: opts.emissive || 0x000000,
      emissiveIntensity: opts.emissiveIntensity || 0
    };
    if (opts.map) matProps.map = opts.map;
    if (opts.bumpMap) {
      matProps.bumpMap = opts.bumpMap;
      matProps.bumpScale = opts.bumpScale || 0.018;
    }
    var mat = new THREE.MeshStandardMaterial(matProps);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = opts.castShadow !== false;
    mesh.receiveShadow = opts.receiveShadow !== false;
    return mesh;
  };

  Kosan3DViewer.prototype._buildPlantPot = function (x, y, z, scale) {
    var THREE = this.THREE;
    var g = new THREE.Group();
    g.position.set(x, y, z);
    g.scale.setScalar(scale || 1);

    var pot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.17, 0.34, 16),
      new THREE.MeshStandardMaterial({ color: 0xb84825, roughness: 0.78 })
    );
    pot.position.y = 0.17;
    pot.castShadow = true;

    var soil = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.22, 0.04, 14),
      new THREE.MeshStandardMaterial({ color: 0x3b2c22, roughness: 0.95 })
    );
    soil.position.y = 0.33;
    g.add(pot, soil);

    var leafMat = new THREE.MeshStandardMaterial({
      color: 0x286e51,
      roughness: 0.45,
      side: THREE.DoubleSide
    });
    for (var i = 0; i < 6; i += 1) {
      var angle = (i / 6) * Math.PI * 2;
      var frond = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.48, 0.02), leafMat);
      frond.position.set(Math.cos(angle) * 0.14, 0.52 + (i % 2) * 0.08, Math.sin(angle) * 0.14);
      frond.rotation.y = -angle;
      frond.rotation.z = 0.42 + (i % 2) * 0.15;
      frond.castShadow = true;
      g.add(frond);
    }
    return g;
  };

  Kosan3DViewer.prototype._buildScooter = function (x, z, bodyColor, helmetColor) {
    var THREE = this.THREE;
    var moto = new THREE.Group();
    moto.position.set(x, 0, z);
    var tireGeo = new THREE.TorusGeometry(0.17, 0.06, 10, 18);
    tireGeo.rotateY(Math.PI / 2);
    var tireMat = new THREE.MeshStandardMaterial({ color: 0x1a1c1b, roughness: 0.88 });
    var rimGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.07, 14);
    rimGeo.rotateZ(Math.PI / 2);
    var rimMat = new THREE.MeshStandardMaterial({ color: 0xc2c8cc, metalness: 0.78, roughness: 0.22 });

    var w1 = new THREE.Mesh(tireGeo, tireMat);
    w1.position.set(0, 0.23, 0.46);
    var r1 = new THREE.Mesh(rimGeo, rimMat);
    r1.position.copy(w1.position);

    var w2 = new THREE.Mesh(tireGeo, tireMat);
    w2.position.set(0, 0.23, -0.46);
    var r2 = new THREE.Mesh(rimGeo, rimMat);
    r2.position.copy(w2.position);

    var body = this._makeBox(0.32, 0.34, 1.02, bodyColor, { roughness: 0.22, metalness: 0.2, envMapIntensity: 1.3 });
    body.position.set(0, 0.46, 0);
    var seat = this._makeBox(0.28, 0.1, 0.54, 0x211e1c, { roughness: 0.72 });
    seat.position.set(0, 0.68, -0.15);
    var stem = this._makeBox(0.09, 0.54, 0.12, bodyColor, { roughness: 0.25 });
    stem.position.set(0, 0.72, 0.36);
    stem.rotation.x = -0.22;
    var bar = this._makeBox(0.54, 0.055, 0.07, 0x232624);
    bar.position.set(0, 0.98, 0.31);
    var headlightMat = new THREE.MeshStandardMaterial({ color: 0xfff8e2, emissive: 0xffe4a0, emissiveIntensity: 0.1, roughness: 0.1 });
    var headlight = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.11, 0.05), headlightMat);
    headlight.position.set(0, 0.78, 0.47);
    this.nightGlowMats.push({ mat: headlightMat, day: 0.1, night: 0.9 });
    var helmet = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 16, 16),
      new THREE.MeshStandardMaterial({ color: helmetColor, roughness: 0.18, envMapIntensity: 1.3 })
    );
    helmet.position.set(0, 0.84, -0.12);
    moto.add(w1, r1, w2, r2, body, seat, stem, bar, headlight, helmet);
    return moto;
  };

  Kosan3DViewer.prototype._buildSiteAndBuilding = function () {
    var THREE = this.THREE;
    var self = this;

    this.worldGroup = new THREE.Group();
    this.scene.add(this.worldGroup);

    var aoPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 14),
      new THREE.MeshBasicMaterial({ map: this.textures.shadow, transparent: true, opacity: 0.65, depthWrite: false })
    );
    aoPlane.rotation.x = -Math.PI / 2;
    aoPlane.position.set(-0.3, -0.45, 0.35);
    this.worldGroup.add(aoPlane);

    var plinth = this._makeBox(16.2, 0.42, 10.0, 0xd8d0c1, { roughness: 0.9, bumpMap: this.textures.plasterBump, bumpScale: 0.015 });
    plinth.position.set(-0.4, -0.22, 0.35);
    this.worldGroup.add(plinth);

    var road = this._makeBox(16.2, 0.08, 2.2, 0x3b403d, { roughness: 0.94, bumpMap: this.textures.plasterBump, bumpScale: 0.028 });
    road.position.set(-0.4, 0.02, 4.2);
    this.worldGroup.add(road);

    var curb = this._makeBox(16.2, 0.12, 0.22, 0xc7bfb0, { roughness: 0.86 });
    curb.position.set(-0.4, 0.04, 3.04);
    this.worldGroup.add(curb);

    for (var rx = -6.2; rx <= 5.4; rx += 2.4) {
      var dash = this._makeBox(1.1, 0.09, 0.13, 0xf2ede2, { castShadow: false });
      dash.position.set(rx, 0.03, 4.2);
      this.worldGroup.add(dash);
    }

    var yard = this._makeBox(15.6, 0.07, 6.45, 0xffffff, { map: this.textures.tile, roughness: 0.78 });
    yard.position.set(-0.4, 0.035, -0.18);
    this.worldGroup.add(yard);

    var fenceLeft = this._makeBox(2.9, 0.72, 0.18, 0xffffff, { map: this.textures.brick, bumpMap: this.textures.plasterBump, bumpScale: 0.03, roughness: 0.85 });
    fenceLeft.position.set(-6.35, 0.4, 2.88);
    this.worldGroup.add(fenceLeft);

    [-4.7, 1.4].forEach(function (gx) {
      var pillar = self._makeBox(0.34, 1.48, 0.34, 0xffffff, { map: self.textures.brick, bumpMap: self.textures.plasterBump, bumpScale: 0.03, roughness: 0.85 });
      pillar.position.set(gx, 0.76, 2.88);
      self.worldGroup.add(pillar);
    });

    // PLN Meter Box on entrance pillar
    var plnBox = this._makeBox(0.28, 0.4, 0.12, 0xe8e4db, { roughness: 0.35 });
    plnBox.position.set(1.4, 1.05, 3.08);
    var plnScreen = this._makeBox(0.14, 0.08, 0.02, 0x3b8b69, { emissive: 0x3b8b69, emissiveIntensity: 0.4 });
    plnScreen.position.set(1.4, 1.12, 3.14);
    this.worldGroup.add(plnBox, plnScreen);

    for (var bar = 0; bar < 7; bar += 1) {
      var picket = this._makeBox(0.055, 1.05, 0.055, 0x18221e, { metalness: 0.5, roughness: 0.38 });
      picket.position.set(-1.1 + bar * 0.34, 0.62, 2.88);
      this.worldGroup.add(picket);
    }
    var gateRail = this._makeBox(2.4, 0.075, 0.085, 0x18221e, { metalness: 0.5, roughness: 0.35 });
    gateRail.position.set(-0.08, 1.12, 2.88);
    this.worldGroup.add(gateRail);

    // Garden Lamp Post
    var lampPost = this._makeBox(0.09, 1.9, 0.09, 0x18221e, { metalness: 0.45 });
    lampPost.position.set(1.9, 0.98, 2.68);
    var gardenBulbMat = new THREE.MeshStandardMaterial({
      color: 0xfff3d4,
      emissive: 0xffb347,
      emissiveIntensity: 0.12,
      roughness: 0.15
    });
    var gardenBulb = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 16), gardenBulbMat);
    gardenBulb.position.set(1.9, 1.98, 2.68);
    this.nightGlowMats.push({ mat: gardenBulbMat, day: 0.12, night: 1.45 });
    this.worldGroup.add(lampPost, gardenBulb);

    // Planter box with botanical potted palms
    var planter = this._makeBox(3.3, 0.42, 0.9, 0xffffff, { map: this.textures.brick, bumpMap: this.textures.plasterBump, bumpScale: 0.03, roughness: 0.85 });
    planter.position.set(3.55, 0.25, 2.58);
    this.worldGroup.add(planter);
    this.worldGroup.add(this._buildPlantPot(2.55, 0.45, 2.58, 0.95));
    this.worldGroup.add(this._buildPlantPot(3.55, 0.45, 2.58, 1.1));
    this.worldGroup.add(this._buildPlantPot(4.55, 0.45, 2.58, 0.9));

    // Carport / Parkiran Motor with 3 realistic scooters
    this.carportGroup = new THREE.Group();
    this.carportGroup.position.set(-6.35, 0.06, 0.55);
    [
      [-1.3, -1.2],
      [1.2, -1.2],
      [-1.3, 1.3],
      [1.2, 1.3]
    ].forEach(function (pos) {
      var post = self._makeBox(0.1, 2.28, 0.1, 0x18221e, { metalness: 0.45, roughness: 0.35 });
      post.position.set(pos[0], 1.14, pos[1]);
      self.carportGroup.add(post);
    });
    var canopy = this._makeBox(3.0, 0.08, 2.95, 0x39584d, { transparent: true, opacity: 0.62, roughness: 0.12, envMapIntensity: 1.4 });
    canopy.position.set(-0.05, 2.3, 0.05);
    canopy.rotation.z = 0.05;
    this.carportGroup.add(canopy);
    this.carportGroup.add(this._buildScooter(-0.78, 0.12, 0xb84825, 0xfaf8f3));
    this.carportGroup.add(this._buildScooter(-0.02, 0.18, 0x1f5440, 0xb84825));
    this.carportGroup.add(this._buildScooter(0.72, 0.08, 0x263238, 0xe8c488));
    this.worldGroup.add(this.carportGroup);

    // Kos Signboard
    var signPost = this._makeBox(0.13, 1.92, 0.13, 0x18221e, { metalness: 0.4 });
    signPost.position.set(-4.7, 0.98, 2.55);
    this.worldGroup.add(signPost);

    var signBoardMat = new THREE.MeshStandardMaterial({
      map: createSignTexture(),
      roughness: 0.35,
      emissive: 0xffd79e,
      emissiveIntensity: 0.03
    });
    this.nightGlowMats.push({ mat: signBoardMat, day: 0.03, night: 0.32 });
    var signBoard = new THREE.Mesh(
      new THREE.BoxGeometry(1.9, 0.7, 0.12),
      [
        new THREE.MeshStandardMaterial({ color: 0x18221e }),
        new THREE.MeshStandardMaterial({ color: 0x18221e }),
        new THREE.MeshStandardMaterial({ color: 0x18221e }),
        new THREE.MeshStandardMaterial({ color: 0x18221e }),
        signBoardMat,
        new THREE.MeshStandardMaterial({ color: 0x18221e })
      ]
    );
    signBoard.position.set(-4.7, 1.92, 2.55);
    signBoard.castShadow = true;
    this.worldGroup.add(signBoard);

    this.floor1Group = new THREE.Group();
    this.floor2Group = new THREE.Group();
    this.roofGroup = new THREE.Group();
    this.closedRoofGroup = new THREE.Group();
    this.worldGroup.add(this.floor1Group, this.floor2Group, this.roofGroup, this.closedRoofGroup);

    var f1Slab = this._makeBox(9.95, 0.22, 3.85, 0xf2ece0, { roughness: 0.84, bumpMap: this.textures.plasterBump });
    f1Slab.position.set(0, 0.12, 0.1);
    this.floor1Group.add(f1Slab);

    var f1BackWall = this._makeBox(9.95, 2.48, 0.16, 0xf7f3eb, { roughness: 0.88, bumpMap: this.textures.plasterBump });
    f1BackWall.position.set(0, 1.36, -1.72);
    this.floor1Group.add(f1BackWall);

    var leftBrickPillar = this._makeBox(0.28, 5.18, 3.74, 0xffffff, { map: this.textures.brick, bumpMap: this.textures.plasterBump, bumpScale: 0.04, roughness: 0.86 });
    leftBrickPillar.position.set(-4.84, 2.68, 0.1);
    this.floor1Group.add(leftBrickPillar);

    for (var lv = 0; lv < 5; lv += 1) {
      var louver = this._makeBox(0.08, 2.4, 0.14, 0xffffff, { map: this.textures.wood, roughness: 0.55 });
      louver.position.set(4.94, 3.92, -1.4 + lv * 0.45);
      this.floor2Group.add(louver);
    }

    // Admin Kos Desk + Glowing Dashboard Monitor
    var adminDesk = this._makeBox(1.05, 0.68, 0.58, 0xffffff, { map: this.textures.wood, roughness: 0.48 });
    adminDesk.position.set(-3.95, 0.42, 1.88);
    var adminScreenMat = new THREE.MeshStandardMaterial({
      color: 0x18221e,
      emissive: 0x4ca97e,
      emissiveIntensity: 0.55,
      roughness: 0.2
    });
    var adminMonitor = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.38, 0.06), adminScreenMat);
    adminMonitor.position.set(-3.95, 0.96, 1.85);
    this.floor1Group.add(adminDesk, adminMonitor);

    // Exterior Wooden Staircase L1 -> L2
    for (var s = 0; s < 7; s += 1) {
      var step = this._makeBox(0.78, 0.22, 0.42, 0xffffff, { map: this.textures.wood, roughness: 0.52 });
      step.position.set(5.26, 0.24 + s * 0.36, -1.3 + s * 0.42);
      this.floor1Group.add(step);
    }

    // Floor 2 Slab & Reflective Glass Balcony Railing
    var f2Slab = this._makeBox(9.95, 0.22, 4.28, 0xe8e0d0, { roughness: 0.85, bumpMap: this.textures.plasterBump });
    f2Slab.position.set(0, 2.65, 0.32);
    this.floor2Group.add(f2Slab);

    var railTop = this._makeBox(9.8, 0.07, 0.07, 0xbec5c8, { metalness: 0.82, roughness: 0.2, envMapIntensity: 1.4 });
    railTop.position.set(0, 3.45, 2.38);
    var railGlass = this._makeBox(9.7, 0.62, 0.04, 0x9fc6bd, { transparent: true, opacity: 0.34, roughness: 0.05, metalness: 0.1, envMapIntensity: 1.6, castShadow: false });
    railGlass.position.set(0, 3.08, 2.38);
    this.floor2Group.add(railTop, railGlass);

    var f2BackWall = this._makeBox(9.95, 2.48, 0.16, 0xf7f3eb, { roughness: 0.88, bumpMap: this.textures.plasterBump });
    f2BackWall.position.set(0, 3.92, -1.72);
    this.floor2Group.add(f2BackWall);

    [-1.6, 1.6, 4.82].forEach(function (px) {
      var p1 = self._makeBox(0.12, 2.44, 3.55, 0xede6d9, { roughness: 0.88, bumpMap: self.textures.plasterBump });
      p1.position.set(px, 1.35, 0.05);
      self.floor1Group.add(p1);

      var p2 = self._makeBox(0.12, 2.44, 3.55, 0xede6d9, { roughness: 0.88, bumpMap: self.textures.plasterBump });
      p2.position.set(px, 3.9, 0.05);
      self.floor2Group.add(p2);
    });

    ROOM_LAYOUT.forEach(function (layout) {
      self._buildRoom(layout);
    });

    // Cutaway Rooftop Deck & Water Tank
    var roofDeck = this._makeBox(10.35, 0.22, 2.08, 0x22362f, { roughness: 0.82 });
    roofDeck.position.set(0, 5.2, -0.88);
    this.roofGroup.add(roofDeck);

    var frontBeam = this._makeBox(10.1, 0.14, 0.2, 0x18221e);
    frontBeam.position.set(0, 5.2, 2.28);
    this.roofGroup.add(frontBeam);

    [-4.82, -1.6, 1.6, 4.82].forEach(function (rx) {
      var rafter = self._makeBox(0.12, 0.12, 2.4, 0x1f5440);
      rafter.position.set(rx, 5.2, 1.1);
      self.roofGroup.add(rafter);
    });

    var roofOverhang = this._makeBox(10.55, 0.16, 1.68, 0xffffff, { map: this.textures.roof, roughness: 0.65 });
    roofOverhang.position.set(0, 5.42, -1.2);
    roofOverhang.rotation.x = -0.18;
    this.roofGroup.add(roofOverhang);

    var tankStand = this._makeBox(1.1, 0.65, 1.1, 0x3b4440, { metalness: 0.4 });
    tankStand.position.set(3.8, 5.64, -0.92);
    var tankBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.56, 0.58, 1.25, 22),
      new THREE.MeshStandardMaterial({ color: 0x276887, roughness: 0.28, metalness: 0.22, envMapIntensity: 1.2 })
    );
    tankBody.position.set(3.8, 6.54, -0.92);
    tankBody.castShadow = true;
    var tankPipe = this._makeBox(0.08, 4.8, 0.08, 0x9aa4a9, { metalness: 0.65, roughness: 0.25 });
    tankPipe.position.set(4.55, 2.9, -1.85);
    this.roofGroup.add(tankStand, tankBody, tankPipe);

    // Closed Pitched Terracotta Roof Toggle
    this.closedRoofGroup.visible = false;
    var frontSlope = this._makeBox(10.8, 0.16, 3.05, 0xffffff, { map: this.textures.roof, roughness: 0.62 });
    frontSlope.position.set(0, 5.68, 0.95);
    frontSlope.rotation.x = 0.25;
    var backSlope = this._makeBox(10.8, 0.16, 2.95, 0xffffff, { map: this.textures.roof, roughness: 0.62 });
    backSlope.position.set(0, 5.68, -1.35);
    backSlope.rotation.x = -0.25;
    var ridgeCap = this._makeBox(10.9, 0.14, 0.28, 0xb84825);
    ridgeCap.position.set(0, 6.08, -0.2);
    this.closedRoofGroup.add(frontSlope, backSlope, ridgeCap);
  };

  Kosan3DViewer.prototype._buildRoom = function (layout) {
    var THREE = this.THREE;
    var parent = layout.floor === 1 ? this.floor1Group : this.floor2Group;
    var roomGroup = new THREE.Group();
    roomGroup.position.set(layout.x, layout.y, layout.z);
    parent.add(roomGroup);

    var floorPadMat = new THREE.MeshStandardMaterial({
      color: 0x286e51,
      roughness: 0.62,
      emissive: 0x000000,
      emissiveIntensity: 0
    });
    var floorPad = new THREE.Mesh(new THREE.BoxGeometry(2.85, 0.08, 3.1), floorPadMat);
    floorPad.position.set(0, 0.11, -0.15);
    floorPad.receiveShadow = true;
    roomGroup.add(floorPad);

    var frontStripMat = new THREE.MeshStandardMaterial({
      color: 0x286e51,
      emissive: 0x286e51,
      emissiveIntensity: 0.25
    });
    var frontStrip = new THREE.Mesh(new THREE.BoxGeometry(2.75, 0.11, 0.15), frontStripMat);
    frontStrip.position.set(0, 0.16, 1.48);
    roomGroup.add(frontStrip);

    var selectFrame = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(2.94, 0.18, 3.18)),
      new THREE.LineBasicMaterial({ color: 0xb84825, transparent: true, opacity: 0 })
    );
    selectFrame.position.set(0, 0.16, -0.15);
    roomGroup.add(selectFrame);

    // Room number plaque above door
    var plaque = new THREE.Mesh(
      new THREE.PlaneGeometry(0.42, 0.18),
      new THREE.MeshBasicMaterial({ map: createPlaqueTexture(layout.id) })
    );
    plaque.position.set(-0.96, 2.2, 1.5);
    roomGroup.add(plaque);

    var baseboard = this._makeBox(2.9, 0.14, 0.05, 0x6c4c34);
    baseboard.position.set(0, 0.22, -1.67);
    roomGroup.add(baseboard);

    // Hinged Wooden Door
    var doorPivot = new THREE.Group();
    doorPivot.position.set(-1.35, 0.15, 1.44);
    var doorPanel = this._makeBox(0.76, 1.88, 0.07, 0xffffff, { map: this.textures.wood, roughness: 0.48 });
    doorPanel.position.set(0.38, 0.94, 0);
    var doorHandle = this._makeBox(0.1, 0.05, 0.11, 0xd8a24a, { metalness: 0.78, roughness: 0.2 });
    doorHandle.position.set(0.68, 0.9, 0.02);
    doorPivot.add(doorPanel, doorHandle);
    doorPivot.rotation.y = 0.22;
    roomGroup.add(doorPivot);

    // Bed + Headboard + Pillows + Duvet
    var bedFrame = this._makeBox(1.3, 0.24, 1.76, 0xffffff, { map: this.textures.wood, roughness: 0.5 });
    bedFrame.position.set(-0.62, 0.27, -0.58);
    var headboard = this._makeBox(1.3, 0.72, 0.1, 0xffffff, { map: this.textures.wood, roughness: 0.5 });
    headboard.position.set(-0.62, 0.55, -1.42);
    var mattress = this._makeBox(1.2, 0.18, 1.66, 0xfaf7f0, { roughness: 0.9 });
    mattress.position.set(-0.62, 0.45, -0.58);
    var blanket = this._makeBox(1.23, 0.19, 0.94, layout.floor === 1 ? 0xb84825 : 0x1f5440, { roughness: 0.88 });
    blanket.position.set(-0.62, 0.46, -0.2);

    var pillowMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.88 });
    [-0.86, -0.38].forEach(function (px) {
      var pillow = new THREE.Mesh(new THREE.SphereGeometry(0.18, 14, 10), pillowMat);
      pillow.scale.set(1.25, 0.45, 0.85);
      pillow.position.set(px, 0.58, -1.16);
      pillow.castShadow = true;
      roomGroup.add(pillow);
    });
    roomGroup.add(bedFrame, headboard, mattress, blanket);

    var wallArt = this._makeBox(0.68, 0.46, 0.05, 0xb84825);
    wallArt.position.set(-0.62, 1.45, -1.68);
    roomGroup.add(wallArt);

    var stand = this._makeBox(0.38, 0.42, 0.36, 0xffffff, { map: this.textures.wood, roughness: 0.48 });
    stand.position.set(0.24, 0.35, -1.28);
    var lampShadeMat = new THREE.MeshStandardMaterial({
      color: 0xf7e7c4,
      emissive: 0xffb347,
      emissiveIntensity: 0.08,
      roughness: 0.35
    });
    var lampShade = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.16, 0.18, 16), lampShadeMat);
    lampShade.position.set(0.24, 0.68, -1.28);
    this.nightGlowMats.push({ mat: lampShadeMat, day: 0.08, night: 1.4, roomId: layout.id });
    roomGroup.add(stand, lampShade);

    var rug = this._makeBox(0.95, 0.03, 1.25, 0xe1d8c6, { roughness: 0.95, castShadow: false });
    rug.position.set(0.52, 0.16, -0.15);
    roomGroup.add(rug);

    var wardrobe = this._makeBox(0.75, 1.64, 0.52, 0xffffff, { map: this.textures.wood, roughness: 0.48 });
    wardrobe.position.set(0.9, 0.94, -1.25);
    roomGroup.add(wardrobe);

    // Desk + Glowing Laptop + Swivel Chair
    var desk = this._makeBox(0.95, 0.58, 0.55, 0xffffff, { map: this.textures.wood, roughness: 0.45 });
    desk.position.set(0.8, 0.44, 0.46);
    var laptopBase = this._makeBox(0.36, 0.03, 0.25, 0x24342e, { metalness: 0.5 });
    laptopBase.position.set(0.8, 0.75, 0.46);
    var laptopScreenMat = new THREE.MeshStandardMaterial({
      color: 0xd9f0e8,
      emissive: 0x77c5a5,
      emissiveIntensity: 0.2
    });
    var laptopScreen = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.24, 0.03), laptopScreenMat);
    laptopScreen.position.set(0.8, 0.87, 0.34);
    laptopScreen.rotation.x = -0.18;
    this.nightGlowMats.push({ mat: laptopScreenMat, day: 0.2, night: 0.85, roomId: layout.id });

    var chairBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.16, 0.32, 12),
      new THREE.MeshStandardMaterial({ color: 0x18221e, metalness: 0.65, roughness: 0.25 })
    );
    chairBase.position.set(0.32, 0.28, 0.46);
    var chairSeat = this._makeBox(0.36, 0.06, 0.36, 0x3b4c45, { roughness: 0.75 });
    chairSeat.position.set(0.32, 0.44, 0.46);
    var chairBack = this._makeBox(0.34, 0.32, 0.05, 0x3b4c45, { roughness: 0.75 });
    chairBack.position.set(0.16, 0.6, 0.46);
    chairBack.rotation.y = Math.PI / 2;
    roomGroup.add(desk, laptopBase, laptopScreen, chairBase, chairSeat, chairBack);

    // En-suite Bathroom Corner (Shower screen + Vanity Sink + Faucet)
    var bathGlass = this._makeBox(0.04, 1.25, 0.78, 0xa8ccd3, { transparent: true, opacity: 0.38, roughness: 0.08, castShadow: false });
    bathGlass.position.set(0.45, 0.78, -0.58);
    roomGroup.add(bathGlass);

    if (layout.id !== 'K-103' && layout.id !== 'K-203') {
      var acUnit = this._makeBox(0.84, 0.24, 0.22, 0xfdfdfd, { roughness: 0.28 });
      acUnit.position.set(0.35, 1.94, -1.62);
      var acStripe = this._makeBox(0.72, 0.04, 0.23, 0x286e51);
      acStripe.position.set(0.35, 1.88, -1.62);
      roomGroup.add(acUnit, acStripe);

      var outdoorBox = this._makeBox(0.62, 0.48, 0.26, 0xeae6dd, { roughness: 0.45 });
      outdoorBox.position.set(0.35, 1.6, -1.96);
      var fanBlade = this._makeBox(0.28, 0.05, 0.04, 0x18221e);
      fanBlade.position.set(0.35, 1.6, -2.11);
      this.acFans.push(fanBlade);
      roomGroup.add(outdoorBox, fanBlade);
    }

    // Sink & Faucet inside all rooms, with animated leaking water drops specifically on K-103
    var sinkBase = this._makeBox(0.54, 0.66, 0.46, 0xf1eee7, { roughness: 0.32 });
    sinkBase.position.set(0.95, 0.45, -0.45);
    var basin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.15, 0.14, 18),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.12, envMapIntensity: 1.4 })
    );
    basin.position.set(0.95, 0.82, -0.45);
    var faucet = this._makeBox(0.06, 0.26, 0.14, 0xd4dadd, { metalness: 0.9, roughness: 0.14, envMapIntensity: 1.5 });
    faucet.position.set(0.95, 0.94, -0.58);
    roomGroup.add(sinkBase, basin, faucet);

    if (layout.id === 'K-103') {
      for (var wd = 0; wd < 3; wd += 1) {
        var drop = new THREE.Mesh(
          new THREE.SphereGeometry(0.055, 10, 10),
          new THREE.MeshStandardMaterial({ color: 0x6ac7f2, emissive: 0x3b96c9, emissiveIntensity: 0.45, roughness: 0.05 })
        );
        drop.position.set(0.95, 0.88, -0.48);
        drop.userData.phase = wd * 0.33;
        roomGroup.add(drop);
        this.waterDrops.push(drop);
      }
    }

    // Reflective Glass Window + Curtains
    var winFrame = this._makeBox(0.95, 0.78, 0.22, 0x8cc2d4, { transparent: true, opacity: 0.46, roughness: 0.06, metalness: 0.1, envMapIntensity: 1.6, castShadow: false });
    winFrame.position.set(0.45, 1.38, -1.72);
    var curtainL = this._makeBox(0.22, 0.92, 0.12, 0xb84825, { roughness: 0.92 });
    curtainL.position.set(-0.08, 1.36, -1.62);
    var curtainR = this._makeBox(0.22, 0.92, 0.12, 0xb84825, { roughness: 0.92 });
    curtainR.position.set(0.98, 1.36, -1.62);
    roomGroup.add(winFrame, curtainL, curtainR);

    var hitbox = new THREE.Mesh(
      new THREE.BoxGeometry(2.95, 2.25, 3.2),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
    );
    hitbox.position.set(0, 1.15, -0.1);
    hitbox.userData = { roomId: layout.id };
    roomGroup.add(hitbox);
    this.pickables.push(hitbox);

    this.roomMeshes[layout.id] = {
      group: roomGroup,
      floor: layout.floor,
      floorPadMat: floorPadMat,
      frontStripMat: frontStripMat,
      selectFrame: selectFrame,
      doorPivot: doorPivot,
      doorTargetAngle: 0.22,
      anchor: new THREE.Vector3(layout.x, layout.y + 2.08, layout.z + 1.15)
    };
  };

  Kosan3DViewer.prototype._buildFlowProps = function () {
    var THREE = this.THREE;
    var self = this;

    this.flowPropsGroup = new THREE.Group();
    this.worldGroup.add(this.flowPropsGroup);

    this.contractGroup = new THREE.Group();
    this.contractGroup.position.set(-3.2, 5.8, 1.15);
    this.contractGroup.visible = false;

    this.contractSheetMat = new THREE.MeshStandardMaterial({
      map: createContractTexture(false),
      roughness: 0.45,
      side: THREE.DoubleSide
    });
    this.contractSheet = new THREE.Mesh(new THREE.PlaneGeometry(1.48, 1.78), this.contractSheetMat);
    this.contractSheet.position.set(-0.45, 0.25, 0);
    this.contractSheet.userData = { actionId: 'contract' };
    this.actionPickables.push(this.contractSheet);
    this.contractGroup.add(this.contractSheet);

    this.keyGroup = new THREE.Group();
    this.keyGroup.position.set(0.65, 0.15, 0.2);
    var keyMat = new THREE.MeshStandardMaterial({ color: 0xdfb151, roughness: 0.2, metalness: 0.85, envMapIntensity: 1.5 });
    var keyRing = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.06, 12, 22), keyMat);
    var keyShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.72, 12), keyMat);
    keyShaft.rotation.z = Math.PI / 2;
    keyShaft.position.set(0.52, 0, 0);
    var keyTooth1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.16, 0.06), keyMat);
    keyTooth1.position.set(0.68, -0.1, 0);
    var keyTooth2 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.06), keyMat);
    keyTooth2.position.set(0.84, -0.08, 0);
    this.keyGroup.add(keyRing, keyShaft, keyTooth1, keyTooth2);
    this.contractGroup.add(this.keyGroup);
    this.flowPropsGroup.add(this.contractGroup);

    this.billingGroup = new THREE.Group();
    this.billingGroup.visible = false;

    this.qrisMat = new THREE.MeshStandardMaterial({
      map: createQrisTexture(false),
      roughness: 0.4,
      side: THREE.DoubleSide
    });
    this.qrisCard = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.65), this.qrisMat);
    this.qrisCard.position.set(0.0, 5.75, 1.15);
    this.qrisCard.userData = { actionId: 'qris' };
    this.actionPickables.push(this.qrisCard);
    this.billingGroup.add(this.qrisCard);

    this.billingCurve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(-3.95, 1.35, 1.85),
      new THREE.Vector3(-2.1, 4.85, 3.05),
      new THREE.Vector3(0.0, 4.85, 1.25)
    );
    var tubeGeo = new THREE.TubeGeometry(this.billingCurve, 28, 0.042, 8, false);
    var tubeMat = new THREE.MeshStandardMaterial({
      color: 0x9c6514,
      emissive: 0x9c6514,
      emissiveIntensity: 0.35,
      transparent: true,
      opacity: 0.72
    });
    this.billingTube = new THREE.Mesh(tubeGeo, tubeMat);
    this.billingGroup.add(this.billingTube);

    this.billingPulses = [];
    for (var i = 0; i < 3; i += 1) {
      var pulse = new THREE.Mesh(
        new THREE.SphereGeometry(0.14, 12, 12),
        new THREE.MeshStandardMaterial({ color: 0xf3c178, emissive: 0xf3c178, emissiveIntensity: 0.85 })
      );
      this.billingGroup.add(pulse);
      this.billingPulses.push(pulse);
    }
    this.flowPropsGroup.add(this.billingGroup);

    this.complaintGroup = new THREE.Group();
    this.complaintGroup.position.set(3.2, 2.55, 0.85);
    this.complaintGroup.visible = false;

    this.complaintRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.55, 0.08, 12, 28),
      new THREE.MeshStandardMaterial({ color: 0xb84825, emissive: 0xb84825, emissiveIntensity: 0.65 })
    );
    this.complaintRing.rotation.x = Math.PI / 2;
    this.complaintGroup.add(this.complaintRing);

    this.complaintCore = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.38, 0),
      new THREE.MeshStandardMaterial({ color: 0xb84825, emissive: 0xb84825, emissiveIntensity: 0.45, roughness: 0.25 })
    );
    this.complaintCore.position.y = 0.62;
    this.complaintCore.userData = { actionId: 'complaint' };
    this.actionPickables.push(this.complaintCore);
    this.complaintGroup.add(this.complaintCore);
    this.flowPropsGroup.add(this.complaintGroup);

    this.financeGroup = new THREE.Group();
    this.financeGroup.position.set(-1.35, 5.32, -0.88);
    this.financeGroup.visible = false;

    var barColors = [0x286e51, 0x1e4d3b, 0x9c6514, 0xb84825, 0xf3c178];
    this.financeBars = [];
    barColors.forEach(function (col, idx) {
      var bar = self._makeBox(0.68, 1.0, 0.68, col, { emissive: col, emissiveIntensity: 0.14, roughness: 0.3 });
      bar.position.set((idx - 2) * 1.15, 0.5, 0);
      self.financeGroup.add(bar);
      self.financeBars.push(bar);
    });
    this.flowPropsGroup.add(this.financeGroup);
  };

  Kosan3DViewer.prototype._buildManualChaosProps = function () {
    this.manualChaosGroup = new this.THREE.Group();
    this.manualChaosGroup.visible = false;
    this.chaosItems = [];

    var specs = [
      { x: -3.3, y: 3.1, z: 2.35, color: 0xfdf8eb, w: 0.72, h: 0.92 },
      { x: -1.1, y: 4.5, z: 2.65, color: 0xb84825, w: 0.68, h: 0.52 },
      { x: 1.4, y: 2.3, z: 2.7, color: 0xfdf8eb, w: 0.78, h: 0.88 },
      { x: 3.4, y: 4.4, z: 2.25, color: 0x9c6514, w: 0.68, h: 0.54 },
      { x: -4.2, y: 1.9, z: 2.5, color: 0xb84825, w: 0.6, h: 0.48 },
      { x: 0.2, y: 5.7, z: 1.75, color: 0xfdf8eb, w: 0.82, h: 0.95 }
    ];

    var self = this;
    specs.forEach(function (sp, idx) {
      var mesh = self._makeBox(sp.w, sp.h, 0.06, sp.color, { roughness: 0.6 });
      mesh.position.set(sp.x, sp.y, sp.z);
      mesh.rotation.set(0.2 * idx, -0.3 + idx * 0.25, 0.22 * (idx % 2 ? 1 : -1));
      mesh.userData.baseY = sp.y;
      mesh.userData.phase = idx * 1.1;
      self.manualChaosGroup.add(mesh);
      self.chaosItems.push(mesh);
    });

    this.worldGroup.add(this.manualChaosGroup);
  };

  Kosan3DViewer.prototype._createPinDOM = function () {
    if (!this.pinsContainer) return;
    this.pinsContainer.innerHTML = '';
    var self = this;
    ROOM_LAYOUT.forEach(function (layout) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'room-pin';
      btn.setAttribute('data-pin-room', layout.id);
      btn.innerHTML = '<span class="pin-dot"></span><span>' + layout.id + '</span>';
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        self.selectRoom(layout.id);
        self.onRoomSelect(layout.id);
      });
      self.pinsContainer.appendChild(btn);
      self.pinElements[layout.id] = btn;
    });
  };

  Kosan3DViewer.prototype.updateRoomsState = function (rooms) {
    this.roomsState = rooms;
    if (this.fallbackMode) {
      this._drawFallback2D();
      return;
    }
    this._syncRoomsVisuals();
    this._syncFinanceBars();
  };

  Kosan3DViewer.prototype.setStatusFilter = function (statusKey) {
    this.statusFilter = statusKey || 'all';
    if (this.fallbackMode) {
      this._drawFallback2D();
      return;
    }
    this._syncRoomsVisuals();
  };

  Kosan3DViewer.prototype._syncRoomsVisuals = function () {
    var self = this;
    this.roomsState.forEach(function (room) {
      var entry = self.roomMeshes[room.id];
      if (!entry) return;

      var meta = STATUS_META[room.status] || STATUS_META.ready;
      var showManualChaos = self.mode === 'hero' && self.heroVisualMode === 'manual';
      var matchesFilter = self.statusFilter === 'all' || room.status === self.statusFilter;

      var targetColor = showManualChaos ? 0x8f8778 : meta.color;
      entry.floorPadMat.color.setHex(targetColor);
      entry.frontStripMat.color.setHex(targetColor);
      entry.frontStripMat.emissive.setHex(targetColor);

      var isSelected = self.selectedRoomId === room.id && matchesFilter;
      var isHovered = self.hoveredRoomId === room.id;
      entry.floorPadMat.emissive.setHex(isSelected || isHovered ? meta.color : 0x000000);
      entry.floorPadMat.emissiveIntensity = isSelected ? 0.34 : isHovered ? 0.2 : 0;
      entry.selectFrame.material.opacity = isSelected ? 0.95 : isHovered ? 0.45 : 0;
      entry.doorTargetAngle = isSelected ? 1.32 : 0.22;

      var pin = self.pinElements[room.id];
      if (pin) {
        pin.classList.toggle('is-selected', isSelected);
        pin.style.opacity = matchesFilter ? '1' : '0.35';
        var dot = pin.querySelector('.pin-dot');
        if (dot) {
          dot.className = 'pin-dot ' + (showManualChaos ? 'pin-repair' : meta.pinClass);
        }
      }
    });

    this._syncNightGlow();
  };

  Kosan3DViewer.prototype._syncNightGlow = function () {
    if (!this.nightGlowMats) return;
    var self = this;
    var statusMap = {};
    this.roomsState.forEach(function (r) {
      statusMap[r.id] = r.status;
    });

    this.nightGlowMats.forEach(function (item) {
      if (item.roomId) {
        var st = statusMap[item.roomId];
        var lit = self.isNightMode && (st === 'occupied' || self.selectedRoomId === item.roomId);
        item.mat.emissiveIntensity = lit ? item.night : item.day;
      } else {
        item.mat.emissiveIntensity = self.isNightMode ? item.night : item.day;
      }
    });
  };

  Kosan3DViewer.prototype._syncFinanceBars = function () {
    if (!this.financeBars || !this.financeBars.length) return;
    var occupiedCount = 0;
    var paidIncome = 0;
    var pendingIncome = 0;
    this.roomsState.forEach(function (r) {
      if (r.status === 'occupied') {
        occupiedCount += 1;
        if (r.billingStatus === 'Lunas' || r.billingStatus === 'Lunas Bulan Pertama') paidIncome += r.price;
        else pendingIncome += r.price;
      } else if (r.status === 'booked') {
        pendingIncome += r.price * 0.3;
      }
    });
    var net = Math.max(0.4, (paidIncome - 1400000) / 1500000);
    var heights = [
      Math.max(0.6, paidIncome / 1600000),
      Math.max(0.5, (occupiedCount / 6) * 2.8),
      Math.max(0.4, pendingIncome / 1600000 + 0.35),
      0.95,
      net + 0.55
    ];
    this.financeBars.forEach(function (bar, i) {
      var h = heights[i] || 1;
      bar.scale.y = h;
      bar.position.y = h * 0.5;
    });
  };

  Kosan3DViewer.prototype._syncStepProps = function () {
    if (this.fallbackMode) {
      this._drawFallback2D();
      return;
    }

    var isStudio = this.mode === 'studio';
    this.manualChaosGroup.visible = this.mode === 'hero' && this.heroVisualMode === 'manual';

    this.contractGroup.visible = isStudio && this.activeStep === 2;
    this.billingGroup.visible = isStudio && this.activeStep === 3;
    this.complaintGroup.visible = isStudio && this.activeStep === 4;
    this.financeGroup.visible = isStudio && (this.activeStep === 5 || this.floorFilter === 'roof');

    if (this.contractSheetMat) {
      this.contractSheetMat.map = createContractTexture(this.simState.contractConfirmed);
      this.contractSheetMat.needsUpdate = true;
    }

    if (this.qrisMat) {
      this.qrisMat.map = createQrisTexture(this.simState.qrisPaid);
      this.qrisMat.needsUpdate = true;
      var tubeCol = this.simState.qrisPaid ? 0x286e51 : 0x9c6514;
      this.billingTube.material.color.setHex(tubeCol);
      this.billingTube.material.emissive.setHex(tubeCol);
    }

    if (this.complaintCore && this.complaintRing) {
      var stageColor =
        this.simState.complaintStage === 'done'
          ? 0x286e51
          : this.simState.complaintStage === 'processing'
            ? 0x9c6514
            : 0xb84825;
      this.complaintCore.material.color.setHex(stageColor);
      this.complaintCore.material.emissive.setHex(stageColor);
      this.complaintRing.material.color.setHex(stageColor);
      this.complaintRing.material.emissive.setHex(stageColor);
    }

    var showDrops = this.simState.complaintStage !== 'done';
    this.waterDrops.forEach(function (d) {
      d.visible = showDrops;
    });

    this._syncFinanceBars();
  };

  Kosan3DViewer.prototype.setStep = function (stepNumber, focusRoomId) {
    this.activeStep = stepNumber;
    if (focusRoomId) {
      this.selectedRoomId = focusRoomId;
    }
    this.camTarget = Object.assign({}, this._getCameraPreset());
    this._syncRoomsVisuals();
    this._syncStepProps();
  };

  Kosan3DViewer.prototype.setHeroMode = function (visualMode) {
    this.heroVisualMode = visualMode;
    if (this.fallbackMode) {
      this._drawFallback2D();
      return;
    }
    this._syncRoomsVisuals();
    this._syncStepProps();
  };

  Kosan3DViewer.prototype.setNightMode = function (enabled) {
    this.isNightMode = !!enabled;
    var shell = this.canvas.parentElement;
    if (shell) shell.classList.toggle('is-night', this.isNightMode);
    if (this.fallbackMode) {
      this._drawFallback2D();
      return;
    }

    if (this.isNightMode) {
      this.hemiLight.intensity = 0.35;
      this.hemiLight.color.setHex(0x88a8c9);
      this.sunLight.intensity = 0.28;
      this.sunLight.color.setHex(0xa8c3e8);
      this.warmNightLight.intensity = 0.78;
    } else {
      this.hemiLight.intensity = 0.85;
      this.hemiLight.color.setHex(0xfffcf5);
      this.sunLight.intensity = 1.15;
      this.sunLight.color.setHex(0xfff4df);
      this.warmNightLight.intensity = 0;
    }
    this._syncNightGlow();
  };

  Kosan3DViewer.prototype.setRoofClosed = function (closed) {
    this.isRoofClosed = !!closed;
    if (this.fallbackMode) return;
    if (this.closedRoofGroup) {
      this.closedRoofGroup.visible = this.isRoofClosed && (this.floorFilter === 'all' || this.floorFilter === 'roof');
    }
  };

  Kosan3DViewer.prototype.setFloorFilter = function (floor) {
    this.floorFilter = floor;
    if (this.fallbackMode) {
      this._drawFallback2D();
      return;
    }
    this.floor1Group.visible = true;
    this.floor2Group.visible = floor === 'all' || floor === '2' || floor === 'roof';
    this.roofGroup.visible = floor === 'all' || floor === 'roof';
    this.closedRoofGroup.visible = this.isRoofClosed && (floor === 'all' || floor === 'roof');
    this.camTarget = Object.assign({}, this._getCameraPreset());
    this._syncStepProps();
  };

  Kosan3DViewer.prototype.focusRoom = function (roomId) {
    var layout = ROOM_LAYOUT.find(function (l) {
      return l.id === roomId;
    });
    if (!layout) return;
    this.selectRoom(roomId);
    if (this.fallbackMode) return;
    this.camTarget = {
      theta: layout.x < 0 ? 0.42 : layout.x > 0 ? -0.35 : 0.15,
      phi: 0.96,
      radius: 8.6,
      tx: layout.x,
      ty: layout.y + 1.05,
      tz: 0.25
    };
  };

  Kosan3DViewer.prototype.setSimState = function (patch) {
    Object.assign(this.simState, patch);
    this._syncStepProps();
  };

  Kosan3DViewer.prototype.selectRoom = function (roomId) {
    this.selectedRoomId = roomId;
    if (this.fallbackMode) {
      this._drawFallback2D();
      return;
    }
    this._syncRoomsVisuals();
  };

  Kosan3DViewer.prototype.rotateBy = function (deltaTheta) {
    if (this.fallbackMode) {
      this.fallbackYaw += deltaTheta;
      this._drawFallback2D();
      return;
    }
    this.camTarget.theta += deltaTheta;
  };

  Kosan3DViewer.prototype.zoomBy = function (delta) {
    if (this.fallbackMode) return;
    this.camTarget.radius = Math.min(24, Math.max(7.6, this.camTarget.radius + delta));
  };

  Kosan3DViewer.prototype.resetCamera = function () {
    if (this.fallbackMode) {
      this.fallbackYaw = 0.52;
      this._drawFallback2D();
      return;
    }
    this.camTarget = Object.assign({}, this._getCameraPreset());
  };

  Kosan3DViewer.prototype._bindEvents = function () {
    var self = this;
    var dragState = {
      active: false,
      lastX: 0,
      lastY: 0,
      moved: 0
    };

    this.canvas.addEventListener('pointerdown', function (e) {
      dragState.active = true;
      dragState.lastX = e.clientX;
      dragState.lastY = e.clientY;
      dragState.moved = 0;
    });

    global.addEventListener('pointermove', function (e) {
      if (dragState.active) {
        var dx = e.clientX - dragState.lastX;
        var dy = e.clientY - dragState.lastY;
        dragState.moved += Math.hypot(dx, dy);
        dragState.lastX = e.clientX;
        dragState.lastY = e.clientY;

        self.camTarget.theta -= dx * 0.0085;
        self.camTarget.phi = Math.min(1.36, Math.max(0.42, self.camTarget.phi - dy * 0.0055));
        return;
      }

      if (self.isVisible) {
        self._hoverAt(e.clientX, e.clientY);
      }
    });

    global.addEventListener('pointerup', function (e) {
      if (!dragState.active) return;
      dragState.active = false;
      if (dragState.moved < 7) {
        self._pickAt(e.clientX, e.clientY);
      }
    });

    global.addEventListener('pointercancel', function () {
      dragState.active = false;
    });

    this._onResize = function () {
      self._resize();
    };
    global.addEventListener('resize', this._onResize);
  };

  Kosan3DViewer.prototype._raycast = function (clientX, clientY, targets) {
    var rect = this.canvas.getBoundingClientRect();
    if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {
      return [];
    }
    this.pointerNDC.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.pointerNDC.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointerNDC, this.camera);
    return this.raycaster.intersectObjects(targets, false);
  };

  Kosan3DViewer.prototype._getActiveTargets = function () {
    var activeActions = this.actionPickables.filter(function (mesh) {
      return mesh.parent && mesh.parent.visible;
    });
    var activeRooms = this.pickables.filter(function (mesh) {
      return mesh.parent && mesh.parent.parent && mesh.parent.parent.visible;
    });
    return { actions: activeActions, rooms: activeRooms };
  };

  Kosan3DViewer.prototype._hoverAt = function (clientX, clientY) {
    var targets = this._getActiveTargets();
    var hits = this._raycast(clientX, clientY, targets.actions.concat(targets.rooms));
    if (hits.length > 0) {
      this.canvas.style.cursor = 'pointer';
      var hoveredId = hits[0].object.userData.roomId || null;
      if (hoveredId !== this.hoveredRoomId) {
        this.hoveredRoomId = hoveredId;
        this._syncRoomsVisuals();
      }
    } else {
      this.canvas.style.cursor = 'grab';
      if (this.hoveredRoomId !== null) {
        this.hoveredRoomId = null;
        this._syncRoomsVisuals();
      }
    }
  };

  Kosan3DViewer.prototype._pickAt = function (clientX, clientY) {
    var targets = this._getActiveTargets();
    var actionHits = this._raycast(clientX, clientY, targets.actions);
    if (actionHits.length > 0 && actionHits[0].object.userData.actionId) {
      this.onPropAction(actionHits[0].object.userData.actionId);
      return;
    }

    var roomHits = this._raycast(clientX, clientY, targets.rooms);
    if (roomHits.length > 0 && roomHits[0].object.userData.roomId) {
      var roomId = roomHits[0].object.userData.roomId;
      this.selectRoom(roomId);
      this.onRoomSelect(roomId);
    }
  };

  Kosan3DViewer.prototype._resize = function () {
    var parent = this.canvas.parentElement;
    if (!parent) return;
    var w = Math.max(240, parent.clientWidth);
    var h = Math.max(240, parent.clientHeight);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
    this.viewW = w;
    this.viewH = h;
  };

  Kosan3DViewer.prototype._setupObserver = function () {
    var self = this;
    if ('ResizeObserver' in global && this.canvas.parentElement) {
      var ro = new ResizeObserver(function () {
        self._resize();
      });
      ro.observe(this.canvas.parentElement);
    }
    if (!('IntersectionObserver' in global)) return;
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          self.isVisible = entry.isIntersecting;
        });
      },
      { threshold: 0.05 }
    );
    io.observe(this.canvas);
  };

  Kosan3DViewer.prototype._updatePins = function () {
    if (!this.pinsContainer || !this.viewW || !this.viewH || this.mode === 'hero') return;
    var THREE = this.THREE;
    var tempV = new THREE.Vector3();
    var self = this;

    ROOM_LAYOUT.forEach(function (layout) {
      var pin = self.pinElements[layout.id];
      var meshEntry = self.roomMeshes[layout.id];
      if (!pin || !meshEntry) return;

      var floorVisible =
        self.floorFilter === 'all' ||
        self.floorFilter === 'roof' ||
        String(layout.floor) === String(self.floorFilter);

      if (!floorVisible) {
        pin.style.display = 'none';
        return;
      }

      tempV.copy(meshEntry.anchor);
      tempV.project(self.camera);

      if (tempV.z > 1) {
        pin.style.display = 'none';
        return;
      }

      var sx = (tempV.x * 0.5 + 0.5) * self.viewW;
      var sy = (-tempV.y * 0.5 + 0.5) * self.viewH;
      pin.style.display = 'inline-flex';
      pin.style.left = Math.round(sx) + 'px';
      pin.style.top = Math.round(sy) + 'px';
    });
  };

  Kosan3DViewer.prototype._startLoop = function () {
    var self = this;
    function tick(now) {
      self.rafId = global.requestAnimationFrame(tick);
      if (!self.isVisible) return;

      var t = (now - self.clockStart) * 0.001;

      if (self.mode === 'hero') {
        self.camTarget.theta += 0.0008;
      }

      var k = 0.095;
      self.camCurrent.theta += (self.camTarget.theta - self.camCurrent.theta) * k;
      self.camCurrent.phi += (self.camTarget.phi - self.camCurrent.phi) * k;
      self.camCurrent.radius += (self.camTarget.radius - self.camCurrent.radius) * k;
      self.camCurrent.tx += (self.camTarget.tx - self.camCurrent.tx) * k;
      self.camCurrent.ty += (self.camTarget.ty - self.camCurrent.ty) * k;
      self.camCurrent.tz += (self.camTarget.tz - self.camCurrent.tz) * k;

      var sinPhi = Math.sin(self.camCurrent.phi);
      var cosPhi = Math.cos(self.camCurrent.phi);
      var sinTheta = Math.sin(self.camCurrent.theta);
      var cosTheta = Math.cos(self.camCurrent.theta);

      self.camera.position.set(
        self.camCurrent.tx + self.camCurrent.radius * sinPhi * sinTheta,
        self.camCurrent.ty + self.camCurrent.radius * cosPhi,
        self.camCurrent.tz + self.camCurrent.radius * sinPhi * cosTheta
      );
      self.camera.lookAt(self.camCurrent.tx, self.camCurrent.ty, self.camCurrent.tz);

      ROOM_LAYOUT.forEach(function (layout) {
        var entry = self.roomMeshes[layout.id];
        if (entry && entry.doorPivot) {
          entry.doorPivot.rotation.y += (entry.doorTargetAngle - entry.doorPivot.rotation.y) * 0.12;
        }
      });

      self.acFans.forEach(function (fan) {
        fan.rotation.z = t * 8.0;
      });

      if (self.waterDrops.length && self.simState.complaintStage !== 'done') {
        self.waterDrops.forEach(function (drop) {
          var cycle = (t * 1.15 + drop.userData.phase) % 1;
          drop.position.y = 0.9 - cycle * 0.36;
          drop.scale.setScalar(1 - cycle * 0.35);
        });
      }

      if (self.contractGroup && self.contractGroup.visible) {
        self.contractGroup.position.y = 5.75 + Math.sin(t * 2.1) * 0.12;
        self.contractSheet.lookAt(self.camera.position.x, self.contractGroup.position.y, self.camera.position.z);
        var keyTargetX = self.simState.contractConfirmed ? 0.08 : 0.65;
        self.keyGroup.position.x += (keyTargetX - self.keyGroup.position.x) * 0.1;
        self.keyGroup.rotation.y = t * 1.4;
      }

      if (self.billingGroup && self.billingGroup.visible) {
        self.qrisCard.position.y = 5.75 + Math.sin(t * 2.0) * 0.12;
        self.qrisCard.lookAt(self.camera.position.x, self.qrisCard.position.y, self.camera.position.z);
        self.billingPulses.forEach(function (pulse, idx) {
          var speed = self.simState.qrisPaid ? 0.55 : 0.32;
          var u = (t * speed + idx * 0.33) % 1;
          var pt = self.billingCurve.getPoint(self.simState.qrisPaid ? 1 - u : u);
          pulse.position.copy(pt);
          pulse.material.color.setHex(self.simState.qrisPaid ? 0x57c58f : 0xf3c178);
        });
      }

      if (self.complaintGroup && self.complaintGroup.visible) {
        self.complaintCore.rotation.y = t * 2.2;
        self.complaintCore.position.y = 0.65 + Math.sin(t * 3.0) * 0.1;
        var pulseScale = 1 + Math.sin(t * 4.2) * 0.16;
        self.complaintRing.scale.set(pulseScale, pulseScale, 1);
      }

      if (self.manualChaosGroup && self.manualChaosGroup.visible) {
        self.chaosItems.forEach(function (item) {
          item.position.y = item.userData.baseY + Math.sin(t * 2.3 + item.userData.phase) * 0.18;
          item.rotation.z += 0.008;
        });
      }

      self.renderer.render(self.scene, self.camera);
      self._updatePins();
    }
    this.rafId = global.requestAnimationFrame(tick);
  };

  Kosan3DViewer.prototype._initFallback2D = function () {
    this.fallbackMode = true;
    this.fallbackYaw = 0.52;
    this.ctx2d = this.canvas.getContext('2d');
    var self = this;

    var drag = { active: false, lastX: 0 };
    this.canvas.addEventListener('pointerdown', function (e) {
      drag.active = true;
      drag.lastX = e.clientX;
    });
    global.addEventListener('pointermove', function (e) {
      if (!drag.active) return;
      var dx = e.clientX - drag.lastX;
      drag.lastX = e.clientX;
      self.fallbackYaw += dx * 0.01;
      self._drawFallback2D();
    });
    global.addEventListener('pointerup', function () {
      drag.active = false;
    });
    global.addEventListener('pointercancel', function () {
      drag.active = false;
    });

    if (this.mode === 'studio') this._createPinDOM();
    global.addEventListener('resize', function () {
      self._drawFallback2D();
    });
    this._drawFallback2D();
  };

  Kosan3DViewer.prototype._drawFallback2D = function () {
    var parent = this.canvas.parentElement;
    if (!parent || !this.ctx2d) return;
    var w = (this.canvas.width = parent.clientWidth);
    var h = (this.canvas.height = parent.clientHeight);
    var ctx = this.ctx2d;
    ctx.clearRect(0, 0, w, h);

    var cx = w * 0.52;
    var cy = h * 0.7;
    var scale = Math.min(w / 14.5, h / 9.8);
    var cosA = Math.cos(this.fallbackYaw);
    var sinA = Math.sin(this.fallbackYaw);

    function project(x, y, z) {
      var rx = x * cosA - z * sinA;
      var rz = x * sinA + z * cosA;
      return {
        x: cx + rx * scale,
        y: cy - y * scale + rz * scale * 0.4
      };
    }

    function drawBlock(x, y, z, bw, bh, bd, topCol, sideCol) {
      var hw = bw / 2;
      var hd = bd / 2;
      var p1 = project(x - hw, y + bh, z - hd);
      var p2 = project(x + hw, y + bh, z - hd);
      var p3 = project(x + hw, y + bh, z + hd);
      var p4 = project(x - hw, y + bh, z + hd);
      var b3 = project(x + hw, y, z + hd);
      var b4 = project(x - hw, y, z + hd);

      ctx.fillStyle = sideCol;
      ctx.beginPath();
      ctx.moveTo(p4.x, p4.y);
      ctx.lineTo(p3.x, p3.y);
      ctx.lineTo(b3.x, b3.y);
      ctx.lineTo(b4.x, b4.y);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(24,34,30,0.22)';
      ctx.stroke();

      ctx.fillStyle = topCol;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineTo(p3.x, p3.y);
      ctx.lineTo(p4.x, p4.y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    drawBlock(-0.2, -0.35, 0, 13.4, 0.35, 6.2, '#e2dacb', '#c6bda9');
    drawBlock(-5.6, 0.1, 0.4, 2.2, 2.0, 2.5, '#284e41', '#1b352c');

    var self = this;
    ROOM_LAYOUT.forEach(function (layout) {
      var floorVisible =
        self.floorFilter === 'all' ||
        self.floorFilter === 'roof' ||
        String(layout.floor) === String(self.floorFilter);
      var pin = self.pinElements[layout.id];

      if (!floorVisible) {
        if (pin) pin.style.display = 'none';
        return;
      }

      var st = self.roomsState.find(function (r) {
        return r.id === layout.id;
      });
      var meta = STATUS_META[(st && st.status) || 'ready'];
      drawBlock(layout.x, layout.y, layout.z, 2.7, 1.85, 2.8, '#faf8f3', meta.hex);

      if (pin) {
        var pt = project(layout.x, layout.y + 2.05, layout.z);
        pin.style.display = 'inline-flex';
        pin.style.left = Math.round(pt.x) + 'px';
        pin.style.top = Math.round(pt.y) + 'px';
        pin.classList.toggle('is-selected', self.selectedRoomId === layout.id);
      }
    });
  };

  global.Kosan3DViewer = Kosan3DViewer;
})(window);

(function () {
  'use strict';

  var STATUS_INFO = {
    occupied: { label: 'Terisi', badgeClass: 'status-occupied' },
    ready: { label: 'Kosong siap huni', badgeClass: 'status-ready' },
    booked: { label: 'Dalam tahap pemesanan', badgeClass: 'status-booked' },
    repair: { label: 'Sedang diperbaiki', badgeClass: 'status-repair' }
  };

  var STEP_META = {
    1: { hudTitle: 'Data Kamar, Penghuni, & Pemesanan', focusRoom: 'K-102' },
    2: { hudTitle: 'Kontrak Sewa Digital & Serah Kunci', focusRoom: 'K-201' },
    3: { hudTitle: 'Penagihan Tanpa Canggung & QRIS', focusRoom: 'K-202' },
    4: { hudTitle: 'Penanganan Pengaduan 3 Status', focusRoom: 'K-103' },
    5: { hudTitle: 'Laporan Keuangan & Keterisian Kamar', focusRoom: 'K-101' }
  };

  var ROLES_DATA = {
    admin: {
      title: 'Admin Kos: Pengendali Penuh Operasional Properti',
      scope: 'Ruang Data Terpisah & Aman',
      desc: 'Mengelola kamar, data penghuni, pemesanan, kontrak sewa digital, tagihan, pembayaran, pengaduan, dan laporan keuangan di ruang data yang terpisah dan aman.',
      capabilities: [
        'Memperbarui empat status kamar serta mencatat pemesanan masuk tanpa risiko terjual ganda',
        'Menyimpan identitas diri, kontak darurat, riwayat kamar, dan kontrak sewa digital penghuni',
        'Mengatur pengingat jatuh tempo otomatis serta memantau pembayaran QRIS dan transfer bank',
        'Memperbarui progres pengaduan penghuni dan membaca laporan keuangan bersih kapan saja'
      ]
    },
    penghuni: {
      title: 'Penghuni Kos: Transparansi Informasi, Kontrak, & Tagihan',
      scope: 'Akun Penghuni Mandiri',
      desc: 'Mengakses informasi kamar, melihat kontrak sewa digital, memantau tagihan dan riwayat pembayaran, serta mengirim laporan pengaduan.',
      capabilities: [
        'Melihat informasi kamar, fasilitas, dan ketentuan sewa dalam kontrak digital kapan saja',
        'Memantau status tagihan dan riwayat pembayaran tanpa khawatir bukti transfer tercecer',
        'Membayar sewa lewat QRIS atau transfer bank yang otomatis tercatat di dalam sistem',
        'Mengirim laporan kendala fasilitas dan memantau status perbaikannya hingga tuntas'
      ]
    },
    superadmin: {
      title: 'Super Admin: Penjaga Keandalan Platform SaaS',
      scope: 'Manajemen Sistem Terpusat',
      desc: 'Menjaga keandalan infrastruktur platform SaaS, mengelola akun Admin Kos, dan memantau sistem secara terpusat.',
      capabilities: [
        'Menjaga stabilitas dan keandalan infrastruktur layanan bagi seluruh pengelola rumah kos',
        'Mengelola pembuatan serta akses akun Admin Kos untuk masing-masing properti',
        'Memantau performa sistem secara terpusat sambil menjaga isolasi data antar pengelola'
      ]
    }
  };

  var INITIAL_ROOMS = [
    {
      id: 'K-101',
      floor: 1,
      type: 'Tipe AC',
      price: 1850000,
      status: 'occupied',
      tenant: 'Rizky Pratama',
      billingStatus: 'Lunas',
      contractState: 'Kontrak Digital Terkonfirmasi',
      note: 'Fasilitas: AC, Kasur Queen, Meja Kerja, Lemari, Wi-Fi, Kamar Mandi Dalam. Jatuh tempo tanggal 5.'
    },
    {
      id: 'K-102',
      floor: 1,
      type: 'Tipe AC · Siap Huni',
      price: 1850000,
      status: 'ready',
      tenant: 'Belum ada penghuni',
      billingStatus: 'Tersedia untuk pemesanan baru',
      contractState: 'Menunggu pemesan',
      note: 'Fasilitas: AC, Kasur Queen, Meja Kerja, Lemari, Wi-Fi, Kamar Mandi Dalam. Siap dipesan calon penghuni.'
    },
    {
      id: 'K-103',
      floor: 1,
      type: 'Tipe Standar',
      price: 1250000,
      status: 'repair',
      tenant: 'Perawatan Fasilitas Aktif',
      billingStatus: 'Tiket #ADU-04: Keran bocor',
      contractState: 'Sedang ditangani Admin Kos',
      note: 'Fasilitas: Kasur, Meja Belajar, Lemari, Wi-Fi, Kamar Mandi Dalam. Keluhan keran air bocor tercatat resmi.'
    },
    {
      id: 'K-201',
      floor: 2,
      type: 'Tipe AC + Balkon',
      price: 1950000,
      status: 'booked',
      tenant: 'Nadia Kusuma (Masuk tgl 1)',
      billingStatus: 'DP Pemesanan Tercatat',
      contractState: 'Menunggu konfirmasi kontrak digital',
      note: 'Fasilitas: AC, Balkon, Kasur Queen, Meja Kerja, Lemari, Wi-Fi. Konfirmasi kontrak sebelum kunci diserahkan.'
    },
    {
      id: 'K-202',
      floor: 2,
      type: 'Tipe AC',
      price: 1950000,
      status: 'occupied',
      tenant: 'Siti Rahmawati',
      billingStatus: 'Menunggu Pembayaran (H-2)',
      contractState: 'Kontrak Digital Terkonfirmasi',
      note: 'Fasilitas: AC, Kasur Queen, Meja Kerja, Lemari, Wi-Fi. Pengingat jatuh tempo otomatis aktif.'
    },
    {
      id: 'K-203',
      floor: 2,
      type: 'Tipe Standar + Balkon',
      price: 1350000,
      status: 'occupied',
      tenant: 'Dimas Wijaya',
      billingStatus: 'Lunas',
      contractState: 'Kontrak Digital Terkonfirmasi',
      note: 'Fasilitas: Balkon, Kasur, Meja Kerja, Lemari, Wi-Fi, Kamar Mandi Dalam. Pembayaran rutin tercatat rapi.'
    }
  ];

  var FULL_GUIDE_PARAGRAPHS = [
    { heading: 'Panduan Mengelola Rumah Kos Secara Modern dan Efisien', body: 'Langkah Praktis Menata Operasional, Penagihan, Kontrak Sewa, dan Kepuasan Penghuni dengan Teknologi Digital.' },
    { heading: 'Pendahuluan', body: 'Banyak bisnis rumah kos dimulai dengan cara yang sangat sederhana. Pada awalnya, pemilik hanya memiliki lima hingga sepuluh kamar. Semua urusan terasa cukup ditangani dengan satu buku tulis bergaris, catatan di ponsel, dan percakapan WhatsApp bersama penghuni. Selama jumlah kamar masih sedikit dan penghuninya jarang berganti, pola kerja manual seperti itu memang terlihat berjalan baik.' },
    { heading: '', body: 'Namun, situasi mulai berubah ketika jumlah kamar bertambah, pergantian penghuni semakin sering, atau pengelola mulai memiliki kesibukan lain di luar mengurus kos. Di titik inilah pekerjaan administratif yang tampak sepele mulai menyita waktu dan energi. Catatan pembayaran tercecer di berbagai obrolan, jadwal jatuh tempo terlewat, foto kartu identitas penghuni tertimbun pesan lain, dan pemilik kos kesulitan menjawab pertanyaan paling mendasar tentang usahanya sendiri: berapa sebenarnya pemasukan bersih bulan ini dan kamar mana saja yang masih menunggak?' },
    { heading: '', body: 'Buku panduan ini disusun untuk membantu pengelola dan pemilik rumah kos menata operasional secara lebih teratur, profesional, dan efisien. Pembahasan di dalamnya berangkat dari permasalahan sehari-hari yang paling sering ditemui di lapangan, lalu menguraikan langkah-langkah praktis serta cara memanfaatkan teknologi digital agar rumah kos lebih mudah dikelola tanpa harus mengorbankan waktu pribadi Anda.' },
    { heading: 'Mengapa Pengelolaan Manual Mulai Kewalahan', body: 'Masalah terbesar dalam pengelolaan kos tradisional bukan terletak pada kurangnya niat baik pengelola, melainkan pada sistem pencatatan yang terpisah-pisah. Ketika data kamar ada di kepala atau papan tulis, data penghuni tersimpan di galeri foto ponsel, tagihan dikirim secara manual satu per satu lewat pesan singkat, dan catatan pengeluaran disimpan di bon kertas, celah kesalahan hampir pasti muncul.' },
    { heading: '', body: 'Kebocoran paling sering terjadi pada tiga hal. Pertama, keterlambatan penagihan dan pembayaran yang tidak terdeteksi tepat waktu. Tanpa pengingat yang teratur, penghuni bisa lupa membayar, sementara pengelola pun kerap merasa sungkan menagih berulang kali. Kedua, informasi ketersediaan kamar yang tidak akurat sehingga calon penghuni mendapat jawaban yang lambat atau keliru. Ketiga, keluhan penghuni mengenai kerusakan fasilitas yang terselip di antara ratusan pesan masuk sehingga penanganannya tertunda dan membuat penghuni tidak betah.' },
    { heading: '', body: 'Ketika persoalan-persoalan tersebut menumpuk, bisnis kos yang seharusnya menjadi sumber pendapatan pasif yang tenang justru berubah menjadi pekerjaan harian yang melelahkan. Solusinya bukan dengan bekerja lebih keras memakai cara lama, melainkan memindahkan rutinitas tersebut ke dalam satu alur kerja digital yang rapi.' },
    { heading: 'Menata Data Kamar, Penghuni, dan Pemesanan dalam Satu Tempat', body: 'Langkah pertama menuju pengelolaan kos yang modern adalah menyatukan seluruh informasi dasar properti ke dalam satu basis data yang selalu mutakhir. Setiap kamar perlu memiliki identitas yang jelas, mulai dari nomor kamar, tipe, harga sewa, daftar fasilitas di dalamnya, hingga status terkini apakah kamar tersebut sedang terisi, kosong siap huni, dalam tahap pemesanan, atau sedang diperbaiki.' },
    { heading: '', body: 'Bayangkan ketika seorang calon penghuni menghubungi Anda pada siang hari untuk menanyakan kamar ber-AC yang kosong bulan depan. Dengan sistem pencatatan terpusat, Anda tidak perlu lagi menelepon penjaga kos atau membuka-buka catatan lama. Anda cukup melihat status kamar secara langsung, memeriksa tanggal berakhirnya masa sewa penghuni sebelumnya, lalu mencatat pemesanan kamar baru saat itu juga. Risiko kamar terjual ganda atau terlewatnya jadwal masuk penghuni pun dapat dihindari.' },
    { heading: '', body: 'Hal yang sama berlaku untuk data penghuni. Informasi penting seperti nama lengkap, nomor kontak darurat, identitas diri, tanggal masuk, dan riwayat kamar yang ditempati sebaiknya tersimpan rapi dan mudah dicari kembali. Dalam platform berbasis SaaS seperti sistem manajemen rumah kos, peran Admin Kos dirancang khusus untuk menangani seluruh pencatatan kamar, data penghuni, dan pemesanan tersebut dalam satu dasbor terpadu. Karena sistem ini memisahkan data setiap pengelola kos secara aman, informasi properti dan privasi penghuni Anda tetap terlindungi dan tidak bercampur dengan pengelola kos lainnya.' },
    { heading: 'Membangun Kejelasan Lewat Kontrak Sewa Digital', body: 'Salah satu sumber kesalahpahaman yang paling sering memicu konflik di rumah kos adalah kesepakatan sewa yang hanya disampaikan secara lisan atau melalui pesan singkat yang mudah tenggelam. Pertanyaan seperti apakah biaya listrik sudah termasuk sewa, bagaimana aturan membawa tamu, berapa denda keterlambatan, atau bagaimana ketentuan pengembalian uang jaminan sering kali baru muncul saat penghuni hendak pindah keluar.' },
    { heading: '', body: 'Untuk mencegah perdebatan semacam ini, setiap penghuni baru perlu menyepakati kontrak sewa yang tertulis jelas sejak awal. Kini, Anda tidak lagi harus mencetak berlembar-lembar kertas yang mudah hilang atau rusak. Kontrak sewa digital memungkinkan seluruh ketentuan sewa, durasi tinggal, nominal pembayaran, dan tata tertib rumah kos tersimpan rapi di dalam sistem.' },
    { heading: 'Tips Praktis Serah Terima Kamar', quote: 'Biasakan proses serah terima kamar selalu disertai konfirmasi kontrak digital sebelum kunci diserahkan. Dengan begitu, penghuni memahami hak dan kewajibannya sejak hari pertama. Di dalam sistem manajemen rumah kos berbasis SaaS, dokumen kontrak sewa digital dapat dikelola oleh Admin Kos dan dilihat kembali kapan saja oleh Penghuni Kos melalui akun mereka.' },
    { heading: 'Menagih Lebih Profesional dan Menghindari Tunggakan', body: 'Bagi banyak pemilik kos, menagih uang sewa adalah bagian pekerjaan yang paling tidak nyaman. Ada rasa sungkan jika harus mengirim pesan penagihan secara pribadi, apalagi jika penghuni sudah cukup lama tinggal dan memiliki hubungan baik dengan pengelola. Sebaliknya, jika tidak diingatkan, sebagian penghuni benar-benar lupa karena kesibukan kuliah atau pekerjaan mereka.' },
    { heading: '', body: 'Cara terbaik untuk menghilangkan rasa canggung tersebut adalah memisahkan urusan pribadi dari sistem penagihan. Penagihan harus berjalan sebagai prosedur rutin yang teratur dan objektif. Mulailah dengan menetapkan siklus jatuh tempo yang jelas, menyediakan rincian tagihan yang transparan, serta mengirimkan pengingat jatuh tempo beberapa hari sebelum tanggal pembayaran tiba. Ketika pengingat dikirimkan secara sistematis, penghuni memandangnya sebagai pengingat resmi dari manajemen kos, bukan teguran personal dari pemiliknya.' },
    { heading: '', body: 'Selain itu, berikan kemudahan dalam metode pembayaran dan pencatatan buktinya. Menyediakan opsi pembayaran digital seperti QRIS atau transfer bank yang tercatat statusnya di dalam sistem akan memangkas waktu pengecekan mutasi rekening secara manual. Penghuni tidak perlu lagi khawatir apakah bukti transfer mereka sudah terbaca atau belum, karena mereka dapat memantau status tagihan dan riwayat pembayaran langsung dari halaman Penghuni Kos. Sementara itu, Admin Kos dapat melihat daftar tagihan yang sudah lunas, masih menunggu pembayaran, atau melewati jatuh tempo dalam satu tampilan yang bersih.' },
    { heading: 'Prinsip Penagihan Tanpa Canggung', quote: 'Pisahkan hubungan personal dari prosedur penagihan dengan memanfaatkan pengingat jatuh tempo otomatis serta opsi pembayaran digital (QRIS/transfer bank). Pengingat sistematis dipahami sebagai pengingat resmi manajemen kos, bukan teguran personal dari pemilik.' },
    { heading: 'Menangani Pengaduan Penghuni Secara Terukur', body: 'Tingkat hunian yang tinggi tidak hanya ditentukan oleh lokasi yang strategis dan harga yang bersaing, tetapi juga oleh seberapa nyaman penghuni merasa didengar ketika menghadapi masalah. Keran air yang bocor, pendingin ruangan yang kurang dingin, atau koneksi internet yang terputus adalah hal wajar dalam operasional bangunan. Yang menentukan kepuasan penghuni adalah kecepatan dan kejelasan respons pengelola.' },
    { heading: '', body: 'Kebiasaan menerima keluhan hanya lewat pesan WhatsApp pribadi sering membuat laporan tercecer. Jika pengelola sedang sibuk saat pesan masuk, pesan itu bisa tertimbun dan baru diingat beberapa hari kemudian ketika penghuni sudah merasa kesal. Untuk mengatasinya, biasakan setiap laporan kerusakan masuk melalui satu jalur pencatatan pengaduan yang memiliki status penanganan, misalnya baru dilaporkan, sedang diproses, atau sudah selesai diperbaiki.' },
    { heading: 'Alur Penanganan Keluhan yang Ideal', quote: 'Dilaporkan oleh Penghuni -> Diproses oleh Admin Kos -> Selesai & Terdokumentasi. Dengan alur status yang jelas, penghuni merasa tenang karena kendala sedang ditangani, sementara pengelola memiliki catatan perawatan kamar yang terukur.' },
    { heading: 'Membaca Kesehatan Bisnis Lewat Laporan Keuangan yang Rapi', body: 'Banyak pemilik kos merasa bisnisnya selalu ramai karena hampir semua kamar terisi, tetapi tetap bingung ke mana perginya uang hasil sewa di akhir tahun. Penyebabnya hampir selalu sama: uang sewa masuk bercampur dengan rekening pribadi, sementara biaya perawatan kecil, iuran lingkungan, kebersihan, dan perbaikan mendadak jarang dicatat secara disiplin.' },
    { heading: '', body: 'Mengelola rumah kos secara modern berarti memperlakukan kos sebagai unit usaha yang memiliki laporan keuangan jelas. Setiap pemasukan dari pembayaran sewa maupun biaya tambahan, serta setiap pengeluaran operasional, perlu dicatat secara berkala. Dari catatan inilah Anda dapat menghitung arus kas bersih, mengetahui tingkat keterisian kamar dari bulan ke bulan, serta merencanakan dana cadangan untuk renovasi atau peremajaan fasilitas.' },
    { heading: '', body: 'Ketika seluruh aktivitas pemesanan, tagihan, dan pembayaran sudah berjalan di satu sistem digital, laporan keuangan tidak lagi harus disusun ulang dari awal menggunakan rumus spreadsheet yang rumit di akhir bulan. Data transaksi yang sudah terverifikasi otomatis terangkum menjadi laporan keuangan dan statistik hunian yang siap dibaca kapan saja oleh pengelola. Keputusan bisnis seperti penyesuaian tarif sewa tahunan atau rencana penambahan kamar pun bisa diambil berdasarkan angka nyata, bukan sekadar perkiraan.' },
    { heading: 'Memulai Transisi Digital di Rumah Kos Anda', body: 'Beralih dari pencatatan manual ke sistem digital tidak harus dilakukan secara tergesa-gesa dalam satu malam. Anda dapat memulainya secara bertahap dengan merapikan data kamar dan daftar penghuni yang sedang aktif saat ini. Pastikan setiap kamar sudah memiliki tarif dan status yang benar, lalu lengkapi data penghuni beserta tanggal jatuh tempo sewa mereka masing-masing.' },
    { heading: '', body: 'Setelah fondasi data tersebut masuk ke dalam sistem, mulailah membiasakan pencatatan setiap pemesanan baru, pembuatan kontrak sewa digital, penagihan bulanan, serta penanganan keluhan penghuni melalui platform yang sama. Dalam satu hingga dua siklus penagihan, Anda akan mulai merasakan perbedaannya: waktu yang dihabiskan untuk mengecek catatan berkurang drastis, komunikasi dengan penghuni menjadi lebih tertib, dan kondisi keuangan kos jauh lebih mudah dipantau.' },
    { heading: '', body: 'Sebagai solusi berbasis SaaS, Sistem Informasi Manajemen Rumah Kos dibangun untuk mendukung transisi ini dengan struktur peran yang jelas: Super Admin menjaga keandalan infrastruktur platform SaaS secara terpusat, Admin Kos memegang kendali penuh atas propertinya di ruang data yang terpisah dan aman, dan Penghuni Kos memperoleh kemudahan akses informasi kamar, kontrak, tagihan, hingga pengaduan secara mandiri.' },
    { heading: '', quote: 'Mengelola rumah kos yang teratur bukan soal seberapa besar bangunan yang Anda miliki hari ini, melainkan seberapa siap sistem kerja Anda menopang pertumbuhan di masa depan.' }
  ];

  var rooms = INITIAL_ROOMS.map(function (r) {
    return Object.assign({}, r);
  });

  var OPERATIONAL_EXPENSE = 1400000;
  var currentStep = 1;
  var selectedStudioRoom = 'K-102';
  var activeStatusFilter = 'all';
  var heroViewer = null;
  var studioViewer = null;

  function formatRupiah(num) {
    return 'Rp ' + num.toLocaleString('id-ID');
  }

  function findRoom(id) {
    return rooms.find(function (r) {
      return r.id === id;
    });
  }

  function setupMobileMenu() {
    var toggle = document.getElementById('menu-toggle');
    var drawer = document.getElementById('mobile-nav');
    if (!toggle || !drawer) return;

    toggle.addEventListener('click', function () {
      var isOpen = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!isOpen));
      drawer.hidden = isOpen;
    });

    drawer.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        toggle.setAttribute('aria-expanded', 'false');
        drawer.hidden = true;
      });
    });
  }

  function renderInspector(roomId) {
    var emptyBox = document.getElementById('inspector-empty-state');
    var detailWrap = document.getElementById('inspector-detail-wrap');
    var matchingRooms =
      activeStatusFilter === 'all'
        ? rooms
        : rooms.filter(function (r) {
            return r.status === activeStatusFilter;
          });

    if (matchingRooms.length === 0) {
      emptyBox.hidden = false;
      detailWrap.hidden = true;
      var stLabel = STATUS_INFO[activeStatusFilter] ? STATUS_INFO[activeStatusFilter].label : activeStatusFilter;
      document.getElementById('inspector-empty-msg').textContent =
        'Saat ini tidak ada kamar simulasi yang berstatus "' + stLabel + '".';
      return;
    }

    emptyBox.hidden = true;
    detailWrap.hidden = false;

    var room = findRoom(roomId);
    if (!room || (activeStatusFilter !== 'all' && room.status !== activeStatusFilter)) {
      room = matchingRooms[0];
    }

    selectedStudioRoom = room.id;
    var st = STATUS_INFO[room.status] || STATUS_INFO.ready;

    document.getElementById('insp-code').textContent = 'KAMAR ' + room.id + ' · LANTAI ' + room.floor;
    document.getElementById('insp-title').textContent = room.type;
    var badge = document.getElementById('insp-status');
    badge.textContent = st.label;
    badge.className = 'status-badge ' + st.badgeClass;

    document.getElementById('insp-price').textContent = formatRupiah(room.price) + ' / bln';
    document.getElementById('insp-tenant').textContent = room.tenant;
    document.getElementById('insp-billing').textContent = room.billingStatus + ' · ' + room.contractState;
    document.getElementById('insp-note').textContent = room.note;
  }

  function renderFinancialLedger() {
    var income = 0;
    var pending = 0;
    var occupiedCount = 0;

    rooms.forEach(function (r) {
      if (r.status === 'occupied') {
        occupiedCount += 1;
        if (r.billingStatus === 'Lunas' || r.billingStatus === 'Lunas Bulan Pertama') {
          income += r.price;
        } else {
          pending += r.price;
        }
      } else if (r.status === 'booked') {
        pending += Math.round(r.price * 0.3);
      }
    });

    var net = income - OPERATIONAL_EXPENSE;
    var occPct = Math.round((occupiedCount / rooms.length) * 100);

    document.getElementById('metric-income').textContent = formatRupiah(income);
    document.getElementById('metric-pending').textContent = formatRupiah(pending);
    document.getElementById('metric-expense').textContent = formatRupiah(OPERATIONAL_EXPENSE);
    document.getElementById('metric-net').textContent = formatRupiah(net);
    document.getElementById('metric-occupancy').textContent = occPct + '% (' + occupiedCount + '/' + rooms.length + ' Kamar)';
    document.getElementById('metric-occupancy-fill').style.width = occPct + '%';
  }

  function syncAllViewers() {
    if (heroViewer) heroViewer.updateRoomsState(rooms);
    if (studioViewer) studioViewer.updateRoomsState(rooms);
    renderInspector(selectedStudioRoom);
    renderFinancialLedger();
  }

  function activateStep(stepNum) {
    currentStep = Math.min(5, Math.max(1, stepNum));
    var meta = STEP_META[currentStep];

    document.querySelectorAll('.step-item').forEach(function (card) {
      var isTarget = Number(card.getAttribute('data-step')) === currentStep;
      card.classList.toggle('is-active', isTarget);
      var trigger = card.querySelector('.step-trigger');
      if (trigger) trigger.setAttribute('aria-expanded', String(isTarget));
    });

    document.querySelectorAll('[data-step-tab]').forEach(function (tab) {
      var isTarget = Number(tab.getAttribute('data-step-tab')) === currentStep;
      tab.classList.toggle('is-active', isTarget);
      tab.setAttribute('aria-selected', String(isTarget));
    });

    document.getElementById('hud-step-num').textContent = 'BAB 0' + currentStep;
    document.getElementById('hud-step-title').textContent = meta.hudTitle;
    document.getElementById('step-counter').textContent = 'Bab ' + currentStep + ' / 5';
    document.getElementById('step-prev-btn').disabled = currentStep === 1;
    document.getElementById('step-next-btn').disabled = currentStep === 5;

    document.querySelectorAll('.floor-btn').forEach(function (btn) {
      var targetFloor = currentStep === 5 ? 'roof' : 'all';
      btn.classList.toggle('is-active', btn.getAttribute('data-floor') === targetFloor);
    });

    if (studioViewer) {
      studioViewer.setFloorFilter(currentStep === 5 ? 'roof' : 'all');
      studioViewer.setStep(currentStep, meta.focusRoom);
    }

    renderInspector(meta.focusRoom);
  }

  function setup3DScenes() {
    var heroCanvas = document.getElementById('hero-kosan-canvas');
    var heroPins = document.getElementById('hero-kosan-pins');
    var heroToast = document.getElementById('hero-room-toast');
    var heroToastBody = document.getElementById('hero-room-toast-body');

    if (heroCanvas && typeof window.Kosan3DViewer === 'function') {
      heroViewer = new window.Kosan3DViewer({
        canvas: heroCanvas,
        pinsContainer: heroPins,
        mode: 'hero',
        initialRooms: rooms,
        onRoomSelect: function (roomId) {
          var r = findRoom(roomId);
          if (!r || !heroToast || !heroToastBody) return;
          var st = STATUS_INFO[r.status] || STATUS_INFO.ready;
          heroToastBody.innerHTML =
            '<strong>Kamar ' +
            r.id +
            ' (' +
            r.type +
            ')</strong><br>' +
            'Status: <strong>' +
            st.label +
            '</strong> · ' +
            formatRupiah(r.price) +
            '/bln<br>' +
            '<span>' +
            r.tenant +
            '</span>';
          heroToast.hidden = false;
        }
      });
    }

    var toastClose = document.getElementById('hero-toast-close');
    if (toastClose && heroToast) {
      toastClose.addEventListener('click', function () {
        heroToast.hidden = true;
      });
    }

    var heroReset = document.getElementById('hero-reset-cam');
    if (heroReset && heroViewer) {
      heroReset.addEventListener('click', function () {
        heroViewer.resetCamera();
      });
    }

    var heroLightBtn = document.getElementById('hero-lighting-btn');
    var heroNight = false;
    if (heroLightBtn && heroViewer) {
      heroLightBtn.addEventListener('click', function () {
        heroNight = !heroNight;
        heroViewer.setNightMode(heroNight);
        heroLightBtn.setAttribute('aria-pressed', String(heroNight));
        heroLightBtn.textContent = heroNight ? 'Mode Siang' : 'Mode Malam';
      });
    }

    var heroRoofBtn = document.getElementById('hero-roof-btn');
    var heroRoofClosed = false;
    if (heroRoofBtn && heroViewer) {
      heroRoofBtn.addEventListener('click', function () {
        heroRoofClosed = !heroRoofClosed;
        heroViewer.setRoofClosed(heroRoofClosed);
        heroRoofBtn.setAttribute('aria-pressed', String(heroRoofClosed));
        heroRoofBtn.textContent = heroRoofClosed ? 'Buka Potongan' : 'Atap Utuh';
      });
    }

    var modeNote = document.getElementById('hero-mode-note');
    document.querySelectorAll('[data-hero-mode]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var mode = btn.getAttribute('data-hero-mode');
        document.querySelectorAll('[data-hero-mode]').forEach(function (b) {
          var active = b === btn;
          b.classList.toggle('is-active', active);
          b.setAttribute('aria-pressed', String(active));
        });
        if (heroViewer) heroViewer.setHeroMode(mode);
        if (modeNote) {
          modeNote.innerHTML =
            mode === 'manual'
              ? '<strong>Pola Kerja Manual:</strong> Buku tulis, foto identitas, tagihan pesan pribadi, dan bon kertas tercecer sehingga status kamar sulit dipantau cepat.'
              : '<strong>Alur Kerja Digital:</strong> Status setiap kamar, kontrak sewa digital, tagihan, dan pengaduan terbaca langsung dalam satu sistem terpadu.';
        }
      });
    });

    var studioCanvas = document.getElementById('studio-kosan-canvas');
    var studioPins = document.getElementById('studio-kosan-pins');
    if (studioCanvas && typeof window.Kosan3DViewer === 'function') {
      studioViewer = new window.Kosan3DViewer({
        canvas: studioCanvas,
        pinsContainer: studioPins,
        mode: 'studio',
        initialRooms: rooms,
        onRoomSelect: function (roomId) {
          renderInspector(roomId);
        },
        onPropAction: function (actionId) {
          if (actionId === 'contract') {
            document.getElementById('sim-contract-k201').click();
          } else if (actionId === 'qris') {
            document.getElementById('sim-pay-k202').click();
          } else if (actionId === 'complaint') {
            var order = ['reported', 'processing', 'done'];
            var currentBtn = document.querySelector('[data-complaint-stage].is-current');
            var cur = currentBtn ? currentBtn.getAttribute('data-complaint-stage') : 'reported';
            var next = order[(order.indexOf(cur) + 1) % order.length];
            var nextBtn = document.querySelector('[data-complaint-stage="' + next + '"]');
            if (nextBtn) nextBtn.click();
          }
        }
      });
    }

    document.querySelectorAll('.floor-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var floor = btn.getAttribute('data-floor');
        document.querySelectorAll('.floor-btn').forEach(function (b) {
          b.classList.toggle('is-active', b === btn);
        });
        if (studioViewer) studioViewer.setFloorFilter(floor);
      });
    });

    var studioLightBtn = document.getElementById('studio-lighting-btn');
    var studioNight = false;
    studioLightBtn.addEventListener('click', function () {
      studioNight = !studioNight;
      if (studioViewer) studioViewer.setNightMode(studioNight);
      studioLightBtn.setAttribute('aria-pressed', String(studioNight));
      studioLightBtn.textContent = studioNight ? 'Siang' : 'Malam';
    });

    document.getElementById('studio-rot-left').addEventListener('click', function () {
      if (studioViewer) studioViewer.rotateBy(-0.55);
    });
    document.getElementById('studio-rot-right').addEventListener('click', function () {
      if (studioViewer) studioViewer.rotateBy(0.55);
    });
    document.getElementById('studio-zoom-in').addEventListener('click', function () {
      if (studioViewer) studioViewer.zoomBy(-2.0);
    });
    document.getElementById('studio-zoom-out').addEventListener('click', function () {
      if (studioViewer) studioViewer.zoomBy(2.0);
    });
    document.getElementById('studio-reset-cam').addEventListener('click', function () {
      if (studioViewer) studioViewer.resetCamera();
    });
    document.getElementById('insp-focus-btn').addEventListener('click', function () {
      if (studioViewer && selectedStudioRoom) {
        studioViewer.focusRoom(selectedStudioRoom);
      }
    });

    document.querySelectorAll('[data-status-filter]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        activeStatusFilter = btn.getAttribute('data-status-filter');
        document.querySelectorAll('[data-status-filter]').forEach(function (b) {
          b.classList.toggle('is-active', b === btn);
        });
        if (studioViewer) studioViewer.setStatusFilter(activeStatusFilter);
        renderInspector(selectedStudioRoom);
      });
    });

    document.getElementById('inspector-clear-filter').addEventListener('click', function () {
      activeStatusFilter = 'all';
      document.querySelectorAll('[data-status-filter]').forEach(function (b) {
        b.classList.toggle('is-active', b.getAttribute('data-status-filter') === 'all');
      });
      if (studioViewer) studioViewer.setStatusFilter('all');
      renderInspector(selectedStudioRoom);
    });

    document.querySelectorAll('[data-select-step]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        activateStep(Number(btn.getAttribute('data-select-step')));
      });
    });

    document.querySelectorAll('[data-step-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        activateStep(Number(btn.getAttribute('data-step-tab')));
      });
    });

    document.querySelectorAll('[data-jump-step]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var step = Number(btn.getAttribute('data-jump-step'));
        activateStep(step);
        var target = document.getElementById('simulasi-3d');
        if (target) target.scrollIntoView({ behavior: 'smooth' });
      });
    });

    document.getElementById('step-prev-btn').addEventListener('click', function () {
      activateStep(currentStep - 1);
    });

    document.getElementById('step-next-btn').addEventListener('click', function () {
      activateStep(currentStep + 1);
    });
  }

  function setupSimulations() {
    var bookBtn = document.getElementById('sim-book-k102');
    var fb1 = document.getElementById('feedback-step-1');
    bookBtn.addEventListener('click', function () {
      var k102 = findRoom('K-102');
      if (!k102) return;
      if (k102.status === 'ready') {
        k102.status = 'booked';
        k102.tenant = 'Bagas Pratama (Pemesanan Baru)';
        k102.billingStatus = 'Uang Muka Tercatat';
        k102.contractState = 'Menunggu konfirmasi kontrak';
        bookBtn.textContent = 'Reset Status K-102 (Siap Huni)';
        fb1.textContent = 'Berhasil. K-102 kini berstatus Dalam tahap pemesanan sehingga terhindar dari risiko kamar terjual ganda.';
      } else {
        k102.status = 'ready';
        k102.tenant = 'Belum ada penghuni';
        k102.billingStatus = 'Tersedia untuk pemesanan baru';
        k102.contractState = 'Menunggu pemesan';
        bookBtn.textContent = 'Simulasi: Catat Pemesanan K-102 (AC)';
        fb1.textContent = 'K-102 dikembalikan ke status Kosong siap huni.';
      }
      selectedStudioRoom = 'K-102';
      if (studioViewer) studioViewer.selectRoom('K-102');
      syncAllViewers();
    });

    var contractBtn = document.getElementById('sim-contract-k201');
    var fb2 = document.getElementById('feedback-step-2');
    var contractDone = false;
    contractBtn.addEventListener('click', function () {
      var k201 = findRoom('K-201');
      if (!k201) return;
      contractDone = !contractDone;
      if (contractDone) {
        k201.status = 'occupied';
        k201.tenant = 'Nadia Kusuma (Penghuni Aktif)';
        k201.billingStatus = 'Lunas Bulan Pertama';
        k201.contractState = 'Kontrak Digital Terkonfirmasi';
        contractBtn.textContent = 'Reset Simulasi Kontrak (K-201)';
        fb2.textContent = 'Kontrak digital terkonfirmasi sebelum kunci diserahkan. Status K-201 berubah menjadi Terisi.';
      } else {
        k201.status = 'booked';
        k201.tenant = 'Nadia Kusuma (Masuk tgl 1)';
        k201.billingStatus = 'DP Pemesanan Tercatat';
        k201.contractState = 'Menunggu konfirmasi kontrak digital';
        contractBtn.textContent = 'Konfirmasi Kontrak & Serah Kunci (K-201)';
        fb2.textContent = 'Simulasi dikembalikan ke tahap menunggu konfirmasi kontrak sebelum serah kunci.';
      }
      if (studioViewer) {
        studioViewer.setSimState({ contractConfirmed: contractDone });
        studioViewer.selectRoom('K-201');
      }
      selectedStudioRoom = 'K-201';
      syncAllViewers();
    });

    var remindBtn = document.getElementById('sim-remind-k202');
    var payBtn = document.getElementById('sim-pay-k202');
    var fb3 = document.getElementById('feedback-step-3');
    var paidDone = false;

    remindBtn.addEventListener('click', function () {
      activateStep(3);
      fb3.textContent = 'Pengingat jatuh tempo resmi dikirim sistem ke akun Penghuni Kos K-202 tanpa rasa sungkan.';
      if (studioViewer) {
        studioViewer.selectRoom('K-202');
      }
      selectedStudioRoom = 'K-202';
      renderInspector('K-202');
    });

    payBtn.addEventListener('click', function () {
      var k202 = findRoom('K-202');
      if (!k202) return;
      paidDone = !paidDone;
      if (paidDone) {
        k202.billingStatus = 'Lunas';
        payBtn.textContent = 'Reset Tagihan K-202';
        fb3.textContent = 'Pembayaran QRIS Rp 1.950.000 otomatis tercatat Lunas dan masuk ke laporan keuangan.';
      } else {
        k202.billingStatus = 'Menunggu Pembayaran (H-2)';
        payBtn.textContent = 'Simulasi Bayar QRIS (K-202)';
        fb3.textContent = 'Kamar K-202 kembali berstatus menunggu pembayaran sewa.';
      }
      if (studioViewer) {
        studioViewer.setSimState({ qrisPaid: paidDone });
        studioViewer.selectRoom('K-202');
      }
      selectedStudioRoom = 'K-202';
      syncAllViewers();
    });

    var fb4 = document.getElementById('feedback-step-4');
    document.querySelectorAll('[data-complaint-stage]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var stage = btn.getAttribute('data-complaint-stage');
        document.querySelectorAll('[data-complaint-stage]').forEach(function (b) {
          b.classList.toggle('is-current', b === btn);
        });

        var k103 = findRoom('K-103');
        if (k103) {
          if (stage === 'reported') {
            k103.status = 'repair';
            k103.billingStatus = 'Tiket #ADU-04: Baru Dilaporkan';
            k103.contractState = 'Menunggu respon Admin Kos';
            fb4.textContent = 'Tahap 1: Penghuni melapor keran air bocor melalui jalur pengaduan resmi.';
          } else if (stage === 'processing') {
            k103.status = 'repair';
            k103.billingStatus = 'Tiket #ADU-04: Sedang Diproses';
            k103.contractState = 'Ditangani Admin Kos';
            fb4.textContent = 'Tahap 2: Admin Kos memperbarui status menjadi Sedang Diproses agar penghuni tenang.';
          } else {
            k103.status = 'ready';
            k103.billingStatus = 'Riwayat Perawatan Tersimpan';
            k103.contractState = 'Selesai & Terdokumentasi';
            fb4.textContent = 'Tahap 3: Keran selesai diperbaiki, tetesan berhenti, dan riwayat perawatan K-103 terdokumentasi rapi.';
          }
        }

        if (studioViewer) {
          studioViewer.setSimState({ complaintStage: stage });
          studioViewer.selectRoom('K-103');
        }
        selectedStudioRoom = 'K-103';
        syncAllViewers();
      });
    });
  }

  function setupRoleSwitcher() {
    var tabs = document.querySelectorAll('[data-role]');
    var titleEl = document.getElementById('role-title');
    var scopeEl = document.getElementById('role-scope');
    var descEl = document.getElementById('role-desc');
    var listEl = document.getElementById('role-capabilities');

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var roleKey = tab.getAttribute('data-role');
        var data = ROLES_DATA[roleKey];
        if (!data) return;

        tabs.forEach(function (t) {
          var isSelected = t === tab;
          t.classList.toggle('is-active', isSelected);
          t.setAttribute('aria-selected', String(isSelected));
        });

        titleEl.textContent = data.title;
        scopeEl.textContent = data.scope;
        descEl.textContent = data.desc;
        listEl.innerHTML = data.capabilities
          .map(function (item) {
            return '<li>' + item + '</li>';
          })
          .join('');
      });
    });
  }

  function setupReaderModal() {
    var modal = document.getElementById('reader-modal');
    var openBtn = document.getElementById('open-reader-btn');
    var closeBtn = document.getElementById('close-reader-btn');
    var closeFooterBtn = document.getElementById('reader-close-footer-btn');
    var printBtn = document.getElementById('reader-print-btn');
    var bodyEl = document.getElementById('reader-modal-body');
    var lastFocused = null;

    if (!modal || !bodyEl) return;

    bodyEl.innerHTML = FULL_GUIDE_PARAGRAPHS.map(function (item) {
      var html = '';
      if (item.heading) html += '<h3>' + item.heading + '</h3>';
      if (item.body) html += '<p>' + item.body + '</p>';
      if (item.quote) html += '<blockquote>' + item.quote + '</blockquote>';
      return html;
    }).join('');

    function openModal() {
      lastFocused = document.activeElement;
      modal.hidden = false;
      document.body.style.overflow = 'hidden';
      closeBtn.focus();
    }

    function closeModal() {
      modal.hidden = true;
      document.body.style.overflow = '';
      if (lastFocused && typeof lastFocused.focus === 'function') {
        lastFocused.focus();
      }
    }

    openBtn.addEventListener('click', openModal);
    closeBtn.addEventListener('click', closeModal);
    closeFooterBtn.addEventListener('click', closeModal);
    printBtn.addEventListener('click', function () {
      window.print();
    });

    modal.addEventListener('click', function (e) {
      if (e.target === modal) closeModal();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !modal.hidden) {
        closeModal();
      }
    });
  }

  function buildDownloadDocument(name, roomsRange) {
    var lines = [
      'PANDUAN MENGELOLA RUMAH KOS SECARA MODERN DAN EFISIEN',
      'Disiapkan untuk: ' + name + ' (Skala Properti: ' + roomsRange + ' Kamar)',
      '=========================================================================',
      ''
    ];

    FULL_GUIDE_PARAGRAPHS.forEach(function (item) {
      if (item.heading) {
        lines.push(item.heading.toUpperCase());
      }
      if (item.body) {
        lines.push(item.body);
      }
      if (item.quote) {
        lines.push('>> ' + item.quote);
      }
      lines.push('');
    });

    lines.push('CHECKLIST PRAKTIS TRANSISI DIGITAL RUMAH KOS');
    lines.push('1. Rapikan daftar kamar: nomor kamar, tipe, tarif sewa, dan daftar fasilitas.');
    lines.push('2. Tetapkan 4 status kamar: Terisi | Kosong siap huni | Dalam tahap pemesanan | Sedang diperbaiki.');
    lines.push('3. Lengkapi data penghuni aktif: nama lengkap, kontak darurat, identitas diri, tanggal masuk, jatuh tempo.');
    lines.push('4. Biasakan konfirmasi kontrak sewa digital SEBELUM kunci kamar diserahkan.');
    lines.push('5. Aktifkan pengingat jatuh tempo otomatis dan sediakan QRIS atau transfer bank.');
    lines.push('6. Jalankan alur pengaduan: Dilaporkan Penghuni -> Diproses Admin Kos -> Selesai & Terdokumentasi.');
    lines.push('7. Pisahkan rekening operasional kos dari rekening pribadi untuk memantau arus kas bersih.');

    return lines.join('\n');
  }

  function setupLeadMagnetForm() {
    var form = document.getElementById('lead-magnet-form');
    var errorEl = document.getElementById('lead-form-error');
    var loadingBox = document.getElementById('lead-loading-box');
    var successBox = document.getElementById('lead-success-box');
    var successMsg = document.getElementById('lead-success-msg');
    var downloadBtn = document.getElementById('download-checklist-btn');
    var printBtn = document.getElementById('print-guide-btn');
    var resetBtn = document.getElementById('reset-form-btn');

    var latestLead = { name: 'Pengelola Kos', rooms: '5-10' };

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var nameVal = document.getElementById('lead-name').value.trim();
      var contactVal = document.getElementById('lead-contact').value.trim();
      var roomsVal = document.getElementById('lead-rooms').value;

      if (nameVal.length < 2) {
        errorEl.textContent = 'Mohon isi nama pemilik atau pengelola kos minimal 2 karakter.';
        errorEl.hidden = false;
        return;
      }

      if (contactVal.length < 5) {
        errorEl.textContent = 'Mohon isi alamat email atau nomor WhatsApp yang valid.';
        errorEl.hidden = false;
        return;
      }

      errorEl.hidden = true;
      latestLead = { name: nameVal, rooms: roomsVal, contact: contactVal };

      form.hidden = true;
      loadingBox.hidden = false;

      setTimeout(function () {
        loadingBox.hidden = true;
        successBox.hidden = false;
        successMsg.textContent =
          'Terima kasih, ' +
          nameVal +
          '. Naskah lengkap panduan dan checklist transisi untuk skala ' +
          roomsVal +
          ' kamar siap Anda unduh atau cetak sekarang.';
      }, 420);
    });

    downloadBtn.addEventListener('click', function () {
      var content = buildDownloadDocument(latestLead.name, latestLead.rooms);
      var blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'Panduan-dan-Checklist-Kos-Modern.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () {
        URL.revokeObjectURL(url);
      }, 500);
    });

    printBtn.addEventListener('click', function () {
      window.print();
    });

    resetBtn.addEventListener('click', function () {
      successBox.hidden = true;
      loadingBox.hidden = true;
      form.hidden = false;
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    setupMobileMenu();
    setup3DScenes();
    setupSimulations();
    setupRoleSwitcher();
    setupReaderModal();
    setupLeadMagnetForm();
    activateStep(1);
    renderFinancialLedger();
  });
})();
