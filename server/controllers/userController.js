const db = require('../config/database');

exports.getUserById = async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT user_id, email, full_name, phone, location, sex, is_active, created_at FROM Users WHERE user_id = ?',
      [req.params.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(users[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user', details: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { full_name, phone, location, sex } = req.body;
    
    await db.query(
      'UPDATE Users SET full_name = ?, phone = ?, location = ?, sex = ? WHERE user_id = ?',
      [full_name, phone, location, sex, req.params.id]
    );

    res.json({ message: 'User updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user', details: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    await db.query('DELETE FROM Users WHERE user_id = ?', [req.params.id]);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user', details: error.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT user_id, email, full_name, phone, location, sex, is_active, created_at FROM Users'
    );
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users', details: error.message });
  }
};
