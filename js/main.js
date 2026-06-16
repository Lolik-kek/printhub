const pages = ['home','materials','printers','news','cart','profile','login','register','calc','contacts'];

const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const navMenu = document.getElementById('navMenu');

let isLoggedIn = false;
let userName = '';

function updateAuthButton() {
  const authBtn = document.getElementById('authBtn');
  const userNameEl = document.getElementById('userName');
  if (authBtn) {
    if (isLoggedIn) {
      authBtn.outerHTML = '<a href="../profile.html" class="user-name" id="authBtn">' + userName + '</a>';
    }
  }
  if (userNameEl) {
    if (isLoggedIn) {
      userNameEl.textContent = userName;
      userNameEl.className = 'user-name';
    }
  }
}

function login(name) {
  isLoggedIn = true;
  userName = name;
  updateAuthButton();
  localStorage.setItem('isLoggedIn', 'true');
  localStorage.setItem('userName', name);
}

function logout() {
  isLoggedIn = false;
  userName = '';
  const authBtn = document.getElementById('authBtn');
  if (authBtn) {
    authBtn.outerHTML = '<a href="../login.html" class="auth-btn" id="authBtn">Вход / Регистрация</a>';
  }
  const userNameEl = document.getElementById('userName');
  if (userNameEl) {
    userNameEl.outerHTML = '<a href="../login.html" class="auth-btn" id="authBtn">Вход / Регистрация</a>';
  }
  localStorage.setItem('isLoggedIn', 'false');
  localStorage.setItem('userName', '');
}

function navigate(id, event) {
  if (event) {
    const target = document.getElementById('page-' + id);
    if (target) {
      event.preventDefault();
      pages.forEach(p => {
        const el = document.getElementById('page-' + p);
        if (el) el.classList.remove('active');
      });
      target.classList.add('active');
      window.scrollTo({top:0,behavior:'smooth'});
      if (navMenu) navMenu.classList.remove('active');
      if (mobileMenuBtn) mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
      updateActiveLink(id);
    }
  }
}

function updateActiveLink(currentId) {
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active-link');
    const href = link.getAttribute('href');
    if (href && href.includes(currentId)) {
      link.classList.add('active-link');
    } else if (currentId === 'home' && href === '../index.html') {
      link.classList.add('active-link');
    } else if (currentId === 'calc' && href === '../calc.html') {
      link.classList.add('active-link');
    } else if (currentId === 'materials' && href === '../materials.html') {
      link.classList.add('active-link');
    } else if (currentId === 'printers' && href === '../printers.html') {
      link.classList.add('active-link');
    } else if (currentId === 'news' && href === '../news.html') {
      link.classList.add('active-link');
    } else if (currentId === 'contacts' && href === '../contacts.html') {
      link.classList.add('active-link');
    } else if (currentId === 'cart' && href === '../cart.html') {
      link.classList.add('active-link');
    } else if (currentId === 'profile' && href === '../profile.html') {
      link.classList.add('active-link');
    } else if (currentId === 'login' && href === '../login.html') {
      link.classList.add('active-link');
    } else if (currentId === 'register' && href === '../register.html') {
      link.classList.add('active-link');
    }
  });
}

if (mobileMenuBtn) {
  mobileMenuBtn.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    mobileMenuBtn.innerHTML = navMenu.classList.contains('active') 
      ? '<i class="fas fa-times"></i>' 
      : '<i class="fas fa-bars"></i>';
  });
}

document.addEventListener('DOMContentLoaded', () => {
  window.addEventListener('scroll', () => {
    const header = document.getElementById('metaHeader');
    if (header && window.scrollY > 50) header.classList.add('scrolled');
    else if (header) header.classList.remove('scrolled');
  });

  document.querySelectorAll('.filter-bar').forEach(bar => {
    bar.querySelectorAll('.filter-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        bar.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
      });
    });
  });
});
