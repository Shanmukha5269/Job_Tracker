-- Create Database
CREATE DATABASE IF NOT EXISTS job_tracker_db;
USE job_tracker_db;

-- Users Table (with user_type)
CREATE TABLE IF NOT EXISTS Users (
  user_id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  location VARCHAR(255),
  sex ENUM('Male', 'Female', 'Other'),
  user_type ENUM('job_seeker', 'employer') NOT NULL DEFAULT 'job_seeker',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_user_type (user_type)
);

-- Companies Table (linked to employer users)
CREATE TABLE IF NOT EXISTS Companies (
  company_id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  industry VARCHAR(100),
  location VARCHAR(255),
  website VARCHAR(255),
  description TEXT,
  no_of_employees INT,
  logo_url VARCHAR(500),
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
  INDEX idx_company_name (company_name),
  INDEX idx_user_id (user_id)
);

-- Jobs Table (only employers can create)
CREATE TABLE IF NOT EXISTS Jobs (
  job_id INT PRIMARY KEY AUTO_INCREMENT,
  company_id INT NOT NULL,
  job_title VARCHAR(255) NOT NULL,
  job_description TEXT,
  location VARCHAR(255),
  employment_type ENUM('Full-time', 'Part-time', 'Contract', 'Internship', 'Remote') NOT NULL,
  salary_range VARCHAR(100),
  posted_date DATE,
  application_deadline DATE,
  job_url VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES Companies(company_id) ON DELETE CASCADE,
  INDEX idx_company_id (company_id),
  INDEX idx_job_title (job_title),
  INDEX idx_is_active (is_active)
);

-- Applications Table (only job seekers can apply)
CREATE TABLE IF NOT EXISTS Applications (
  application_id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  job_id INT NOT NULL,
  application_date DATE NOT NULL,
  status ENUM('Applied', 'In Review', 'Interview Scheduled', 'Rejected', 'Accepted', 'Withdrawn') DEFAULT 'Applied',
  resume VARCHAR(500),
  cover_letter TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (job_id) REFERENCES Jobs(job_id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_job_id (job_id),
  INDEX idx_status (status),
  UNIQUE KEY unique_application (user_id, job_id)
);

-- Contacts Table (for networking)
CREATE TABLE IF NOT EXISTS Contacts (
  contact_id INT PRIMARY KEY AUTO_INCREMENT,
  company_id INT NOT NULL,
  contact_name VARCHAR(255) NOT NULL,
  job_title VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES Companies(company_id) ON DELETE CASCADE,
  INDEX idx_company_id (company_id)
);


-- Application_Contacts Junction Table (M:N Relationship)
CREATE TABLE IF NOT EXISTS Application_Contacts (
  application_id INT NOT NULL,
  contact_id INT NOT NULL,
  interaction_date DATE,
  notes TEXT,
  PRIMARY KEY (application_id, contact_id),
  FOREIGN KEY (application_id) REFERENCES Applications(application_id) ON DELETE CASCADE,
  FOREIGN KEY (contact_id) REFERENCES Contacts(contact_id) ON DELETE CASCADE
);
