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
  getBusinessConfig,
  updateBusinessConfig,
  getMonthlyReport,
  exportDatabaseBackup,
  getCajas,
  createCaja,
  updateCaja,
  deleteCaja,
  getInventoryAdjustments
} from '../controllers/admin.controller.js';
import { runScraper } from '../controllers/scraper.controller.js';
import { authGuard, roleGuard } from '../middlewares/authGuard.js';

const router = Router();

router.get('/stats', authGuard, roleGuard(['ADMIN']), getDashboardStats);

// Bulk Price Manager Routes
router.get('/inventory-prices', authGuard, roleGuard(['ADMIN']), getInventoryPrices);
router.post('/bulk-price-update', authGuard, roleGuard(['ADMIN']), bulkUpdatePrices);

// Old Price Inbox Routes (Keep for now but unused in UI)
router.get('/prices', authGuard, roleGuard(['ADMIN']), getPriceSuggestions);
router.post('/prices/:id/approve', authGuard, roleGuard(['ADMIN']), approveSuggestion);
router.post('/prices/:id/reject', authGuard, roleGuard(['ADMIN']), rejectSuggestion);

// Scraper Route
router.post('/scrape', authGuard, roleGuard(['ADMIN']), runScraper);

// Cancellation and Expenses
router.post('/cancel-sale/:id', authGuard, roleGuard(['ADMIN']), cancelSale);
router.post('/gastos', authGuard, addGasto);
router.get('/corte', authGuard, roleGuard(['ADMIN']), getCorteCaja);
router.patch('/inventory/adjust', authGuard, roleGuard(['ADMIN']), adjustInventory);
router.post('/inventory/bulk-adjust', authGuard, roleGuard(['ADMIN']), bulkAdjustInventory);
router.get('/inventory/adjustments', authGuard, roleGuard(['ADMIN']), getInventoryAdjustments);
router.post('/inventory/products', authGuard, roleGuard(['ADMIN']), createProduct);
router.put('/inventory/products/:id', authGuard, roleGuard(['ADMIN']), updateProduct);

// Global Config
router.get('/config', authGuard, roleGuard(['ADMIN']), getBusinessConfig);
router.post('/config', authGuard, roleGuard(['ADMIN']), updateBusinessConfig);

// Reports & Backups
router.get('/reports/monthly', authGuard, roleGuard(['ADMIN']), getMonthlyReport);
router.get('/export/backup', authGuard, roleGuard(['ADMIN']), exportDatabaseBackup);

// Cajas Management
router.get('/cajas', authGuard, getCajas); // Allow cashiers to see list
router.post('/cajas', authGuard, roleGuard(['ADMIN']), createCaja);
router.put('/cajas/:id', authGuard, roleGuard(['ADMIN']), updateCaja);
router.delete('/cajas/:id', authGuard, roleGuard(['ADMIN']), deleteCaja);

export default router;
