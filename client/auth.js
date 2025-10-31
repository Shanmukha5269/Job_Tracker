const API_URL = 'http://localhost:3000/api';

function showLogin() {
  document.getElementById('loginForm').style.display = 'block';
  document.getElementById('registerForm').style.display = 'none';
  document.querySelectorAll('.tab-btn')[0].classList.add('active');
  document.querySelectorAll('.tab-btn')[1].classList.remove('active');
}

function showRegister() {
  document.getElementById('loginForm').style.display = 'none';
  document.getElementById('registerForm').style.display = 'block';
  document.querySelectorAll('.tab-btn')[1].classList.add('active');
  document.querySelectorAll('.tab-btn')[0].classList.remove('active');
}

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const messageEl = document.getElementById('loginMessage');

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, user_type: 'job_seeker' })  // ← Enforce job seeker type
    });

    const data = await response.json();

    if (response.ok) {
      // STRICT CHECK: Only allow job seekers
      if (data.user.user_type !== 'job_seeker') {
        messageEl.textContent = 'This account is registered as an employer. Please use the employer login portal.';
        messageEl.className = 'message error';
        
        // Show link to employer portal
        setTimeout(() => {
          messageEl.innerHTML = 'This is an employer account. <a href="employer-auth.html" style="color: #667eea; font-weight: 600;">Click here to login as employer</a>';
        }, 2000);
        return;
      }

      messageEl.textContent = 'Login successful! Redirecting...';
      messageEl.className = 'message success';
      localStorage.setItem('user', JSON.stringify(data.user));
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1000);
    } else {
      messageEl.textContent = data.error || 'Login failed';
      messageEl.className = 'message error';
    }
  } catch (error) {
    console.error('Login error:', error);
    messageEl.textContent = 'Connection error. Please try again.';
    messageEl.className = 'message error';
  }
});

document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const userData = {
    email: document.getElementById('regEmail').value,
    password: document.getElementById('regPassword').value,
    full_name: document.getElementById('regFullName').value,
    phone: document.getElementById('regPhone').value,
    location: document.getElementById('regLocation').value,
    sex: document.getElementById('regSex').value
  };

  const messageEl = document.getElementById('registerMessage');

  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });

    const data = await response.json();

    if (response.ok) {
      messageEl.textContent = 'Registration successful! Please login.';
      messageEl.className = 'message success';
      document.getElementById('registerForm').reset();
      setTimeout(() => showLogin(), 2000);
    } else {
      messageEl.textContent = data.error || 'Registration failed';
      messageEl.className = 'message error';
    }
  } catch (error) {
    console.error('Registration error:', error);
    messageEl.textContent = 'Connection error. Please try again.';
    messageEl.className = 'message error';
  }
});
