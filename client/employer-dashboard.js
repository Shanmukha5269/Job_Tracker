const API_URL = 'http://localhost:3000/api';
let currentUser = null;
let currentCompany = null;
let allApplications = [];

window.addEventListener('DOMContentLoaded', () => {
  const userData = localStorage.getItem('user');
  const companyData = localStorage.getItem('company');
  
  if (!userData || !companyData) {
    window.location.href = 'employer-auth.html';
    return;
  }
  
  currentUser = JSON.parse(userData);
  currentCompany = JSON.parse(companyData);
  
  if (currentUser.user_type !== 'employer') {
    alert('Access denied. Employer access only.');
    window.location.href = '/';
    return;
  }
  
  initializeDashboard();
});

function initializeDashboard() {
  const initials = currentCompany.company_name.substring(0, 1).toUpperCase();
  document.getElementById('userInitial').textContent = initials;
  document.getElementById('sidebarCompanyInitial').textContent = initials;
  document.getElementById('userName').textContent = currentCompany.company_name;
  document.getElementById('sidebarCompanyName').textContent = currentCompany.company_name;
  document.getElementById('userEmail').textContent = currentUser.email;
  document.getElementById('companyIndustry').textContent = currentCompany.industry || 'Not specified';
  
  loadJobs();
  loadApplications();
  loadCompanyProfile();
}

function showSection(sectionName) {
  document.querySelectorAll('.content-section').forEach(section => {
    section.classList.remove('active');
  });
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });

  document.getElementById(`${sectionName}Section`).classList.add('active');
  document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

  if (sectionName === 'applications') loadApplications();
  else if (sectionName === 'jobs') loadJobs();
}

function toggleUserDropdown() {
  document.getElementById('userDropdown').classList.toggle('active');
}

function logout() {
  localStorage.removeItem('user');
  localStorage.removeItem('company');
  window.location.href = '/';
}

function showAddJobModal() {
  document.getElementById('jobModal').classList.add('active');
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('active');
}

async function loadJobs() {
  try {
    const response = await fetch(`${API_URL}/jobs/company/${currentCompany.company_id}`);
    const jobs = await response.json();
    
    document.getElementById('totalJobs').textContent = jobs.length;
    displayJobs(jobs);
  } catch (error) {
    console.error('Error loading jobs:', error);
  }
}

function displayJobs(jobs) {
  const listEl = document.getElementById('jobsList');
  listEl.innerHTML = jobs.length === 0 
    ? '<p style="grid-column: 1/-1; text-align: center;">No jobs posted yet. Create your first job!</p>'
    : jobs.map(job => `
      <div class="data-card">
        <h3>${job.job_title}</h3>
        <p><strong>Type:</strong> ${job.employment_type}</p>
        <p><strong>Location:</strong> ${job.location || 'Not specified'}</p>
        <p><strong>Salary:</strong> ${job.salary_range || 'Not disclosed'}</p>
        <p><strong>Posted:</strong> ${new Date(job.posted_date || job.created_at).toLocaleDateString()}</p>
        <div class="card-actions">
          <button class="btn-small btn-delete" onclick="deleteJob(${job.job_id})">
            <i class="fas fa-trash"></i> Delete
          </button>
        </div>
      </div>
    `).join('');
}

// FIXED: Load applications for employer's jobs
async function loadApplications() {
  try {
    const response = await fetch(`${API_URL}/applications/company/${currentCompany.company_id}`);
    allApplications = await response.json();
    
    document.getElementById('totalApplications').textContent = allApplications.length;
    displayApplications(allApplications);
  } catch (error) {
    console.error('Error loading applications:', error);
    document.getElementById('applicationsList').innerHTML = 
      '<p style="grid-column: 1/-1; text-align: center; color: red;">Error loading applications</p>';
  }
}

