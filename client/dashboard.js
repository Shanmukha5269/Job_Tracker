const API_URL = 'http://localhost:3000/api';
let currentUser = null;
let allApplications = [];
let allJobs = [];
let allCompanies = [];
let allContacts = [];

// Check authentication on page load
window.addEventListener('DOMContentLoaded', () => {
  const userData = localStorage.getItem('user');
  if (!userData) {
    window.location.href = '/login';
    return;
  }
  
  currentUser = JSON.parse(userData);
  initializeDashboard();
});

function initializeDashboard() {
  // Set user info in sidebar and navbar
  const initials = currentUser.full_name.split(' ').map(n => n[0]).join('').toUpperCase();
  document.getElementById('userInitial').textContent = initials;
  document.getElementById('sidebarUserInitial').textContent = initials;
  document.getElementById('userName').textContent = currentUser.full_name;
  document.getElementById('sidebarUserName').textContent = currentUser.full_name;
  document.getElementById('userEmail').textContent = currentUser.email;
  
  // Load initial data
  loadProfile();
  loadApplications();
  loadJobs();
  loadCompanies();
  loadContacts();
  calculateStatistics();
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
  else if (sectionName === 'companies') loadCompanies();
  else if (sectionName === 'contacts') loadContacts();
  else if (sectionName === 'statistics') loadStatistics();
  else if (sectionName === 'profile') loadProfile();
}

function toggleUserDropdown() {
  document.getElementById('userDropdown').classList.toggle('active');
}

function logout() {
  localStorage.removeItem('user');
  window.location.href = '/';
}

function toggleTheme() {
  alert('Theme toggle feature coming soon!');
}

// Modal Functions
function showAddApplicationModal() {
  document.getElementById('applicationModal').classList.add('active');
  loadJobsForSelect();
}

function showAddJobModal() {
  document.getElementById('jobModal').classList.add('active');
  loadCompaniesForSelect('jobCompanyId');
}

function showAddCompanyModal() {
  document.getElementById('companyModal').classList.add('active');
}

function showAddContactModal() {
  document.getElementById('contactModal').classList.add('active');
  loadCompaniesForSelect('contactCompanyId');
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('active');
}

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

