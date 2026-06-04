import { Router, Request, Response } from 'express';
import { query } from '../config/database';

const router = Router();

// Get customer features
router.get('/customer-features', async (req: Request, res: Response) => {
  try {
    const customerId = req.query.customerId as string;
    const snapshotDate = req.query.snapshotDate as string;

    if (!customerId) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'customerId is required',
        timestamp: new Date().toISOString(),
      });
    }

    let whereClause = 'WHERE customer_id = $1';
    const params: any[] = [customerId];

    if (snapshotDate) {
      params.push(snapshotDate);
      whereClause += ` AND snapshot_date = $${params.length}`;
    } else {
      whereClause += ` ORDER BY snapshot_date DESC LIMIT 1`;
    }

    const result = await query(`SELECT * FROM analytics.customer_features ${whereClause}`, params);

    res.status(200).json({ data: result.rows });
  } catch (error) {
    console.error('Error getting customer features:', error);
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Failed to get customer features',
      timestamp: new Date().toISOString(),
    });
  }
});

// Get churn risk
router.get('/churn-risk', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const offset = (page - 1) * pageSize;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (req.query.riskLevel) {
      params.push(req.query.riskLevel);
      whereClause += ` AND churn_risk_level = $${params.length}`;
    }

    const countResult = await query(`SELECT COUNT(*) as total FROM analytics.churn_features ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].total);

    params.push(pageSize);
    params.push(offset);

    const result = await query(
      `SELECT customer_id, snapshot_date, inactivity_days, churn_probability, churn_risk_level
       FROM analytics.churn_features ${whereClause} ORDER BY churn_probability DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
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
    console.error('Error getting churn risk:', error);
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Failed to get churn risk data',
      timestamp: new Date().toISOString(),
    });
  }
});

// Get fraud detection
router.get('/fraud-detection', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const offset = (page - 1) * pageSize;

    const countResult = await query(`SELECT COUNT(*) as total FROM analytics.fraud_features WHERE fraud_label = true`);
    const total = parseInt(countResult.rows[0].total);

    const result = await query(
      `SELECT customer_id, transaction_id, snapshot_date, fraud_probability, fraud_reason
       FROM analytics.fraud_features WHERE fraud_label = true ORDER BY fraud_probability DESC LIMIT $1 OFFSET $2`,
      [pageSize, offset]
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
    console.error('Error getting fraud detection:', error);
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Failed to get fraud detection data',
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
