import { Router, Request, Response } from 'express';
import { query } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// List campaigns
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

    if (req.query.campaignType) {
      params.push(req.query.campaignType);
      whereClause += ` AND campaign_type = $${params.length}`;
    }

    const countResult = await query(`SELECT COUNT(*) as total FROM promo.campaign ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].total);

    params.push(pageSize);
    params.push(offset);

    const result = await query(
      `SELECT campaign_id, campaign_code, campaign_name, campaign_type, objective, budget_amount, start_date, end_date, status, priority_level, created_at
       FROM promo.campaign ${whereClause} ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
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
    console.error('Error listing campaigns:', error);
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Failed to list campaigns',
      timestamp: new Date().toISOString(),
    });
  }
});

// Create campaign
router.post('/', async (req: Request, res: Response) => {
  try {
    const { campaignCode, campaignName, campaignType, startDate, endDate, objective, budgetAmount, currencyCode = 'IDR', priorityLevel = 1, ownerTeam } = req.body;

    if (!campaignCode || !campaignName || !campaignType || !startDate || !endDate) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Missing required fields',
        timestamp: new Date().toISOString(),
      });
    }

    const campaignId = uuidv4();

    const result = await query(
      `INSERT INTO promo.campaign (campaign_id, campaign_code, campaign_name, campaign_type, objective, budget_amount, currency_code, start_date, end_date, status, priority_level, owner_team)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING campaign_id, campaign_code, campaign_name, campaign_type, status, created_at`,
      [campaignId, campaignCode, campaignName, campaignType, objective, budgetAmount, currencyCode, startDate, endDate, 'Draft', priorityLevel, ownerTeam]
    );

    res.status(201).json({ data: result.rows[0] });
  } catch (error: any) {
    console.error('Error creating campaign:', error);

    if (error.code === '23505') {
      return res.status(409).json({
        code: 'DUPLICATE_KEY',
        message: 'Campaign code already exists',
        timestamp: new Date().toISOString(),
      });
    }

    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Failed to create campaign',
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