// ==================== APPLICATIONS ====================
async function loadApplications() {
  try {
    const response = await fetch(`${API_URL}/applications/user/${currentUser.user_id}`);
    allApplications = await response.json();
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
    ? '<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary);">No applications yet. Browse jobs and apply!</p>'
    : applications.map(app => `
      <div class="data-card">
        <h3>${app.job_title}</h3>
        <p><strong>Company:</strong> ${app.company_name}</p>
        <p><strong>Location:</strong> ${app.location || 'Not specified'}</p>
        <p><strong>Type:</strong> ${app.employment_type}</p>
        <p><strong>Applied:</strong> ${new Date(app.application_date).toLocaleDateString()}</p>
        <span class="status-badge status-${app.status.toLowerCase().replace(/ /g, '-')}">${app.status}</span>
        <div class="card-actions">
          <button class="btn-small btn-delete" onclick="deleteApplication(${app.application_id})"><i class="fas fa-trash"></i> Delete</button>
        </div>
      </div>
    `).join('');
}

function filterApplications() {
  const status = document.getElementById('statusFilter').value;
  const filtered = status ? allApplications.filter(app => app.status === status) : allApplications;
  displayApplications(filtered);
}

function searchApplications() {
  const query = document.getElementById('searchApplications').value.toLowerCase();
  const filtered = allApplications.filter(app => 
    app.job_title.toLowerCase().includes(query) ||
    app.company_name.toLowerCase().includes(query)
  );
  displayApplications(filtered);
}

async function loadJobsForSelect() {
  try {
    const response = await fetch(`${API_URL}/jobs`);
    const jobs = await response.json();
    
    const selectEl = document.getElementById('appJobId');
    selectEl.innerHTML = '<option value="">Select a job</option>' + 
      jobs.map(job => `<option value="${job.job_id}">${job.job_title} - ${job.company_name}</option>`).join('');
  } catch (error) {
    console.error('Error loading jobs for select:', error);
  }
}

document.getElementById('applicationForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const applicationData = {
    user_id: currentUser.user_id,
    job_id: document.getElementById('appJobId').value,
    application_date: document.getElementById('appDate').value,
    status: document.getElementById('appStatus').value,
    resume: document.getElementById('appResume').value,
    cover_letter: document.getElementById('appCoverLetter').value
  };

  try {
    const response = await fetch(`${API_URL}/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(applicationData)
    });

    if (response.ok) {
      alert('Application submitted successfully!');
      closeModal('applicationModal');
      document.getElementById('applicationForm').reset();
      loadApplications();
      calculateStatistics();
    } else {
      const data = await response.json();
      alert(data.error || 'Failed to submit application');
    }
  } catch (error) {
    alert('Connection error. Please try again.');
  }
});

async function deleteApplication(id) {
  if (!confirm('Are you sure you want to delete this application?')) return;
  
  try {
    const response = await fetch(`${API_URL}/applications/${id}`, { method: 'DELETE' });
    if (response.ok) {
      alert('Application deleted successfully!');
      loadApplications();
      calculateStatistics();
    }
  } catch (error) {
    alert('Failed to delete application');
  }
}

function editApplication(id) {
  alert('Edit functionality coming soon!');
}

// ==================== JOBS ====================
async function loadJobs() {
  try {
    const response = await fetch(`${API_URL}/jobs`);
    allJobs = await response.json();
    displayJobs(allJobs);
  } catch (error) {
    console.error('Error loading jobs:', error);
    document.getElementById('jobsList').innerHTML = 
      '<p style="grid-column: 1/-1; text-align: center; color: red;">Error loading jobs</p>';
  }
}

function displayJobs(jobs) {
  const listEl = document.getElementById('jobsList');
  listEl.innerHTML = jobs.length === 0 
    ? '<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary);">No jobs available at the moment.</p>'
    : jobs.map(job => `
      <div class="data-card">
        <h3>${job.job_title}</h3>
        <p><strong>Company:</strong> ${job.company_name}</p>
        <p><strong>Location:</strong> ${job.location || 'Not specified'}</p>
        <p><strong>Type:</strong> ${job.employment_type}</p>
        <p><strong>Salary:</strong> ${job.salary_range || 'Not disclosed'}</p>
        ${job.application_deadline ? `<p><strong>Deadline:</strong> ${new Date(job.application_deadline).toLocaleDateString()}</p>` : ''}
        ${job.job_url ? `<p><a href="${job.job_url}" target="_blank" style="color: var(--primary-color);">View Posting <i class="fas fa-external-link-alt"></i></a></p>` : ''}
        <div class="card-actions">
          <button class="btn-small btn-apply" onclick="applyToJob(${job.job_id}, '${job.job_title}')">
            <i class="fas fa-paper-plane"></i> Apply Now
          </button>
        </div>
      </div>
    `).join('');
}

// Apply to Job Function
async function applyToJob(jobId, jobTitle) {
  // Check if already applied
  const alreadyApplied = allApplications.some(app => app.job_id === jobId);
  if (alreadyApplied) {
    alert('You have already applied to this job!');
    return;
  }

  if (!confirm(`Do you want to apply for "${jobTitle}"?`)) return;

  const applicationData = {
    user_id: currentUser.user_id,
    job_id: jobId,
    application_date: new Date().toISOString().split('T')[0],
    status: 'Applied'
  };

  try {
    const response = await fetch(`${API_URL}/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(applicationData)
    });

    if (response.ok) {
      alert('Application submitted successfully! Check "My Applications" to view it.');
      loadApplications();
      calculateStatistics();
    } else {
      const data = await response.json();
      alert(data.error || 'Failed to submit application');
    }
  } catch (error) {
    alert('Connection error. Please try again.');
  }
}

function filterJobs() {
  const type = document.getElementById('employmentTypeFilter').value;
  const filtered = type ? allJobs.filter(job => job.employment_type === type) : allJobs;
  displayJobs(filtered);
}

function searchJobs() {
  const query = document.getElementById('searchJobs').value.toLowerCase();
  const filtered = allJobs.filter(job => 
    job.job_title.toLowerCase().includes(query) ||
    job.company_name.toLowerCase().includes(query) ||
    (job.location && job.location.toLowerCase().includes(query))
  );
  displayJobs(filtered);
}

// REMOVED: Job creation/deletion for job seekers - they can only view and apply

// ==================== COMPANIES ====================
async function loadCompanies() {
  try {
    const response = await fetch(`${API_URL}/companies`);
    allCompanies = await response.json();
    displayCompanies(allCompanies);
  } catch (error) {
    console.error('Error loading companies:', error);
    document.getElementById('companiesList').innerHTML = 
      '<p style="grid-column: 1/-1; text-align: center; color: red;">Error loading companies</p>';
  }
}

function displayCompanies(companies) {
  const listEl = document.getElementById('companiesList');
  listEl.innerHTML = companies.length === 0 
    ? '<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary);">No companies registered yet.</p>'
    : companies.map(company => `
      <div class="data-card">
        <h3>${company.company_name}</h3>
        <p><strong>Industry:</strong> ${company.industry || 'Not specified'}</p>
        <p><strong>Location:</strong> ${company.location || 'Not specified'}</p>
        <p><strong>Employees:</strong> ${company.no_of_employees || 'Not specified'}</p>
        ${company.website ? `<p><a href="${company.website}" target="_blank" style="color: var(--primary-color);">Visit Website <i class="fas fa-external-link-alt"></i></a></p>` : ''}
        ${company.description ? `<p style="margin-top: 10px; font-size: 13px;">${company.description.substring(0, 100)}${company.description.length > 100 ? '...' : ''}</p>` : ''}
      </div>
    `).join('');
  // REMOVED: Delete button - job seekers can only view companies
}

