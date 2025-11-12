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
    
    try {
        const parsedData = JSON.parse(userData);
        
        // Handle nested user object from login response
        if (parsedData.user) {
            currentUser = parsedData.user;
        } else {
            currentUser = parsedData;
        }
        
        // Handle both userid and user_id
        if (currentUser.user_id && !currentUser.userid) {
            currentUser.userid = currentUser.user_id;
        }
        
        if (!currentUser.userid) {
            console.error('No userid found in session');
            alert('Session expired. Please log in again.');
            localStorage.removeItem('user');
            window.location.href = '/login';
            return;
        }
        
        console.log('=== USER SESSION LOADED ===');
        console.log('User ID:', currentUser.userid);
        console.log('Full Name:', currentUser.fullname);
        console.log('Email:', currentUser.email);
        
        initializeDashboard();
    } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('user');
        window.location.href = '/login';
    }
});

function initializeDashboard() {
    setUserUI();
    loadInitialData();
}

function setUserUI() {
    const userName = currentUser.full_name || 'User';
    const userEmail = currentUser.email || '';
    
    const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase();
    
    console.log('Setting UI - Name:', userName, 'Email:', userEmail, 'Initials:', initials);
    
    // Update all user display elements
    const elements = {
        userInitial: document.getElementById('userInitial'),
        userName: document.getElementById('userName'),
        sidebarUserInitial: document.getElementById('sidebarUserInitial'),
        sidebarUserName: document.getElementById('sidebarUserName'),
        sidebarUserEmail: document.getElementById('sidebarUserEmail')
    };
    
    if (elements.userInitial) elements.userInitial.textContent = initials;
    if (elements.userName) elements.userName.textContent = userName;
    if (elements.sidebarUserInitial) elements.sidebarUserInitial.textContent = initials;
    if (elements.sidebarUserName) elements.sidebarUserName.textContent = userName;
    if (elements.sidebarUserEmail) elements.sidebarUserEmail.textContent = userEmail;
}

async function loadInitialData() {
    try {
        console.log('=== LOADING INITIAL DATA ===');
        await Promise.allSettled([
            loadProfile(),
            loadApplications(),
            loadJobs(),
            loadCompanies(),
            loadContacts()
        ]);
        
        calculateStatistics();
        console.log('=== INITIAL DATA LOAD COMPLETE ===');
    } catch (error) {
        console.error('Error loading initial data:', error);
    }
}

function showSection(sectionName) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    const targetSection = document.getElementById(`${sectionName}Section`);
    const targetNavItem = document.querySelector(`[data-section="${sectionName}"]`);
    
    if (targetSection) targetSection.classList.add('active');
    if (targetNavItem) targetNavItem.classList.add('active');
}

