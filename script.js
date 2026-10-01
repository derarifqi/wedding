/**
 * ==========================================================================
 * THE WEDDING OF DERA & RIFQI
 * Main JavaScript Interactivity (script.js)
 * Features:
 * 1. URL Query Guest Name Reader (?to=...)
 * 2. Auto-Open Cover (4s timer) with manual click override & sound autoplay
 * 3. Smooth Auto-Scroll with Pause on Screen Touch/Hold & Resume on Release
 * 4. Countdown Timer to Big Day
 * 5. One-Click DANA Copy to Clipboard
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Membaca Parameter URL Nama Tamu (?to=...)
  setupGuestName();

  // 2. Kontrol Cover Lock Overlay, Auto-Open (4 detik), & Background Audio
  setupCoverAndAudio();

  // 3. Countdown Timer Real-time Menuju Hari-H
  setupCountdownTimer();

  // 4. Animasi Scroll Reveal
  setupScrollReveal();
});

/**
 * Membaca URL Query Parameter (?to=... atau ?u=... atau ?guest=...)
 * Fallback: "Tamu Undangan"
 */
function setupGuestName() {
  const urlParams = new URLSearchParams(window.location.search);
  const rawGuest = urlParams.get('to') || urlParams.get('u') || urlParams.get('guest');
  const guestDisplay = document.getElementById('guestNameDisplay');

  if (guestDisplay) {
    if (rawGuest && rawGuest.trim() !== '') {
      const cleanGuest = sanitizeHtml(decodeURIComponent(rawGuest.replace(/\+/g, ' ').trim()));
      guestDisplay.textContent = cleanGuest;
    } else {
      guestDisplay.textContent = 'Tamu Undangan';
    }
  }
}

/**
 * Sanitasi string sederhana untuk mencegah injection HTML
 */
function sanitizeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Variabel Global untuk Kontrol Auto-Scroll
 */
let isAutoScrollEnabled = true;
let isUserInteracting = false;
let autoScrollRafId = null;
let resumeScrollTimeout = null;

/**
 * Kontrol Cover Lock Modal, Auto-Open Timer (4 Detik), & Background Audio
 */
function setupCoverAndAudio() {
  const coverOverlay = document.getElementById('coverOverlay');
  const btnOpenInvite = document.getElementById('btnOpenInvite');
  const audio = document.getElementById('bg-audio');
  const floatingMusicBtn = document.getElementById('floatingMusicBtn');

  let isCoverOpened = false;
  let autoOpenTimer = null;

  // Fungsi inti untuk membuka undangan
  function openInvitation() {
    if (isCoverOpened) return;
    isCoverOpened = true;

    // Bersihkan timer auto-open jika belum jalan
    if (autoOpenTimer) {
      clearTimeout(autoOpenTimer);
      autoOpenTimer = null;
    }

    // 1. Geser cover ke atas secara mulus (translateY(-100%))
    if (coverOverlay) {
      coverOverlay.classList.add('hide');
    }

    // 2. Buka kunci scroll halaman
    document.body.classList.remove('locked');

    // 3. Putar musik latar
    if (audio) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          updateMusicUI(true);
        }).catch((err) => {
          console.warn('Autoplay terblokir kebijakan browser, menunggu sentuhan pertama:', err);
          updateMusicUI(false);
          // Fallback: putar musik pada sentuhan/interaksi layar pertama kali
          enableAudioOnFirstGesture(audio);
        });
      }
    }

    // 4. Mulai Auto-Scroll setelah transisi cover selesai (jeda 1.2 detik)
    setTimeout(() => {
      startSmartAutoScroll();
    }, 1200);
  }

  // A. Tombol Buka Undangan diklik manual
  if (btnOpenInvite) {
    btnOpenInvite.addEventListener('click', () => {
      openInvitation();
    });
  }

  // B. Auto-Open Otomatis setelah 4 Detik (Waktu ideal agar tamu sempat membaca namanya di cover)
  autoOpenTimer = setTimeout(() => {
    openInvitation();
  }, 4000);

  // C. Floating Button Toggle Musik Manual
  if (floatingMusicBtn && audio) {
    floatingMusicBtn.addEventListener('click', () => {
      if (audio.paused) {
        audio.play().then(() => {
          updateMusicUI(true);
        }).catch((err) => {
          console.warn('Gagal memutar audio:', err);
        });
      } else {
        audio.pause();
        updateMusicUI(false);
      }
    });
  }

  function updateMusicUI(isPlaying) {
    if (!floatingMusicBtn) return;
    if (isPlaying) {
      floatingMusicBtn.classList.add('playing');
      floatingMusicBtn.setAttribute('title', 'Jeda Musik');
    } else {
      floatingMusicBtn.classList.remove('playing');
      floatingMusicBtn.setAttribute('title', 'Putar Musik');
    }
  }

  // Listener untuk autoplay musik pada gesture pertama jika browser membatasi auto-play awal
  function enableAudioOnFirstGesture(targetAudio) {
    const playOnce = () => {
      targetAudio.play().then(() => {
        updateMusicUI(true);
      }).catch(() => {});
      window.removeEventListener('touchstart', playOnce);
      window.removeEventListener('click', playOnce);
    };
    window.addEventListener('touchstart', playOnce, { passive: true });
    window.addEventListener('click', playOnce, { passive: true });
  }
}

