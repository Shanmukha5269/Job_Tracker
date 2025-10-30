const db = require('../config/database');

exports.createCompany = async (req, res) => {
  try {
    const { company_name, industry, location, website, description, no_of_employees } = req.body;

    if (!company_name) {
      return res.status(400).json({ error: 'Company name is required' });
    }

    const [result] = await db.query(
      'INSERT INTO Companies (company_name, industry, location, website, description, no_of_employees) VALUES (?, ?, ?, ?, ?, ?)',
      [company_name, industry, location, website, description, no_of_employees]
    );

    res.status(201).json({ 
      message: 'Company created successfully',
      companyId: result.insertId 
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create company', details: error.message });
  }
};

exports.getAllCompanies = async (req, res) => {
  try {
    const [companies] = await db.query('SELECT * FROM Companies ORDER BY created_at DESC');
    res.json(companies);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch companies', details: error.message });
  }
};

exports.getCompanyById = async (req, res) => {
  try {
    const [companies] = await db.query('SELECT * FROM Companies WHERE company_id = ?', [req.params.id]);
    
    if (companies.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    res.json(companies[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch company', details: error.message });
  }
};

exports.updateCompany = async (req, res) => {
  try {
    const { company_name, industry, location, website, description, no_of_employees } = req.body;
    
    await db.query(
      'UPDATE Companies SET company_name = ?, industry = ?, location = ?, website = ?, description = ?, no_of_employees = ? WHERE company_id = ?',
      [company_name, industry, location, website, description, no_of_employees, req.params.id]
    );

    res.json({ message: 'Company updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update company', details: error.message });
  }
};

exports.deleteCompany = async (req, res) => {
  try {
    await db.query('DELETE FROM Companies WHERE company_id = ?', [req.params.id]);
    res.json({ message: 'Company deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete company', details: error.message });
  }
};