// ==================== PROFILE SECTION ====================
async function loadProfile() {
    try {
        console.log('=== LOADING PROFILE ===');
        console.log('Fetching user data for ID:', currentUser.userid);
        
        const response = await fetch(`${API_URL}/users/${currentUser.userid}`);
        console.log('Profile API response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const userData = await response.json();
        console.log('Profile data received:', userData);
        
        // Populate form fields
        const fields = {
            profileFullName: userData.full_name || currentUser.full_name || '',
            profileEmail: userData.email || currentUser.email || '',
            profilePhone: userData.phone || '',
            profileLocation: userData.location || '',
            profileSex: userData.sex || ''
        };
        
        Object.keys(fields).forEach(key => {
            const el = document.getElementById(key);
            if (el) {
                el.value = fields[key];
                console.log(`✓ Set ${key}: ${fields[key]}`);
            }
        });
        
        // Update currentUser with fresh data
        currentUser.fullname = userData.fullname || currentUser.fullname;
        currentUser.email = userData.email || currentUser.email;
        currentUser.phone = userData.phone;
        currentUser.location = userData.location;
        currentUser.sex = userData.sex;
        
        // Update UI with fresh data
        setUserUI();
        
        // Load profile sections
        console.log('Loading profile sections...');
        await Promise.allSettled([
            loadSkills(),
            loadEducation(),
            loadCertifications(),
            loadLanguages()
        ]);
        
        await loadProfileStats();
        
        console.log('=== PROFILE LOAD COMPLETE ===');
        
    } catch (error) {
        console.error('=== PROFILE LOADING ERROR ===');
        console.error('Error:', error);
        // If API fails, at least show currentUser data
        if (currentUser.fullname) {
            const fullnameEl = document.getElementById('profileFullName');
            const emailEl = document.getElementById('profileEmail');
            if (fullnameEl) fullnameEl.value = currentUser.fullname;
            if (emailEl) emailEl.value = currentUser.email;
        }
    }
}

async function loadProfileStats() {
    try {
        const response = await fetch(`${API_URL}/applications/user/${currentUser.userid}`);
        if (!response.ok) return;
        
        const applications = await response.json();
        
        const stats = {
            profileTotalApps: applications.length,
            profileInReview: applications.filter(a => a.status === 'In Review').length,
            profileInterviews: applications.filter(a => a.status === 'Interview').length,
            profileOffers: applications.filter(a => a.status === 'Offer').length
        };
        
        Object.keys(stats).forEach(key => {
            const el = document.getElementById(key);
            if (el) el.textContent = stats[key];
        });
        
    } catch (error) {
        console.error('Profile stats error:', error);
    }
}

async function updateProfile(event) {
    event.preventDefault();
    
    if (!currentUser || !currentUser.userid) {
        alert('Invalid session. Please log in again.');
        logout();
        return;
    }
    
    const data = {
        fullname: document.getElementById('profileFullName').value,
        email: document.getElementById('profileEmail').value,
        phone: document.getElementById('profilePhone').value,
        location: document.getElementById('profileLocation').value,
        sex: document.getElementById('profileSex').value
    };
    
    try {
        const response = await fetch(`${API_URL}/users/${currentUser.userid}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            alert('Profile updated successfully!');
            currentUser.fullname = data.fullname;
            currentUser.email = data.email;
            currentUser.phone = data.phone;
            currentUser.location = data.location;
            currentUser.sex = data.sex;
            localStorage.setItem('user', JSON.stringify(currentUser));
            setUserUI();
        } else {
            const errorData = await response.json();
            alert(errorData.error || 'Failed to update profile');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        alert('Error updating profile.');
    }
}

// ==================== SKILLS ====================
async function loadSkills() {
    try {
        console.log('=== LOADING SKILLS ===');
        console.log('Fetching skills for user_id:', currentUser.userid);
        
        // CRITICAL: Send as userid parameter (backend expects userid)
        const url = `${API_URL}/profile/skills?user_id=${currentUser.userid}`;
        console.log('Skills API URL:', url);
        
        const response = await fetch(url);
        console.log('Skills response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Skills error response:', errorText);
            throw new Error(`Skills fetch failed: ${response.status}`);
        }
        
        const skills = await response.json();
        console.log('Skills data received:', skills);
        console.log('Number of skills:', skills.length);
        
        displaySkills(skills);
    } catch (error) {
        console.error('=== SKILLS LOADING ERROR ===');
        console.error('Error:', error);
        const container = document.getElementById('skillsList');
        if (container) {
            container.innerHTML = '<p style="color: #6b7280;">No skills added yet.</p>';
        }
    }
}

function displaySkills(skills) {
    const container = document.getElementById('skillsList');
    if (!container) {
        console.error('Skills container not found');
        return;
    }
    
    if (!skills || skills.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-code" style="font-size: 48px; color: #6b7280;"></i>
                <h4>No skills added yet</h4>
                <p>Add your professional skills</p>
                <button class="btn-primary btn-small" onclick="showSkillsModal()">Add Skill</button>
            </div>
        `;
        return;
    }
    
    console.log('Displaying', skills.length, 'skills');
    
    container.innerHTML = skills.map(skill => `
        <div class="skill-item">
            <div class="skill-info">
                <span class="skill-name">${skill.skill_name || skill.skillname || 'Skill'}</span>
                <span class="skill-level">${skill.proficiency_level || skill.proficiencylevel || 'N/A'}</span>
            </div>
            <button class="btn-delete btn-small" onclick="deleteSkill(${skill.id})" title="Delete">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
}

function showSkillsModal(editSkill = null) {
    const modal = document.getElementById('skillsModal');
    const form = document.getElementById('skillsForm');
    
    if (!modal || !form) {
        console.error('Skills modal or form not found');
        return;
    }
    
    if (editSkill) {
        document.getElementById('skill-id').value = editSkill.id;
        document.getElementById('skill-name').value = editSkill.skill_name || editSkill.skillname;
        document.getElementById('proficiency-level').value = editSkill.proficiency_level || editSkill.proficiencylevel;
    } else {
        form.reset();
        const skillIdEl = document.getElementById('skill-id');
        if (skillIdEl) skillIdEl.value = '';
    }
    
    modal.classList.add('active');
}

async function saveSkill(event) {
    event.preventDefault();
    
    const skillIdEl = document.getElementById('skill-id');
    const skillId = skillIdEl ? skillIdEl.value : '';
    
    const skillData = {
        user_id: parseInt(currentUser.userid), // CRITICAL: Send as number
        skill_name: document.getElementById('skill-name').value,
        proficiency_level: document.getElementById('proficiency-level').value
    };
    
    console.log('Saving skill:', skillData);
    
    try {
        const url = skillId ? 
            `${API_URL}/profile/skills/${skillId}` : 
            `${API_URL}/profile/skills`;
        
        const method = skillId ? 'PUT' : 'POST';
        
        console.log(`${method} ${url}`);
        
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(skillData)
        });
        
        console.log('Save skill response status:', response.status);
        
        if (response.ok) {
            closeModal('skillsModal');
            await loadSkills();
            alert(skillId ? 'Skill updated!' : 'Skill added successfully!');
        } else {
            const errorData = await response.json();
            console.error('Save skill error:', errorData);
            alert(errorData.error || 'Failed to save skill');
        }
    } catch (error) {
        console.error('Error saving skill:', error);
        alert('Error saving skill.');
    }
}

async function deleteSkill(skillId) {
    if (!confirm('Delete this skill?')) return;
    
    try {
        const response = await fetch(`${API_URL}/profile/skills/${skillId}?user_id=${currentUser.userid}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            await loadSkills();
            alert('Skill deleted!');
        } else {
            const errorData = await response.json();
            alert(errorData.error || 'Failed to delete skill');
        }
    } catch (error) {
        console.error('Error deleting skill:', error);
    }
}

// ==================== EDUCATION ====================
async function loadEducation() {
    try {
        console.log('=== LOADING EDUCATION ===');
        console.log('Fetching education for user_id:', currentUser.userid);
        
        const url = `${API_URL}/profile/education?user_id=${currentUser.userid}`;
        console.log('Education API URL:', url);
        
        const response = await fetch(url);
        console.log('Education response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Education error response:', errorText);
            throw new Error(`Education fetch failed: ${response.status}`);
        }
        
        const education = await response.json();
        console.log('Education data received:', education);
        console.log('Number of education entries:', education.length);
        
        displayEducation(education);
    } catch (error) {
        console.error('=== EDUCATION LOADING ERROR ===');
        console.error('Error:', error);
        const container = document.getElementById('educationList');
        if (container) {
            container.innerHTML = '<p style="color: #6b7280;">No education history.</p>';
        }
    }
}

