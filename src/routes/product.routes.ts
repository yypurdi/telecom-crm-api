import { Router, Request, Response } from 'express';
import { query } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// List products
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const offset = (page - 1) * pageSize;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (req.query.productType) {
      params.push(req.query.productType);
      whereClause += ` AND product_type = $${params.length}`;
    }

    if (req.query.status) {
      params.push(req.query.status);
      whereClause += ` AND status = $${params.length}`;
    }

    if (req.query.search) {
      params.push(`%${req.query.search}%`);
      whereClause += ` AND (product_code ILIKE $${params.length} OR product_name ILIKE $${params.length})`;
    }

    const countResult = await query(`SELECT COUNT(*) as total FROM product.product ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].total);

    params.push(pageSize);
    params.push(offset);

    const result = await query(
      `SELECT product_id, product_code, product_name, product_type, category, description, status, launch_date, retirement_date, created_at, updated_at
       FROM product.product ${whereClause} ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
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
    console.error('Error listing products:', error);
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Failed to list products',
      timestamp: new Date().toISOString(),
    });
  }
});

// Get product by ID
router.get('/:productId', async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;

    const result = await query(
      `SELECT product_id, product_code, product_name, product_type, category, description, status, launch_date, retirement_date, created_at, updated_at
       FROM product.product WHERE product_id = $1`,
      [productId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        code: 'NOT_FOUND',
        message: 'Product not found',
        timestamp: new Date().toISOString(),
      });
    }

    res.status(200).json({ data: result.rows[0] });
  } catch (error) {
    console.error('Error getting product:', error);
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Failed to get product',
      timestamp: new Date().toISOString(),
    });
  }
});

// Create product
router.post('/', async (req: Request, res: Response) => {
  try {
    const { productCode, productName, productType, category, description, status = 'ACTIVE', launchDate } = req.body;

    if (!productCode || !productName || !productType) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Missing required fields',
        timestamp: new Date().toISOString(),
      });
    }

    const productId = uuidv4();

    const result = await query(
      `INSERT INTO product.product (product_id, product_code, product_name, product_type, category, description, status, launch_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING product_id, product_code, product_name, product_type, category, description, status, launch_date, created_at`,
      [productId, productCode, productName, productType, category, description, status, launchDate]
    );

    res.status(201).json({ data: result.rows[0] });
  } catch (error: any) {
    console.error('Error creating product:', error);

    if (error.code === '23505') {
      return res.status(409).json({
        code: 'DUPLICATE_KEY',
        message: 'Product code already exists',
        timestamp: new Date().toISOString(),
      });
    }

    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Failed to create product',
      timestamp: new Date().toISOString(),
    });
  }
});

// Update product
router.put('/:productId', async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const { productName, description, status, category } = req.body;

    const updates: string[] = [];
    const params: any[] = [];
    let paramCount = 1;

    if (productName) {
      updates.push(`product_name = $${paramCount}`);
      params.push(productName);
      paramCount++;
    }

    if (description) {
      updates.push(`description = $${paramCount}`);
      params.push(description);
      paramCount++;
    }

    if (status) {
      updates.push(`status = $${paramCount}`);
      params.push(status);
      paramCount++;
    }

    if (category) {
      updates.push(`category = $${paramCount}`);
      params.push(category);
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
    params.push(productId);

    const result = await query(
      `UPDATE product.product SET ${updates.join(', ')} WHERE product_id = $${paramCount} RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        code: 'NOT_FOUND',
        message: 'Product not found',
        timestamp: new Date().toISOString(),
      });
    }

    res.status(200).json({ data: result.rows[0] });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Failed to update product',
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
