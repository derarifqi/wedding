/**
 * ==========================================================================
 * THE WEDDING OF DERA & RIFQI
 * Main JavaScript Interactivity (script.js)
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Membaca Parameter URL Nama Tamu (?to=...)
  setupGuestName();

  // 2. Kontrol Cover Lock Overlay & Background Audio
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
      // Decode URL, ganti tanda plus dengan spasi, sanitasi XSS
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
 * Kontrol Cover Lock Modal dan Pemutaran Background Music
 */
function setupCoverAndAudio() {
  const coverOverlay = document.getElementById('coverOverlay');
  const btnOpenInvite = document.getElementById('btnOpenInvite');
  const audio = document.getElementById('bg-audio');
  const floatingMusicBtn = document.getElementById('floatingMusicBtn');

  // Klik tombol "Buka Undangan"
  if (btnOpenInvite && coverOverlay) {
    btnOpenInvite.addEventListener('click', () => {
      // 1. Geser cover ke atas secara mulus (translateY(-100%))
      coverOverlay.classList.add('hide');

      // 2. Buka kunci scroll halaman
      document.body.classList.remove('locked');

      // 3. Putar audio otomatis (User gesture autoplay)
      if (audio) {
        audio.play().then(() => {
          updateMusicUI(true);
        }).catch((err) => {
          console.warn('Autoplay dicegah oleh browser:', err);
          updateMusicUI(false);
        });
      }
    });
  }

  // Floating Button Toggle Musik
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

  // Waktu target: 07 Oktober 2026 08:00:00 WIB (+07:00)
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

    // Reset teks tombol setelah 2 detik
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
 * Fallback salin teks untuk peramban yang membatasi clipboard API
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
 * Animasi Scroll Reveal saat elemen masuk ke dalam viewport
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
    // Fallback jika browser lawas
    items.forEach((item) => item.classList.add('active'));
  }
}
