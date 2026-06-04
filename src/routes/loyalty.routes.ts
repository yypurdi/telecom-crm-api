import { Router, Request, Response } from 'express';
import { query } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// List members
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const offset = (page - 1) * pageSize;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (req.query.status) {
      params.push(req.query.status);
      whereClause += ` AND status = $${params.length}`;
    }

    const countResult = await query(`SELECT COUNT(*) as total FROM loyalty.member ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].total);

    params.push(pageSize);
    params.push(offset);

    const result = await query(
      `SELECT member_id, member_code, email, phone, status, total_points, available_points, current_tier_id, join_date, created_at
       FROM loyalty.member ${whereClause} ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.status(200).json({
      data: result.rows,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('Error listing members:', error);
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Failed to list members',
      timestamp: new Date().toISOString(),
    });
  }
});

// Enroll member
router.post('/', async (req: Request, res: Response) => {
  try {
    const { memberCode, customerId, firstName, lastName, email, phone, birthDate, gender } = req.body;

    if (!memberCode || !customerId) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Missing required fields',
        timestamp: new Date().toISOString(),
      });
    }

    const memberId = uuidv4();

    const result = await query(
      `INSERT INTO loyalty.member (member_id, member_code, customer_id, first_name, last_name, email, phone, birth_date, gender, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING member_id, member_code, email, phone, status, join_date, created_at`,
      [memberId, memberCode, customerId, firstName, lastName, email, phone, birthDate, gender, 'ACTIVE']
    );

    res.status(201).json({ data: result.rows[0] });
  } catch (error: any) {
    console.error('Error enrolling member:', error);

    if (error.code === '23505') {
      return res.status(409).json({
        code: 'DUPLICATE_KEY',
        message: 'Member code already exists',
        timestamp: new Date().toISOString(),
      });
    }

    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Failed to enroll member',
      timestamp: new Date().toISOString(),
    });
  }
});

// Get member points
router.get('/:memberId/points', async (req: Request, res: Response) => {
  try {
    const { memberId } = req.params;

    const result = await query(
      `SELECT member_id, total_points, available_points, redeemed_points, lifetime_points
       FROM loyalty.member WHERE member_id = $1`,
      [memberId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        code: 'NOT_FOUND',
        message: 'Member not found',
        timestamp: new Date().toISOString(),
      });
    }

    res.status(200).json({ data: result.rows[0] });
  } catch (error) {
    console.error('Error getting member points:', error);
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Failed to get member points',
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
