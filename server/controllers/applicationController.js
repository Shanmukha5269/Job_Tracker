const db = require('../config/database');

exports.createApplication = async (req, res) => {
  try {
    const { user_id, job_id, application_date, status, resume, cover_letter } = req.body;

    if (!user_id || !job_id || !application_date) {
      return res.status(400).json({ error: 'User ID, job ID, and application date are required' });
    }

    const [result] = await db.query(
      'INSERT INTO Applications (user_id, job_id, application_date, status, resume, cover_letter) VALUES (?, ?, ?, ?, ?, ?)',
      [user_id, job_id, application_date, status || 'Applied', resume, cover_letter]
    );

    res.status(201).json({ 
      message: 'Application created successfully',
      applicationId: result.insertId 
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create application', details: error.message });
  }
};

exports.getApplicationsByUser = async (req, res) => {
  try {
    const [applications] = await db.query(`
      SELECT a.*, j.job_title, c.company_name, j.location, j.employment_type 
      FROM Applications a 
      JOIN Jobs j ON a.job_id = j.job_id 
      JOIN Companies c ON j.company_id = c.company_id 
      WHERE a.user_id = ? 
      ORDER BY a.application_date DESC
    `, [req.params.userId]);
    
    res.json(applications);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch applications', details: error.message });
  }
};

exports.getApplicationById = async (req, res) => {
  try {
    const [applications] = await db.query(`
      SELECT a.*, j.job_title, j.job_description, c.company_name, c.industry, c.website 
      FROM Applications a 
      JOIN Jobs j ON a.job_id = j.job_id 
      JOIN Companies c ON j.company_id = c.company_id 
      WHERE a.application_id = ?
    `, [req.params.id]);
    
    if (applications.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    res.json(applications[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch application', details: error.message });
  }
};

exports.updateApplication = async (req, res) => {
  try {
    const { status, resume, cover_letter } = req.body;
    
    await db.query(
      'UPDATE Applications SET status = ?, resume = ?, cover_letter = ? WHERE application_id = ?',
      [status, resume, cover_letter, req.params.id]
    );

    res.json({ message: 'Application updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update application', details: error.message });
  }
};

exports.deleteApplication = async (req, res) => {
  try {
    await db.query('DELETE FROM Applications WHERE application_id = ?', [req.params.id]);
    res.json({ message: 'Application deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete application', details: error.message });
  }
};

exports.linkContactToApplication = async (req, res) => {
  try {
    const { contact_id, interaction_date, notes } = req.body;
    const application_id = req.params.id;

    await db.query(
      'INSERT INTO Application_Contacts (application_id, contact_id, interaction_date, notes) VALUES (?, ?, ?, ?)',
      [application_id, contact_id, interaction_date, notes]
    );

    res.status(201).json({ message: 'Contact linked to application successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to link contact', details: error.message });
  }
};
