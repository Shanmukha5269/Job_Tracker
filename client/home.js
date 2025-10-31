// Mobile Menu Toggle
function toggleMobileMenu() {
  const navLinks = document.querySelector('.nav-links');
  navLinks.classList.toggle('active');
}

// Smooth Scroll for Navigation
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
      
      // Close mobile menu if open
      const navLinks = document.querySelector('.nav-links');
      navLinks.classList.remove('active');
    }
  });
});

// Navbar Scroll Effect
window.addEventListener('scroll', () => {
  const navbar = document.querySelector('.navbar-home');
  if (window.scrollY > 50) {
    navbar.style.boxShadow = '0 2px 30px rgba(0, 0, 0, 0.15)';
  } else {
    navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
  }
});

// Animated Counter for Stats
function animateCounter(element, target, duration) {
  let start = 0;
  const increment = target / (duration / 16); // 60 FPS
  
  const timer = setInterval(() => {
    start += increment;
    if (start >= target) {
      element.textContent = target.toLocaleString() + '+';
      clearInterval(timer);
    } else {
      element.textContent = Math.floor(start).toLocaleString();
    }
  }, 16);
}

// Intersection Observer for Stats Animation
const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const statNumbers = entry.target.querySelectorAll('.stat-number');
      statNumbers.forEach(stat => {
        const target = parseInt(stat.dataset.target);
        animateCounter(stat, target, 2000);
      });
      statsObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

// Observe stats section
const statsSection = document.querySelector('.stats');
if (statsSection) {
  statsObserver.observe(statsSection);
}

// Intersection Observer for Feature Cards Animation
const featureObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, index) => {
    if (entry.isIntersecting) {
      setTimeout(() => {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }, index * 100);
    }
  });
}, { threshold: 0.1 });

// Initialize feature cards with animation
document.querySelectorAll('.feature-card').forEach(card => {
  card.style.opacity = '0';
  card.style.transform = 'translateY(30px)';
  card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  featureObserver.observe(card);
});

// Initialize steps with animation
document.querySelectorAll('.step').forEach(step => {
  step.style.opacity = '0';
  step.style.transform = 'translateY(30px)';
  step.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  featureObserver.observe(step);
});

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
  const navLinks = document.querySelector('.nav-links');
  const menuToggle = document.querySelector('.mobile-menu-toggle');
  
  if (!navLinks.contains(e.target) && !menuToggle.contains(e.target)) {
    navLinks.classList.remove('active');
  }
});

// Add active state to navigation links based on scroll position
window.addEventListener('scroll', () => {
  const sections = document.querySelectorAll('section[id]');
  const scrollPosition = window.scrollY + 100;

  sections.forEach(section => {
    const sectionTop = section.offsetTop;
    const sectionHeight = section.offsetHeight;
    const sectionId = section.getAttribute('id');
    
    if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
      document.querySelectorAll('.nav-links a').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${sectionId}`) {
          link.classList.add('active');
        }
      });
    }
  });
});

// Parallax effect for hero section
window.addEventListener('scroll', () => {
  const scrolled = window.scrollY;
  const hero = document.querySelector('.hero');
  if (hero && scrolled < window.innerHeight) {
    hero.style.transform = `translateY(${scrolled * 0.5}px)`;
  }
});

// Loading animation
window.addEventListener('load', () => {
  document.body.style.opacity = '0';
  setTimeout(() => {
    document.body.style.transition = 'opacity 0.5s ease';
    document.body.style.opacity = '1';
  }, 100);
});

function showUserFlow(type) {
  // Toggle tab buttons
  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.classList.add('active');

  // Toggle flow content
  if (type === 'seeker') {
    document.getElementById('seekerFlow').style.display = 'grid';
    document.getElementById('employerFlow').style.display = 'none';
  } else {
    document.getElementById('seekerFlow').style.display = 'none';
    document.getElementById('employerFlow').style.display = 'grid';
  }
}

// Check URL parameters for user type
window.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const userType = urlParams.get('type');
  
  if (userType === 'employer') {
    // Scroll to employer section
    document.getElementById('for-employers')?.scrollIntoView({ behavior: 'smooth' });
  }
});
