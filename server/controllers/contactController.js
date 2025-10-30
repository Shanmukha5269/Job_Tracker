const db = require('../config/database');

exports.createContact = async (req, res) => {
  try {
    const { company_id, contact_name, job_title, email, phone } = req.body;

    if (!company_id || !contact_name) {
      return res.status(400).json({ error: 'Company ID and contact name are required' });
    }

    const [result] = await db.query(
      'INSERT INTO Contacts (company_id, contact_name, job_title, email, phone) VALUES (?, ?, ?, ?, ?)',
      [company_id, contact_name, job_title, email, phone]
    );

    res.status(201).json({ 
      message: 'Contact created successfully',
      contactId: result.insertId 
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create contact', details: error.message });
  }
};

exports.getAllContacts = async (req, res) => {
  try {
    const [contacts] = await db.query(`
      SELECT c.*, comp.company_name 
      FROM Contacts c 
      JOIN Companies comp ON c.company_id = comp.company_id 
      ORDER BY c.created_at DESC
    `);
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch contacts', details: error.message });
  }
};

exports.getContactById = async (req, res) => {
  try {
    const [contacts] = await db.query(`
      SELECT c.*, comp.company_name 
      FROM Contacts c 
      JOIN Companies comp ON c.company_id = comp.company_id 
      WHERE c.contact_id = ?
    `, [req.params.id]);
    
    if (contacts.length === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.json(contacts[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch contact', details: error.message });
  }
};

exports.getContactsByCompany = async (req, res) => {
  try {
    const [contacts] = await db.query('SELECT * FROM Contacts WHERE company_id = ?', [req.params.companyId]);
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch contacts', details: error.message });
  }
};

exports.updateContact = async (req, res) => {
  try {
    const { contact_name, job_title, email, phone } = req.body;
    
    await db.query(
      'UPDATE Contacts SET contact_name = ?, job_title = ?, email = ?, phone = ? WHERE contact_id = ?',
      [contact_name, job_title, email, phone, req.params.id]
    );

    res.json({ message: 'Contact updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update contact', details: error.message });
  }
};

exports.deleteContact = async (req, res) => {
  try {
    await db.query('DELETE FROM Contacts WHERE contact_id = ?', [req.params.id]);
    res.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete contact', details: error.message });
  }
};
