import { Router } from 'express';
import { SettingsController } from '../controllers/settings.controller';
import { requireAuth, optionalAuth } from '../../../../presentation/http/middleware/require-auth.middleware';
import { requirePermission } from '../../../../presentation/http/middleware/require-permission.middleware';
import { cacheMiddleware, invalidateCache } from '../../../../presentation/http/middleware/cache.middleware';

const router = Router();
const controller = new SettingsController();

// Public route to fetch public settings (cached for 10 minutes; non-public keys require manage_settings)
router.get('/:key', optionalAuth, cacheMiddleware(600, 'settings'), controller.getSetting.bind(controller));

// Admin route to update settings (Requires auth + manage_settings permission, invalidates settings cache upon mutation)
router.put('/:key', requireAuth, requirePermission('manage_settings'), async (req, res, next) => {
  try {
    await controller.updateSetting(req, res);
    await invalidateCache('settings:*');
  } catch (error) {
    next(error);
  }
});

export const settingsRoutes = router;
