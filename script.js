/**
 * ==========================================================================
 * THE WEDDING OF DERA & RIFQI
 * Main JavaScript Functionality (script.js)
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Inisialisasi Nama Tamu Dinamis dari Query String (?to=...)
  initGuestName();

  // 2. Inisialisasi Cover Overlay & Audio Controller
  initCoverAndAudio();

  // 3. Inisialisasi Countdown Timer Hari-H
  initCountdownTimer();

  // 4. Inisialisasi Animasi Scroll Reveal
  initScrollAnimations();
});

/**
 * Membaca URL Query Parameter dan menampilkan nama tamu
 * Format URL yang didukung: ?to=Nama+Tamu atau ?u=Nama+Tamu atau ?guest=Nama+Tamu
 */
function initGuestName() {
  const urlParams = new URLSearchParams(window.location.search);
  const rawGuest = urlParams.get('to') || urlParams.get('u') || urlParams.get('guest');
  const guestElement = document.getElementById('guestNameCover');

  if (guestElement) {
    if (rawGuest && rawGuest.trim() !== '') {
      // Decode URI Component dan bersihkan dari karakter berbahaya (Anti-XSS)
      const cleanGuest = escapeHtml(decodeURIComponent(rawGuest.replace(/\+/g, ' ').trim()));
      guestElement.textContent = cleanGuest;
    } else {
      guestElement.textContent = 'Tamu Undangan';
    }
  }
}

/**
 * Sanitasi string sederhana untuk mencegah injection HTML
 */
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Mengontrol Cover Overlay saat dibuka dan pemutaran background music
 */
function initCoverAndAudio() {
  const coverOverlay = document.getElementById('coverOverlay');
  const btnOpenInvitation = document.getElementById('btnOpenInvitation');
  const audio = document.getElementById('weddingAudio');
  const musicToggleBtn = document.getElementById('musicToggleBtn');
  const musicIconPlay = document.getElementById('musicIconPlay');
  const musicIconPause = document.getElementById('musicIconPause');

  let isPlaying = false;

  // Handler saat tombol "Buka Undangan" diklik
  if (btnOpenInvitation && coverOverlay) {
    btnOpenInvitation.addEventListener('click', () => {
      // 1. Hilangkan cover overlay ke atas
      coverOverlay.classList.add('hide');

      // 2. Buka kunci scroll body
      document.body.classList.remove('locked');

      // 3. Putar audio otomatis (Play on user gesture)
      if (audio) {
        audio.play().then(() => {
          isPlaying = true;
          updateMusicUI(true);
        }).catch((err) => {
          console.warn('Autoplay audio dicegah oleh peramban:', err);
          isPlaying = false;
          updateMusicUI(false);
        });
      }
    });
  }

  // Handler untuk Floating Music Button
  if (musicToggleBtn && audio) {
    musicToggleBtn.addEventListener('click', () => {
      if (audio.paused) {
        audio.play().then(() => {
          isPlaying = true;
          updateMusicUI(true);
        }).catch((err) => {
          console.warn('Gagal memutar audio:', err);
        });
      } else {
        audio.pause();
        isPlaying = false;
        updateMusicUI(false);
      }
    });
  }

  function updateMusicUI(active) {
    if (!musicToggleBtn) return;
    if (active) {
      musicToggleBtn.classList.add('playing');
      musicToggleBtn.setAttribute('title', 'Jeda Musik');
      if (musicIconPlay) musicIconPlay.style.display = 'none';
      if (musicIconPause) musicIconPause.style.display = 'block';
    } else {
      musicToggleBtn.classList.remove('playing');
      musicToggleBtn.setAttribute('title', 'Putar Musik');
      if (musicIconPlay) musicIconPlay.style.display = 'block';
      if (musicIconPause) musicIconPause.style.display = 'none';
    }
  }
}

/**
 * Countdown Timer Real-time menuju Hari-H
 * Target: Rabu, 07 Oktober 2026 pukul 08:00 WIB (UTC+7)
 */
function initCountdownTimer() {
  const cdDays = document.getElementById('cdDays');
  const cdHours = document.getElementById('cdHours');
  const cdMinutes = document.getElementById('cdMinutes');
  const cdSeconds = document.getElementById('cdSeconds');

  // Waktu target: 07 Oktober 2026, 08:00:00 WIB (+07:00)
  const targetDate = new Date('2026-10-07T08:00:00+07:00').getTime();

  function updateCountdown() {
    const now = new Date().getTime();
    const distance = targetDate - now;

    if (distance <= 0) {
      if (cdDays) cdDays.textContent = '00';
      if (cdHours) cdHours.textContent = '00';
      if (cdMinutes) cdMinutes.textContent = '00';
      if (cdSeconds) cdSeconds.textContent = '00';
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    if (cdDays) cdDays.textContent = String(days).padStart(2, '0');
    if (cdHours) cdHours.textContent = String(hours).padStart(2, '0');
    if (cdMinutes) cdMinutes.textContent = String(minutes).padStart(2, '0');
    if (cdSeconds) cdSeconds.textContent = String(seconds).padStart(2, '0');
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);
}

/**
 * Fungsi Copy to Clipboard untuk Tanda Kasih (Nomor DANA)
 * @param {string} text - Teks yang akan disalin (nomor rekening/DANA)
 * @param {string} buttonId - ID elemen tombol
 * @param {string} defaultText - Teks asli tombol
 */
function copyToClipboard(text, buttonId, defaultText) {
  const btn = document.getElementById(buttonId);
  
  const onSuccess = () => {
    if (btn) {
      btn.classList.add('copied');
      btn.innerHTML = `
        <svg viewBox="0 0 24 24" style="width:16px;height:16px;fill:currentColor;"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
        <span>Tersalin!</span>
      `;
    }

    // Tampilkan Toast
    showToast(`Nomor DANA (${text}) berhasil disalin!`);

    // Reset tombol setelah 2 detik
    setTimeout(() => {
      if (btn) {
        btn.classList.remove('copied');
        btn.innerHTML = `
          <svg viewBox="0 0 24 24" style="width:15px;height:15px;fill:currentColor;"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
          <span>${defaultText}</span>
        `;
      }
    }, 2000);
  };

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(onSuccess).catch(() => {
      fallbackCopyText(text, onSuccess);
    });
  } else {
    fallbackCopyText(text, onSuccess);
  }
}

/**
 * Fallback salin teks untuk peramban yang membatasi clipboard API
 */
function fallbackCopyText(text, callback) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.top = '-9999px';
  textArea.style.left = '-9999px';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    const successful = document.execCommand('copy');
    if (successful && typeof callback === 'function') {
      callback();
    }
  } catch (err) {
    console.error('Fallback copy gagal:', err);
  }
  document.body.removeChild(textArea);
}

/**
 * Menampilkan Toast Notification
 */
function showToast(message) {
  const toast = document.getElementById('toastMsg');
  const toastText = document.getElementById('toastText');
  if (toast && toastText) {
    toastText.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2500);
  }
}

/**
 * Inisialisasi Intersection Observer untuk Scroll Reveal Elemen
 */
function initScrollAnimations() {
  const revealElements = document.querySelectorAll('.reveal-on-scroll');

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          // Unobserve setelah tampil pertama kali
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px'
    });

    revealElements.forEach((el) => observer.observe(el));
  } else {
    // Fallback jika browser lawas tidak mendukung IntersectionObserver
    revealElements.forEach((el) => el.classList.add('active'));
  }
}