function displayApplications(applications) {
  const listEl = document.getElementById('applicationsList');
  listEl.innerHTML = applications.length === 0 
    ? '<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary);">No applications received yet.</p>'
    : applications.map(app => `
      <div class="data-card">
        <h3>${app.full_name}</h3>
        <p><strong>Applied for:</strong> ${app.job_title}</p>
        <p><strong>Email:</strong> <a href="mailto:${app.email}" style="color: var(--primary-color);">${app.email}</a></p>
        <p><strong>Phone:</strong> ${app.phone || 'Not provided'}</p>
        <p><strong>Location:</strong> ${app.location || 'Not specified'}</p>
        <p><strong>Applied on:</strong> ${new Date(app.application_date).toLocaleDateString()}</p>
        <span class="status-badge status-${app.status.toLowerCase().replace(/ /g, '-')}">${app.status}</span>
        ${app.resume ? `<p style="margin-top: 10px;"><a href="${app.resume}" target="_blank" style="color: var(--primary-color);"><i class="fas fa-file-pdf"></i> View Resume</a></p>` : ''}
        <div class="card-actions">
          <button class="btn-small btn-edit" onclick="updateApplicationStatus(${app.application_id}, '${app.status}')">
            <i class="fas fa-edit"></i> Update Status
          </button>
        </div>
      </div>
    `).join('');
}

// Update application status
async function updateApplicationStatus(applicationId, currentStatus) {
  const statuses = ['Applied', 'In Review', 'Interview Scheduled', 'Rejected', 'Accepted'];
  
  const newStatus = prompt(
    `Current Status: ${currentStatus}\n\nSelect new status:\n1. Applied\n2. In Review\n3. Interview Scheduled\n4. Rejected\n5. Accepted\n\nEnter number (1-5):`,
    statuses.indexOf(currentStatus) + 1
  );

  if (!newStatus || newStatus < 1 || newStatus > 5) return;

  const statusToUpdate = statuses[parseInt(newStatus) - 1];

  try {
    const response = await fetch(`${API_URL}/applications/${applicationId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: statusToUpdate })
    });

    if (response.ok) {
      alert(`Status updated to: ${statusToUpdate}`);
      loadApplications();
    } else {
      alert('Failed to update status');
    }
  } catch (error) {
    console.error('Error updating status:', error);
    alert('Error updating status');
  }
}

async function loadCompanyProfile() {
  document.getElementById('companyName').value = currentCompany.company_name;
  document.getElementById('industry').value = currentCompany.industry || '';
  document.getElementById('location').value = currentCompany.location || '';
  document.getElementById('website').value = currentCompany.website || '';
  document.getElementById('employees').value = currentCompany.no_of_employees || '';
  document.getElementById('description').value = currentCompany.description || '';
}

document.getElementById('jobForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const jobData = {
    company_id: currentCompany.company_id,
    job_title: document.getElementById('jobTitle').value,
    job_description: document.getElementById('jobDescription').value,
    location: document.getElementById('jobLocation').value,
    employment_type: document.getElementById('jobEmploymentType').value,
    salary_range: document.getElementById('jobSalary').value,
    posted_date: new Date().toISOString().split('T')[0],
    application_deadline: document.getElementById('jobDeadline').value
  };

  try {
    const response = await fetch(`${API_URL}/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(jobData)
    });

    if (response.ok) {
      alert('Job posted successfully!');
      closeModal('jobModal');
      document.getElementById('jobForm').reset();
      loadJobs();
    } else {
      const data = await response.json();
      alert(data.error || 'Failed to post job');
    }
  } catch (error) {
    alert('Connection error. Please try again.');
  }
});

async function deleteJob(id) {
  if (!confirm('Are you sure you want to delete this job?')) return;
  
  try {
    const response = await fetch(`${API_URL}/jobs/${id}`, { method: 'DELETE' });
    if (response.ok) {
      alert('Job deleted successfully!');
      loadJobs();
    }
  } catch (error) {
    alert('Failed to delete job');
  }
}

document.getElementById('companyForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const companyData = {
    company_name: document.getElementById('companyName').value,
    industry: document.getElementById('industry').value,
    location: document.getElementById('location').value,
    website: document.getElementById('website').value,
    no_of_employees: document.getElementById('employees').value,
    description: document.getElementById('description').value
  };

  try {
    const response = await fetch(`${API_URL}/companies/${currentCompany.company_id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(companyData)
    });

    if (response.ok) {
      alert('Company profile updated successfully!');
      currentCompany = { ...currentCompany, ...companyData };
      localStorage.setItem('company', JSON.stringify(currentCompany));
      initializeDashboard();
    }
  } catch (error) {
    alert('Failed to update profile');
  }
});

window.onclick = function(event) {
  if (event.target.classList.contains('modal')) {
    event.target.classList.remove('active');
  }
}

document.addEventListener('click', (e) => {
  if (!e.target.closest('.user-menu')) {
    document.getElementById('userDropdown').classList.remove('active');
  }
});
