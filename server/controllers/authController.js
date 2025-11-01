const db = require('../config/database');
const bcrypt = require('bcryptjs');

// Job Seeker Registration
exports.register = async (req, res) => {
  try {
    const { email, password, full_name, phone, location, sex } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({ error: 'Email, password, and full name are required' });
    }

    const [existing] = await db.query('SELECT * FROM Users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.query(
      'INSERT INTO Users (email, password, full_name, phone, location, sex, user_type) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [email, hashedPassword, full_name, phone, location, sex, 'job_seeker']
    );

    res.status(201).json({ 
      message: 'User registered successfully',
      userId: result.insertId 
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed', details: error.message });
  }
};

// Employer Registration
exports.registerEmployer = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    const { 
      email, password, full_name, phone, location, 
      company_name, industry, website, no_of_employees, description 
    } = req.body;

    console.log('=== Employer Registration Attempt ===');
    console.log('Email:', email);
    console.log('Company Name:', company_name);
    console.log('Full Name:', full_name);

    // Validate required fields
    if (!email || !password || !full_name || !company_name) {
      return res.status(400).json({ 
        error: 'Email, password, full name, and company name are required' 
      });
    }

    // Check if user already exists
    const [existing] = await connection.query('SELECT * FROM Users WHERE email = ?', [email]);
    if (existing.length > 0) {
      connection.release();
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Start transaction
    await connection.beginTransaction();
    console.log('Transaction started');

    try {
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      console.log('Password hashed');

      // Insert employer user
      const [userResult] = await connection.query(
        'INSERT INTO Users (email, password, full_name, phone, location, user_type) VALUES (?, ?, ?, ?, ?, ?)',
        [email, hashedPassword, full_name, phone || null, location || null, 'employer']
      );

      const userId = userResult.insertId;
      console.log('User created with ID:', userId);

      // Insert company
      const [companyResult] = await connection.query(
        'INSERT INTO Companies (user_id, company_name, industry, location, website, description, no_of_employees) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [userId, company_name, industry || null, location || null, website || null, description || null, no_of_employees || null]
      );

      console.log('Company created with ID:', companyResult.insertId);

      // Commit transaction
      await connection.commit();
      console.log('Transaction committed successfully');
      connection.release();

      res.status(201).json({ 
        message: 'Employer registered successfully',
        userId: userId,
        companyId: companyResult.insertId
      });

    } catch (error) {
      // Rollback transaction on error
      await connection.rollback();
      console.error('Transaction rolled back due to error:', error);
      connection.release();
      throw error;
    }

  } catch (error) {
    console.error('=== Employer Registration Error ===');
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('SQL State:', error.sqlState);
    console.error('SQL:', error.sql);
    console.error('Stack:', error.stack);
    
    res.status(500).json({ 
      error: 'Employer registration failed', 
      details: error.message,
      code: error.code
    });
  }
};

// Login (for both job seekers and employers)
exports.login = async (req, res) => {
  try {
    const { email, password, user_type } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const [users] = await db.query('SELECT * FROM Users WHERE email = ?', [email]);
    
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = users[0];

    // Check user type matches
    if (user_type && user.user_type !== user_type) {
      const correctPortal = user.user_type === 'employer' ? 'employer portal' : 'job seeker portal';
      return res.status(403).json({ 
        error: `This account is registered as a ${user.user_type}. Please use the ${correctPortal}.` 
      });
    }

    if (!user.is_active) {
      return res.status(403).json({ error: 'Account is inactive' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Get company info if employer
    let companyInfo = null;
    if (user.user_type === 'employer') {
      const [companies] = await db.query('SELECT * FROM Companies WHERE user_id = ?', [user.user_id]);
      if (companies.length > 0) {
        companyInfo = companies[0];
      }
    }

    const { password: _, ...userWithoutPassword } = user;
    
    res.json({ 
      message: 'Login successful',
      user: userWithoutPassword,
      company: companyInfo
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
};
