import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../lib/db.js';
import { authenticateToken, requireRole } from '../lib/middleware.js';

const router = express.Router();

router.use(authenticateToken);

// GET /api/stores - List all registered stores with owner name, average rating & current user rating
router.get('/', async (req, res) => {
  try {
    const { search = '', sortBy = 'name', order = 'ASC' } = req.query;
    const sortOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const allowedSortFields = {
      name: 's.name',
      address: 's.address',
      email: 's.email',
      ownerName: 'u.name',
      averageRating: 'average_rating',
      userRating: 'user_rating'
    };

    const sortColumn = allowedSortFields[sortBy] || 's.name';

    let sql = `
      SELECT s.id, s.name, s.address, s.email, u.name AS owner_name,
             COALESCE(AVG(r_all.rating), 0) AS average_rating,
             COALESCE((SELECT r_user.rating FROM ratings r_user WHERE r_user.store_id = s.id AND r_user.user_id = ?), 0) AS user_rating
      FROM stores s
      LEFT JOIN users u ON s.owner_id = u.id
      LEFT JOIN ratings r_all ON r_all.store_id = s.id
    `;

    const params = [req.user.id];

    if (search) {
      sql += ' WHERE (s.name LIKE ? OR s.address LIKE ? OR u.name LIKE ?)';
      const searchWildcard = `%${search}%`;
      params.push(searchWildcard, searchWildcard, searchWildcard);
    }

    sql += ' GROUP BY s.id, u.id';
    sql += ` ORDER BY ${sortColumn} ${sortOrder}`;

    const [stores] = await db.execute(sql, params);

    const formattedStores = stores.map(store => ({
      id: store.id,
      name: store.name,
      address: store.address,
      email: store.email,
      ownerName: store.owner_name || 'Unassigned',
      averageRating: parseFloat(parseFloat(store.average_rating).toFixed(2)),
      userRating: parseInt(store.user_rating, 10)
    }));

    return res.json(formattedStores);
  } catch (error) {
    console.error('Stores list error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/stores/:storeId/rating - Submit or modify rating (1 to 5)
router.post('/:storeId/rating', requireRole(['NORMAL_USER']), async (req, res) => {
  try {
    const { storeId } = req.params;
    const { rating } = req.body;

    const ratingInt = parseInt(rating, 10);
    if (isNaN(ratingInt) || ratingInt < 1 || ratingInt > 5) {
      return res.status(400).json({ error: 'Rating must be an integer between 1 and 5.' });
    }

    const [stores] = await db.execute('SELECT id FROM stores WHERE id = ?', [storeId]);
    if (stores.length === 0) {
      return res.status(404).json({ error: 'Store not found.' });
    }

    const ratingId = uuidv4();
    await db.execute(
      `INSERT INTO ratings (id, user_id, store_id, rating) 
       VALUES (?, ?, ?, ?) 
       ON DUPLICATE KEY UPDATE rating = VALUES(rating)`,
      [ratingId, req.user.id, storeId, ratingInt]
    );

    return res.json({ message: 'Rating submitted successfully.' });
  } catch (error) {
    console.error('Store rating submission error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
