const { successResponse, errorResponse } = require('../utils/apiResponse');
const securityService = require('../services/securityService');

/**
 * Handle incoming security events from Wazuh integrations or direct API calls
 */
exports.analyze = async (req, res, next) => {
  try {
    let ip = req.body.ip || req.body.srcip || req.body.src_ip;
    let log = req.body.log || req.body.message || req.body.full_log;
    let ruleId = req.body.ruleId || req.body.rule_id;
    let level = req.body.level;
    let source = req.body.source || 'api';

    // Parse Wazuh standard integration JSON payload if present
    // Wazuh sends { alert: { rule: { id, level, description }, data: { srcip }, full_log } }
    if (req.body.alert) {
      const alert = req.body.alert;
      ip = ip || alert.data?.srcip || alert.data?.src_ip;
      log = log || alert.full_log || alert.rule?.description;
      ruleId = ruleId || alert.rule?.id;
      level = level || alert.rule?.level;
      source = 'wazuh-integration';
    }

    // Default IP if none provided (e.g., from request IP)
    if (!ip) {
      ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || '127.0.0.1';
      // Normalize IPv6 localhost
      if (ip === '::1' || ip === '::ffff:127.0.0.1') {
        ip = '127.0.0.1';
      }
    }

    if (!log) {
      log = `Observed connection on endpoint ${req.originalUrl} from ${ip}`;
    }

    const incident = await securityService.processSecurityEvent({
      ip,
      log,
      source,
      ruleId,
      level
    });

    return successResponse(res, incident, 'Security log analyzed successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Get recent analyzed security incidents
 */
exports.getAlerts = async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit || 20), 100);
    const incidents = await securityService.getRecentIncidents(limit);
    return successResponse(res, incidents, 'Incidents retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get threat intelligence and AI SOC stats
 */
exports.getStats = async (req, res, next) => {
  try {
    const stats = await securityService.getSecurityStats();
    return successResponse(res, stats, 'Security stats retrieved successfully');
  } catch (error) {
    next(error);
  }
};
