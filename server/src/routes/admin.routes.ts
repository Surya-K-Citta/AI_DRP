// @ts-nocheck
import { integrationStatus } from '../lib/integrations/readThrough';
import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { gatewayConfig } from '../lib/aiGateway';
import { UserAdminController } from '../controllers/userAdmin.controller';
import { auditOnSuccess, pick } from '../lib/auditMiddleware';

const router = Router();

// All routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

// Get analytics
router.get('/analytics', AdminController.getAnalytics);

// Get all users
router.get('/users', AdminController.getAllUsers);

// Get all projects
router.get('/projects', AdminController.getAllProjects);

// Get all feedback
router.get('/feedback', AdminController.getAllFeedback);

// User management
router.put('/users/:id', AdminController.updateUser);
router.delete('/users/:id', AdminController.deleteUser);
router.post('/users/invite', UserAdminController.invite);
router.post('/users/:id/deactivate', UserAdminController.deactivate);
router.post('/users/:id/reactivate', UserAdminController.reactivate);
router.post('/users/:id/revoke-sessions', UserAdminController.revokeSessions);

// DPR management
router.get('/dprs', AdminController.getAllDPRs);
router.post('/dprs/:id/approve', auditOnSuccess(AdminController.approveDPR, { action: 'dpr_decision', targetType: 'dpr', payload: (req) => ({ decision: 'approve' }) }));
router.post('/dprs/:id/reject', auditOnSuccess(AdminController.rejectDPR, { action: 'dpr_decision', targetType: 'dpr', payload: (req) => ({ decision: 'reject', reason: req.body?.reason }) }));

// Policy management
router.get('/policies', AdminController.getAllPolicies);
const policyFields = ['title', 'category', 'version', 'status', 'effectiveDate', 'expiryDate', 'tags'];
router.post('/policies', auditOnSuccess(AdminController.createPolicy, { action: 'policy_change', targetType: 'policy', payload: (req) => ({ op: 'create', ...pick(req.body, policyFields) }) }));
router.put('/policies/:id', auditOnSuccess(AdminController.updatePolicy, { action: 'policy_change', targetType: 'policy', payload: (req) => ({ op: 'update', changed: Object.keys(req.body || {}), ...pick(req.body, policyFields) }) }));
router.delete('/policies/:id', auditOnSuccess(AdminController.deletePolicy, { action: 'policy_change', targetType: 'policy', payload: () => ({ op: 'delete' }) }));
router.post('/policies/:id/approve', auditOnSuccess(AdminController.approvePolicy, { action: 'policy_change', targetType: 'policy', payload: () => ({ op: 'approve' }) }));

router.get('/audit', AdminController.getAudit);
router.get('/audit/csv', AdminController.exportAuditCsv);
router.get('/audit/verify', AdminController.verifyAudit);
router.get('/ai/status', (_req, res) => res.json({ success: true, data: gatewayConfig() }));
router.get('/infra/status', (_req, res) => {
  const { accountCacheStats, accountCacheHitRate, STATUS_TTL_MS } = require('../lib/accountStatus');
  const mongoose = require('mongoose');
  const opts = mongoose.connection.getClient?.()?.options || {};
  res.json({
    success: true,
    data: {
      database: { readyState: mongoose.connection.readyState, maxPoolSize: opts.maxPoolSize ?? null, minPoolSize: opts.minPoolSize ?? null, maxIdleTimeMS: opts.maxIdleTimeMS ?? null },
      redis: require('../lib/redis').redisStatus(),
      accountStatusCache: { ttlMs: STATUS_TTL_MS, ...accountCacheStats, hitRate: accountCacheHitRate() },
      rateLimitStore: process.env.REDIS_URL ? 'redis (memory when unreachable)' : 'memory (per server)',
    },
  });
});
router.get('/integrations/status', (_req, res) => res.json({ success: true, data: integrationStatus() }));
router.post('/retention/run', AdminController.runRetention);

export default router;