function searchCompanies() {
  const query = document.getElementById('searchCompanies').value.toLowerCase();
  const filtered = allCompanies.filter(company => 
    company.company_name.toLowerCase().includes(query) ||
    (company.industry && company.industry.toLowerCase().includes(query))
  );
  displayCompanies(filtered);
}

// REMOVED: Company creation/deletion for job seekers

// ==================== CONTACTS ====================
async function loadContacts() {
  try {
    const response = await fetch(`${API_URL}/contacts`);
    allContacts = await response.json();
    displayContacts(allContacts);
  } catch (error) {
    console.error('Error loading contacts:', error);
    document.getElementById('contactsList').innerHTML = 
      '<p style="grid-column: 1/-1; text-align: center; color: red;">Error loading contacts</p>';
  }
}

function displayContacts(contacts) {
  const listEl = document.getElementById('contactsList');
  listEl.innerHTML = contacts.length === 0 
    ? '<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary);">No contacts available yet.</p>'
    : contacts.map(contact => `
      <div class="data-card">
        <h3>${contact.contact_name}</h3>
        <p><strong>Company:</strong> ${contact.company_name}</p>
        <p><strong>Title:</strong> ${contact.job_title || 'Not specified'}</p>
        ${contact.email ? `<p><strong>Email:</strong> <a href="mailto:${contact.email}" style="color: var(--primary-color);">${contact.email}</a></p>` : ''}
        ${contact.phone ? `<p><strong>Phone:</strong> <a href="tel:${contact.phone}" style="color: var(--primary-color);">${contact.phone}</a></p>` : ''}
      </div>
    `).join('');
  // REMOVED: Delete button - job seekers can only view contacts
}

function searchContacts() {
  const query = document.getElementById('searchContacts').value.toLowerCase();
  const filtered = allContacts.filter(contact => 
    contact.contact_name.toLowerCase().includes(query) ||
    contact.company_name.toLowerCase().includes(query) ||
    (contact.job_title && contact.job_title.toLowerCase().includes(query))
  );
  displayContacts(filtered);
}

// REMOVED: Contact creation/deletion for job seekers

// ==================== PROFILE ====================
async function loadProfile() {
  document.getElementById('profileFullName').value = currentUser.full_name;
  document.getElementById('profileEmail').value = currentUser.email;
  document.getElementById('profilePhone').value = currentUser.phone || '';
  document.getElementById('profileLocation').value = currentUser.location || '';
  document.getElementById('profileSex').value = currentUser.sex || '';
}

document.getElementById('profileForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const profileData = {
    full_name: document.getElementById('profileFullName').value,
    phone: document.getElementById('profilePhone').value,
    location: document.getElementById('profileLocation').value,
    sex: document.getElementById('profileSex').value
  };

  try {
    const response = await fetch(`${API_URL}/users/${currentUser.user_id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileData)
    });

    if (response.ok) {
      alert('Profile updated successfully!');
      currentUser = { ...currentUser, ...profileData };
      localStorage.setItem('user', JSON.stringify(currentUser));
      initializeDashboard();
    } else {
      const data = await response.json();
      alert(data.error || 'Failed to update profile');
    }
  } catch (error) {
    alert('Connection error. Please try again.');
  }
});

// ==================== STATISTICS ====================
async function calculateStatistics() {
  try {
    const response = await fetch(`${API_URL}/applications/user/${currentUser.user_id}`);
    const applications = await response.json();
    
    document.getElementById('totalApplications').textContent = applications.length;
    document.getElementById('pendingApplications').textContent = 
      applications.filter(app => app.status === 'In Review').length;
    document.getElementById('interviewScheduled').textContent = 
      applications.filter(app => app.status === 'Interview Scheduled').length;
    document.getElementById('acceptedOffers').textContent = 
      applications.filter(app => app.status === 'Accepted').length;
  } catch (error) {
    console.error('Error calculating statistics:', error);
  }
}

async function loadStatistics() {
  try {
    const response = await fetch(`${API_URL}/applications/user/${currentUser.user_id}`);
    const applications = await response.json();
    
    document.getElementById('statsTotal').textContent = applications.length;
    
    const thisMonth = new Date();
    const thisMonthApps = applications.filter(app => {
      const appDate = new Date(app.application_date);
      return appDate.getMonth() === thisMonth.getMonth() && 
             appDate.getFullYear() === thisMonth.getFullYear();
    });
    document.getElementById('statsThisMonth').textContent = thisMonthApps.length;
    
    const accepted = applications.filter(app => app.status === 'Accepted').length;
    const successRate = applications.length > 0 ? ((accepted / applications.length) * 100).toFixed(1) : 0;
    document.getElementById('statsSuccessRate').textContent = successRate + '%';
    
    document.getElementById('statsAvgTime').textContent = '5 days';
    
  } catch (error) {
    console.error('Error loading statistics:', error);
  }
}