function displayEducation(education) {
    const container = document.getElementById('educationList');
    if (!container) {
        console.error('Education container not found');
        return;
    }
    
    if (!education || education.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-graduation-cap" style="font-size: 48px; color: #6b7280;"></i>
                <h4>No education history</h4>
                <p>Add your educational background</p>
                <button class="btn-primary btn-small" onclick="showEducationModal()">Add Education</button>
            </div>
        `;
        return;
    }
    
    console.log('Displaying', education.length, 'education entries');
    
    container.innerHTML = education.map(edu => {
        const endDate = edu.currently_studying ? 'Present' : 
                       (edu.end_date ? new Date(edu.end_date).toLocaleDateString() : 'N/A');
        const startDate = edu.start_date ? new Date(edu.start_date).toLocaleDateString() : 'N/A';
        
        return `
            <div class="education-item">
                <h4>${edu.degree} ${edu.field_of_study ? `in ${edu.field_of_study}` : ''}</h4>
                <div>${edu.school_name}</div>
                <div>${startDate} - ${endDate}</div>
                ${edu.gpa ? `<div>GPA: ${edu.gpa}</div>` : ''}
                <button class="btn-delete btn-small" onclick="deleteEducation(${edu.id})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
    }).join('');
}

function showEducationModal(editEdu = null) {
    const modal = document.getElementById('educationModal');
    const form = document.getElementById('educationForm');
    
    if (!modal || !form) {
        console.error('Education modal or form not found');
        return;
    }
    
    if (editEdu) {
        document.getElementById('education-id').value = editEdu.id;
        document.getElementById('school-name').value = editEdu.school_name;
        document.getElementById('school-location').value = editEdu.school_location || '';
        document.getElementById('degree').value = editEdu.degree;
        document.getElementById('field-of-study').value = editEdu.field_of_study || '';
        document.getElementById('edu-start-date').value = editEdu.start_date ? editEdu.start_date.slice(0, 7) : '';
        document.getElementById('edu-end-date').value = editEdu.end_date ? editEdu.end_date.slice(0, 7) : '';
        document.getElementById('currently-studying').checked = editEdu.currently_studying || false;
        document.getElementById('gpa').value = editEdu.gpa || '';
        document.getElementById('honors-awards').value = editEdu.honors_awards || '';
    } else {
        form.reset();
        document.getElementById('education-id').value = '';
    }
    
    modal.classList.add('active');
}

