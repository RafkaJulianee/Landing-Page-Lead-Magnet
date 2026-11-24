(function () {
  'use strict';

  var STORAGE_KEY = 'kosinaja_digitalisasi_checklist_v1';

  var FULL_GUIDE_SECTIONS = [
    {
      heading: 'Panduan Singkat Digitalisasi Operasional Rumah Kos',
      subheading: 'Cara Praktis Merapikan Booking, Kontrak, Tagihan, hingga Laporan Keuangan Kos dalam Satu Alur Terintegrasi'
    },
    {
      heading: 'Kenapa Pengelolaan Kos Perlu Terstruktur?',
      body: 'Pengelolaan rumah kos secara manual sering kali memicu berbagai masalah operasional, mulai dari pencatatan ketersediaan kamar yang tidak akurat, tagihan bulanan yang terlewat, berkas kontrak kertas yang tercecer, hingga pengaduan kerusakan dari penghuni yang lambat ditangani. Dengan menerapkan alur sistem digital yang terintegrasi, seluruh proses operasional dapat terorganisir secara otomatis dan transparan. Hal ini tidak hanya mempermudah kerja pengelola, tetapi juga meningkatkan kepuasan serta kenyamanan para penghuni kos.'
    },
    {
      heading: '4 Tahap Alur Operasional Kos Modern',
      subheading: '1. Pengaturan Awal & Data Kos',
      bullets: [
        '<strong>Registrasi Admin &amp; Layanan:</strong> Pengelola mendaftarkan akun sebagai Admin Kos dan memilih paket layanan yang sesuai dengan skala usaha rumah kos.',
        '<strong>Kelola Profil &amp; Unit:</strong> Mengisi informasi profil kos, inventaris daftar kamar, kelengkapan fasilitas, serta aturan resmi kos agar dapat diakses calon penghuni secara transparan.'
      ]
    },
    {
      subheading: '2. Pemesanan Kamar & Kontrak Digital',
      bullets: [
        '<strong>Eksplorasi &amp; Pengajuan Online:</strong> Calon penghuni melihat halaman penawaran, mencari unit yang sesuai, mengecek detail fasilitas kamar, dan mengajukan sewa secara online.',
        '<strong>Verifikasi &amp; Kontrak Digital:</strong> Pengelola meninjau pengajuan sewa (menyetujui atau menolak <em>booking</em>), mencatat data identitas penghuni, serta menerbitkan dokumen kontrak sewa digital.'
      ]
    },
    {
      subheading: '3. Penagihan, Verifikasi Pembayaran & Laporan',
      bullets: [
        '<strong>Penagihan Terpusat:</strong> Sistem menerbitkan tagihan sewa rutin secara otomatis dan mengirimkan notifikasi pengingat pembayaran langsung kepada penghuni.',
        '<strong>Verifikasi &amp; Monitoring Financial:</strong> Penghuni dapat memantau riwayat pembayaran, sementara pengelola mengonfirmasi pembayaran yang masuk serta memantau laporan keuangan dan tingkat hunian (<em>occupancy rate</em>) secara <em>real-time</em>.'
      ]
    },
    {
      subheading: '4. Layanan Penghuni & Penanganan Pengaduan',
      bullets: [
        '<strong>Pengajuan Komplain Mandiri:</strong> Penghuni dapat melaporkan kerusakan fasilitas atau menyampaikan pengaduan langsung melalui portal akun mereka.',
        '<strong>Tindak Lanjut &amp; Pemeliharaan System:</strong> Pengelola menerima notifikasi instant untuk segera menindaklanjuti perbaikan hingga tuntas, didukung pengawasan infrastruktur oleh Admin Super demi kelancaran platform.'
      ]
    },
    {
      heading: 'Checklist Kesiapan Digitalisasi Kos Anda',
      bullets: [
        'Daftar seluruh kamar beserta status terisi/kosong dan harga sewa',
        'Rincian fasilitas dan peraturan resmi rumah kos',
        'Format kontrak sewa standar untuk diubah ke kontrak digital',
        'Jadwal jatuh tempo tagihan bulanan penghuni',
        'Alur penerimaan komplain dan perbaikan fasilitas'
      ]
    },
    {
      heading: 'Langkah Selanjutnya',
      body: 'Jika Anda telah melengkapi seluruh poin pada checklist di atas, Anda sudah siap untuk melangkah ke tahap digitalisasi operasional secara penuh. Segera siapkan aktivasi sistem manajemen rumah kos Anda atau manfaatkan paket template operasional awal agar bisnis kos Anda dapat berjalan secara otomatis, rapi, dan profesional.'
    }
  ];

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

  function loadChecklistState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { checked: {}, notes: {} };
      var parsed = JSON.parse(raw);
      return {
        checked: parsed.checked || {},
        notes: parsed.notes || {}
      };
    } catch (e) {
      return { checked: {}, notes: {} };
    }
  }

  function saveChecklistState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      // Ignore storage quota or private mode errors
    }
  }

  function setupChecklist() {
    var checkboxes = document.querySelectorAll('.prep-checkbox');
    var noteInputs = document.querySelectorAll('.note-input');
    var progressText = document.getElementById('checklist-progress-text');
    var progressBar = document.getElementById('checklist-progress-bar');
    var banner = document.getElementById('checklist-banner');
    var bannerMsg = document.getElementById('checklist-banner-msg');
    var markAllBtn = document.getElementById('checklist-mark-all');
    var resetBtn = document.getElementById('checklist-reset');
    var printChecklistBtn = document.getElementById('checklist-print-btn');

    var state = loadChecklistState();
    var total = checkboxes.length;

    function updateUI() {
      var completed = 0;

      checkboxes.forEach(function (cb) {
        var id = cb.getAttribute('data-check-id');
        var isChecked = Boolean(state.checked[id]);
        cb.checked = isChecked;
        if (isChecked) completed += 1;

        var row = document.querySelector('[data-check-row="' + id + '"]');
        if (row) row.classList.toggle('is-checked', isChecked);

        var pill = document.querySelector('[data-status-pill="' + id + '"]');
        if (pill) {
          pill.textContent = isChecked ? 'Siap' : 'Belum Lengkap';
          pill.classList.toggle('is-ready', isChecked);
        }
      });

      noteInputs.forEach(function (input) {
        var id = input.getAttribute('data-note-id');
        if (document.activeElement !== input) {
          input.value = state.notes[id] || '';
        }
      });

      var pct = total > 0 ? Math.round((completed / total) * 100) : 0;
      if (progressText) {
        progressText.textContent = completed + ' dari ' + total + ' Item Persiapan Selesai (' + pct + '%)';
      }
      if (progressBar) {
        progressBar.style.width = pct + '%';
      }

      if (banner && bannerMsg) {
        var allDone = completed === total && total > 0;
        banner.classList.toggle('is-complete', allDone);
        bannerMsg.textContent = allDone
          ? 'Seluruh 5 poin checklist telah siap. Anda sudah siap melangkah ke tahap digitalisasi operasional rumah kos secara penuh.'
          : 'Lengkapi kelima poin persiapan di atas untuk memulai digitalisasi operasional rumah kos secara penuh.';
      }
    }

    checkboxes.forEach(function (cb) {
      cb.addEventListener('change', function () {
        var id = cb.getAttribute('data-check-id');
        state.checked[id] = cb.checked;
        saveChecklistState(state);
        updateUI();
      });
    });

    noteInputs.forEach(function (input) {
      input.addEventListener('input', function () {
        var id = input.getAttribute('data-note-id');
        state.notes[id] = input.value;
        saveChecklistState(state);
      });
    });

    if (markAllBtn) {
      markAllBtn.addEventListener('click', function () {
        checkboxes.forEach(function (cb) {
          var id = cb.getAttribute('data-check-id');
          state.checked[id] = true;
        });
        saveChecklistState(state);
        updateUI();
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        state = { checked: {}, notes: {} };
        noteInputs.forEach(function (input) {
          input.value = '';
        });
        saveChecklistState(state);
        updateUI();
      });
    }

    if (printChecklistBtn) {
      printChecklistBtn.addEventListener('click', function () {
        window.print();
      });
    }

    updateUI();
  }

  function setupReaderModal() {
    var modal = document.getElementById('reader-modal');
    var openBtn = document.getElementById('open-reader-btn');
    var heroOpenBtn = document.getElementById('hero-open-reader');
    var headerReaderBtn = document.getElementById('header-reader-btn');
    var mobileReaderBtn = document.getElementById('mobile-reader-btn');
    var podOpenReader = document.getElementById('pod-open-reader');
    var closeBtn = document.getElementById('close-reader-btn');
    var closeFooterBtn = document.getElementById('reader-close-footer-btn');
    var printBtn = document.getElementById('reader-print-btn');
    var bodyEl = document.getElementById('reader-modal-body');
    var lastFocused = null;

    if (!modal || !bodyEl) return;

    bodyEl.innerHTML = FULL_GUIDE_SECTIONS.map(function (sec) {
      var html = '';
      if (sec.heading) html += '<h3>' + sec.heading + '</h3>';
      if (sec.subheading) html += '<h4>' + sec.subheading + '</h4>';
      if (sec.body) html += '<p>' + sec.body + '</p>';
      if (sec.bullets && sec.bullets.length) {
        html +=
          '<ul>' +
          sec.bullets
            .map(function (b) {
              return '<li>' + b + '</li>';
            })
            .join('') +
          '</ul>';
      }
      return html;
    }).join('');

    function openModal() {
      lastFocused = document.activeElement;
      modal.hidden = false;
      document.body.style.overflow = 'hidden';
      if (closeBtn) closeBtn.focus();
    }

    function closeModal() {
      modal.hidden = true;
      document.body.style.overflow = '';
      if (lastFocused && typeof lastFocused.focus === 'function') {
        lastFocused.focus();
      }
    }

    if (openBtn) openBtn.addEventListener('click', openModal);
    if (heroOpenBtn) heroOpenBtn.addEventListener('click', openModal);
    if (headerReaderBtn) headerReaderBtn.addEventListener('click', openModal);
    if (mobileReaderBtn) mobileReaderBtn.addEventListener('click', openModal);
    if (podOpenReader) podOpenReader.addEventListener('click', openModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (closeFooterBtn) closeFooterBtn.addEventListener('click', closeModal);
    if (printBtn) {
      printBtn.addEventListener('click', function () {
        window.print();
      });
    }

    modal.addEventListener('click', function (e) {
      if (e.target === modal) closeModal();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !modal.hidden) {
        closeModal();
      }
    });
  }

  function setupDirectPrintButton() {
    var printBtn = document.getElementById('direct-print-btn');
    if (printBtn) {
      printBtn.addEventListener('click', function () {
        window.print();
      });
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    setupMobileMenu();
    setupChecklist();
    setupReaderModal();
    setupDirectPrintButton();
  });
})();
