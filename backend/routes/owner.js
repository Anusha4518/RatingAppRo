import express from 'express';
import db from '../lib/db.js';
import { authenticateToken, requireRole } from '../lib/middleware.js';

const router = express.Router();

router.use(authenticateToken, requireRole(['STORE_OWNER']));

// GET /api/owner/dashboard - Get owner's store name, average rating, and list of user ratings with sorting
router.get('/dashboard', async (req, res) => {
  try {
    const { sortBy = 'createdAt', order = 'DESC' } = req.query;
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const allowedSortFields = {
      name: 'u.name',
      email: 'u.email',
      address: 'u.address',
      rating: 'r.rating',
      createdAt: 'r.created_at',
      created_at: 'r.created_at'
    };

    const sortColumn = allowedSortFields[sortBy] || 'r.created_at';

    const [stores] = await db.execute(
      'SELECT id, name FROM stores WHERE owner_id = ?',
      [req.user.id]
    );

    if (stores.length === 0) {
      return res.json({
        storeName: null,
        averageRating: 0,
        ratings: []
      });
    }

    const store = stores[0];

    const [[avgResult]] = await db.execute(
      'SELECT COALESCE(AVG(rating), 0) AS average_rating FROM ratings WHERE store_id = ?',
      [store.id]
    );

    const [raters] = await db.execute(
      `SELECT u.name, u.email, u.address, r.rating, r.created_at 
       FROM ratings r
       JOIN users u ON r.user_id = u.id
       WHERE r.store_id = ?
       ORDER BY ${sortColumn} ${sortOrder}`,
      [store.id]
    );

    const formattedRaters = raters.map(r => ({
      name: r.name,
      email: r.email,
      address: r.address,
      rating: r.rating,
      createdAt: r.created_at
    }));

    return res.json({
      storeName: store.name,
      averageRating: parseFloat(parseFloat(avgResult.average_rating).toFixed(2)),
      ratings: formattedRaters
    });
  } catch (error) {
    console.error('Owner dashboard stats error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
