const db = require('../config/database');

exports.createJob = async (req, res) => {
  try {
    const { company_id, job_title, job_description, location, employment_type, salary_range, posted_date, application_deadline, job_url } = req.body;

    if (!company_id || !job_title || !employment_type) {
      return res.status(400).json({ error: 'Company ID, job title, and employment type are required' });
    }

    const [result] = await db.query(
      'INSERT INTO Jobs (company_id, job_title, job_description, location, employment_type, salary_range, posted_date, application_deadline, job_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [company_id, job_title, job_description, location, employment_type, salary_range, posted_date, application_deadline, job_url]
    );

    res.status(201).json({ 
      message: 'Job created successfully',
      jobId: result.insertId 
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create job', details: error.message });
  }
};

exports.getAllJobs = async (req, res) => {
  try {
    const [jobs] = await db.query(`
      SELECT j.*, c.company_name 
      FROM Jobs j 
      JOIN Companies c ON j.company_id = c.company_id 
      ORDER BY j.posted_date DESC
    `);
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch jobs', details: error.message });
  }
};

exports.getJobById = async (req, res) => {
  try {
    const [jobs] = await db.query(`
      SELECT j.*, c.company_name, c.industry, c.website 
      FROM Jobs j 
      JOIN Companies c ON j.company_id = c.company_id 
      WHERE j.job_id = ?
    `, [req.params.id]);
    
    if (jobs.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json(jobs[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch job', details: error.message });
  }
};

exports.getJobsByCompany = async (req, res) => {
  try {
    const [jobs] = await db.query('SELECT * FROM Jobs WHERE company_id = ? ORDER BY posted_date DESC', [req.params.companyId]);
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch jobs', details: error.message });
  }
};

exports.updateJob = async (req, res) => {
  try {
    const { job_title, job_description, location, employment_type, salary_range, posted_date, application_deadline, job_url } = req.body;
    
    await db.query(
      'UPDATE Jobs SET job_title = ?, job_description = ?, location = ?, employment_type = ?, salary_range = ?, posted_date = ?, application_deadline = ?, job_url = ? WHERE job_id = ?',
      [job_title, job_description, location, employment_type, salary_range, posted_date, application_deadline, job_url, req.params.id]
    );

    res.json({ message: 'Job updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update job', details: error.message });
  }
};

exports.deleteJob = async (req, res) => {
  try {
    await db.query('DELETE FROM Jobs WHERE job_id = ?', [req.params.id]);
    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete job', details: error.message });
  }
};
