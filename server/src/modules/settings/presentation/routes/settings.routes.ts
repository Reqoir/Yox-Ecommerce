import { Router } from 'express';
import { SettingsController } from '../controllers/settings.controller';
import { requireAuth } from '../../../../presentation/http/middleware/require-auth.middleware';

const router = Router();
const controller = new SettingsController();

// Public route to fetch settings (e.g. storefront config)
router.get('/:key', controller.getSetting.bind(controller));

// Admin route to update settings (Requires auth, for now we will just use requireAuth. Add permissions later if needed)
router.put('/:key', requireAuth, controller.updateSetting.bind(controller));

export const settingsRoutes = router;
