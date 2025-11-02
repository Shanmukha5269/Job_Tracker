const db = require('../config/database');

exports.createContact = async (req, res) => {
  try {
    const { company_id, contact_name, job_title, email, phone } = req.body;

    if (!company_id || !contact_name || !email) {
      return res.status(400).json({ error: 'Company ID, contact name, and email are required' });
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
    console.error('Error creating contact:', error);
    res.status(500).json({ error: 'Failed to create contact', details: error.message });
  }
};

exports.getAllContacts = async (req, res) => {
  try {
    const [contacts] = await db.query(`
      SELECT c.*, co.company_name 
      FROM Contacts c 
      JOIN Companies co ON c.company_id = co.company_id
      ORDER BY c.contact_name
    `);
    res.json(contacts);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ error: 'Failed to fetch contacts', details: error.message });
  }
};

// NEW: Get contacts by company
exports.getContactsByCompany = async (req, res) => {
  try {
    const [contacts] = await db.query(`
      SELECT c.*, co.company_name 
      FROM Contacts c 
      JOIN Companies co ON c.company_id = co.company_id
      WHERE c.company_id = ?
      ORDER BY c.contact_name
    `, [req.params.companyId]);
    
    res.json(contacts);
  } catch (error) {
    console.error('Error fetching company contacts:', error);
    res.status(500).json({ error: 'Failed to fetch contacts', details: error.message });
  }
};

exports.getContactById = async (req, res) => {
  try {
    const [contacts] = await db.query(`
      SELECT c.*, co.company_name 
      FROM Contacts c 
      JOIN Companies co ON c.company_id = co.company_id
      WHERE c.contact_id = ?
    `, [req.params.id]);
    
    if (contacts.length === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.json(contacts[0]);
  } catch (error) {
    console.error('Error fetching contact:', error);
    res.status(500).json({ error: 'Failed to fetch contact', details: error.message });
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
    console.error('Error updating contact:', error);
    res.status(500).json({ error: 'Failed to update contact', details: error.message });
  }
};

exports.deleteContact = async (req, res) => {
  try {
    await db.query('DELETE FROM Contacts WHERE contact_id = ?', [req.params.id]);
    res.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    console.error('Error deleting contact:', error);
    res.status(500).json({ error: 'Failed to delete contact', details: error.message });
  }
};
