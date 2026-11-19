(function (global) {
  'use strict';

  var STATUS_META = {
    occupied: { label: 'Terisi', color: 0x1e4a3b, hex: '#173028', badgeClass: 'status-occupied', pinClass: 'pin-occupied' },
    ready: { label: 'Kosong siap huni', color: 0x2b6f53, hex: '#2b6f53', badgeClass: 'status-ready', pinClass: 'pin-ready' },
    booked: { label: 'Dalam tahap pemesanan', color: 0xc68621, hex: '#c68621', badgeClass: 'status-booked', pinClass: 'pin-booked' },
    repair: { label: 'Sedang diperbaiki', color: 0xc4542d, hex: '#c4542d', badgeClass: 'status-repair', pinClass: 'pin-repair' }
  };

  var ROOM_LAYOUT = [
    { id: 'K-101', floor: 1, x: -3.2, y: 0.15, z: 0.2 },
    { id: 'K-102', floor: 1, x: 0.0, y: 0.15, z: 0.2 },
    { id: 'K-103', floor: 1, x: 3.2, y: 0.15, z: 0.2 },
    { id: 'K-201', floor: 2, x: -3.2, y: 2.75, z: 0.2 },
    { id: 'K-202', floor: 2, x: 0.0, y: 2.75, z: 0.2 },
    { id: 'K-203', floor: 2, x: 3.2, y: 2.75, z: 0.2 }
  ];

  function createCanvasLabelTexture(drawFn, w, h) {
    var canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    var ctx = canvas.getContext('2d');
    drawFn(ctx, w, h);
    var tex = new global.THREE.CanvasTexture(canvas);
    tex.encoding = global.THREE.sRGBEncoding;
    tex.needsUpdate = true;
    return tex;
  }

  function createSignTexture() {
    return createCanvasLabelTexture(function (ctx, w, h) {
      ctx.fillStyle = '#173028';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#d8a24a';
      ctx.lineWidth = 6;
      ctx.strokeRect(6, 6, w - 12, h - 12);
      ctx.fillStyle = '#fcfaf5';
      ctx.font = 'bold 30px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('KOS GRIYA ASRI', w / 2, h / 2 - 12);
      ctx.fillStyle = '#f3c178';
      ctx.font = '600 16px monospace';
      ctx.fillText('6 KAMAR · 2 LANTAI', w / 2, h / 2 + 20);
    }, 320, 110);
  }

  function createContractTexture(confirmed) {
    return createCanvasLabelTexture(function (ctx, w, h) {
      ctx.fillStyle = '#fcfaf5';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = confirmed ? '#2b6f53' : '#173028';
      ctx.lineWidth = 8;
      ctx.strokeRect(4, 4, w - 8, h - 8);

      ctx.fillStyle = '#173028';
      ctx.fillRect(20, 22, w - 40, 34);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 17px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('KONTRAK SEWA DIGITAL', w / 2, 45);

      ctx.fillStyle = '#7e8680';
      for (var i = 0; i < 6; i++) {
        ctx.fillRect(26, 78 + i * 24, w - 52 - (i % 2) * 32, 8);
      }

      if (confirmed) {
        ctx.strokeStyle = '#2b6f53';
        ctx.lineWidth = 5;
        ctx.strokeRect(36, 232, w - 72, 44);
        ctx.fillStyle = '#2b6f53';
        ctx.font = 'bold 19px monospace';
        ctx.fillText('TERKONFIRMASI', w / 2, 260);
      } else {
        ctx.fillStyle = '#c68621';
        ctx.fillRect(24, 234, w - 48, 38);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 15px monospace';
        ctx.fillText('KONFIRMASI DULU', w / 2, 258);
      }
    }, 256, 310);
  }

  function createQrisTexture(paid) {
    return createCanvasLabelTexture(function (ctx, w, h) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = paid ? '#2b6f53' : '#c68621';
      ctx.lineWidth = 10;
      ctx.strokeRect(5, 5, w - 10, h - 10);

      ctx.fillStyle = paid ? '#2b6f53' : '#173028';
      ctx.fillRect(16, 16, w - 32, 38);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 19px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(paid ? 'LUNAS OTOMATIS' : 'TAGIHAN QRIS', w / 2, 41);

      var startX = 48;
      var startY = 72;
      var cell = 14;
      ctx.fillStyle = '#173028';
      for (var r = 0; r < 10; r++) {
        for (var c = 0; c < 10; c++) {
          var corner = (r < 3 && c < 3) || (r < 3 && c > 6) || (r > 6 && c < 3);
          if (corner || (r * 7 + c * 11) % 3 === 0) {
            ctx.fillRect(startX + c * cell, startY + r * cell, cell - 2, cell - 2);
          }
        }
      }

      ctx.fillStyle = paid ? '#2b6f53' : '#c4542d';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(paid ? 'Rp 1.950.000 · TERCATAT' : 'Jatuh Tempo: H-2', w / 2, 236);
    }, 240, 265);
  }

  function Kosan3DViewer(options) {
    this.canvas = options.canvas;
    this.pinsContainer = options.pinsContainer;
    this.mode = options.mode || 'studio';
    this.onRoomSelect = options.onRoomSelect || function () {};
    this.roomsState = options.initialRooms || [];

    this.activeStep = 1;
    this.heroVisualMode = 'digital';
    this.floorFilter = 'all';
    this.selectedRoomId = this.mode === 'studio' ? 'K-102' : null;

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
      return { theta: 0.64, phi: 0.94, radius: 17.5, tx: -0.2, ty: 2.2, tz: 0.3 };
    }
    if (this.floorFilter === '1') {
      return { theta: 0.45, phi: 0.88, radius: 13.8, tx: 0.0, ty: 1.1, tz: 0.2 };
    }
    if (this.floorFilter === '2') {
      return { theta: 0.5, phi: 0.85, radius: 13.6, tx: 0.0, ty: 3.4, tz: 0.2 };
    }
    if (this.floorFilter === 'roof') {
      return { theta: 0.62, phi: 0.72, radius: 15.8, tx: -0.2, ty: 4.5, tz: 0.0 };
    }

    switch (this.activeStep) {
      case 1:
        return { theta: 0.58, phi: 0.92, radius: 16.4, tx: 0.0, ty: 2.2, tz: 0.2 };
      case 2:
        return { theta: 0.48, phi: 0.88, radius: 11.6, tx: -3.0, ty: 3.8, tz: 0.4 };
      case 3:
        return { theta: 0.38, phi: 0.88, radius: 12.0, tx: -0.4, ty: 3.6, tz: 0.5 };
      case 4:
        return { theta: -0.34, phi: 0.9, radius: 11.2, tx: 3.1, ty: 1.45, tz: 0.25 };
      case 5:
        return { theta: 0.66, phi: 0.68, radius: 16.4, tx: -0.2, ty: 4.3, tz: -0.1 };
      default:
        return { theta: 0.58, phi: 0.92, radius: 16.4, tx: 0.0, ty: 2.2, tz: 0.2 };
    }
  };

  Kosan3DViewer.prototype._initThree = function () {
    var THREE = global.THREE;
    this.THREE = THREE;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(35, 16 / 10, 0.1, 140);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(global.devicePixelRatio || 1, 2));
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    var preset = this._getCameraPreset();
    this.camCurrent = {
      theta: preset.theta,
      phi: preset.phi,
      radius: preset.radius,
      tx: preset.tx,
      ty: preset.ty,
      tz: preset.tz
    };
    this.camTarget = Object.assign({}, this.camCurrent);

    this.raycaster = new THREE.Raycaster();
    this.pointerNDC = new THREE.Vector2();
    this.roomMeshes = {};
    this.pickables = [];
    this.pinElements = {};

    this._setupLights();
    this._buildSiteAndBuilding();
    this._buildFlowProps();
    this._buildManualChaosProps();
    this._createPinDOM();
    this._syncRoomsVisuals();
    this._syncStepProps();

    this._bindEvents();
    this._resize();
    this._setupObserver();
    this._startLoop();
  };

  Kosan3DViewer.prototype._setupLights = function () {
    var THREE = this.THREE;
    var hemi = new THREE.HemisphereLight(0xfffbf0, 0xbab09d, 0.94);
    this.scene.add(hemi);

    var sun = new THREE.DirectionalLight(0xfff5e4, 1.06);
    sun.position.set(11, 17, 12);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 1024;
    sun.shadow.mapSize.height = 1024;
    sun.shadow.camera.near = 2;
    sun.shadow.camera.far = 42;
    var d = 10;
    sun.shadow.camera.left = -d;
    sun.shadow.camera.right = d;
    sun.shadow.camera.top = d;
    sun.shadow.camera.bottom = -d;
    sun.shadow.bias = -0.0008;
    this.scene.add(sun);

    var fill = new THREE.DirectionalLight(0xd9ece5, 0.36);
    fill.position.set(-10, 8, -8);
    this.scene.add(fill);
  };

  Kosan3DViewer.prototype._makeBox = function (w, h, d, color, opts) {
    var THREE = this.THREE;
    opts = opts || {};
    var geo = new THREE.BoxGeometry(w, h, d);
    var mat = new THREE.MeshStandardMaterial({
      color: color,
      roughness: opts.roughness !== undefined ? opts.roughness : 0.72,
      metalness: opts.metalness !== undefined ? opts.metalness : 0.05,
      transparent: !!opts.transparent,
      opacity: opts.opacity !== undefined ? opts.opacity : 1.0,
      emissive: opts.emissive || 0x000000,
      emissiveIntensity: opts.emissiveIntensity || 0
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = opts.castShadow !== false;
    mesh.receiveShadow = opts.receiveShadow !== false;
    return mesh;
  };

  Kosan3DViewer.prototype._buildSiteAndBuilding = function () {
    var THREE = this.THREE;
    var self = this;

    this.worldGroup = new THREE.Group();
    this.scene.add(this.worldGroup);

    // Site base & road
    var plinth = this._makeBox(15.2, 0.45, 9.6, 0xddd4c2, { roughness: 0.88 });
    plinth.position.set(-0.3, -0.22, 0.3);
    this.worldGroup.add(plinth);

    var road = this._makeBox(15.2, 0.08, 2.1, 0x454c47, { roughness: 0.92 });
    road.position.set(-0.3, 0.02, 4.05);
    this.worldGroup.add(road);

    for (var rx = -6; rx <= 5; rx += 2.4) {
      var dash = this._makeBox(1.1, 0.09, 0.14, 0xf3eee2, { castShadow: false });
      dash.position.set(rx, 0.03, 4.05);
      this.worldGroup.add(dash);
    }

    var yard = this._makeBox(14.6, 0.06, 6.4, 0xebe4d6, { roughness: 0.85 });
    yard.position.set(-0.3, 0.03, -0.2);
    this.worldGroup.add(yard);

    // Planter box + Tropical plants
    var planter = this._makeBox(3.4, 0.38, 0.9, 0xc4542d, { roughness: 0.78 });
    planter.position.set(3.4, 0.22, 2.55);
    this.worldGroup.add(planter);

    for (var p = 0; p < 3; p++) {
      var plant = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.42 + (p % 2) * 0.08, 0),
        new THREE.MeshStandardMaterial({ color: p === 1 ? 0x2b6f53 : 0x3b8463, roughness: 0.78 })
      );
      plant.position.set(2.4 + p * 0.95, 0.62, 2.55);
      plant.castShadow = true;
      this.worldGroup.add(plant);
    }

    // Carport / Parkiran Motor
    this.carportGroup = new THREE.Group();
    this.carportGroup.position.set(-6.05, 0.06, 0.6);
    [
      [-1.1, -1.2],
      [1.1, -1.2],
      [-1.1, 1.3],
      [1.1, 1.3]
    ].forEach(function (pos) {
      var post = self._makeBox(0.11, 2.25, 0.11, 0x1e2c26);
      post.position.set(pos[0], 1.12, pos[1]);
      self.carportGroup.add(post);
    });
    var canopy = this._makeBox(2.65, 0.1, 2.95, 0x284e41, { transparent: true, opacity: 0.82 });
    canopy.position.set(0, 2.28, 0.05);
    canopy.rotation.z = 0.05;
    this.carportGroup.add(canopy);

    // 2 Stylized 3D Motorbikes
    [-0.48, 0.52].forEach(function (mx, idx) {
      var moto = new THREE.Group();
      moto.position.set(mx, 0, 0.15);
      var wheelGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.11, 14);
      wheelGeo.rotateZ(Math.PI / 2);
      var wheelMat = new THREE.MeshStandardMaterial({ color: 0x222625, roughness: 0.8 });
      var w1 = new THREE.Mesh(wheelGeo, wheelMat);
      w1.position.set(0, 0.22, 0.45);
      var w2 = new THREE.Mesh(wheelGeo, wheelMat);
      w2.position.set(0, 0.22, -0.45);
      var body = self._makeBox(0.32, 0.34, 1.05, idx === 0 ? 0xc4542d : 0x2b6f53);
      body.position.set(0, 0.46, 0);
      var seat = self._makeBox(0.28, 0.1, 0.55, 0x23201e);
      seat.position.set(0, 0.68, -0.15);
      var stem = self._makeBox(0.08, 0.48, 0.08, 0x383e3b);
      stem.position.set(0, 0.72, 0.36);
      stem.rotation.x = -0.22;
      var bar = self._makeBox(0.46, 0.06, 0.08, 0x232624);
      bar.position.set(0, 0.94, 0.31);
      moto.add(w1, w2, body, seat, stem, bar);
      self.carportGroup.add(moto);
    });
    this.worldGroup.add(this.carportGroup);

    // Kos Signboard
    var signPost = this._makeBox(0.14, 1.85, 0.14, 0x2a2f2c);
    signPost.position.set(-4.35, 0.95, 2.55);
    this.worldGroup.add(signPost);

    var signBoard = new THREE.Mesh(
      new THREE.BoxGeometry(1.75, 0.65, 0.12),
      [
        new THREE.MeshStandardMaterial({ color: 0x173028 }),
        new THREE.MeshStandardMaterial({ color: 0x173028 }),
        new THREE.MeshStandardMaterial({ color: 0x173028 }),
        new THREE.MeshStandardMaterial({ color: 0x173028 }),
        new THREE.MeshStandardMaterial({ map: createSignTexture(), roughness: 0.45 }),
        new THREE.MeshStandardMaterial({ color: 0x173028 })
      ]
    );
    signBoard.position.set(-4.35, 1.82, 2.55);
    signBoard.castShadow = true;
    this.worldGroup.add(signBoard);

    this.floor1Group = new THREE.Group();
    this.floor2Group = new THREE.Group();
    this.roofGroup = new THREE.Group();
    this.worldGroup.add(this.floor1Group, this.floor2Group, this.roofGroup);

    // Floor 1 Base & Back Wall
    var f1Slab = this._makeBox(9.9, 0.22, 3.8, 0xf2ece0);
    f1Slab.position.set(0, 0.12, 0.1);
    this.floor1Group.add(f1Slab);

    var f1BackWall = this._makeBox(9.9, 2.45, 0.16, 0xf7f3ea);
    f1BackWall.position.set(0, 1.35, -1.72);
    this.floor1Group.add(f1BackWall);

    // Terracotta architectural side accent column
    var leftAccent = this._makeBox(0.24, 5.15, 3.7, 0xc4542d, { roughness: 0.78 });
    leftAccent.position.set(-4.84, 2.68, 0.1);
    this.floor1Group.add(leftAccent);

    // Admin Kos Desk + Monitor Hub
    var adminDesk = this._makeBox(0.95, 0.65, 0.55, 0x8f5b38);
    adminDesk.position.set(-4.0, 0.42, 1.85);
    var adminMonitor = this._makeBox(0.55, 0.36, 0.06, 0x173028, { emissive: 0x2b6f53, emissiveIntensity: 0.45 });
    adminMonitor.position.set(-4.0, 0.94, 1.82);
    this.floor1Group.add(adminDesk, adminMonitor);

    // Staircase L1 -> L2
    for (var s = 0; s < 7; s++) {
      var step = this._makeBox(0.75, 0.24, 0.42, 0xb88f64);
      step.position.set(5.25, 0.24 + s * 0.36, -1.3 + s * 0.42);
      this.floor1Group.add(step);
    }

    // Floor 2 Slab & Balcony Rail
    var f2Slab = this._makeBox(9.9, 0.22, 4.25, 0xe8e0d0);
    f2Slab.position.set(0, 2.65, 0.32);
    this.floor2Group.add(f2Slab);

    var railTop = this._makeBox(9.8, 0.07, 0.07, 0x1e2c26);
    railTop.position.set(0, 3.45, 2.36);
    var railGlass = this._makeBox(9.7, 0.62, 0.04, 0x8eb8ac, { transparent: true, opacity: 0.35, castShadow: false });
    railGlass.position.set(0, 3.08, 2.36);
    this.floor2Group.add(railTop, railGlass);

    var f2BackWall = this._makeBox(9.9, 2.45, 0.16, 0xf7f3ea);
    f2BackWall.position.set(0, 3.92, -1.72);
    this.floor2Group.add(f2BackWall);

    // Partition walls between rooms
    [-1.6, 1.6, 4.82].forEach(function (px) {
      var p1 = self._makeBox(0.12, 2.42, 3.55, 0xe9e2d4);
      p1.position.set(px, 1.35, 0.05);
      self.floor1Group.add(p1);

      var p2 = self._makeBox(0.12, 2.42, 3.55, 0xe9e2d4);
      p2.position.set(px, 3.9, 0.05);
      self.floor2Group.add(p2);
    });

    ROOM_LAYOUT.forEach(function (layout) {
      self._buildRoom(layout);
    });

    // Cutaway Rooftop Deck (covers rear half z: -1.9..0.1 so Lantai 2 interiors stay completely open & sunlit!)
    var roofDeck = this._makeBox(10.3, 0.22, 2.05, 0x26443a);
    roofDeck.position.set(0, 5.2, -0.88);
    this.roofGroup.add(roofDeck);

    // Slim front architectural pergola beam along front edge (leaves sky open above L2 rooms)
    var frontBeam = this._makeBox(10.1, 0.14, 0.2, 0x173028);
    frontBeam.position.set(0, 5.2, 2.28);
    this.roofGroup.add(frontBeam);

    [-4.82, -1.6, 1.6, 4.82].forEach(function (rx) {
      var rafter = self._makeBox(0.12, 0.12, 2.4, 0x26443a);
      rafter.position.set(rx, 5.2, 1.1);
      self.roofGroup.add(rafter);
    });

    var roofOverhang = this._makeBox(10.5, 0.16, 1.65, 0xc4542d);
    roofOverhang.position.set(0, 5.42, -1.2);
    roofOverhang.rotation.x = -0.18;
    this.roofGroup.add(roofOverhang);

    // Toren Air (Water Tank) cleanly on rear-right roof
    var tankStand = this._makeBox(1.1, 0.65, 1.1, 0x3b4440);
    tankStand.position.set(3.8, 5.64, -0.92);
    var tankBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.56, 0.58, 1.25, 18),
      new THREE.MeshStandardMaterial({ color: 0x2b6e8e, roughness: 0.38, metalness: 0.15 })
    );
    tankBody.position.set(3.8, 6.54, -0.92);
    tankBody.castShadow = true;
    this.roofGroup.add(tankStand, tankBody);
  };

  Kosan3DViewer.prototype._buildRoom = function (layout) {
    var THREE = this.THREE;
    var parent = layout.floor === 1 ? this.floor1Group : this.floor2Group;
    var roomGroup = new THREE.Group();
    roomGroup.position.set(layout.x, layout.y, layout.z);
    parent.add(roomGroup);

    var floorPadMat = new THREE.MeshStandardMaterial({
      color: 0x2b6f53,
      roughness: 0.68,
      emissive: 0x000000,
      emissiveIntensity: 0
    });
    var floorPad = new THREE.Mesh(new THREE.BoxGeometry(2.85, 0.08, 3.1), floorPadMat);
    floorPad.position.set(0, 0.11, -0.15);
    floorPad.receiveShadow = true;
    roomGroup.add(floorPad);

    var frontStripMat = new THREE.MeshStandardMaterial({
      color: 0x2b6f53,
      emissive: 0x2b6f53,
      emissiveIntensity: 0.35
    });
    var frontStrip = new THREE.Mesh(new THREE.BoxGeometry(2.75, 0.12, 0.16), frontStripMat);
    frontStrip.position.set(0, 0.16, 1.48);
    roomGroup.add(frontStrip);

    var selectFrame = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(2.92, 0.16, 3.16)),
      new THREE.LineBasicMaterial({ color: 0xf3c178, transparent: true, opacity: 0 })
    );
    selectFrame.position.set(0, 0.16, -0.15);
    roomGroup.add(selectFrame);

    // Bed + blanket + pillow
    var bedFrame = this._makeBox(1.28, 0.24, 1.75, 0x8d5d3c);
    bedFrame.position.set(-0.62, 0.27, -0.58);
    var mattress = this._makeBox(1.18, 0.18, 1.65, 0xfaf6ed);
    mattress.position.set(-0.62, 0.45, -0.58);
    var blanket = this._makeBox(1.2, 0.19, 0.92, layout.floor === 1 ? 0xc4542d : 0x2b6f53);
    blanket.position.set(-0.62, 0.46, -0.2);
    var pillow = this._makeBox(0.68, 0.12, 0.36, 0xffffff);
    pillow.position.set(-0.62, 0.58, -1.18);
    roomGroup.add(bedFrame, mattress, blanket, pillow);

    // Bedside Rug
    var rug = this._makeBox(0.95, 0.03, 1.25, 0xded5c3, { castShadow: false });
    rug.position.set(0.52, 0.16, -0.2);
    roomGroup.add(rug);

    // Wardrobe
    var wardrobe = this._makeBox(0.75, 1.62, 0.52, 0x704a30);
    wardrobe.position.set(0.88, 0.94, -1.25);
    roomGroup.add(wardrobe);

    // Desk + Laptop + Chair
    var desk = this._makeBox(0.95, 0.58, 0.55, 0xa8764f);
    desk.position.set(0.78, 0.44, 0.28);
    var laptop = this._makeBox(0.36, 0.04, 0.26, 0x24342e);
    laptop.position.set(0.78, 0.75, 0.28);
    var chair = this._makeBox(0.36, 0.38, 0.36, 0x3b4c45);
    chair.position.set(0.3, 0.34, 0.28);
    roomGroup.add(desk, laptop, chair);

    // AC Indoor Unit or Sink/Keran
    if (layout.id !== 'K-103' && layout.id !== 'K-203') {
      var acUnit = this._makeBox(0.82, 0.24, 0.22, 0xfdfdfd);
      acUnit.position.set(-0.55, 1.92, -1.62);
      var acStripe = this._makeBox(0.7, 0.04, 0.23, 0x2b6f53);
      acStripe.position.set(-0.55, 1.86, -1.62);
      roomGroup.add(acUnit, acStripe);
    } else {
      var sinkBase = this._makeBox(0.55, 0.68, 0.48, 0xe8e4dc);
      sinkBase.position.set(0.95, 0.46, -0.45);
      var faucet = this._makeBox(0.08, 0.26, 0.14, 0x9aa3a8);
      faucet.position.set(0.95, 0.9, -0.58);
      roomGroup.add(sinkBase, faucet);
    }

    var winFrame = this._makeBox(0.95, 0.75, 0.22, 0x8cc2d4, { transparent: true, opacity: 0.55, castShadow: false });
    winFrame.position.set(-0.4, 1.35, -1.72);
    roomGroup.add(winFrame);

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
      anchor: new THREE.Vector3(layout.x, layout.y + 2.05, layout.z + 1.15)
    };
  };

  Kosan3DViewer.prototype._buildFlowProps = function () {
    var THREE = this.THREE;
    var self = this;

    this.flowPropsGroup = new THREE.Group();
    this.worldGroup.add(this.flowPropsGroup);

    // Step 2: Digital Contract + Brass Key floating cleanly above open front of K-201
    this.contractGroup = new THREE.Group();
    this.contractGroup.position.set(-3.2, 5.8, 1.15);
    this.contractGroup.visible = false;

    this.contractSheetMat = new THREE.MeshStandardMaterial({
      map: createContractTexture(false),
      roughness: 0.45,
      side: THREE.DoubleSide
    });
    this.contractSheet = new THREE.Mesh(new THREE.PlaneGeometry(1.42, 1.72), this.contractSheetMat);
    this.contractSheet.position.set(-0.45, 0.25, 0);
    this.contractGroup.add(this.contractSheet);

    this.keyGroup = new THREE.Group();
    this.keyGroup.position.set(0.65, 0.15, 0.2);
    var keyMat = new THREE.MeshStandardMaterial({ color: 0xdfb151, roughness: 0.28, metalness: 0.65 });
    var keyRing = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.06, 10, 20), keyMat);
    var keyShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.72, 10), keyMat);
    keyShaft.rotation.z = Math.PI / 2;
    keyShaft.position.set(0.52, 0, 0);
    var keyTooth1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.16, 0.06), keyMat);
    keyTooth1.position.set(0.68, -0.1, 0);
    var keyTooth2 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.06), keyMat);
    keyTooth2.position.set(0.84, -0.08, 0);
    this.keyGroup.add(keyRing, keyShaft, keyTooth1, keyTooth2);
    this.contractGroup.add(this.keyGroup);
    this.flowPropsGroup.add(this.contractGroup);

    // Step 3: QRIS Billing Card + Animated Pulse Arc to K-202
    this.billingGroup = new THREE.Group();
    this.billingGroup.visible = false;

    this.qrisMat = new THREE.MeshStandardMaterial({
      map: createQrisTexture(false),
      roughness: 0.4,
      side: THREE.DoubleSide
    });
    this.qrisCard = new THREE.Mesh(new THREE.PlaneGeometry(1.46, 1.6), this.qrisMat);
    this.qrisCard.position.set(0.0, 5.75, 1.15);
    this.billingGroup.add(this.qrisCard);

    this.billingCurve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(-4.0, 1.35, 1.85),
      new THREE.Vector3(-2.1, 4.85, 3.05),
      new THREE.Vector3(0.0, 4.85, 1.25)
    );
    var tubeGeo = new THREE.TubeGeometry(this.billingCurve, 28, 0.045, 8, false);
    var tubeMat = new THREE.MeshStandardMaterial({
      color: 0xc68621,
      emissive: 0xc68621,
      emissiveIntensity: 0.35,
      transparent: true,
      opacity: 0.72
    });
    this.billingTube = new THREE.Mesh(tubeGeo, tubeMat);
    this.billingGroup.add(this.billingTube);

    this.billingPulses = [];
    for (var i = 0; i < 3; i++) {
      var pulse = new THREE.Mesh(
        new THREE.SphereGeometry(0.15, 12, 12),
        new THREE.MeshStandardMaterial({ color: 0xf3c178, emissive: 0xf3c178, emissiveIntensity: 0.85 })
      );
      this.billingGroup.add(pulse);
      this.billingPulses.push(pulse);
    }
    this.flowPropsGroup.add(this.billingGroup);

    // Step 4: Complaint Beacon above K-103
    this.complaintGroup = new THREE.Group();
    this.complaintGroup.position.set(3.2, 2.55, 0.85);
    this.complaintGroup.visible = false;

    this.complaintRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.55, 0.08, 12, 28),
      new THREE.MeshStandardMaterial({ color: 0xc4542d, emissive: 0xc4542d, emissiveIntensity: 0.65 })
    );
    this.complaintRing.rotation.x = Math.PI / 2;
    this.complaintGroup.add(this.complaintRing);

    this.complaintCore = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.36, 0),
      new THREE.MeshStandardMaterial({ color: 0xc4542d, emissive: 0xc4542d, emissiveIntensity: 0.45, roughness: 0.3 })
    );
    this.complaintCore.position.y = 0.62;
    this.complaintGroup.add(this.complaintCore);
    this.flowPropsGroup.add(this.complaintGroup);

    // Step 5: Rooftop 3D Financial Growth Bars cleanly seated on rear roofDeck
    this.financeGroup = new THREE.Group();
    this.financeGroup.position.set(-1.35, 5.32, -0.88);
    this.financeGroup.visible = false;

    var barColors = [0x2b6f53, 0x3b8463, 0xc68621, 0xc4542d, 0xf3c178];
    this.financeBars = [];
    barColors.forEach(function (col, idx) {
      var bar = self._makeBox(0.68, 1.0, 0.68, col, { emissive: col, emissiveIntensity: 0.16 });
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
      { x: -1.1, y: 4.5, z: 2.65, color: 0xc4542d, w: 0.68, h: 0.52 },
      { x: 1.4, y: 2.3, z: 2.7, color: 0xfdf8eb, w: 0.78, h: 0.88 },
      { x: 3.4, y: 4.4, z: 2.25, color: 0xc68621, w: 0.68, h: 0.54 },
      { x: -4.2, y: 1.9, z: 2.5, color: 0xc4542d, w: 0.6, h: 0.48 },
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

  Kosan3DViewer.prototype._syncRoomsVisuals = function () {
    var self = this;
    this.roomsState.forEach(function (room) {
      var entry = self.roomMeshes[room.id];
      if (!entry) return;

      var meta = STATUS_META[room.status] || STATUS_META.ready;
      var showManualChaos = self.mode === 'hero' && self.heroVisualMode === 'manual';

      var targetColor = showManualChaos ? 0x8f8778 : meta.color;
      entry.floorPadMat.color.setHex(targetColor);
      entry.frontStripMat.color.setHex(targetColor);
      entry.frontStripMat.emissive.setHex(targetColor);

      var isSelected = self.selectedRoomId === room.id;
      entry.floorPadMat.emissive.setHex(isSelected ? meta.color : 0x000000);
      entry.floorPadMat.emissiveIntensity = isSelected ? 0.35 : 0;
      entry.selectFrame.material.opacity = isSelected ? 0.95 : 0;

      var pin = self.pinElements[room.id];
      if (pin) {
        pin.classList.toggle('is-selected', isSelected);
        var dot = pin.querySelector('.pin-dot');
        if (dot) {
          dot.className = 'pin-dot ' + (showManualChaos ? 'pin-repair' : meta.pinClass);
        }
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
        occupiedCount++;
        if (r.billingStatus === 'Lunas') paidIncome += r.price;
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
      var tubeCol = this.simState.qrisPaid ? 0x2b6f53 : 0xc68621;
      this.billingTube.material.color.setHex(tubeCol);
      this.billingTube.material.emissive.setHex(tubeCol);
    }

    if (this.complaintCore && this.complaintRing) {
      var stageColor =
        this.simState.complaintStage === 'done'
          ? 0x2b6f53
          : this.simState.complaintStage === 'processing'
            ? 0xc68621
            : 0xc4542d;
      this.complaintCore.material.color.setHex(stageColor);
      this.complaintCore.material.emissive.setHex(stageColor);
      this.complaintRing.material.color.setHex(stageColor);
      this.complaintRing.material.emissive.setHex(stageColor);
    }

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

  Kosan3DViewer.prototype.setFloorFilter = function (floor) {
    this.floorFilter = floor;
    if (this.fallbackMode) {
      this._drawFallback2D();
      return;
    }
    this.floor1Group.visible = true;
    this.floor2Group.visible = floor === 'all' || floor === '2' || floor === 'roof';
    this.roofGroup.visible = floor === 'all' || floor === 'roof';
    this.camTarget = Object.assign({}, this._getCameraPreset());
    this._syncStepProps();
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

  Kosan3DViewer.prototype.zoomBy = function (delta) {
    if (this.fallbackMode) return;
    this.camTarget.radius = Math.min(24, Math.max(8.5, this.camTarget.radius + delta));
  };

  Kosan3DViewer.prototype.resetCamera = function () {
    if (this.fallbackMode) {
      this.fallbackYaw = 0.62;
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
      if (!dragState.active) return;
      var dx = e.clientX - dragState.lastX;
      var dy = e.clientY - dragState.lastY;
      dragState.moved += Math.hypot(dx, dy);
      dragState.lastX = e.clientX;
      dragState.lastY = e.clientY;

      self.camTarget.theta -= dx * 0.0085;
      self.camTarget.phi = Math.min(1.36, Math.max(0.42, self.camTarget.phi - dy * 0.0055));
    });

    global.addEventListener('pointerup', function (e) {
      if (!dragState.active) return;
      dragState.active = false;
      if (dragState.moved < 7) {
        self._pickRoomAt(e.clientX, e.clientY);
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

  Kosan3DViewer.prototype._pickRoomAt = function (clientX, clientY) {
    var rect = this.canvas.getBoundingClientRect();
    if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {
      return;
    }
    this.pointerNDC.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.pointerNDC.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.pointerNDC, this.camera);
    var activePickables = this.pickables.filter(function (mesh) {
      return mesh.parent && mesh.parent.parent && mesh.parent.parent.visible;
    });
    var hits = this.raycaster.intersectObjects(activePickables, false);
    if (hits.length > 0) {
      var roomId = hits[0].object.userData.roomId;
      if (roomId) {
        this.selectRoom(roomId);
        this.onRoomSelect(roomId);
      }
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
    if (!this.pinsContainer || !this.viewW || !this.viewH) return;
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
        self.camTarget.theta += 0.0012;
      }

      var k = 0.09;
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

      // Step 2: Contract & Key float + billboard contract sheet toward camera
      if (self.contractGroup && self.contractGroup.visible) {
        self.contractGroup.position.y = 5.75 + Math.sin(t * 2.1) * 0.12;
        self.contractSheet.lookAt(self.camera.position.x, self.contractGroup.position.y + 0.25, self.camera.position.z);
        self.keyGroup.rotation.y = t * 1.4;
        self.keyGroup.position.y = self.simState.contractConfirmed ? -1.45 : 0.15 + Math.cos(t * 2.4) * 0.08;
      }

      // Step 3: QRIS plaque float + billboard + animated pulse spheres
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

      // Step 4: Complaint pulsing beacon
      if (self.complaintGroup && self.complaintGroup.visible) {
        self.complaintCore.rotation.y = t * 2.2;
        self.complaintCore.position.y = 0.65 + Math.sin(t * 3.0) * 0.1;
        var pulseScale = 1 + Math.sin(t * 4.2) * 0.16;
        self.complaintRing.scale.set(pulseScale, pulseScale, 1);
      }

      // Hero Manual mode floating chaos
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

  /* Graceful 2D-Projected Isometric 3D Canvas Fallback (works offline without Three.js CDN) */
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

    this._createPinDOM();
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
      ctx.strokeStyle = 'rgba(23,48,40,0.25)';
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
      drawBlock(layout.x, layout.y, layout.z, 2.7, 1.85, 2.8, '#faf7f0', meta.hex);

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
