const API_URL = 'http://localhost:3000/api';
let currentUser = null;

// Check authentication on page load
window.addEventListener('DOMContentLoaded', () => {
  const userData = localStorage.getItem('user');
  if (!userData) {
    window.location.href = 'index.html';
    return;
  }
  
  currentUser = JSON.parse(userData);
  loadDashboardData();
});

function logout() {
  localStorage.removeItem('user');
  window.location.href = 'index.html';
}

function showSection(sectionName) {
  document.querySelectorAll('.section').forEach(section => {
    section.classList.remove('active');
  });
  document.getElementById(`${sectionName}Section`).classList.add('active');
  
  if (sectionName === 'applications') loadApplications();
  else if (sectionName === 'jobs') loadJobs();
  else if (sectionName === 'companies') loadCompanies();
  else if (sectionName === 'contacts') loadContacts();
  else if (sectionName === 'profile') loadProfile();
}

async function loadDashboardData() {
  showSection('applications');
}

// Applications Functions
async function loadApplications() {
  try {
    const response = await fetch(`${API_URL}/applications/user/${currentUser.user_id}`);
    const applications = await response.json();
    
    const listEl = document.getElementById('applicationsList');
    listEl.innerHTML = applications.length === 0 
      ? '<p>No applications yet. Add your first application!</p>'
      : applications.map(app => `
        <div class="data-card">
          <h3>${app.job_title}</h3>
          <p><strong>Company:</strong> ${app.company_name}</p>
          <p><strong>Location:</strong> ${app.location}</p>
          <p><strong>Employment Type:</strong> ${app.employment_type}</p>
          <p><strong>Application Date:</strong> ${new Date(app.application_date).toLocaleDateString()}</p>
          <span class="status-badge status-${app.status.toLowerCase().replace(/ /g, '-')}">${app.status}</span>
          <div class="card-actions">
            <button class="btn-small btn-edit" onclick="editApplication(${app.application_id})">Edit</button>
            <button class="btn-small btn-delete" onclick="deleteApplication(${app.application_id})">Delete</button>
          </div>
        </div>
      `).join('');
  } catch (error) {
    console.error('Error loading applications:', error);
  }
}

function showAddApplicationForm() {
  document.getElementById('addApplicationForm').style.display = 'block';
  loadJobsForSelect();
}

function hideAddApplicationForm() {
  document.getElementById('addApplicationForm').style.display = 'none';
  document.getElementById('applicationForm').reset();
}

async function loadJobsForSelect() {
  try {
    const response = await fetch(`${API_URL}/jobs`);
    const jobs = await response.json();
    
    const selectEl = document.getElementById('appJobId');
    selectEl.innerHTML = '<option value="">Select a job</option>' + 
      jobs.map(job => `<option value="${job.job_id}">${job.job_title} - ${job.company_name}</option>`).join('');
  } catch (error) {
    console.error('Error loading jobs:', error);
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
      alert('Application added successfully!');
      hideAddApplicationForm();
      loadApplications();
    } else {
      const data = await response.json();
      alert(data.error || 'Failed to add application');
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
    }
  } catch (error) {
    alert('Failed to delete application');
  }
}

// Jobs Functions
async function loadJobs() {
  try {
    const response = await fetch(`${API_URL}/jobs`);
    const jobs = await response.json();
    
    const listEl = document.getElementById('jobsList');
    listEl.innerHTML = jobs.length === 0 
      ? '<p>No jobs available. Add a new job!</p>'
      : jobs.map(job => `
        <div class="data-card">
          <h3>${job.job_title}</h3>
          <p><strong>Company:</strong> ${job.company_name}</p>
          <p><strong>Location:</strong> ${job.location || 'Not specified'}</p>
          <p><strong>Type:</strong> ${job.employment_type}</p>
          <p><strong>Salary:</strong> ${job.salary_range || 'Not disclosed'}</p>
          ${job.application_deadline ? `<p><strong>Deadline:</strong> ${new Date(job.application_deadline).toLocaleDateString()}</p>` : ''}
          ${job.job_url ? `<p><a href="${job.job_url}" target="_blank">View Job Posting</a></p>` : ''}
          <div class="card-actions">
            <button class="btn-small btn-delete" onclick="deleteJob(${job.job_id})">Delete</button>
          </div>
        </div>
      `).join('');
  } catch (error) {
    console.error('Error loading jobs:', error);
  }
}

function showAddJobForm() {
  document.getElementById('addJobForm').style.display = 'block';
  loadCompaniesForSelect('jobCompanyId');
}

function hideAddJobForm() {
  document.getElementById('addJobForm').style.display = 'none';
  document.getElementById('jobForm').reset();
}