/**
 * ==========================================================================
 * SMART AUTO-SCROLL CONTROLLER
 * - Berjalan santai ke bawah secara otomatis
 * - Pengguna bisa scroll manual kapan saja
 * - Berhenti seketika saat layar DITAHAN (touch/press/wheel)
 * - Berjalan kembali saat layar DILEPAS
 * - Berhenti permanen saat sudah mentok paling bawah
 * ==========================================================================
 */
function startSmartAutoScroll() {
  const scrollSpeed = 0.85; // Kecepatan pixel per frame (sangat santai dan nyaman dibaca)
  let lastTimestamp = null;

  function step(timestamp) {
    if (!isAutoScrollEnabled) return;

    if (!lastTimestamp) lastTimestamp = timestamp;
    const delta = timestamp - lastTimestamp;
    lastTimestamp = timestamp;

    // Jika pengguna sedang menahan layar / scroll manual, jangan jalankan auto-scroll
    if (!isUserInteracting) {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const currentScroll = window.scrollY || window.pageYOffset;

      if (currentScroll < maxScroll - 2) {
        // Geser ke bawah
        window.scrollBy({
          top: scrollSpeed,
          left: 0,
          behavior: 'auto'
        });
      } else {
        // Sudah mentok paling bawah, hentikan auto-scroll
        isAutoScrollEnabled = false;
        return;
      }
    }

    autoScrollRafId = requestAnimationFrame(step);
  }

  autoScrollRafId = requestAnimationFrame(step);

  // Inisialisasi Detektor Interaksi Pengguna (Sentuh / Tahan / Lepas)
  initUserInteractionListeners();
}

/**
 * Detektor sentuhan layar (Touch & Mouse events)
 */
function initUserInteractionListeners() {
  // 1. Saat Layar DITAHAN / Disentuh (Touchstart / Mousedown)
  const onInteractionStart = () => {
    isUserInteracting = true;
    if (resumeScrollTimeout) {
      clearTimeout(resumeScrollTimeout);
      resumeScrollTimeout = null;
    }
  };

  // 2. Saat Layar DILEPAS (Touchend / Mouseup)
  const onInteractionEnd = () => {
    if (resumeScrollTimeout) clearTimeout(resumeScrollTimeout);
    // Beri jeda wajar 900ms setelah layar dilepas sebelum auto-scroll berjalan kembali
    resumeScrollTimeout = setTimeout(() => {
      isUserInteracting = false;
    }, 900);
  };

  // 3. Saat Pengguna melakukan Scroll Manual (Mouse wheel / Touch move)
  const onManualScroll = () => {
    isUserInteracting = true;
    if (resumeScrollTimeout) clearTimeout(resumeScrollTimeout);
    resumeScrollTimeout = setTimeout(() => {
      isUserInteracting = false;
    }, 900);
  };

  // Event Listeners untuk Mobile Touchscreen
  window.addEventListener('touchstart', onInteractionStart, { passive: true });
  window.addEventListener('touchend', onInteractionEnd, { passive: true });
  window.addEventListener('touchcancel', onInteractionEnd, { passive: true });

  // Event Listeners untuk Desktop Mouse / Pointer
  window.addEventListener('mousedown', onInteractionStart, { passive: true });
  window.addEventListener('mouseup', onInteractionEnd, { passive: true });
  window.addEventListener('wheel', onManualScroll, { passive: true });
}

