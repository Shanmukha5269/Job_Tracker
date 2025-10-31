const API_URL = 'http://localhost:3000/api';

function showEmployerLogin() {
  document.getElementById('employerLoginForm').style.display = 'block';
  document.getElementById('employerRegisterForm').style.display = 'none';
  document.querySelectorAll('.tab-btn')[0].classList.add('active');
  document.querySelectorAll('.tab-btn')[1].classList.remove('active');
}

function showEmployerRegister() {
  document.getElementById('employerLoginForm').style.display = 'none';
  document.getElementById('employerRegisterForm').style.display = 'block';
  document.querySelectorAll('.tab-btn')[1].classList.add('active');
  document.querySelectorAll('.tab-btn')[0].classList.remove('active');
}

// Employer Login
document.getElementById('employerLoginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('empLoginEmail').value;
  const password = document.getElementById('empLoginPassword').value;
  const messageEl = document.getElementById('empLoginMessage');

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, user_type: 'employer' })  // ← Enforce employer type
    });

    const data = await response.json();

    if (response.ok) {
      // STRICT CHECK: Only allow employers
      if (data.user.user_type !== 'employer') {
        messageEl.textContent = 'This account is registered as a job seeker. Please use the job seeker login portal.';
        messageEl.className = 'message error';
        
        // Show link to job seeker portal
        setTimeout(() => {
          messageEl.innerHTML = 'This is a job seeker account. <a href="index.html" style="color: #1e3c72; font-weight: 600;">Click here to login as job seeker</a>';
        }, 2000);
        return;
      }

      messageEl.textContent = 'Login successful! Redirecting to employer dashboard...';
      messageEl.className = 'message success';
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('company', JSON.stringify(data.company));
      
      setTimeout(() => {
        window.location.href = 'employer-dashboard.html';
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

// Employer Register
document.getElementById('employerRegisterForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const password = document.getElementById('empRegPassword').value;
  const confirmPassword = document.getElementById('empRegConfirmPassword').value;
  const messageEl = document.getElementById('empRegisterMessage');

  if (password !== confirmPassword) {
    messageEl.textContent = 'Passwords do not match!';
    messageEl.className = 'message error';
    return;
  }

  if (password.length < 8) {
    messageEl.textContent = 'Password must be at least 8 characters long!';
    messageEl.className = 'message error';
    return;
  }

  if (!document.getElementById('empRegTerms').checked) {
    messageEl.textContent = 'Please agree to the Terms of Service!';
    messageEl.className = 'message error';
    return;
  }

  const userData = {
    email: document.getElementById('empRegEmail').value,
    password: password,
    full_name: document.getElementById('empRegFullName').value,
    phone: document.getElementById('empRegPhone').value,
    location: document.getElementById('empRegLocation').value,
    company_name: document.getElementById('empRegCompanyName').value,
    industry: document.getElementById('empRegIndustry').value,
    website: document.getElementById('empRegWebsite').value,
    no_of_employees: document.getElementById('empRegEmployees').value,
    description: document.getElementById('empRegDescription').value
  };

  console.log('Sending registration data:', userData);

  try {
    const response = await fetch(`${API_URL}/auth/register-employer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });

    const data = await response.json();
    console.log('Registration response:', data);

    if (response.ok) {
      messageEl.textContent = 'Company registered successfully! Redirecting to login...';
      messageEl.className = 'message success';
      document.getElementById('employerRegisterForm').reset();
      
      setTimeout(() => {
        showEmployerLogin();
      }, 2000);
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
