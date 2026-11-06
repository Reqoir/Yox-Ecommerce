import { Router } from 'express';
import { SettingsController } from '../controllers/settings.controller';
import { requireAuth } from '../../../../presentation/http/middleware/require-auth.middleware';
import { cacheMiddleware, invalidateCache } from '../../../../presentation/http/middleware/cache.middleware';

const router = Router();
const controller = new SettingsController();

// Public route to fetch settings (e.g. storefront config, cached for 10 minutes)
router.get('/:key', cacheMiddleware(600, 'settings'), controller.getSetting.bind(controller));

// Admin route to update settings (Requires auth, invalidates settings cache upon mutation)
router.put('/:key', requireAuth, async (req, res) => {
  await invalidateCache('settings:*');
  return controller.updateSetting(req, res);
});

export const settingsRoutes = router;