async function saveEducation(event) {
    event.preventDefault();
    
    const eduIdEl = document.getElementById('education-id');
    const eduId = eduIdEl ? eduIdEl.value : '';
    
    const eduData = {
        user_id: parseInt(currentUser.userid), // CRITICAL: Send as number
        school_name: document.getElementById('school-name').value,
        school_location: document.getElementById('school-location').value,
        degree: document.getElementById('degree').value,
        field_of_study: document.getElementById('field-of-study').value,
        start_date: document.getElementById('edu-start-date').value,
        end_date: document.getElementById('currently-studying').checked ? null : document.getElementById('edu-end-date').value,
        currently_studying: document.getElementById('currently-studying').checked,
        gpa: document.getElementById('gpa').value,
        honors_awards: document.getElementById('honors-awards').value
    };
    
    console.log('Saving education:', eduData);
    
    try {
        const url = eduId ? `${API_URL}/profile/education/${eduId}` : `${API_URL}/profile/education`;
        const method = eduId ? 'PUT' : 'POST';
        
        console.log(`${method} ${url}`);
        
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eduData)
        });
        
        console.log('Save education response status:', response.status);
        
        if (response.ok) {
            closeModal('educationModal');
            await loadEducation();
            alert(eduId ? 'Education updated!' : 'Education added successfully!');
        } else {
            const errorData = await response.json();
            console.error('Save education error:', errorData);
            alert(errorData.error || 'Failed to save education');
        }
    } catch (error) {
        console.error('Error saving education:', error);
        alert('Error saving education.');
    }
}

