import { Router } from 'express';
import { 
  getDashboardStats, 
  getPriceSuggestions, 
  approveSuggestion, 
  rejectSuggestion,
  getInventoryPrices,
  bulkUpdatePrices,
  cancelSale,
  addGasto,
  getCorteCaja,
  adjustInventory,
  bulkAdjustInventory,
  createProduct,
  updateProduct,
  toggleProductStatus,
  getBusinessConfig,
  updateBusinessConfig,
  getMonthlyReport,
  exportDatabaseBackup,
  getCajas,
  createCaja,
  updateCaja,
  deleteCaja,
  getInventoryAdjustments,
  importInventory
} from '../controllers/admin.controller.js';
import { runScraper } from '../controllers/scraper.controller.js';
import { authGuard, roleGuard } from '../middlewares/authGuard.js';
import { validate } from '../middlewares/validate.middleware.js';
import { 
  createProductSchema, 
  updateProductSchema, 
  toggleProductStatusSchema, 
  adjustInventorySchema, 
  bulkAdjustInventorySchema, 
  bulkUpdatePricesSchema, 
  importInventorySchema 
} from '../schemas/inventory.schema.js';
import { 
  addGastoSchema, 
  createCajaSchema, 
  updateCajaSchema, 
  updateBusinessConfigSchema 
} from '../schemas/admin.schema.js';

const router = Router();

router.get('/stats', authGuard, roleGuard(['ADMIN']), getDashboardStats);
router.post('/inventory/import', authGuard, roleGuard(['ADMIN']), validate(importInventorySchema), importInventory);

// Bulk Price Manager Routes
router.get('/inventory-prices', authGuard, roleGuard(['ADMIN']), getInventoryPrices);
router.post('/bulk-price-update', authGuard, roleGuard(['ADMIN']), validate(bulkUpdatePricesSchema), bulkUpdatePrices);

// Old Price Inbox Routes (Keep for now but unused in UI)
router.get('/prices', authGuard, roleGuard(['ADMIN']), getPriceSuggestions);
router.post('/prices/:id/approve', authGuard, roleGuard(['ADMIN']), approveSuggestion);
router.post('/prices/:id/reject', authGuard, roleGuard(['ADMIN']), rejectSuggestion);

// Scraper Route
router.post('/scrape', authGuard, roleGuard(['ADMIN']), runScraper);

// Cancellation and Expenses
router.post('/cancel-sale/:id', authGuard, roleGuard(['ADMIN']), cancelSale);
router.post('/gastos', authGuard, roleGuard(['ADMIN']), validate(addGastoSchema), addGasto);
router.get('/corte', authGuard, roleGuard(['ADMIN']), getCorteCaja);
router.patch('/inventory/adjust', authGuard, roleGuard(['ADMIN']), validate(adjustInventorySchema), adjustInventory);
router.post('/inventory/bulk-adjust', authGuard, roleGuard(['ADMIN']), validate(bulkAdjustInventorySchema), bulkAdjustInventory);
router.get('/inventory/adjustments', authGuard, roleGuard(['ADMIN']), getInventoryAdjustments);
router.post('/inventory/products', authGuard, roleGuard(['ADMIN']), validate(createProductSchema), createProduct);
router.put('/inventory/products/:id', authGuard, roleGuard(['ADMIN']), validate(updateProductSchema), updateProduct);
router.patch('/inventory/products/:id/toggle-status', authGuard, roleGuard(['ADMIN']), validate(toggleProductStatusSchema), toggleProductStatus);

// Global Config
router.get('/config', authGuard, roleGuard(['ADMIN']), getBusinessConfig);
router.post('/config', authGuard, roleGuard(['ADMIN']), validate(updateBusinessConfigSchema), updateBusinessConfig);

// Reports & Backups
router.get('/reports/monthly', authGuard, roleGuard(['ADMIN']), getMonthlyReport);
router.get('/export/backup', authGuard, roleGuard(['ADMIN']), exportDatabaseBackup);

// Cajas Management
router.get('/cajas', authGuard, getCajas); // Allow cashiers to see list
router.post('/cajas', authGuard, roleGuard(['ADMIN']), validate(createCajaSchema), createCaja);
router.put('/cajas/:id', authGuard, roleGuard(['ADMIN']), validate(updateCajaSchema), updateCaja);
router.delete('/cajas/:id', authGuard, roleGuard(['ADMIN']), deleteCaja);

export default router;
