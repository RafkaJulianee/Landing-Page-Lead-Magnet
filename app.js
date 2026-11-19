(function () {
  'use strict';

  var STATUS_INFO = {
    occupied: { label: 'Terisi', badgeClass: 'status-occupied' },
    ready: { label: 'Kosong siap huni', badgeClass: 'status-ready' },
    booked: { label: 'Dalam tahap pemesanan', badgeClass: 'status-booked' },
    repair: { label: 'Sedang diperbaiki', badgeClass: 'status-repair' }
  };

  var STEP_META = {
    1: { hudTitle: 'Data Kamar & Pemesanan Terpusat', focusRoom: 'K-102' },
    2: { hudTitle: 'Kontrak Sewa Digital & Serah Terima Kunci', focusRoom: 'K-201' },
    3: { hudTitle: 'Penagihan Tanpa Canggung & QRIS', focusRoom: 'K-202' },
    4: { hudTitle: 'Alur Pengaduan 3-Status Terukur', focusRoom: 'K-103' },
    5: { hudTitle: 'Laporan Keuangan & Statistik Hunian', focusRoom: 'K-101' }
  };

  var ROLES_DATA = {
    admin: {
      tag: 'RUANG DATA TERPISAH & AMAN',
      title: 'Admin Kos — Pusat Kendali Operasional Properti',
      scope: 'Isolasi Data Per Properti',
      desc: 'Mengelola kamar, data penghuni, pemesanan, kontrak sewa digital, tagihan, pembayaran, pengaduan, dan laporan keuangan di ruang data yang terpisah dan aman.',
      capabilities: [
        'Memperbarui status 4 kondisi kamar & mencatat pemesanan tanpa risiko dobel booking',
        'Menyimpan data penghuni, kontak darurat, identitas, dan kontrak sewa digital',
        'Mengirim pengingat jatuh tempo otomatis & memverifikasi pembayaran QRIS/transfer',
        'Memperbarui progres pengaduan penghuni dan membaca laporan keuangan bersih'
      ]
    },
    penghuni: {
      tag: 'AKSES MANDIRI PENGHUNI',
      title: 'Penghuni Kos — Transparansi Kontrak, Tagihan, & Keluhan',
      scope: 'Akun Penghuni Pribadi',
      desc: 'Mengakses informasi kamar, melihat kontrak sewa digital, memantau tagihan dan riwayat pembayaran, serta mengirim laporan pengaduan langsung tanpa canggung.',
      capabilities: [
        'Melihat detail kamar, fasilitas, dan tata tertib yang tercantum di kontrak sewa digital kapan saja',
        'Memantau status tagihan bulanan (Menunggu / Lunas) dan riwayat pembayaran secara mandiri',
        'Melakukan pembayaran digital (QRIS / transfer bank) tanpa khawatir bukti transfer tertimbun chat',
        'Mengirim laporan kendala fasilitas dan memantau progres perbaikannya hingga selesai'
      ]
    },
    superadmin: {
      tag: 'INFRASTRUKTUR PLATFORM SAAS',
      title: 'Super Admin — Penjaga Keandalan Sistem Terpusat',
      scope: 'Manajemen Platform SaaS',
      desc: 'Menjaga keandalan infrastruktur platform SaaS, mengelola akun Admin Kos, dan memantau sistem secara terpusat agar setiap properti kos berjalan stabil.',
      capabilities: [
        'Memastikan infrastruktur cloud dan ketersediaan layanan tetap andal bagi seluruh pengelola kos',
        'Mengelola pendaftaran dan aktivasi akun Admin Kos baru dengan isolasi data yang aman',
        'Memantau kesehatan dan keamanan sistem secara terpusat tanpa mencampur privasi data penghuni'
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
      contractState: 'Terkonfirmasi',
      note: 'Fasilitas: AC, Kasur Queen, Meja Kerja, Lemari, Wi-Fi, KM Dalam. Jatuh tempo tanggal 5 setiap bulan.'
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
      note: 'Fasilitas: AC, Kasur Queen, Meja Kerja, Lemari, Wi-Fi, KM Dalam. Siap dipesan langsung oleh calon penghuni.'
    },
    {
      id: 'K-103',
      floor: 1,
      type: 'Tipe Standar',
      price: 1250000,
      status: 'repair',
      tenant: 'Perawatan Berkala (Riwayat Aktif)',
      billingStatus: 'Tiket #ADU-04: Keran bocor',
      contractState: 'Sedang ditangani Admin Kos',
      note: 'Fasilitas: Kasur, Meja Belajar, Lemari, Wi-Fi. Keluhan keran air bocor dilaporkan melalui sistem pengaduan.'
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
      note: 'Fasilitas: AC, Balkon, Kasur Queen, Meja Kerja, Lemari, Wi-Fi. Wajib konfirmasi kontrak digital sebelum serah terima kunci.'
    },
    {
      id: 'K-202',
      floor: 2,
      type: 'Tipe AC',
      price: 1950000,
      status: 'occupied',
      tenant: 'Siti Rahmawati',
      billingStatus: 'Menunggu Pembayaran (H-2)',
      contractState: 'Terkonfirmasi',
      note: 'Fasilitas: AC, Kasur Queen, Meja Kerja, Lemari, Wi-Fi. Pengingat jatuh tempo otomatis dikirim oleh sistem.'
    },
    {
      id: 'K-203',
      floor: 2,
      type: 'Tipe Standar + Balkon',
      price: 1350000,
      status: 'occupied',
      tenant: 'Fajar Hidayat',
      billingStatus: 'Lunas',
      contractState: 'Terkonfirmasi',
      note: 'Fasilitas: Kasur, Meja Kerja, Lemari, Balkon, Wi-Fi. Pembayaran diverifikasi otomatis.'
    }
  ];

  var rooms = INITIAL_ROOMS.map(function (r) {
    return Object.assign({}, r);
  });

  var OPERATIONAL_EXPENSE = 1400000;
  var currentStep = 1;
  var selectedStudioRoom = 'K-102';
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
    var room = findRoom(roomId) || rooms[0];
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
        occupiedCount++;
        if (r.billingStatus === 'Lunas') {
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

    // Update desktop cards
    document.querySelectorAll('.step-card').forEach(function (card) {
      var isTarget = Number(card.getAttribute('data-step')) === currentStep;
      card.classList.toggle('is-active', isTarget);
      var trigger = card.querySelector('.step-trigger');
      if (trigger) trigger.setAttribute('aria-expanded', String(isTarget));
    });

    // Update mobile tabs
    document.querySelectorAll('[data-step-tab]').forEach(function (tab) {
      var isTarget = Number(tab.getAttribute('data-step-tab')) === currentStep;
      tab.classList.toggle('is-active', isTarget);
      tab.setAttribute('aria-selected', String(isTarget));
    });

    // Update HUD & footer navigation
    document.getElementById('hud-step-num').textContent = 'LANGKAH 0' + currentStep;
    document.getElementById('hud-step-title').textContent = meta.hudTitle;
    document.getElementById('step-counter').textContent = 'Langkah ' + currentStep + ' dari 5';
    document.getElementById('step-prev-btn').disabled = currentStep === 1;
    document.getElementById('step-next-btn').disabled = currentStep === 5;

    // Reset floor filter to 'all' unless step 5
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

    // Hero Manual vs Digital switch
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
              ? '<strong>Cara Manual:</strong> Bon kertas, foto KTP, tagihan chat, dan laporan keluhan tercecer sehingga status kamar sulit dipantau cepat.'
              : '<strong>Alur Digital:</strong> Status 6 kamar, kontrak, tagihan QRIS, dan keluhan terpantau dalam satu dasbor terpusat.';
        }
      });
    });

    // Studio 3D Walkthrough Viewer
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
        }
      });
    }

    // Studio Controls
    document.querySelectorAll('.floor-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var floor = btn.getAttribute('data-floor');
        document.querySelectorAll('.floor-btn').forEach(function (b) {
          b.classList.toggle('is-active', b === btn);
        });
        if (studioViewer) studioViewer.setFloorFilter(floor);
      });
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

    // Step Triggers
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

    document.getElementById('step-prev-btn').addEventListener('click', function () {
      activateStep(currentStep - 1);
    });

    document.getElementById('step-next-btn').addEventListener('click', function () {
      activateStep(currentStep + 1);
    });
  }

  function setupSimulations() {
    // Step 1 Simulation: Book K-102
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
        fb1.textContent = 'Berhasil! K-102 langsung berubah menjadi Dalam tahap pemesanan sehingga terhindar dari terjual ganda.';
      } else {
        k102.status = 'ready';
        k102.tenant = 'Belum ada penghuni';
        k102.billingStatus = 'Tersedia untuk pemesanan baru';
        k102.contractState = 'Menunggu pemesan';
        bookBtn.textContent = 'Simulasi: Pesan Kamar AC (K-102)';
        fb1.textContent = 'K-102 dikembalikan ke status Kosong siap huni.';
      }
      selectedStudioRoom = 'K-102';
      if (studioViewer) studioViewer.selectRoom('K-102');
      syncAllViewers();
    });

    // Step 2 Simulation: Confirm Digital Contract & Key Handover on K-201
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
        fb2.textContent = 'Kontrak digital terkonfirmasi & kunci diserahkan! Status K-201 berubah menjadi Terisi.';
      } else {
        k201.status = 'booked';
        k201.tenant = 'Nadia Kusuma (Masuk tgl 1)';
        k201.billingStatus = 'DP Pemesanan Tercatat';
        k201.contractState = 'Menunggu konfirmasi kontrak digital';
        contractBtn.textContent = 'Simulasi: Konfirmasi Kontrak & Serahkan Kunci (K-201)';
        fb2.textContent = 'Simulasi dikembalikan ke tahap menunggu konfirmasi kontrak sebelum serah kunci.';
      }
      if (studioViewer) {
        studioViewer.setSimState({ contractConfirmed: contractDone });
        studioViewer.selectRoom('K-201');
      }
      selectedStudioRoom = 'K-201';
      syncAllViewers();
    });

    // Step 3 Simulation: Send Reminder & QRIS Payment on K-202
    var remindBtn = document.getElementById('sim-remind-k202');
    var payBtn = document.getElementById('sim-pay-k202');
    var fb3 = document.getElementById('feedback-step-3');
    var paidDone = false;

    remindBtn.addEventListener('click', function () {
      activateStep(3);
      fb3.textContent = 'Pengingat jatuh tempo resmi dikirim sistem ke akun Penghuni Kos K-202 — tanpa rasa canggung!';
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
        fb3.textContent = 'Pembayaran QRIS Rp 1.950.000 otomatis tercatat Lunas dan langsung masuk ke laporan keuangan!';
      } else {
        k202.billingStatus = 'Menunggu Pembayaran (H-2)';
        payBtn.textContent = 'Simulasi Bayar QRIS (K-202)';
        fb3.textContent = 'Kamar 202 kembali berstatus menunggu pembayaran sewa.';
      }
      if (studioViewer) {
        studioViewer.setSimState({ qrisPaid: paidDone });
        studioViewer.selectRoom('K-202');
      }
      selectedStudioRoom = 'K-202';
      syncAllViewers();
    });

    // Step 4 Simulation: 3-stage complaint resolution on K-103
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
            fb4.textContent = 'Tahap 1: Penghuni melapor keran air bocor melalui aplikasi tanpa chat tenggelam.';
          } else if (stage === 'processing') {
            k103.status = 'repair';
            k103.billingStatus = 'Tiket #ADU-04: Sedang Diproses';
            k103.contractState = 'Teknisi ditugaskan Admin Kos';
            fb4.textContent = 'Tahap 2: Admin Kos memperbarui status menjadi Sedang Diproses — penghuni merasa tenang.';
          } else {
            k103.status = 'ready';
            k103.billingStatus = 'Riwayat Perawatan Tersimpan';
            k103.contractState = 'Siap dihuni · Terdokumentasi';
            fb4.textContent = 'Tahap 3: Perbaikan selesai & riwayat perawatan Kamar 103 terdokumentasi rapi!';
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
    var tagEl = document.getElementById('role-tag');
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

        tagEl.textContent = data.tag;
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

  function buildChecklistDocument(name, roomsScale) {
    return [
      'PANDUAN MENGELOLA RUMAH KOS SECARA MODERN DAN EFISIEN',
      'Ringkasan Checklist Praktis Transisi Operasional Digital',
      'Disiapkan untuk: ' + name + ' (Skala: ' + roomsScale + ' Kamar)',
      '====================================================================',
      '',
      '1. AUDIT 3 KEBOCORAN OPERASIONAL MANUAL',
      '[ ] Cek apakah ada jadwal penagihan yang terlambat atau sungkan ditagih',
      '[ ] Cek apakah status kamar kosong/dipesan masih mengandalkan ingatan atau papan tulis',
      '[ ] Cek apakah ada keluhan perbaikan kamar yang terselip di chat WhatsApp',
      '',
      '2. MENATA DATA KAMAR & PENGHUNI DALAM SATU TEMPAT',
      '[ ] Catat identitas tiap kamar: nomor, tipe, tarif sewa, dan fasilitas lengkap',
      '[ ] Tetapkan 4 status baku: Terisi | Kosong siap huni | Dalam tahap pemesanan | Sedang diperbaiki',
      '[ ] Simpan data penghuni: nama lengkap, kontak darurat, identitas diri, tanggal masuk, riwayat kamar',
      '',
      '3. KONTRAK SEWA DIGITAL (TIPS SERAH TERIMA KAMAR)',
      '[ ] Pastikan ketentuan listrik, aturan tamu, denda keterlambatan, dan uang jaminan tertulis jelas',
      '[ ] Biasakan konfirmasi kontrak digital SEBELUM kunci kamar diserahkan ke penghuni baru',
      '[ ] Beri akses penghuni untuk melihat ulang kontrak digitalnya kapan saja',
      '',
      '4. PENAGIHAN PROFESIONAL TANPA RASA CANGGUNG',
      '[ ] Pisahkan hubungan personal dari prosedur penagihan',
      '[ ] Atur pengingat jatuh tempo otomatis H-3 / H-2 sebagai pemberitahuan resmi manajemen kos',
      '[ ] Sediakan metode bayar QRIS / transfer bank yang tercatat otomatis (Lunas / Menunggu / Lewat Jatuh Tempo)',
      '',
      '5. PENANGANAN PENGADUAN TERUKUR (3 STATUS)',
      '[ ] Arahkan laporan kerusakan (keran bocor, AC, Wi-Fi) ke satu jalur resmi',
      '[ ] Jalankan alur: Dilaporkan Penghuni -> Diproses Admin Kos -> Selesai & Terdokumentasi',
      '[ ] Simpan riwayat perawatan per kamar untuk evaluasi kualitas bangunan',
      '',
      '6. LAPORAN KEUANGAN & KESEHATAN BISNIS',
      '[ ] Pisahkan rekening operasional kos dari rekening pribadi',
      '[ ] Catat pemasukan sewa + pengeluaran perawatan, kebersihan, iuran lingkungan, dan perbaikan',
      '[ ] Pantau arus kas bersih, tingkat keterisian bulanan, dan sisihkan dana cadangan renovasi',
      '',
      '7. PERAN PENGGUNA DALAM SISTEM MANAJEMEN KOS SAAS',
      '- Super Admin : Menjaga keandalan infrastruktur SaaS, mengelola akun Admin Kos, memantau sistem terpusat',
      '- Admin Kos   : Mengelola kamar, penghuni, pemesanan, kontrak, tagihan, pengaduan, & laporan di ruang data terpisah',
      '- Penghuni Kos: Melihat info kamar, kontrak digital, status tagihan & riwayat bayar, serta mengirim pengaduan'
    ].join('\n');
  }

  function setupLeadMagnetForm() {
    var form = document.getElementById('lead-magnet-form');
    var errorEl = document.getElementById('lead-form-error');
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
        errorEl.textContent = 'Mohon isi nama pemilik atau pengelola kos terlebih dahulu.';
        errorEl.hidden = false;
        return;
      }

      if (contactVal.length < 5) {
        errorEl.textContent = 'Mohon isi alamat email atau nomor WhatsApp yang aktif.';
        errorEl.hidden = false;
        return;
      }

      errorEl.hidden = true;
      latestLead = { name: nameVal, rooms: roomsVal, contact: contactVal };

      form.hidden = true;
      successBox.hidden = false;
      successMsg.textContent =
        'Terima kasih, ' +
        nameVal +
        '. Ringkasan panduan untuk skala ' +
        roomsVal +
        ' kamar siap Anda unduh sekarang atau dicetak sebagai referensi transisi digital kos Anda.';
    });

    downloadBtn.addEventListener('click', function () {
      var content = buildChecklistDocument(latestLead.name, latestLead.rooms);
      var blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'Checklist-Panduan-Kos-Modern.txt';
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
      form.hidden = false;
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    setupMobileMenu();
    setup3DScenes();
    setupSimulations();
    setupRoleSwitcher();
    setupLeadMagnetForm();
    activateStep(1);
    renderFinancialLedger();
  });
})();
