// ===== NAVBAR SCROLL =====
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 40);
});

// ===== MOBILE MENU =====
const burger = document.getElementById('burger');
const mobileMenu = document.getElementById('mobileMenu');
if (burger) {
  burger.addEventListener('click', () => {
    mobileMenu.classList.toggle('open');
  });
}

// ===== REVEAL ON SCROLL =====
const reveals = document.querySelectorAll('.reveal');
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      const delay = entry.target.style.getPropertyValue('--i') || 0;
      setTimeout(() => {
        entry.target.classList.add('visible');
      }, parseFloat(delay) * 100);
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.08, rootMargin: '0px 0px -60px 0px' });

reveals.forEach(el => observer.observe(el));

// ===== COUNTER ANIMATION =====
function animateCounter(el, target, suffix = '') {
  let start = 0;
  const duration = 1800;
  const step = (timestamp) => {
    if (!start) start = timestamp;
    const progress = Math.min((timestamp - start) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.floor(ease * target) + suffix;
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const nums = entry.target.querySelectorAll('.stat-num');
      nums.forEach(num => {
        const target = parseInt(num.dataset.target);
        animateCounter(num, target);
      });
      statsObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.3 });

const heroStats = document.querySelector('.hero-stats');
if (heroStats) statsObserver.observe(heroStats);

// ===== SMOOTH LINK TRANSITIONS =====
document.querySelectorAll('a[href]').forEach(link => {
  const href = link.getAttribute('href');
  if (href && !href.startsWith('#') && !href.startsWith('mailto') && !href.startsWith('tel')) {
    link.addEventListener('click', e => {
      // Already on same page
    });
  }
});

// ===== CONTACT FORM =====
const form = document.querySelector('.contact-form');
if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    btn.textContent = 'Sending...';
    btn.disabled = true;
    setTimeout(() => {
      btn.textContent = '✓ Request Submitted!';
      btn.style.background = '#c8ff00';
      btn.style.color = '#05050a';
      setTimeout(() => {
        btn.textContent = 'Submit Request';
        btn.disabled = false;
        btn.style.background = '';
        btn.style.color = '';
        form.reset();
      }, 3000);
    }, 1400);
  });
}

// ===== ANTIGRAVITY INIT =====
document.addEventListener('DOMContentLoaded', function () {
  var el = document.getElementById('antigravity-canvas');
  if (el && typeof Antigravity !== 'undefined') {
    new Antigravity(el, {
      count: 300,
      magnetRadius: 6,
      ringRadius: 7,
      waveSpeed: 0.4,
      waveAmplitude: 1,
      particleSize: 1.5,
      lerpSpeed: 0.05,
      color: '#c8ff00',
      autoAnimate: true,
      particleVariance: 1,
      rotationSpeed: 0,
      depthFactor: 1,
      pulseSpeed: 3,
      fieldStrength: 10
    });
  }
});
