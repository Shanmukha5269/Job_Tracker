const API_URL = 'http://localhost:3000/api';
let currentUser = null;
let currentCompany = null;
let allApplications = [];
let allJobs = [];
let allContacts = [];

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
  loadContacts();
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
  else if (sectionName === 'contacts') loadContacts();
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

function showAddContactModal() {
  document.getElementById('contactModal').classList.add('active');
}

// ==================== JOBS ====================
async function loadJobs() {
  try {
    const response = await fetch(`${API_URL}/jobs/company/${currentCompany.company_id}`);
    allJobs = await response.json();
    
    document.getElementById('totalJobs').textContent = allJobs.length;
    displayJobs(allJobs);
  } catch (error) {
    console.error('Error loading jobs:', error);
  }
}

function displayJobs(jobs) {
  const listEl = document.getElementById('jobsList');
  
  if (jobs.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-briefcase"></i>
        <h3>No jobs posted yet</h3>
        <p>Create your first job posting to start attracting candidates</p>
        <button class="btn-apply-modern" onclick="showAddJobModal()">
          <i class="fas fa-plus"></i>
          Post Your First Job
        </button>
      </div>
    `;
    return;
  }

  listEl.innerHTML = jobs.map(job => `
    <div class="employer-job-card">
      <div class="employer-job-header">
        <div class="employer-job-title">
          <h3>${job.job_title}</h3>
          <div class="employer-job-meta">
            <div class="meta-item">
              <i class="fas fa-map-marker-alt"></i>
              <span>${job.location || 'Remote'}</span>
            </div>
            <div class="meta-item">
              <i class="fas fa-briefcase"></i>
              <span>${job.employment_type}</span>
            </div>
            ${job.salary_range ? `
              <div class="meta-item">
                <i class="fas fa-dollar-sign"></i>
                <span>${job.salary_range}</span>
              </div>
            ` : ''}
          </div>
        </div>
        <span class="job-status-badge ${job.is_active ? 'active' : 'inactive'}">
          ${job.is_active ? 'Active' : 'Inactive'}
        </span>
      </div>

      <div class="employer-job-stats">
        <div class="job-stat">
          <span class="job-stat-number" id="appCount-${job.job_id}">0</span>
          <span class="job-stat-label">Applications</span>
        </div>
        <div class="job-stat">
          <span class="job-stat-number">${formatDate(job.posted_date || job.created_at)}</span>
          <span class="job-stat-label">Posted</span>
        </div>
      </div>

      <div class="employer-job-footer">
        <button class="btn-view-applications" onclick="viewJobApplications(${job.job_id}, '${job.job_title.replace(/'/g, "\\'")}')">
          <i class="fas fa-users"></i>
          View Applications
        </button>
        <button class="btn-delete-job" onclick="deleteJob(${job.job_id})">
          <i class="fas fa-trash"></i>
          Delete
        </button>
      </div>
    </div>
  `).join('');

  jobs.forEach(job => {
    loadJobApplicationCount(job.job_id);
  });
}

async function loadJobApplicationCount(jobId) {
  try {
    const jobApps = allApplications.filter(app => app.job_id === jobId);
    const countEl = document.getElementById(`appCount-${jobId}`);
    if (countEl) {
      countEl.textContent = jobApps.length;
    }
  } catch (error) {
    console.error('Error loading application count:', error);
  }
}

function viewJobApplications(jobId, jobTitle) {
  showSection('applications');
  const jobApps = allApplications.filter(app => app.job_id === jobId);
  displayApplications(jobApps);
  document.querySelector('#applicationsSection .section-header h1').textContent = `Applications for ${jobTitle}`;
}

function filterJobs() {
  const status = document.getElementById('jobStatusFilter').value;
  let filtered = allJobs;
  
  if (status === 'active') {
    filtered = allJobs.filter(job => job.is_active);
  } else if (status === 'inactive') {
    filtered = allJobs.filter(job => !job.is_active);
  }
  
  displayJobs(filtered);
}

function searchJobs() {
  const query = document.getElementById('searchJobs').value.toLowerCase();
  const filtered = allJobs.filter(job => 
    job.job_title.toLowerCase().includes(query) ||
    (job.location && job.location.toLowerCase().includes(query)) ||
    job.employment_type.toLowerCase().includes(query)
  );
  displayJobs(filtered);
}

// ==================== APPLICATIONS ====================
async function loadApplications() {
  try {
    const response = await fetch(`${API_URL}/applications/company/${currentCompany.company_id}`);
    allApplications = await response.json();
    
    document.getElementById('totalApplications').textContent = allApplications.length;
    displayApplications(allApplications);
  } catch (error) {
    console.error('Error loading applications:', error);
    document.getElementById('applicationsList').innerHTML = 
      '<p style="text-align: center; color: red;">Error loading applications</p>';
  }
}

function displayApplications(applications) {
  const listEl = document.getElementById('applicationsList');
  
  if (applications.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-inbox"></i>
        <h3>No applications received yet</h3>
        <p>Applications will appear here when candidates apply to your posted jobs</p>
        <button class="btn-apply-modern" onclick="showSection('jobs')">
          <i class="fas fa-briefcase"></i>
          View My Jobs
        </button>
      </div>
    `;
    return;
  }

  listEl.innerHTML = applications.map(app => {
    const applicantInitials = app.full_name.split(' ').map(n => n[0]).join('').toUpperCase();
    
    return `
      <div class="application-card">
        <div class="application-header">
          <div class="application-title" style="display: flex; align-items: center; gap: 16px;">
            <div class="applicant-avatar" style="width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(135deg, #667eea, #764ba2); color: white; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 700;">
              ${applicantInitials}
            </div>
            <div>
              <h3>${app.full_name}</h3>
              <div class="application-company">
                <i class="fas fa-briefcase"></i>
                Applied for: ${app.job_title}
              </div>
            </div>
          </div>
          <span class="application-status ${app.status.toLowerCase().replace(/ /g, '-')}">${app.status}</span>
        </div>

        <div class="application-details">
          <div class="detail-item">
            <i class="fas fa-envelope"></i>
            <a href="mailto:${app.email}" style="color: #1a73e8; text-decoration: none;">${app.email}</a>
          </div>
          ${app.phone ? `
            <div class="detail-item">
              <i class="fas fa-phone"></i>
              <a href="tel:${app.phone}" style="color: #1a73e8; text-decoration: none;">${app.phone}</a>
            </div>
          ` : ''}
          ${app.location ? `
            <div class="detail-item">
              <i class="fas fa-map-marker-alt"></i>
              <span>${app.location}</span>
            </div>
          ` : ''}
          <div class="detail-item">
            <i class="fas fa-calendar"></i>
            <strong>Applied:</strong> ${new Date(app.application_date).toLocaleDateString()}
          </div>
        </div>

        ${app.cover_letter ? `
          <div class="detail-item" style="margin-top: 12px; padding: 12px; background: #f8f9fa; border-radius: 8px;">
            <div style="display: block; width: 100%;">
              <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px;">
                <i class="fas fa-file-alt"></i>
                <strong style="font-size: 13px; color: #202124;">Cover Letter</strong>
              </div>
              <p style="font-size: 13px; color: #5f6368; line-height: 1.6; margin: 0;">${app.cover_letter}</p>
            </div>
          </div>
        ` : ''}

        <div class="application-footer">
          <button class="btn-save-job" onclick="updateApplicationStatus(${app.application_id}, '${app.status}')">
            <i class="fas fa-edit"></i>
            Update Status
          </button>
          ${app.resume ? `
            <a href="${app.resume}" target="_blank" class="btn-apply-modern" style="text-decoration: none;">
              <i class="fas fa-file-pdf"></i>
              View Resume
            </a>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');
}

async function updateApplicationStatus(applicationId, currentStatus) {
  const statuses = ['Applied', 'In Review', 'Interview Scheduled', 'Rejected', 'Accepted'];
  const currentIndex = statuses.indexOf(currentStatus);
  
  const statusOptions = statuses.map((status, index) => 
    `${index + 1}. ${status} ${index === currentIndex ? '(Current)' : ''}`
  ).join('\n');
  
  const newStatusIndex = prompt(
    `Update Application Status\n\n${statusOptions}\n\nEnter number (1-5):`,
    currentIndex + 1
  );

  if (!newStatusIndex || newStatusIndex < 1 || newStatusIndex > 5) return;

  const statusToUpdate = statuses[parseInt(newStatusIndex) - 1];

  try {
    const response = await fetch(`${API_URL}/applications/${applicationId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: statusToUpdate })
    });

    if (response.ok) {
      alert(`✓ Status updated to: ${statusToUpdate}`);
      loadApplications();
    } else {
      alert('Failed to update status. Please try again.');
    }
  } catch (error) {
    console.error('Error updating status:', error);
    alert('Connection error. Please try again.');
  }
}

function filterApplications() {
  const status = document.getElementById('statusFilter').value;
  const filtered = status ? allApplications.filter(app => app.status === status) : allApplications;
  displayApplications(filtered);
}

function searchApplications() {
  const query = document.getElementById('searchApplications').value.toLowerCase();
  const filtered = allApplications.filter(app => 
    app.full_name.toLowerCase().includes(query) ||
    app.email.toLowerCase().includes(query) ||
    app.job_title.toLowerCase().includes(query)
  );
  displayApplications(filtered);
}

// ==================== COMPANY PROFILE ====================
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

function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString();
}

// ==================== CONTACTS MANAGEMENT ====================
async function loadContacts() {
  try {
    const response = await fetch(`${API_URL}/contacts/company/${currentCompany.company_id}`);
    allContacts = await response.json();
    displayContacts(allContacts);
  } catch (error) {
    console.error('Error loading contacts:', error);
    document.getElementById('contactsList').innerHTML = 
      '<p style="text-align: center; color: red;">Error loading contacts</p>';
  }
}

function displayContacts(contacts) {
  const listEl = document.getElementById('contactsList');
  
  if (contacts.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-address-book"></i>
        <h3>No contacts added yet</h3>
        <p>Add HR personnel and recruiters that job seekers can reach out to</p>
        <button class="btn-apply-modern" onclick="showAddContactModal()">
          <i class="fas fa-plus"></i>
          Add First Contact
        </button>
      </div>
    `;
    return;
  }

  listEl.innerHTML = contacts.map(contact => {
    const contactInitials = contact.contact_name.split(' ').map(n => n[0]).join('').toUpperCase();
    
    return `
      <div class="company-card">
        <div class="company-card-banner tech"></div>
        <div class="company-logo-wrapper">
          <div class="company-logo">${contactInitials}</div>
        </div>
        <div class="company-card-body">
          <div class="company-card-header">
            <h3 class="company-card-name">${contact.contact_name}</h3>
            <span class="company-card-industry">${contact.job_title}</span>
          </div>

          <div class="company-card-meta">
            <div class="company-meta-item">
              <i class="fas fa-envelope"></i>
              <a href="mailto:${contact.email}" style="color: #1a73e8; text-decoration: none;">${contact.email}</a>
            </div>
            ${contact.phone ? `
              <div class="company-meta-item">
                <i class="fas fa-phone"></i>
                <a href="tel:${contact.phone}" style="color: #1a73e8; text-decoration: none;">${contact.phone}</a>
              </div>
            ` : ''}
          </div>

          <div class="company-card-stats">
            <div class="company-stat">
              <span class="company-stat-number">${currentCompany.company_name}</span>
              <span class="company-stat-label">Company</span>
            </div>
          </div>

          <div class="company-card-footer">
            <button class="btn-view-company" onclick="editContact(${contact.contact_id})">
              <i class="fas fa-edit"></i>
              Edit
            </button>
            <button class="btn-company-website" onclick="deleteContact(${contact.contact_id})" style="background: #c5221f;">
              <i class="fas fa-trash"></i>
              Delete
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function searchContacts() {
  const query = document.getElementById('searchContacts').value.toLowerCase();
  const filtered = allContacts.filter(contact => 
    contact.contact_name.toLowerCase().includes(query) ||
    contact.job_title.toLowerCase().includes(query) ||
    contact.email.toLowerCase().includes(query)
  );
  displayContacts(filtered);
}

// Add Contact
document.getElementById('contactForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const contactData = {
    company_id: currentCompany.company_id,
    contact_name: document.getElementById('contactName').value,
    job_title: document.getElementById('contactJobTitle').value,
    email: document.getElementById('contactEmail').value,
    phone: document.getElementById('contactPhone').value
  };

  try {
    const response = await fetch(`${API_URL}/contacts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contactData)
    });

    if (response.ok) {
      alert('Contact added successfully!');
      closeModal('contactModal');
      document.getElementById('contactForm').reset();
      loadContacts();
    } else {
      const data = await response.json();
      alert(data.error || 'Failed to add contact');
    }
  } catch (error) {
    console.error('Error adding contact:', error);
    alert('Connection error. Please try again.');
  }
});

async function deleteContact(id) {
  if (!confirm('Are you sure you want to delete this contact?')) return;
  
  try {
    const response = await fetch(`${API_URL}/contacts/${id}`, { method: 'DELETE' });
    if (response.ok) {
      alert('Contact deleted successfully!');
      loadContacts();
    } else {
      alert('Failed to delete contact');
    }
  } catch (error) {
    console.error('Error deleting contact:', error);
    alert('Failed to delete contact');
  }
}

function editContact(id) {
  alert('Edit contact functionality coming soon!');
  // You can implement edit functionality similar to add
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
