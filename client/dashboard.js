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

// ==================== PROFILE ====================
async function loadProfile() {
    try {
        const response = await fetch(`${API_URL}/users/${currentUser.user_id}`);
        const userData = await response.json();

        document.getElementById('profileFullName').value = userData.full_name || '';
        document.getElementById('profileEmail').value = userData.email || '';
        document.getElementById('profilePhone').value = userData.phone || '';
        document.getElementById('profileLocation').value = userData.location || '';
        document.getElementById('profileSex').value = userData.sex || '';

        // Load profile sections
        loadEducation();
        loadSkills();
        loadCertifications();
        loadLanguages();

        // Load profile statistics
        const statsResponse = await fetch(`${API_URL}/applications/user/${currentUser.user_id}`);
        const applications = await statsResponse.json();
        
        document.getElementById('profileTotalApps').textContent = applications.length;
        document.getElementById('profileInReview').textContent = applications.filter(a => a.status === 'In Review').length;
        document.getElementById('profileInterviews').textContent = applications.filter(a => a.status === 'Interview').length;
        document.getElementById('profileOffers').textContent = applications.filter(a => a.status === 'Offer').length;
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

async function updateProfile(event) {
    event.preventDefault();
    
    const data = {
        full_name: document.getElementById('profileFullName').value,
        email: document.getElementById('profileEmail').value,
        phone: document.getElementById('profilePhone').value,
        location: document.getElementById('profileLocation').value,
        sex: document.getElementById('profileSex').value
    };

    try {
        const response = await fetch(`${API_URL}/users/${currentUser.user_id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            alert('Profile updated successfully!');
            currentUser.full_name = data.full_name;
            localStorage.setItem('user', JSON.stringify(currentUser));
            document.getElementById('userName').textContent = data.full_name;
            document.getElementById('sidebarUserName').textContent = data.full_name;
        } else {
            alert('Failed to update profile');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        alert('Error updating profile');
    }
}

// ==================== PROFILE: EDUCATION, SKILLS, CERTIFICATIONS, LANGUAGES ====================

// Education Functions
function showEducationModal() {
    document.getElementById('educationModal').classList.add('active');
    document.getElementById('educationForm').reset();
    document.getElementById('education-id').value = '';
}

async function loadEducation() {
    try {
        const response = await fetch(`${API_URL}/profile/education?user_id=${currentUser.user_id}`);
        const education = await response.json();
        displayEducation(education);
    } catch (error) {
        console.error('Error loading education:', error);
    }
}

function displayEducation(educationList) {
    const container = document.getElementById('educationList');
    if (!container) return;
    
    if (educationList.length === 0) {
        container.innerHTML = '<p style="color: #6b7280;">No education added yet.</p>';
        return;
    }
    
    container.innerHTML = '';
    educationList.forEach(edu => {
        const endDate = edu.currently_studying ? 'Present' : (edu.end_date ? new Date(edu.end_date).toLocaleDateString() : 'N/A');
        const startDate = new Date(edu.start_date).toLocaleDateString();
        
        const card = document.createElement('div');
        card.className = 'data-card';
        card.innerHTML = `
            <div class="card-actions" style="float: right;">
                <button class="btn-small btn-delete" onclick="deleteEducation(${edu.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <h3>${edu.degree}${edu.field_of_study ? ' in ' + edu.field_of_study : ''}</h3>
            <p><strong>${edu.school_name}</strong>${edu.school_location ? ' - ' + edu.school_location : ''}</p>
            <p style="color: #6b7280; font-size: 13px;">${startDate} - ${endDate}</p>
            ${edu.gpa ? `<p>GPA: ${edu.gpa}/10</p>` : ''}
            ${edu.honors_awards ? `<p style="font-style: italic;">${edu.honors_awards}</p>` : ''}
        `;
        container.appendChild(card);
    });
}

async function saveEducation(event) {
    event.preventDefault();
    
    const data = {
        user_id: currentUser.user_id, 
        school_name: document.getElementById('school-name').value,
        school_location: document.getElementById('school-location').value,
        degree: document.getElementById('degree').value,
        field_of_study: document.getElementById('field-of-study').value,
        start_date: document.getElementById('edu-start-date').value,
        end_date: document.getElementById('edu-end-date').value,
        currently_studying: document.getElementById('currently-studying').checked,
        gpa: document.getElementById('gpa').value,
        honors_awards: document.getElementById('honors-awards').value
    };
    
    console.log('Sending education data:', data); // Debug log
    
    try {
        const response = await fetch(`${API_URL}/profile/education`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            closeModal('educationModal');
            loadEducation();
            alert('Education added successfully!');
        } else {
            console.error('Server error:', result);
            alert(result.error || 'Failed to add education');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error saving education');
    }
}

async function deleteEducation(id) {
    if (!confirm('Are you sure you want to delete this education entry?')) return;
    
    try {
        const response = await fetch(`${API_URL}/profile/education/${id}?user_id=${currentUser.user_id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            loadEducation();
            alert('Education deleted successfully!');
        }
    } catch (error) {
        console.error('Error deleting education:', error);
    }
}

// Skills Functions
function showSkillsModal() {
    document.getElementById('skillsModal').classList.add('active');
    document.getElementById('skillsForm').reset();
}

async function loadSkills() {
    try {
        const response = await fetch(`${API_URL}/profile/skills?user_id=${currentUser.user_id}`);
        const skills = await response.json();
        displaySkills(skills);
    } catch (error) {
        console.error('Error loading skills:', error);
    }
}

function displaySkills(skillsList) {
    const container = document.getElementById('skillsList');
    if (!container) return;
    
    if (skillsList.length === 0) {
        container.innerHTML = '<p style="color: #6b7280;">No skills added yet.</p>';
        return;
    }
    
    container.innerHTML = '';
    skillsList.forEach(skill => {
        const badge = document.createElement('span');
        badge.className = 'skill-badge';
        badge.innerHTML = `
            ${skill.skill_name} - <strong>${skill.proficiency_level}</strong>
            <button onclick="deleteSkill(${skill.id})" style="background: none; border: none; color: #ef4444; margin-left: 8px; cursor: pointer; font-size: 18px;">&times;</button>
        `;
        container.appendChild(badge);
    });
}

async function saveSkill(event) {
    event.preventDefault();
    
    const data = {
        user_id: currentUser.user_id, 
        skill_name: document.getElementById('skill-name').value,
        proficiency_level: document.getElementById('proficiency-level').value
    };
    
    console.log('Sending skill data:', data); // Debug log
    
    try {
        const response = await fetch(`${API_URL}/profile/skills`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            closeModal('skillsModal');
            loadSkills();
            alert('Skill added successfully!');
        } else {
            console.error('Server error:', result);
            alert(result.error || 'Failed to add skill');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error saving skill');
    }
}

async function deleteSkill(id) {
    if (!confirm('Are you sure you want to delete this skill?')) return;
    
    try {
        const response = await fetch(`${API_URL}/profile/skills/${id}?user_id=${currentUser.user_id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            loadSkills();
            alert('Skill deleted successfully!');
        }
    } catch (error) {
        console.error('Error deleting skill:', error);
    }
}

// Certifications Functions
function showCertificationModal() {
    document.getElementById('certificationModal').classList.add('active');
    document.getElementById('certificationForm').reset();
}

async function loadCertifications() {
    try {
        const response = await fetch(`${API_URL}/profile/certifications?user_id=${currentUser.user_id}`);
        const certs = await response.json();
        displayCertifications(certs);
    } catch (error) {
        console.error('Error loading certifications:', error);
    }
}

function displayCertifications(certsList) {
    const container = document.getElementById('certificationsList');
    if (!container) return;
    
    if (certsList.length === 0) {
        container.innerHTML = '<p style="color: #6b7280;">No certifications added yet.</p>';
        return;
    }
    
    container.innerHTML = '';
    certsList.forEach(cert => {
        const issueDate = cert.issue_date ? new Date(cert.issue_date).toLocaleDateString() : 'N/A';
        
        const card = document.createElement('div');
        card.className = 'data-card';
        card.innerHTML = `
            <div class="card-actions" style="float: right;">
                <button class="btn-small btn-delete" onclick="deleteCertification(${cert.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <h3>${cert.certification_name}</h3>
            ${cert.issuing_authority ? `<p><strong>${cert.issuing_authority}</strong></p>` : ''}
            <p style="color: #6b7280; font-size: 13px;">Issued: ${issueDate}</p>
        `;
        container.appendChild(card);
    });
}

async function saveCertification(event) {
    event.preventDefault();
    
    const data = {
        user_id: currentUser.user_id,
        certification_name: document.getElementById('cert-name').value,
        issuing_authority: document.getElementById('issuing-authority').value,
        issue_date: document.getElementById('issue-date').value
    };
    
    console.log('Sending certification data:', data); // Debug log
    
    try {
        const response = await fetch(`${API_URL}/profile/certifications`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            closeModal('certificationModal');
            loadCertifications();
            alert('Certification added successfully!');
        } else {
            console.error('Server error:', result);
            alert(result.error || 'Failed to add certification');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error saving certification');
    }
}

async function deleteCertification(id) {
    if (!confirm('Are you sure you want to delete this certification?')) return;
    
    try {
        const response = await fetch(`${API_URL}/profile/certifications/${id}?user_id=${currentUser.user_id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            loadCertifications();
            alert('Certification deleted successfully!');
        }
    } catch (error) {
        console.error('Error deleting certification:', error);
    }
}

// Languages Functions
function showLanguageModal() {
    document.getElementById('languageModal').classList.add('active');
    document.getElementById('languageForm').reset();
}

async function loadLanguages() {
    try {
        const response = await fetch(`${API_URL}/profile/languages?user_id=${currentUser.user_id}`);
        const languages = await response.json();
        displayLanguages(languages);
    } catch (error) {
        console.error('Error loading languages:', error);
    }
}

function displayLanguages(languagesList) {
    const container = document.getElementById('languagesList');
    if (!container) return;
    
    if (languagesList.length === 0) {
        container.innerHTML = '<p style="color: #6b7280;">No languages added yet.</p>';
        return;
    }
    
    container.innerHTML = '';
    languagesList.forEach(lang => {
        const badge = document.createElement('span');
        badge.className = 'skill-badge';
        badge.innerHTML = `
            ${lang.language_name} - <strong>${lang.proficiency_level}</strong>
            <button onclick="deleteLanguage(${lang.id})" style="background: none; border: none; color: #ef4444; margin-left: 8px; cursor: pointer; font-size: 18px;">&times;</button>
        `;
        container.appendChild(badge);
    });
}

async function saveLanguage(event) {
    event.preventDefault();
    
    const data = {
        user_id: currentUser.user_id, 
        language_name: document.getElementById('language-name').value,
        proficiency_level: document.getElementById('lang-proficiency').value
    };
    
    console.log('Sending language data:', data); // Debug log
    
    try {
        const response = await fetch(`${API_URL}/profile/languages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            closeModal('languageModal');
            loadLanguages();
            alert('Language added successfully!');
        } else {
            console.error('Server error:', result);
            alert(result.error || 'Failed to add language');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error saving language');
    }
}

async function deleteLanguage(id) {
    if (!confirm('Are you sure you want to delete this language?')) return;
    
    try {
        const response = await fetch(`${API_URL}/profile/languages/${id}?user_id=${currentUser.user_id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            loadLanguages();
            alert('Language deleted successfully!');
        }
    } catch (error) {
        console.error('Error deleting language:', error);
    }
}


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
  
  if (applications.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-inbox"></i>
        <h3>No applications yet</h3>
        <p>Browse jobs and start applying to build your application history</p>
        <button class="btn-apply-modern" onclick="showSection('jobs')">
          <i class="fas fa-search"></i>
          Browse Jobs
        </button>
      </div>
    `;
    return;
  }

  listEl.innerHTML = applications.map(app => `
    <div class="application-card">
      <div class="application-header">
        <div class="application-title">
          <h3>${app.job_title}</h3>
          <div class="application-company">
            <i class="fas fa-building"></i>
            ${app.company_name}
          </div>
        </div>
        <span class="application-status ${app.status.toLowerCase().replace(/ /g, '-')}">${app.status}</span>
      </div>

      <div class="application-details">
        <div class="detail-item">
          <i class="fas fa-map-marker-alt"></i>
          <span>${app.location || 'Not specified'}</span>
        </div>
        <div class="detail-item">
          <i class="fas fa-briefcase"></i>
          <span>${app.employment_type}</span>
        </div>
        <div class="detail-item">
          <i class="fas fa-calendar"></i>
          <strong>Applied:</strong> ${new Date(app.application_date).toLocaleDateString()}
        </div>
      </div>

      ${app.cover_letter ? `
        <div class="detail-item" style="margin-top: 12px;">
          <i class="fas fa-file-alt"></i>
          <span style="font-style: italic; color: #5f6368;">${app.cover_letter.substring(0, 100)}${app.cover_letter.length > 100 ? '...' : ''}</span>
        </div>
      ` : ''}

      <div class="application-footer">
        <button class="btn-save-job" onclick="deleteApplication(${app.application_id})">
          <i class="fas fa-trash"></i>
          Withdraw
        </button>
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
  
  if (jobs.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-briefcase"></i>
        <h3>No jobs available</h3>
        <p>Check back later for new opportunities</p>
      </div>
    `;
    return;
  }

  listEl.innerHTML = jobs.map(job => {
    const isApplied = allApplications.some(app => app.job_id === job.job_id);
    const employmentTypeClass = `type-${job.employment_type.toLowerCase().replace(/ /g, '-')}`;
    
    return `
      <div class="job-card" id="job-${job.job_id}">
        <div class="job-card-header">
          <div class="job-card-title">
            <h3 onclick="toggleJobDetails(${job.job_id})">${job.job_title}</h3>
            <div class="job-card-company">
              <div class="company-icon">
                <i class="fas fa-building"></i>
              </div>
              <span class="company-name">${job.company_name}</span>
            </div>
          </div>
        </div>

        <div class="job-card-meta">
          <div class="meta-item">
            <i class="fas fa-map-marker-alt"></i>
            <span>${job.location || 'Location not specified'}</span>
          </div>
          ${job.salary_range ? `
            <div class="meta-item">
              <i class="fas fa-dollar-sign"></i>
              <span>${job.salary_range}</span>
            </div>
          ` : ''}
          ${job.application_deadline ? `
            <div class="meta-item">
              <i class="fas fa-clock"></i>
              <span>Deadline: ${new Date(job.application_deadline).toLocaleDateString()}</span>
            </div>
          ` : ''}
        </div>

        <div class="job-card-tags">
          <span class="job-tag ${employmentTypeClass}">${job.employment_type}</span>
          ${job.job_url ? '<span class="job-tag"><i class="fas fa-external-link-alt"></i> External</span>' : ''}
        </div>

        ${job.job_description ? `
          <div class="job-card-description" id="desc-${job.job_id}">
            ${job.job_description}
          </div>
          <div class="job-qualifications" id="qual-${job.job_id}">
            <h4>Minimum qualifications</h4>
            <ul>
              <li>Bachelor's degree or equivalent practical experience</li>
              <li>Relevant work experience in the field</li>
            </ul>
          </div>
        ` : ''}

        <div class="job-card-footer">
          <div class="job-posted-date">
            <i class="far fa-calendar"></i>
            Posted ${formatDate(job.posted_date || job.created_at)}
          </div>
          <div class="job-actions">
            ${job.job_description ? `
              <button class="btn-learn-more" onclick="toggleJobDetails(${job.job_id})">
                <i class="fas fa-chevron-down" id="chevron-${job.job_id}"></i>
                Learn more
              </button>
            ` : ''}
            ${job.job_url ? `
              <a href="${job.job_url}" target="_blank" class="btn-save-job">
                <i class="fas fa-external-link-alt"></i>
                View Posting
              </a>
            ` : ''}
            <button class="btn-apply-modern" 
                    onclick="applyToJob(${job.job_id}, '${job.job_title.replace(/'/g, "\\'")}')"
                    ${isApplied ? 'disabled' : ''}>
              <i class="fas ${isApplied ? 'fa-check' : 'fa-paper-plane'}"></i>
              ${isApplied ? 'Applied' : 'Apply'}
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Toggle job details expansion
function toggleJobDetails(jobId) {
  const descEl = document.getElementById(`desc-${jobId}`);
  const qualEl = document.getElementById(`qual-${jobId}`);
  const chevron = document.getElementById(`chevron-${jobId}`);
  
  if (descEl) {
    descEl.classList.toggle('expanded');
  }
  if (qualEl) {
    qualEl.classList.toggle('show');
  }
  if (chevron) {
    chevron.classList.toggle('fa-chevron-down');
    chevron.classList.toggle('fa-chevron-up');
  }
}

// Format date helper
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

// ==================== JOBS: FILTER & SEARCH ====================
function filterJobs() {
    const typeFilter = document.getElementById('jobTypeFilter').value;
    const searchTerm = document.getElementById('searchJobs').value.toLowerCase();
    
    let filteredJobs = allJobs;
    
    // Filter by job type
    if (typeFilter && typeFilter !== '') {
        filteredJobs = filteredJobs.filter(job => 
            job.employment_type && job.employment_type.toLowerCase() === typeFilter.toLowerCase()
        );
    }
    
    // Filter by search term
    if (searchTerm) {
        filteredJobs = filteredJobs.filter(job => 
            (job.job_title && job.job_title.toLowerCase().includes(searchTerm)) ||
            (job.company_name && job.company_name.toLowerCase().includes(searchTerm)) ||
            (job.location && job.location.toLowerCase().includes(searchTerm))
        );
    }
    
    displayJobs(filteredJobs);
}

function searchJobs() {
    filterJobs();
}


// ==================== COMPANIES (JOB SEEKER VIEW) ====================
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
  
  if (companies.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-building"></i>
        <h3>No companies registered yet</h3>
        <p>Companies will appear here as they join the platform</p>
      </div>
    `;
    return;
  }

  listEl.innerHTML = companies.map(company => {
    const industryClass = company.industry ? company.industry.toLowerCase() : 'default';
    const companyInitial = company.company_name.substring(0, 1).toUpperCase();
    
    return `
      <div class="company-card">
        <div class="company-card-banner ${industryClass}"></div>
        <div class="company-logo-wrapper">
          <div class="company-logo">${companyInitial}</div>
        </div>
        <div class="company-card-body">
          <div class="company-card-header">
            <h3 class="company-card-name">${company.company_name}</h3>
            ${company.industry ? `<span class="company-card-industry">${company.industry}</span>` : ''}
          </div>

          <div class="company-card-meta">
            ${company.location ? `
              <div class="company-meta-item">
                <i class="fas fa-map-marker-alt"></i>
                <span>${company.location}</span>
              </div>
            ` : ''}
            ${company.no_of_employees ? `
              <div class="company-meta-item">
                <i class="fas fa-users"></i>
                <span>${company.no_of_employees} employees</span>
              </div>
            ` : ''}
          </div>

          ${company.description ? `
            <p class="company-card-description">${company.description}</p>
          ` : ''}

          <div class="company-card-stats">
            <div class="company-stat">
              <span class="company-stat-number" id="jobCount-${company.company_id}">0</span>
              <span class="company-stat-label">Open Jobs</span>
            </div>
            <div class="company-stat">
              <span class="company-stat-number">${company.is_verified ? '✓' : '—'}</span>
              <span class="company-stat-label">Verified</span>
            </div>
          </div>

          <div class="company-card-footer">
            <button class="btn-view-company" onclick="viewCompanyJobs(${company.company_id}, '${company.company_name.replace(/'/g, "\\'")}')">
              <i class="fas fa-briefcase"></i>
              View Jobs
            </button>
            ${company.website ? `
              <a href="${company.website}" target="_blank" class="btn-company-website">
                <i class="fas fa-external-link-alt"></i>
                Website
              </a>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Load job counts for each company
  companies.forEach(company => {
    loadCompanyJobCount(company.company_id);
  });
}

async function loadCompanyJobCount(companyId) {
  try {
    const response = await fetch(`${API_URL}/jobs/company/${companyId}`);
    const jobs = await response.json();
    const countEl = document.getElementById(`jobCount-${companyId}`);
    if (countEl) {
      countEl.textContent = jobs.length;
    }
  } catch (error) {
    console.error('Error loading job count:', error);
  }
}

function viewCompanyJobs(companyId, companyName) {
  showSection('jobs');
  // Filter jobs by company
  const companyJobs = allJobs.filter(job => job.company_id === companyId);
  displayJobs(companyJobs);
  
  // Update header to show we're filtering
  document.querySelector('#jobsSection .section-header h1').textContent = `Jobs at ${companyName}`;
}

function searchCompanies() {
  const query = document.getElementById('searchCompanies').value.toLowerCase();
  const filtered = allCompanies.filter(company => 
    company.company_name.toLowerCase().includes(query) ||
    (company.industry && company.industry.toLowerCase().includes(query)) ||
    (company.location && company.location.toLowerCase().includes(query))
  );
  displayCompanies(filtered);
}


function searchCompanies() {
  const query = document.getElementById('searchCompanies').value.toLowerCase();
  const filtered = allCompanies.filter(company => 
    company.company_name.toLowerCase().includes(query) ||
    (company.industry && company.industry.toLowerCase().includes(query))
  );
  displayCompanies(filtered);
}

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
  
  if (contacts.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-address-book"></i>
        <h3>No contacts available yet</h3>
        <p>Company contacts will appear here when employers add them</p>
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
              <i class="fas fa-building"></i>
              <span>${contact.company_name}</span>
            </div>
          </div>

          <div class="company-card-meta" style="margin-top: 12px;">
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

          <div class="company-card-footer" style="margin-top: 20px;">
            <a href="mailto:${contact.email}" class="btn-view-company">
              <i class="fas fa-envelope"></i>
              Send Email
            </a>
            ${contact.phone ? `
              <a href="tel:${contact.phone}" class="btn-company-website">
                <i class="fas fa-phone"></i>
                Call
              </a>
            ` : ''}
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

  // Load profile statistics
        const statsResponse = await fetch(`${API_URL}/applications/user/${currentUser.user_id}`);
        const applications = await statsResponse.json();
        
        document.getElementById('profileTotalApps').textContent = applications.length;
        document.getElementById('profileInReview').textContent = applications.filter(a => a.status === 'In Review').length;
        document.getElementById('profileInterviews').textContent = applications.filter(a => a.status === 'Interview').length;
        document.getElementById('profileOffers').textContent = applications.filter(a => a.status === 'Offer').length;
        

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
        
        if (document.getElementById('profileTotalApps')) {
            document.getElementById('profileTotalApps').textContent = applications.length;
        }
        if (document.getElementById('profileInReview')) {
            document.getElementById('profileInReview').textContent = applications.filter(a => a.status === 'In Review').length;
        }
        if (document.getElementById('profileInterviews')) {
            document.getElementById('profileInterviews').textContent = applications.filter(a => a.status === 'Interview').length;
        }
        if (document.getElementById('profileOffers')) {
            document.getElementById('profileOffers').textContent = applications.filter(a => a.status === 'Offer').length;
        }
    } catch (error) {
        console.error('Error calculating statistics:', error);
    }
}

async function loadStatistics() {
    try {
        const response = await fetch(`${API_URL}/applications/user/${currentUser.user_id}`);
        const applications = await response.json();
        
        const total = applications.length;
        const thisMonth = applications.filter(app => {
            const appDate = new Date(app.application_date);
            const now = new Date();
            return appDate.getMonth() === now.getMonth() && appDate.getFullYear() === now.getFullYear();
        }).length;
        
        const successRate = total > 0 ? ((applications.filter(a => a.status === 'Offer').length / total) * 100).toFixed(0) : 0;
        
        if (document.getElementById('statTotalApps')) {
            document.getElementById('statTotalApps').textContent = total;
            document.getElementById('statThisMonth').textContent = thisMonth;
            document.getElementById('statSuccessRate').textContent = `${successRate}%`;
        }
    } catch (error) {
        console.error('Error loading statistics:', error);
    }
}
