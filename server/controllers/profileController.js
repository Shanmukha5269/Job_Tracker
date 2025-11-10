const db = require('../config/database');

// ============ EDUCATION CONTROLLERS ============

exports.getAllEducation = async (req, res) => {
    try {
        const userId = req.query.user_id;
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }
        
        const [education] = await db.query(
            'SELECT * FROM job_seeker_education WHERE user_id = ? ORDER BY start_date DESC',
            [userId]
        );
        res.json(education);
    } catch (error) {
        console.error('Error fetching education:', error);
        res.status(500).json({ error: 'Failed to fetch education', details: error.message });
    }
};

exports.createEducation = async (req, res) => {
    try {
        const { user_id, school_name, school_location, degree, field_of_study, start_date, end_date, currently_studying, gpa, honors_awards } = req.body;
        
        if (!user_id || !school_name || !degree || !start_date) {
            return res.status(400).json({ error: 'User ID, school name, degree, and start date are required' });
        }
        
        const [result] = await db.query(
            `INSERT INTO job_seeker_education 
            (user_id, school_name, school_location, degree, field_of_study, start_date, end_date, currently_studying, gpa, honors_awards) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [user_id, school_name, school_location || null, degree, field_of_study || null, start_date, end_date || null, currently_studying || false, gpa || null, honors_awards || null]
        );
        
        res.status(201).json({
            message: 'Education created successfully',
            educationId: result.insertId
        });
    } catch (error) {
        console.error('Error creating education:', error);
        res.status(500).json({ error: 'Failed to create education', details: error.message });
    }
};

exports.getEducationById = async (req, res) => {
    try {
        const [education] = await db.query(
            'SELECT * FROM job_seeker_education WHERE id = ?',
            [req.params.id]
        );
        
        if (education.length === 0) {
            return res.status(404).json({ error: 'Education not found' });
        }
        
        res.json(education[0]);
    } catch (error) {
        console.error('Error fetching education:', error);
        res.status(500).json({ error: 'Failed to fetch education', details: error.message });
    }
};

exports.updateEducation = async (req, res) => {
    try {
        const { user_id, school_name, school_location, degree, field_of_study, start_date, end_date, currently_studying, gpa, honors_awards } = req.body;
        
        // Check if education exists
        const [existing] = await db.query('SELECT * FROM job_seeker_education WHERE id = ? AND user_id = ?', [req.params.id, user_id]);
        if (existing.length === 0) {
            return res.status(404).json({ error: 'Education not found' });
        }
        
        await db.query(
            `UPDATE job_seeker_education 
            SET school_name=?, school_location=?, degree=?, field_of_study=?, start_date=?, end_date=?, currently_studying=?, gpa=?, honors_awards=?
            WHERE id=? AND user_id=?`,
            [school_name, school_location || null, degree, field_of_study || null, start_date, end_date || null, currently_studying || false, gpa || null, honors_awards || null, req.params.id, user_id]
        );
        
        res.json({ message: 'Education updated successfully' });
    } catch (error) {
        console.error('Error updating education:', error);
        res.status(500).json({ error: 'Failed to update education', details: error.message });
    }
};

exports.deleteEducation = async (req, res) => {
    try {
        const userId = req.query.user_id;
        
        await db.query('DELETE FROM job_seeker_education WHERE id=? AND user_id=?', [req.params.id, userId]);
        res.json({ message: 'Education deleted successfully' });
    } catch (error) {
        console.error('Error deleting education:', error);
        res.status(500).json({ error: 'Failed to delete education', details: error.message });
    }
};

// ============ SKILLS CONTROLLERS ============

exports.getAllSkills = async (req, res) => {
    try {
        const userId = req.query.user_id;
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }
        
        const [skills] = await db.query(
            'SELECT * FROM job_seeker_skills WHERE user_id = ? ORDER BY skill_name',
            [userId]
        );
        res.json(skills);
    } catch (error) {
        console.error('Error fetching skills:', error);
        res.status(500).json({ error: 'Failed to fetch skills', details: error.message });
    }
};

exports.createSkill = async (req, res) => {
    try {
        const { user_id, skill_name, proficiency_level } = req.body;
        
        if (!user_id || !skill_name || !proficiency_level) {
            return res.status(400).json({ error: 'User ID, skill name, and proficiency level are required' });
        }
        
        const [result] = await db.query(
            'INSERT INTO job_seeker_skills (user_id, skill_name, proficiency_level) VALUES (?, ?, ?)',
            [user_id, skill_name, proficiency_level]
        );
        
        res.status(201).json({
            message: 'Skill created successfully',
            skillId: result.insertId
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ error: 'Skill already exists' });
        } else {
            console.error('Error creating skill:', error);
            res.status(500).json({ error: 'Failed to create skill', details: error.message });
        }
    }
};

exports.deleteSkill = async (req, res) => {
    try {
        const userId = req.query.user_id;
        
        await db.query('DELETE FROM job_seeker_skills WHERE id=? AND user_id=?', [req.params.id, userId]);
        res.json({ message: 'Skill deleted successfully' });
    } catch (error) {
        console.error('Error deleting skill:', error);
        res.status(500).json({ error: 'Failed to delete skill', details: error.message });
    }
};

// ============ CERTIFICATIONS CONTROLLERS ============

exports.getAllCertifications = async (req, res) => {
    try {
        const userId = req.query.user_id;
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }
        
        const [certifications] = await db.query(
            'SELECT * FROM job_seeker_certifications WHERE user_id = ? ORDER BY issue_date DESC',
            [userId]
        );
        res.json(certifications);
    } catch (error) {
        console.error('Error fetching certifications:', error);
        res.status(500).json({ error: 'Failed to fetch certifications', details: error.message });
    }
};

exports.createCertification = async (req, res) => {
    try {
        const { user_id, certification_name, issuing_authority, issue_date } = req.body;
        
        if (!user_id || !certification_name) {
            return res.status(400).json({ error: 'User ID and certification name are required' });
        }
        
        const [result] = await db.query(
            `INSERT INTO job_seeker_certifications 
            (user_id, certification_name, issuing_authority, issue_date) 
            VALUES (?, ?, ?, ?)`,
            [user_id, certification_name, issuing_authority || null, issue_date || null]
        );
        
        res.status(201).json({
            message: 'Certification created successfully',
            certificationId: result.insertId
        });
    } catch (error) {
        console.error('Error creating certification:', error);
        res.status(500).json({ error: 'Failed to create certification', details: error.message });
    }
};

exports.getCertificationById = async (req, res) => {
    try {
        const [certifications] = await db.query(
            'SELECT * FROM job_seeker_certifications WHERE id = ?',
            [req.params.id]
        );
        
        if (certifications.length === 0) {
            return res.status(404).json({ error: 'Certification not found' });
        }
        
        res.json(certifications[0]);
    } catch (error) {
        console.error('Error fetching certification:', error);
        res.status(500).json({ error: 'Failed to fetch certification', details: error.message });
    }
};

exports.updateCertification = async (req, res) => {
    try {
        const { user_id, certification_name, issuing_authority, issue_date } = req.body;
        
        // Check if certification exists
        const [existing] = await db.query('SELECT * FROM job_seeker_certifications WHERE id = ? AND user_id = ?', [req.params.id, user_id]);
        if (existing.length === 0) {
            return res.status(404).json({ error: 'Certification not found' });
        }
        
        await db.query(
            `UPDATE job_seeker_certifications 
            SET certification_name=?, issuing_authority=?, issue_date=?
            WHERE id=? AND user_id=?`,
            [certification_name, issuing_authority || null, issue_date || null, req.params.id, user_id]
        );
        
        res.json({ message: 'Certification updated successfully' });
    } catch (error) {
        console.error('Error updating certification:', error);
        res.status(500).json({ error: 'Failed to update certification', details: error.message });
    }
};

exports.deleteCertification = async (req, res) => {
    try {
        const userId = req.query.user_id;
        
        await db.query('DELETE FROM job_seeker_certifications WHERE id=? AND user_id=?', [req.params.id, userId]);
        res.json({ message: 'Certification deleted successfully' });
    } catch (error) {
        console.error('Error deleting certification:', error);
        res.status(500).json({ error: 'Failed to delete certification', details: error.message });
    }
};

// ============ LANGUAGES CONTROLLERS ============

exports.getAllLanguages = async (req, res) => {
    try {
        const userId = req.query.user_id;
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }
        
        const [languages] = await db.query(
            'SELECT * FROM job_seeker_languages WHERE user_id = ? ORDER BY language_name',
            [userId]
        );
        res.json(languages);
    } catch (error) {
        console.error('Error fetching languages:', error);
        res.status(500).json({ error: 'Failed to fetch languages', details: error.message });
    }
};

exports.createLanguage = async (req, res) => {
    try {
        const { user_id, language_name, proficiency_level } = req.body;
        
        if (!user_id || !language_name || !proficiency_level) {
            return res.status(400).json({ error: 'User ID, language name, and proficiency level are required' });
        }
        
        const [result] = await db.query(
            'INSERT INTO job_seeker_languages (user_id, language_name, proficiency_level) VALUES (?, ?, ?)',
            [user_id, language_name, proficiency_level]
        );
        
        res.status(201).json({
            message: 'Language created successfully',
            languageId: result.insertId
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ error: 'Language already exists' });
        } else {
            console.error('Error creating language:', error);
            res.status(500).json({ error: 'Failed to create language', details: error.message });
        }
    }
};

exports.getLanguageById = async (req, res) => {
    try {
        const [languages] = await db.query(
            'SELECT * FROM job_seeker_languages WHERE id = ?',
            [req.params.id]
        );
        
        if (languages.length === 0) {
            return res.status(404).json({ error: 'Language not found' });
        }
        
        res.json(languages[0]);
    } catch (error) {
        console.error('Error fetching language:', error);
        res.status(500).json({ error: 'Failed to fetch language', details: error.message });
    }
};

exports.updateLanguage = async (req, res) => {
    try {
        const { user_id, language_name, proficiency_level } = req.body;
        
        // Check if language exists
        const [existing] = await db.query('SELECT * FROM job_seeker_languages WHERE id = ? AND user_id = ?', [req.params.id, user_id]);
        if (existing.length === 0) {
            return res.status(404).json({ error: 'Language not found' });
        }
        
        await db.query(
            'UPDATE job_seeker_languages SET language_name=?, proficiency_level=? WHERE id=? AND user_id=?',
            [language_name, proficiency_level, req.params.id, user_id]
        );
        
        res.json({ message: 'Language updated successfully' });
    } catch (error) {
        console.error('Error updating language:', error);
        res.status(500).json({ error: 'Failed to update language', details: error.message });
    }
};

exports.deleteLanguage = async (req, res) => {
    try {
        const userId = req.query.user_id;
        
        await db.query('DELETE FROM job_seeker_languages WHERE id=? AND user_id=?', [req.params.id, userId]);
        res.json({ message: 'Language deleted successfully' });
    } catch (error) {
        console.error('Error deleting language:', error);
        res.status(500).json({ error: 'Failed to delete language', details: error.message });
    }
};
