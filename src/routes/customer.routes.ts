import { Router, Request, Response } from 'express';
import { query } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// List customers
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

    if (req.query.customerType) {
      params.push(req.query.customerType);
      whereClause += ` AND customer_type = $${params.length}`;
    }

    if (req.query.search) {
      params.push(`%${req.query.search}%`);
      whereClause += ` AND (customer_code ILIKE $${params.length} OR national_id ILIKE $${params.length})`;
    }

    const countResult = await query(`SELECT COUNT(*) as total FROM customer.customer ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].total);

    params.push(pageSize);
    params.push(offset);

    const result = await query(
      `SELECT customer_id, customer_code, customer_type, status, registration_channel, national_id, tax_number, created_at, updated_at 
       FROM customer.customer ${whereClause} ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
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
    console.error('Error listing customers:', error);
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Failed to list customers',
      timestamp: new Date().toISOString(),
    });
  }
});

// Get customer by ID
router.get('/:customerId', async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;

    const result = await query(
      `SELECT customer_id, customer_code, customer_type, status, registration_channel, national_id, tax_number, 
              preferred_language, metadata, created_at, updated_at 
       FROM customer.customer WHERE customer_id = $1`,
      [customerId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        code: 'NOT_FOUND',
        message: 'Customer not found',
        timestamp: new Date().toISOString(),
      });
    }

    res.status(200).json({ data: result.rows[0] });
  } catch (error) {
    console.error('Error getting customer:', error);
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Failed to get customer',
      timestamp: new Date().toISOString(),
    });
  }
});

// Create customer
router.post('/', async (req: Request, res: Response) => {
  try {
    const { customerCode, customerType, status = 'ACTIVE', registrationChannel, nationalId, taxNumber, preferredLanguage } = req.body;

    if (!customerCode || !customerType) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Missing required fields',
        timestamp: new Date().toISOString(),
      });
    }

    const customerId = uuidv4();

    const result = await query(
      `INSERT INTO customer.customer (customer_id, customer_code, customer_type, status, registration_channel, national_id, tax_number, preferred_language)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING customer_id, customer_code, customer_type, status, registration_channel, created_at`,
      [customerId, customerCode, customerType, status, registrationChannel, nationalId, taxNumber, preferredLanguage]
    );

    res.status(201).json({ data: result.rows[0] });
  } catch (error: any) {
    console.error('Error creating customer:', error);

    if (error.code === '23505') {
      return res.status(409).json({
        code: 'DUPLICATE_KEY',
        message: 'Customer code already exists',
        timestamp: new Date().toISOString(),
      });
    }

    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Failed to create customer',
      timestamp: new Date().toISOString(),
    });
  }
});

// Update customer
router.put('/:customerId', async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;
    const { status, nationalId, taxNumber, preferredLanguage } = req.body;

    const updates: string[] = [];
    const params: any[] = [];
    let paramCount = 1;

    if (status) {
      updates.push(`status = $${paramCount}`);
      params.push(status);
      paramCount++;
    }

    if (nationalId) {
      updates.push(`national_id = $${paramCount}`);
      params.push(nationalId);
      paramCount++;
    }

    if (taxNumber) {
      updates.push(`tax_number = $${paramCount}`);
      params.push(taxNumber);
      paramCount++;
    }

    if (preferredLanguage) {
      updates.push(`preferred_language = $${paramCount}`);
      params.push(preferredLanguage);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'No fields to update',
        timestamp: new Date().toISOString(),
      });
    }

    updates.push(`updated_at = NOW()`);
    params.push(customerId);

    const result = await query(
      `UPDATE customer.customer SET ${updates.join(', ')} WHERE customer_id = $${paramCount} RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        code: 'NOT_FOUND',
        message: 'Customer not found',
        timestamp: new Date().toISOString(),
      });
    }

    res.status(200).json({ data: result.rows[0] });
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Failed to update customer',
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