async function deleteEducation(eduId) {
    if (!confirm('Delete this education entry?')) return;
    
    try {
        const response = await fetch(`${API_URL}/profile/education/${eduId}?user_id=${currentUser.userid}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            await loadEducation();
            alert('Education deleted!');
        } else {
            const errorData = await response.json();
            alert(errorData.error || 'Failed to delete education');
        }
    } catch (error) {
        console.error('Error deleting education:', error);
    }
}

// ==================== CERTIFICATIONS ====================
async function loadCertifications() {
    try {
        console.log('=== LOADING CERTIFICATIONS ===');
        console.log('Fetching certifications for user_id:', currentUser.userid);
        
        const url = `${API_URL}/profile/certifications?user_id=${currentUser.userid}`;
        console.log('Certifications API URL:', url);
        
        const response = await fetch(url);
        console.log('Certifications response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Certifications error response:', errorText);
            throw new Error(`Certifications fetch failed: ${response.status}`);
        }
        
        const certifications = await response.json();
        console.log('Certifications data received:', certifications);
        console.log('Number of certifications:', certifications.length);
        
        displayCertifications(certifications);
    } catch (error) {
        console.error('=== CERTIFICATIONS LOADING ERROR ===');
        console.error('Error:', error);
        const container = document.getElementById('certificationsList');
        if (container) {
            container.innerHTML = '<p style="color: #6b7280;">No certifications.</p>';
        }
    }
}

function displayCertifications(certifications) {
    const container = document.getElementById('certificationsList');
    if (!container) {
        console.error('Certifications container not found');
        return;
    }
    
    if (!certifications || certifications.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-certificate" style="font-size: 48px; color: #6b7280;"></i>
                <h4>No certifications</h4>
                <p>Add your professional certifications</p>
                <button class="btn-primary btn-small" onclick="showCertificationModal()">Add Certification</button>
            </div>
        `;
        return;
    }
    
    console.log('Displaying', certifications.length, 'certifications');
    
    container.innerHTML = certifications.map(cert => {
        const issueDate = cert.issue_date ? new Date(cert.issue_date).toLocaleDateString() : 'N/A';
        
        return `
            <div class="certification-item">
                <h4>${cert.certification_name}</h4>
                ${cert.issuing_authority ? `<div>${cert.issuing_authority}</div>` : ''}
                <div>Issued: ${issueDate}</div>
                <button class="btn-delete btn-small" onclick="deleteCertification(${cert.id})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
    }).join('');
}

function showCertificationModal(editCert = null) {
    const modal = document.getElementById('certificationModal');
    const form = document.getElementById('certificationForm');
    
    if (!modal || !form) {
        console.error('Certification modal or form not found');
        return;
    }
    
    if (editCert) {
        document.getElementById('certification-id').value = editCert.id;
        document.getElementById('cert-name').value = editCert.certification_name;
        document.getElementById('issuing-authority').value = editCert.issuing_authority || '';
        document.getElementById('issue-date').value = editCert.issue_date ? editCert.issue_date.slice(0, 7) : '';
    } else {
        form.reset();
        const certIdEl = document.getElementById('certification-id');
        if (certIdEl) certIdEl.value = '';
    }
    
    modal.classList.add('active');
}

async function saveCertification(event) {
    event.preventDefault();
    
    const certIdEl = document.getElementById('certification-id');
    const certId = certIdEl ? certIdEl.value : '';
    
    const certData = {
        user_id: parseInt(currentUser.userid), // CRITICAL: Send as number
        certification_name: document.getElementById('cert-name').value,
        issuing_authority: document.getElementById('issuing-authority').value,
        issue_date: document.getElementById('issue-date').value
    };
    
    console.log('Saving certification:', certData);
    
    try {
        const url = certId ? `${API_URL}/profile/certifications/${certId}` : `${API_URL}/profile/certifications`;
        const method = certId ? 'PUT' : 'POST';
        
        console.log(`${method} ${url}`);
        
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(certData)
        });
        
        console.log('Save certification response status:', response.status);
        
        if (response.ok) {
            closeModal('certificationModal');
            await loadCertifications();
            alert(certId ? 'Certification updated!' : 'Certification added successfully!');
        } else {
            const errorData = await response.json();
            console.error('Save certification error:', errorData);
            alert(errorData.error || 'Failed to save certification');
        }
    } catch (error) {
        console.error('Error saving certification:', error);
        alert('Error saving certification.');
    }
}

async function deleteCertification(certId) {
    if (!confirm('Delete this certification?')) return;
    
    try {
        const response = await fetch(`${API_URL}/profile/certifications/${certId}?user_id=${currentUser.userid}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            await loadCertifications();
            alert('Certification deleted!');
        } else {
            const errorData = await response.json();
            alert(errorData.error || 'Failed to delete certification');
        }
    } catch (error) {
        console.error('Error deleting certification:', error);
    }
}

// ==================== LANGUAGES ====================
async function loadLanguages() {
    try {
        console.log('=== LOADING LANGUAGES ===');
        console.log('Fetching languages for user_id:', currentUser.userid);
        
        const url = `${API_URL}/profile/languages?user_id=${currentUser.userid}`;
        console.log('Languages API URL:', url);
        
        const response = await fetch(url);
        console.log('Languages response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Languages error response:', errorText);
            throw new Error(`Languages fetch failed: ${response.status}`);
        }
        
        const languages = await response.json();
        console.log('Languages data received:', languages);
        console.log('Number of languages:', languages.length);
        
        displayLanguages(languages);
    } catch (error) {
        console.error('=== LANGUAGES LOADING ERROR ===');
        console.error('Error:', error);
        const container = document.getElementById('languagesList');
        if (container) {
            container.innerHTML = '<p style="color: #6b7280;">No languages added.</p>';
        }
    }
}