document.getElementById('jobForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const jobData = {
    company_id: document.getElementById('jobCompanyId').value,
    job_title: document.getElementById('jobTitle').value,
    job_description: document.getElementById('jobDescription').value,
    location: document.getElementById('jobLocation').value,
    employment_type: document.getElementById('jobEmploymentType').value,
    salary_range: document.getElementById('jobSalary').value,
    posted_date: document.getElementById('jobPostedDate').value,
    application_deadline: document.getElementById('jobDeadline').value,
    job_url: document.getElementById('jobUrl').value
  };

  try {
    const response = await fetch(`${API_URL}/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(jobData)
    });

    if (response.ok) {
      alert('Job added successfully!');
      hideAddJobForm();
      loadJobs();
    } else {
      const data = await response.json();
      alert(data.error || 'Failed to add job');
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

// Companies Functions
async function loadCompanies() {
  try {
    const response = await fetch(`${API_URL}/companies`);
    const companies = await response.json();
    
    const listEl = document.getElementById('companiesList');
    listEl.innerHTML = companies.length === 0 
      ? '<p>No companies yet. Add a new company!</p>'
      : companies.map(company => `
        <div class="data-card">
          <h3>${company.company_name}</h3>
          <p><strong>Industry:</strong> ${company.industry || 'Not specified'}</p>
          <p><strong>Location:</strong> ${company.location || 'Not specified'}</p>
          <p><strong>Employees:</strong> ${company.no_of_employees || 'Not specified'}</p>
          ${company.website ? `<p><a href="${company.website}" target="_blank">${company.website}</a></p>` : ''}
          ${company.description ? `<p>${company.description}</p>` : ''}
          <div class="card-actions">
            <button class="btn-small btn-delete" onclick="deleteCompany(${company.company_id})">Delete</button>
          </div>
        </div>
      `).join('');
  } catch (error) {
    console.error('Error loading companies:', error);
  }
}

function showAddCompanyForm() {
  document.getElementById('addCompanyForm').style.display = 'block';
}

function hideAddCompanyForm() {
  document.getElementById('addCompanyForm').style.display = 'none';
  document.getElementById('companyForm').reset();
}

async function loadCompaniesForSelect(selectId) {
  try {
    const response = await fetch(`${API_URL}/companies`);
    const companies = await response.json();
    
    const selectEl = document.getElementById(selectId);
    selectEl.innerHTML = '<option value="">Select a company</option>' + 
      companies.map(company => `<option value="${company.company_id}">${company.company_name}</option>`).join('');
  } catch (error) {
    console.error('Error loading companies:', error);
  }
}

document.getElementById('companyForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const companyData = {
    company_name: document.getElementById('companyName').value,
    industry: document.getElementById('companyIndustry').value,
    location: document.getElementById('companyLocation').value,
    website: document.getElementById('companyWebsite').value,
    description: document.getElementById('companyDescription').value,
    no_of_employees: document.getElementById('companyEmployees').value
  };

  try {
    const response = await fetch(`${API_URL}/companies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(companyData)
    });

    if (response.ok) {
      alert('Company added successfully!');
      hideAddCompanyForm();
      loadCompanies();
    } else {
      const data = await response.json();
      alert(data.error || 'Failed to add company');
    }
  } catch (error) {
    alert('Connection error. Please try again.');
  }
});

async function deleteCompany(id) {
  if (!confirm('Are you sure you want to delete this company? This will also delete associated jobs.')) return;
  
  try {
    const response = await fetch(`${API_URL}/companies/${id}`, { method: 'DELETE' });
    if (response.ok) {
      alert('Company deleted successfully!');
      loadCompanies();
    }
  } catch (error) {
    alert('Failed to delete company');
  }
}

// Contacts Functions
async function loadContacts() {
  try {
    const response = await fetch(`${API_URL}/contacts`);
    const contacts = await response.json();
    
    const listEl = document.getElementById('contactsList');
    listEl.innerHTML = contacts.length === 0 
      ? '<p>No contacts yet. Add a new contact!</p>'
      : contacts.map(contact => `
        <div class="data-card">
          <h3>${contact.contact_name}</h3>
          <p><strong>Company:</strong> ${contact.company_name}</p>
          <p><strong>Title:</strong> ${contact.job_title || 'Not specified'}</p>
          ${contact.email ? `<p><strong>Email:</strong> ${contact.email}</p>` : ''}
          ${contact.phone ? `<p><strong>Phone:</strong> ${contact.phone}</p>` : ''}
          <div class="card-actions">
            <button class="btn-small btn-delete" onclick="deleteContact(${contact.contact_id})">Delete</button>
          </div>
        </div>
      `).join('');
  } catch (error) {
    console.error('Error loading contacts:', error);
  }
}

function showAddContactForm() {
  document.getElementById('addContactForm').style.display = 'block';
  loadCompaniesForSelect('contactCompanyId');
}

function hideAddContactForm() {
  document.getElementById('addContactForm').style.display = 'none';
  document.getElementById('contactForm').reset();
}

document.getElementById('contactForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const contactData = {
    company_id: document.getElementById('contactCompanyId').value,
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
      hideAddContactForm();
      loadContacts();
    } else {
      const data = await response.json();
      alert(data.error || 'Failed to add contact');
    }
  } catch (error) {
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
    }
  } catch (error) {
    alert('Failed to delete contact');
  }
}

// Profile Functions
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
    } else {
      const data = await response.json();
      alert(data.error || 'Failed to update profile');
    }
  } catch (error) {
    alert('Connection error. Please try again.');
  }
});