/**
 * Hitung Mundur Real-time menuju Hari-H
 * Target: Rabu, 07 Oktober 2026 pukul 08.00 WIB (UTC+7)
 */
function setupCountdownTimer() {
  const timerDays = document.getElementById('timerDays');
  const timerHours = document.getElementById('timerHours');
  const timerMinutes = document.getElementById('timerMinutes');
  const timerSeconds = document.getElementById('timerSeconds');

  const targetDate = new Date('2026-10-07T08:00:00+07:00').getTime();

  function updateTimer() {
    const now = new Date().getTime();
    const distance = targetDate - now;

    if (distance <= 0) {
      if (timerDays) timerDays.textContent = '00';
      if (timerHours) timerHours.textContent = '00';
      if (timerMinutes) timerMinutes.textContent = '00';
      if (timerSeconds) timerSeconds.textContent = '00';
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    if (timerDays) timerDays.textContent = String(days).padStart(2, '0');
    if (timerHours) timerHours.textContent = String(hours).padStart(2, '0');
    if (timerMinutes) timerMinutes.textContent = String(minutes).padStart(2, '0');
    if (timerSeconds) timerSeconds.textContent = String(seconds).padStart(2, '0');
  }

  updateTimer();
  setInterval(updateTimer, 1000);
}

/**
 * Fitur Salin Rekening / Nomor DANA dengan Feedback Visual 2 Detik
 * @param {string} text - Nomor DANA
 * @param {string} btnId - ID tombol yang diklik
 * @param {string} defaultText - Teks asli tombol
 */
function copyDanaNumber(text, btnId, defaultText) {
  const btn = document.getElementById(btnId);

  const onSuccess = () => {
    if (btn) {
      btn.classList.add('copied');
      btn.innerHTML = `<i class="fa-solid fa-check"></i> <span>Tersalin!</span>`;
    }

    showToast(`Nomor DANA (${text}) berhasil disalin!`);

    setTimeout(() => {
      if (btn) {
        btn.classList.remove('copied');
        btn.innerHTML = `<i class="fa-regular fa-copy"></i> <span>${defaultText}</span>`;
      }
    }, 2000);
  };

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(onSuccess).catch(() => {
      fallbackCopy(text, onSuccess);
    });
  } else {
    fallbackCopy(text, onSuccess);
  }
}

/**
 * Fallback salin teks jika clipboard API dibatasi
 */
function fallbackCopy(text, callback) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.top = '-9999px';
  textArea.style.left = '-9999px';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    const success = document.execCommand('copy');
    if (success && typeof callback === 'function') {
      callback();
    }
  } catch (err) {
    console.error('Fallback copy error:', err);
  }
  document.body.removeChild(textArea);
}

/**
 * Menampilkan Toast Notifikasi
 */
function showToast(message) {
  const toast = document.getElementById('toastNotice');
  const toastText = document.getElementById('toastNoticeText');
  if (toast && toastText) {
    toastText.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2500);
  }
}

/**
 * Animasi Scroll Reveal saat elemen masuk viewport
 */
function setupScrollReveal() {
  const items = document.querySelectorAll('.reveal-item');

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px'
    });

    items.forEach((item) => observer.observe(item));
  } else {
    items.forEach((item) => item.classList.add('active'));
  }
}