function displayLanguages(languages) {
    const container = document.getElementById('languagesList');
    if (!container) {
        console.error('Languages container not found');
        return;
    }
    
    if (!languages || languages.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-globe" style="font-size: 48px; color: #6b7280;"></i>
                <h4>No languages added</h4>
                <p>Add languages you speak</p>
                <button class="btn-primary btn-small" onclick="showLanguageModal()">Add Language</button>
            </div>
        `;
        return;
    }
    
    console.log('Displaying', languages.length, 'languages');
    
    container.innerHTML = languages.map(lang => `
        <div class="language-item">
            <div class="language-info">
                <span class="language-name">${lang.language_name || lang.languagename}</span>
                <span class="language-level">${lang.proficiency_level || lang.proficiencylevel}</span>
            </div>
            <button class="btn-delete btn-small" onclick="deleteLanguage(${lang.id})">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
}

function showLanguageModal(editLang = null) {
    const modal = document.getElementById('languageModal');
    const form = document.getElementById('languageForm');
    
    if (!modal || !form) {
        console.error('Language modal or form not found');
        return;
    }
    
    if (editLang) {
        document.getElementById('language-id').value = editLang.id;
        document.getElementById('language-name').value = editLang.language_name || editLang.languagename;
        document.getElementById('lang-proficiency').value = editLang.proficiency_level || editLang.proficiencylevel;
    } else {
        form.reset();
        const langIdEl = document.getElementById('language-id');
        if (langIdEl) langIdEl.value = '';
    }
    
    modal.classList.add('active');
}

async function saveLanguage(event) {
    event.preventDefault();
    
    const langIdEl = document.getElementById('language-id');
    const langId = langIdEl ? langIdEl.value : '';
    
    const langData = {
        user_id: parseInt(currentUser.userid), // CRITICAL: Send as number
        language_name: document.getElementById('language-name').value,
        proficiency_level: document.getElementById('lang-proficiency').value
    };
    
    console.log('Saving language:', langData);
    
    try {
        const url = langId ? `${API_URL}/profile/languages/${langId}` : `${API_URL}/profile/languages`;
        const method = langId ? 'PUT' : 'POST';
        
        console.log(`${method} ${url}`);
        
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(langData)
        });
        
        console.log('Save language response status:', response.status);
        
        if (response.ok) {
            closeModal('languageModal');
            await loadLanguages();
            alert(langId ? 'Language updated!' : 'Language added successfully!');
        } else {
            const errorData = await response.json();
            console.error('Save language error:', errorData);
            alert(errorData.error || 'Failed to save language');
        }
    } catch (error) {
        console.error('Error saving language:', error);
        alert('Error saving language.');
    }
}

