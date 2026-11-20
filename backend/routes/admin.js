import express from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import db from '../lib/db.js';
import { authenticateToken, requireRole } from '../lib/middleware.js';
import { validateUserInput } from '../lib/validations.js';

const router = express.Router();

// Enforce System Administrator authorization on all routes in this file
router.use(authenticateToken, requireRole(['SYSTEM_ADMIN']));

// 1. Dashboard Metrics: Total users, total stores, total ratings
router.get('/dashboard', async (req, res) => {
  try {
    const [[usersResult]] = await db.execute('SELECT COUNT(*) AS total FROM users');
    const [[storesResult]] = await db.execute('SELECT COUNT(*) AS total FROM stores');
    const [[ratingsResult]] = await db.execute('SELECT COUNT(*) AS total FROM ratings');

    return res.json({
      totalUsers: usersResult.total,
      totalStores: storesResult.total,
      totalRatings: ratingsResult.total
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// 2. Users listing with sorting and filters based on Name, Email, Address, and Role
router.get('/users', async (req, res) => {
  try {
    const { search = '', name = '', email = '', address = '', role = '', sortBy = 'name', order = 'ASC' } = req.query;
    const sortOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const allowedSortFields = {
      name: 'u.name',
      email: 'u.email',
      address: 'u.address',
      role: 'u.role',
      created_at: 'u.created_at',
      rating: 'store_rating'
    };

    const sortColumn = allowedSortFields[sortBy] || 'u.name';

    let sql = `
      SELECT u.id, u.name, u.email, u.address, u.role, u.created_at,
             s.name AS store_name,
             (SELECT AVG(r.rating) FROM ratings r WHERE r.store_id = s.id) AS store_rating
      FROM users u
      LEFT JOIN stores s ON s.owner_id = u.id
    `;

    const whereClauses = [];
    const params = [];

    if (role) {
      whereClauses.push('u.role = ?');
      params.push(role);
    }

    if (name) {
      whereClauses.push('u.name LIKE ?');
      params.push(`%${name}%`);
    }

    if (email) {
      whereClauses.push('u.email LIKE ?');
      params.push(`%${email}%`);
    }

    if (address) {
      whereClauses.push('u.address LIKE ?');
      params.push(`%${address}%`);
    }

    if (search) {
      whereClauses.push('(u.name LIKE ? OR u.email LIKE ? OR u.address LIKE ?)');
      const searchWildcard = `%${search}%`;
      params.push(searchWildcard, searchWildcard, searchWildcard);
    }

    if (whereClauses.length > 0) {
      sql += ' WHERE ' + whereClauses.join(' AND ');
    }

    sql += ` ORDER BY ${sortColumn} ${sortOrder}`;

    const [users] = await db.execute(sql, params);

    const formattedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      address: user.address,
      role: user.role,
      createdAt: user.created_at,
      store: user.store_name ? {
        name: user.store_name,
        rating: user.store_rating !== null ? parseFloat(parseFloat(user.store_rating).toFixed(2)) : 0
      } : null
    }));

    return res.json(formattedUsers);
  } catch (error) {
    console.error('Admin users list error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// 3. Create a new user (System Administrator, Normal User, or Store Owner)
router.post('/users', async (req, res) => {
  try {
    const { name, email, password, address, role } = req.body;

    const validRoles = ['SYSTEM_ADMIN', 'NORMAL_USER', 'STORE_OWNER'];
    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be SYSTEM_ADMIN, NORMAL_USER, or STORE_OWNER.' });
    }

    const { isValid, errors } = validateUserInput({ name, email, password, address });
    if (!isValid) {
      return res.status(400).json({ error: 'Validation failed.', details: errors });
    }

    const [existing] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email is already in use.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    await db.execute(
      `INSERT INTO users (id, name, email, password_hash, address, role) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, name, email, hashedPassword, address, role]
    );

    return res.status(201).json({ message: 'User created successfully.', userId });
  } catch (error) {
    console.error('Admin user create error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// 4. Stores listing with filters (Name, Email, Address) and sorting (Name, Email, Address, Rating)
router.get('/stores', async (req, res) => {
  try {
    const { search = '', name = '', email = '', address = '', sortBy = 'name', order = 'ASC' } = req.query;
    const sortOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const allowedSortFields = {
      name: 's.name',
      email: 's.email',
      address: 's.address',
      rating: 'average_rating'
    };

    const sortColumn = allowedSortFields[sortBy] || 's.name';

    let sql = `
      SELECT s.id, s.name, s.email, s.address, s.owner_id, 
             u.name AS owner_name, 
             COALESCE(AVG(r.rating), 0) AS average_rating
      FROM stores s
      LEFT JOIN users u ON s.owner_id = u.id
      LEFT JOIN ratings r ON r.store_id = s.id
    `;

    const whereClauses = [];
    const params = [];

    if (name) {
      whereClauses.push('s.name LIKE ?');
      params.push(`%${name}%`);
    }

    if (email) {
      whereClauses.push('s.email LIKE ?');
      params.push(`%${email}%`);
    }

    if (address) {
      whereClauses.push('s.address LIKE ?');
      params.push(`%${address}%`);
    }

    if (search) {
      whereClauses.push('(s.name LIKE ? OR s.address LIKE ? OR s.email LIKE ?)');
      const searchWildcard = `%${search}%`;
      params.push(searchWildcard, searchWildcard, searchWildcard);
    }

    if (whereClauses.length > 0) {
      sql += ' WHERE ' + whereClauses.join(' AND ');
    }

    sql += ' GROUP BY s.id, u.id';
    sql += ` ORDER BY ${sortColumn} ${sortOrder}`;

    const [stores] = await db.execute(sql, params);

    const formattedStores = stores.map(store => ({
      id: store.id,
      name: store.name,
      email: store.email,
      address: store.address,
      ownerId: store.owner_id,
      ownerName: store.owner_name,
      averageRating: parseFloat(parseFloat(store.average_rating).toFixed(2))
    }));

    return res.json(formattedStores);
  } catch (error) {
    console.error('Admin stores list error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// 5. Create a new store
router.post('/stores', async (req, res) => {
  try {
    const { name, email, address, ownerId } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length < 20 || name.trim().length > 60) {
      return res.status(400).json({ error: 'Store name must be between 20 and 60 characters.' });
    }

    if (!address || typeof address !== 'string' || address.trim().length === 0 || address.length > 400) {
      return res.status(400).json({ error: 'Store address must not exceed 400 characters.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({ error: 'Store email must be valid.' });
    }

    if (!ownerId) {
      return res.status(400).json({ error: 'Store owner is required.' });
    }

    const [owners] = await db.execute('SELECT role FROM users WHERE id = ?', [ownerId]);
    if (owners.length === 0) {
      return res.status(404).json({ error: 'Selected store owner does not exist.' });
    }

    if (owners[0].role !== 'STORE_OWNER') {
      return res.status(400).json({ error: 'Selected user is not a Store Owner.' });
    }

    const [existing] = await db.execute('SELECT id FROM stores WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Store email is already in use.' });
    }

    const storeId = uuidv4();
    await db.execute(
      `INSERT INTO stores (id, name, email, address, owner_id) 
       VALUES (?, ?, ?, ?, ?)`,
      [storeId, name.trim(), email, address.trim(), ownerId]
    );

    return res.status(201).json({ message: 'Store created successfully.', storeId });
  } catch (error) {
    console.error('Admin store create error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// 6. Ratings list with sorting and filtering
router.get('/ratings', async (req, res) => {
  try {
    const { search = '', sortBy = 'createdAt', order = 'DESC' } = req.query;
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const allowedSortFields = {
      userName: 'u.name',
      userEmail: 'u.email',
      userAddress: 'u.address',
      storeName: 's.name',
      rating: 'r.rating',
      createdAt: 'r.created_at',
      created_at: 'r.created_at'
    };

    const sortColumn = allowedSortFields[sortBy] || 'r.created_at';
    
    let sql = `
      SELECT r.id, r.rating, r.created_at,
             u.name AS user_name, u.email AS user_email, u.address AS user_address,
             s.name AS store_name
      FROM ratings r
      JOIN users u ON r.user_id = u.id
      JOIN stores s ON r.store_id = s.id
    `;
    
    const params = [];
    if (search) {
      sql += ' WHERE (u.name LIKE ? OR u.email LIKE ? OR u.address LIKE ? OR s.name LIKE ?)';
      const wildcard = `%${search}%`;
      params.push(wildcard, wildcard, wildcard, wildcard);
    }
    
    sql += ` ORDER BY ${sortColumn} ${sortOrder}`;
    
    const [ratings] = await db.execute(sql, params);
    
    const formattedRatings = ratings.map(r => ({
      id: r.id,
      userName: r.user_name,
      userEmail: r.user_email,
      userAddress: r.user_address,
      storeName: r.store_name,
      rating: r.rating,
      createdAt: r.created_at
    }));
    
    return res.json(formattedRatings);
  } catch (error) {
    console.error('Admin ratings list error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
