"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customerRoutes = void 0;
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const auth_1 = require("@/middleware/auth");
const customerService_1 = require("@/services/customerService");
const logger_1 = require("@/utils/logger");
const router = (0, express_1.Router)();
exports.customerRoutes = router;
// Apply auth middleware to all routes
router.use(auth_1.authMiddleware);
// Validation middleware
const validateRequest = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: {
                message: 'Validation failed',
                code: 'VALIDATION_ERROR',
                timestamp: new Date().toISOString(),
                details: errors.array(),
                validationErrors: errors.array()
            }
        });
    }
    next();
};
// GET /customers - Search and list customers
router.get('/', [
    (0, express_validator_1.query)('businessId').isString().notEmpty().withMessage('Business ID is required'),
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    (0, express_validator_1.query)('search').optional().isString().isLength({ min: 1, max: 100 }).withMessage('Search must be 1-100 characters'),
    (0, express_validator_1.query)('email').optional().isEmail().withMessage('Invalid email format'),
    (0, express_validator_1.query)('phone').optional().isString().withMessage('Phone must be a string'),
    (0, express_validator_1.query)('vipStatus').optional().isIn(['REGULAR', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM']).withMessage('Invalid VIP status'),
    (0, express_validator_1.query)('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
    (0, express_validator_1.query)('minTotalSpent').optional().isFloat({ min: 0 }).withMessage('minTotalSpent must be a non-negative number'),
    (0, express_validator_1.query)('maxTotalSpent').optional().isFloat({ min: 0 }).withMessage('maxTotalSpent must be a non-negative number'),
    (0, express_validator_1.query)('minTotalVisits').optional().isInt({ min: 0 }).withMessage('minTotalVisits must be a non-negative integer'),
    (0, express_validator_1.query)('maxTotalVisits').optional().isInt({ min: 0 }).withMessage('maxTotalVisits must be a non-negative integer'),
    validateRequest
], async (req, res) => {
    try {
        const { businessId, page = 1, limit = 10, search, email, phone, vipStatus, isActive, minTotalSpent, maxTotalSpent, minTotalVisits, maxTotalVisits, lastVisitAfter, lastVisitBefore, tags } = req.query;
        const filters = {
            businessId,
            search,
            email,
            phone,
            vipStatus,
            isActive: isActive !== undefined ? isActive === 'true' : undefined,
            minTotalSpent: minTotalSpent ? parseFloat(minTotalSpent) : undefined,
            maxTotalSpent: maxTotalSpent ? parseFloat(maxTotalSpent) : undefined,
            minTotalVisits: minTotalVisits ? parseInt(minTotalVisits) : undefined,
            maxTotalVisits: maxTotalVisits ? parseInt(maxTotalVisits) : undefined,
            lastVisitAfter: lastVisitAfter ? new Date(lastVisitAfter) : undefined,
            lastVisitBefore: lastVisitBefore ? new Date(lastVisitBefore) : undefined,
            tags: tags ? (Array.isArray(tags) ? tags : [tags]) : undefined
        };
        const result = await customerService_1.customerService.searchCustomers(filters, parseInt(page), parseInt(limit));
        res.json({
            success: true,
            data: result,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Error searching customers:', error);
        throw error;
    }
});
// GET /customers/stats - Get customer statistics
router.get('/stats', [
    (0, express_validator_1.query)('businessId').isString().notEmpty().withMessage('Business ID is required'),
    validateRequest
], async (req, res) => {
    try {
        const { businessId } = req.query;
        const stats = await customerService_1.customerService.getCustomerStats(businessId);
        res.json({
            success: true,
            data: stats,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Error getting customer stats:', error);
        throw error;
    }
});
// GET /customers/tags/:tag - Get customers by tag
router.get('/tags/:tag', [
    (0, express_validator_1.param)('tag').isString().notEmpty().withMessage('Tag is required'),
    (0, express_validator_1.query)('businessId').isString().notEmpty().withMessage('Business ID is required'),
    validateRequest
], async (req, res) => {
    try {
        const { tag } = req.params;
        const { businessId } = req.query;
        const customers = await customerService_1.customerService.getCustomersByTag(businessId, tag);
        res.json({
            success: true,
            data: customers,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Error getting customers by tag:', error);
        throw error;
    }
});
// POST /customers - Create new customer
router.post('/', [
    (0, express_validator_1.body)('businessId').isString().notEmpty().withMessage('Business ID is required'),
    (0, express_validator_1.body)('firstName').isString().isLength({ min: 1, max: 50 }).withMessage('First name is required and must be 1-50 characters'),
    (0, express_validator_1.body)('lastName').isString().isLength({ min: 1, max: 50 }).withMessage('Last name is required and must be 1-50 characters'),
    (0, express_validator_1.body)('email').optional().isEmail().withMessage('Invalid email format'),
    (0, express_validator_1.body)('phone').optional().isString().matches(/^\+?[\d\s\-\(\)]+$/).withMessage('Invalid phone format'),
    (0, express_validator_1.body)('dateOfBirth').optional().isISO8601().withMessage('Invalid date format'),
    (0, express_validator_1.body)('vipStatus').optional().isIn(['REGULAR', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM']).withMessage('Invalid VIP status'),
    (0, express_validator_1.body)('tags').optional().isArray().withMessage('Tags must be an array'),
    (0, express_validator_1.body)('tags.*').optional().isString().withMessage('Each tag must be a string'),
    (0, express_validator_1.body)('notes').optional().isString().isLength({ max: 1000 }).withMessage('Notes must be less than 1000 characters'),
    validateRequest
], async (req, res) => {
    try {
        const customerData = {
            ...req.body,
            dateOfBirth: req.body.dateOfBirth ? new Date(req.body.dateOfBirth) : undefined
        };
        const customer = await customerService_1.customerService.createCustomer(customerData);
        res.status(201).json({
            success: true,
            data: customer,
            message: 'Customer created successfully',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Error creating customer:', error);
        throw error;
    }
});
// GET /customers/:id - Get customer by ID
router.get('/:id', [
    (0, express_validator_1.param)('id').isString().notEmpty().withMessage('Customer ID is required'),
    (0, express_validator_1.query)('businessId').isString().notEmpty().withMessage('Business ID is required'),
    validateRequest
], async (req, res) => {
    try {
        const { id } = req.params;
        const { businessId } = req.query;
        const customer = await customerService_1.customerService.getCustomerById(id, businessId);
        res.json({
            success: true,
            data: customer,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Error getting customer:', error);
        throw error;
    }
});
// PUT /customers/:id - Update customer
router.put('/:id', [
    (0, express_validator_1.param)('id').isString().notEmpty().withMessage('Customer ID is required'),
    (0, express_validator_1.body)('businessId').isString().notEmpty().withMessage('Business ID is required'),
    (0, express_validator_1.body)('firstName').optional().isString().isLength({ min: 1, max: 50 }).withMessage('First name must be 1-50 characters'),
    (0, express_validator_1.body)('lastName').optional().isString().isLength({ min: 1, max: 50 }).withMessage('Last name must be 1-50 characters'),
    (0, express_validator_1.body)('email').optional().isEmail().withMessage('Invalid email format'),
    (0, express_validator_1.body)('phone').optional().isString().matches(/^\+?[\d\s\-\(\)]+$/).withMessage('Invalid phone format'),
    (0, express_validator_1.body)('dateOfBirth').optional().isISO8601().withMessage('Invalid date format'),
    (0, express_validator_1.body)('vipStatus').optional().isIn(['REGULAR', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM']).withMessage('Invalid VIP status'),
    (0, express_validator_1.body)('tags').optional().isArray().withMessage('Tags must be an array'),
    (0, express_validator_1.body)('tags.*').optional().isString().withMessage('Each tag must be a string'),
    (0, express_validator_1.body)('notes').optional().isString().isLength({ max: 1000 }).withMessage('Notes must be less than 1000 characters'),
    (0, express_validator_1.body)('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
    validateRequest
], async (req, res) => {
    try {
        const { id } = req.params;
        const { businessId, ...updateData } = req.body;
        if (updateData.dateOfBirth) {
            updateData.dateOfBirth = new Date(updateData.dateOfBirth);
        }
        const customer = await customerService_1.customerService.updateCustomer(id, businessId, updateData);
        res.json({
            success: true,
            data: customer,
            message: 'Customer updated successfully',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Error updating customer:', error);
        throw error;
    }
});
// DELETE /customers/:id - Delete customer (soft delete)
router.delete('/:id', [
    (0, express_validator_1.param)('id').isString().notEmpty().withMessage('Customer ID is required'),
    (0, express_validator_1.query)('businessId').isString().notEmpty().withMessage('Business ID is required'),
    validateRequest
], async (req, res) => {
    try {
        const { id } = req.params;
        const { businessId } = req.query;
        await customerService_1.customerService.deleteCustomer(id, businessId);
        res.json({
            success: true,
            message: 'Customer deleted successfully',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Error deleting customer:', error);
        throw error;
    }
});
// POST /customers/:id/tags - Add tag to customer
router.post('/:id/tags', [
    (0, express_validator_1.param)('id').isString().notEmpty().withMessage('Customer ID is required'),
    (0, express_validator_1.body)('businessId').isString().notEmpty().withMessage('Business ID is required'),
    (0, express_validator_1.body)('tag').isString().isLength({ min: 1, max: 50 }).withMessage('Tag is required and must be 1-50 characters'),
    validateRequest
], async (req, res) => {
    try {
        const { id } = req.params;
        const { businessId, tag } = req.body;
        const customer = await customerService_1.customerService.addCustomerTag(id, businessId, tag);
        res.json({
            success: true,
            data: customer,
            message: 'Tag added successfully',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Error adding customer tag:', error);
        throw error;
    }
});
// DELETE /customers/:id/tags/:tag - Remove tag from customer
router.delete('/:id/tags/:tag', [
    (0, express_validator_1.param)('id').isString().notEmpty().withMessage('Customer ID is required'),
    (0, express_validator_1.param)('tag').isString().notEmpty().withMessage('Tag is required'),
    (0, express_validator_1.query)('businessId').isString().notEmpty().withMessage('Business ID is required'),
    validateRequest
], async (req, res) => {
    try {
        const { id, tag } = req.params;
        const { businessId } = req.query;
        const customer = await customerService_1.customerService.removeCustomerTag(id, businessId, tag);
        res.json({
            success: true,
            data: customer,
            message: 'Tag removed successfully',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Error removing customer tag:', error);
        throw error;
    }
});
//# sourceMappingURL=customers.js.map