async function deleteLanguage(langId) {
    if (!confirm('Delete this language?')) return;
    
    try {
        const response = await fetch(`${API_URL}/profile/languages/${langId}?user_id=${currentUser.userid}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            await loadLanguages();
            alert('Language deleted!');
        } else {
            const errorData = await response.json();
            alert(errorData.error || 'Failed to delete language');
        }
    } catch (error) {
        console.error('Error deleting language:', error);
    }
}

// ==================== APPLICATIONS ====================
async function loadApplications() {
    try {
        const response = await fetch(`${API_URL}/applications/user/${currentUser.userid}`);
        if (!response.ok) throw new Error(`Applications fetch failed`);
        
        allApplications = await response.json();
        displayApplications(allApplications);
        calculateStatistics();
    } catch (error) {
        console.error('Error loading applications:', error);
        const listEl = document.getElementById('applicationsList');
        if (listEl) {
            listEl.innerHTML = '<p style="color: #6b7280;">Failed to load applications.</p>';
        }
    }
}

function displayApplications(applications) {
    const listEl = document.getElementById('applicationsList');
    if (!listEl) return;
    
    if (!applications || applications.length === 0) {
        listEl.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <i class="fas fa-inbox" style="font-size: 64px; color: #6b7280;"></i>
                <h3>No applications yet</h3>
                <p>Browse jobs and start applying</p>
                <button class="btn-primary" onclick="showSection('jobs')">
                    <i class="fas fa-search"></i> Browse Jobs
                </button>
            </div>
        `;
        return;
    }
    
    listEl.innerHTML = applications.map(app => {
        const statusClass = app.status.toLowerCase().replace(' ', '-');
        const appliedDate = new Date(app.application_date).toLocaleDateString();
        
        return `
            <div class="application-card">
                <div class="application-header">
                    <div class="application-title">
                        <h3>${app.job_title || 'Job Title'}</h3>
                        <div class="application-company">
                            <i class="fas fa-building"></i>
                            ${app.company_name || 'Unknown Company'}
                        </div>
                    </div>
                    <span class="application-status ${statusClass}">${app.status}</span>
                </div>
                <div class="application-details">
                    <div class="detail-item">
                        <i class="fas fa-calendar"></i>
                        <strong>Applied:</strong> ${appliedDate}
                    </div>
                </div>
                <div class="application-actions">
                    <button class="btn-delete btn-small" onclick="deleteApplication(${app.applicationid})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

async function deleteApplication(appId) {
    if (!confirm('Delete this application?')) return;
    
    try {
        const response = await fetch(`${API_URL}/applications/${appId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            await loadApplications();
            alert('Application deleted!');
        }
    } catch (error) {
        console.error('Error deleting application:', error);
    }
}

// ==================== JOBS ====================
async function loadJobs() {
    try {
        const response = await fetch(`${API_URL}/jobs`);
        if (!response.ok) throw new Error(`Jobs fetch failed`);
        
        allJobs = await response.json();
        displayJobs(allJobs);
    } catch (error) {
        console.error('Error loading jobs:', error);
        const listEl = document.getElementById('jobsList');
        if (listEl) {
            listEl.innerHTML = '<p style="color: #6b7280;">Failed to load jobs.</p>';
        }
    }
}

function displayJobs(jobs) {
    const listEl = document.getElementById('jobsList');
    if (!listEl) return;
    
    if (!jobs || jobs.length === 0) {
        listEl.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <i class="fas fa-briefcase" style="font-size: 64px; color: #6b7280;"></i>
                <h3>No jobs available</h3>
                <p>Check back later for opportunities</p>
            </div>
        `;
        return;
    }
    
    listEl.innerHTML = jobs.map(job => {
        const isApplied = allApplications.some(app => app.job_id === job.job_id);
        const postedDate = job.posted_date ? new Date(job.posted_date).toLocaleDateString() : 'Recently';
        
        return `
            <div class="job-card">
                <h3>${job.job_title || 'Job Title'}</h3>
                <div><i class="fas fa-building"></i> ${job.company_name || 'Company'}</div>
                <div><i class="fas fa-map-marker-alt"></i> ${job.location || 'Location'}</div>
                <div><i class="fas fa-clock"></i> Posted ${postedDate}</div>
                ${job.job_description ? `<p>${job.job_description.substring(0, 150)}...</p>` : ''}
                <div class="job-actions">
                    ${isApplied ? 
                        '<button class="btn-applied" disabled><i class="fas fa-check"></i> Applied</button>' :
                        `<button class="btn-apply" onclick="applyForJob(${job.job_id})">
                            <i class="fas fa-paper-plane"></i> Apply Now
                        </button>`
                    }
                </div>
            </div>
        `;
    }).join('');
}

function filterJobs() {
    const typeFilter = document.getElementById('jobTypeFilter')?.value || '';
    const searchTerm = document.getElementById('searchJobs')?.value.toLowerCase() || '';
    
    let filteredJobs = allJobs;
    
    if (typeFilter) {
        filteredJobs = filteredJobs.filter(job => 
            job.employment_type && job.employment_type.toLowerCase().includes(typeFilter.toLowerCase())
        );
    }
    
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

async function applyForJob(jobId) {
    const job = allJobs.find(j => j.job_id === jobId);
    if (!job) {
        alert('Job not found');
        return;
    }
    
    const alreadyApplied = allApplications.some(app => app.job_id === jobId);
    if (alreadyApplied) {
        alert('You have already applied for this position!');
        return;
    }
    
    if (!confirm(`Apply for "${job.job_title}"?`)) {
        return;
    }
    
    const applicationData = {
        user_id: currentUser.userid,
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
            alert('Application submitted successfully!');
            await loadApplications();
            displayJobs(allJobs);
            showSection('applications');
        } else {
            alert('Failed to submit application');
        }
    } catch (error) {
        console.error('Error applying for job:', error);
    }
}

// ==================== COMPANIES ====================
async function loadCompanies() {
    try {
        const response = await fetch(`${API_URL}/companies`);
        if (!response.ok) throw new Error(`Companies fetch failed`);
        
        allCompanies = await response.json();
        displayCompanies(allCompanies);
    } catch (error) {
        console.error('Error loading companies:', error);
        const listEl = document.getElementById('companiesList');
        if (listEl) {
            listEl.innerHTML = '<p style="color: #6b7280;">Failed to load companies.</p>';
        }
    }
}

function displayCompanies(companies) {
    const listEl = document.getElementById('companiesList');
    if (!listEl) return;
    
    if (!companies || companies.length === 0) {
        listEl.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-building" style="font-size: 64px; color: #6b7280;"></i>
                <h3>No companies yet</h3>
            </div>
        `;
        return;
    }
    
    listEl.innerHTML = companies.map(company => `
        <div class="company-card">
            <h3>${company.company_name || 'Company Name'}</h3>
            ${company.website ? `<p><i class="fas fa-globe"></i> <a href="${company.website}" target="_blank" rel="noopener noreferrer">${company.website}</a></p>` : ''}
            ${company.industry ? `<p><i class="fas fa-industry"></i> ${company.industry}</p>` : ''}
            ${company.location ? `<p><i class="fas fa-map-marker-alt"></i> ${company.location}</p>` : ''}
            ${company.description ? `<p>${company.description.substring(0, 100)}...</p>` : ''}
        </div>
    `).join('');
}

function searchCompanies() {
    const query = document.getElementById('searchCompanies')?.value.toLowerCase() || '';
    const filtered = allCompanies.filter(company => 
        (company.company_name && company.company_name.toLowerCase().includes(query)) ||
        (company.industry && company.industry.toLowerCase().includes(query))
    );
    displayCompanies(filtered);
}

// ==================== CONTACTS ====================
async function loadContacts() {
    try {
        const response = await fetch(`${API_URL}/contacts`);
        if (!response.ok) throw new Error(`Contacts fetch failed`);
        
        allContacts = await response.json();
        displayContacts(allContacts);
    } catch (error) {
        console.error('Error loading contacts:', error);
        const listEl = document.getElementById('contactsList');
        if (listEl) {
            listEl.innerHTML = '<p style="color: #6b7280;">Failed to load contacts.</p>';
        }
    }
}

function displayContacts(contacts) {
    const listEl = document.getElementById('contactsList');
    if (!listEl) return;
    
    if (!contacts || contacts.length === 0) {
        listEl.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-address-book" style="font-size: 64px; color: #6b7280;"></i>
                <h3>No contacts available</h3>
            </div>
        `;
        return;
    }
    
    listEl.innerHTML = contacts.map(contact => `
        <div class="contact-card">
            <h4>${contact.contactname || 'Contact Name'}</h4>
            ${contact.job_title ? `<p>${contact.job_title}</p>` : ''}
            ${contact.email ? `<p><i class="fas fa-envelope"></i> ${contact.email}</p>` : ''}
            ${contact.phone ? `<p><i class="fas fa-phone"></i> ${contact.phone}</p>` : ''}
        </div>
    `).join('');
}

function searchContacts() {
    const query = document.getElementById('searchContacts')?.value.toLowerCase() || '';
    const filtered = allContacts.filter(contact => 
        (contact.contact_name && contact.contact_name.toLowerCase().includes(query)) ||
        (contact.email && contact.email.toLowerCase().includes(query))
    );
    displayContacts(filtered);
}

// ==================== STATISTICS ====================
async function calculateStatistics() {
    if (!allApplications || allApplications.length === 0) {
        updateStatsDisplay(0, 0, 0, 0);
        return;
    }
    
    const total = allApplications.length;
    const thisMonth = allApplications.filter(app => {
        const appDate = new Date(app.application_date);
        const now = new Date();
        return appDate.getMonth() === now.getMonth() && appDate.getFullYear() === now.getFullYear();
    }).length;
    
    const offers = allApplications.filter(a => a.status === 'Offer').length;
    const successRate = total > 0 ? ((offers / total) * 100).toFixed(1) : 0;
    
    updateStatsDisplay(total, thisMonth, successRate, 0);
}

function updateStatsDisplay(total, thisMonth, successRate, avgResponse) {
    const stats = {
        statTotalApps: total,
        statThisMonth: thisMonth,
        statSuccessRate: `${successRate}%`,
        statAvgResponse: avgResponse ? `${avgResponse} days` : '-- days'
    };
    
    Object.keys(stats).forEach(key => {
        const el = document.getElementById(key);
        if (el) el.textContent = stats[key];
    });
}

async function loadStatistics() {
    await calculateStatistics();
}

// ==================== UTILITY FUNCTIONS ====================
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

function toggleUserDropdown() {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) {
        dropdown.classList.toggle('active');
    }
}

function logout() {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        window.location.href = '/';
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
}

function showHelp() {
    alert('Help & Support\n\nContact: support@jobtracker.com');
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.user-menu')) {
        const dropdown = document.getElementById('userDropdown');
        if (dropdown) dropdown.classList.remove('active');
    }
});

// Modal backdrop click to close
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});

// Keyboard support
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal.active').forEach(modal => modal.classList.remove('active'));
        const dropdown = document.getElementById('userDropdown');
        if (dropdown) dropdown.classList.remove('active');
    }
});

console.log('=== DASHBOARD JS LOADED ===');
