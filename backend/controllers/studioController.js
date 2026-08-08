/**
 * LawLens Studio — Backend Controller
 * Studio-specific API endpoints
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const db = require('../database/db');
const auditLog = require('../utils/auditLog');
const jobQueue = require('../utils/jobQueue');
const LegalKnowledgeOS = require('../knowledge/legalKnowledgeOS');
const SourceTracker = require('../knowledge/sourceTracker');

const DATA_DIR = path.resolve(__dirname, '..', 'data');
const lkos = new LegalKnowledgeOS();
const sourceTracker = new SourceTracker();

// ══════════════════════════════════════════════════════════════
// INPUT SANITIZATION
// ══════════════════════════════════════════════════════════════
function sanitize(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/[<>]/g, '').trim().substring(0, 10000);
}

function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const cleaned = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      cleaned[key] = sanitize(value);
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      cleaned[key] = sanitizeObject(value);
    } else if (Array.isArray(value)) {
      cleaned[key] = value.map(v => typeof v === 'string' ? sanitize(v) : v);
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

// ── System Info ──────────────────────────────────────────────
exports.getSystemInfo = async (req, res) => {
  try {
    const memUsage = process.memoryUsage();
    res.json({
      success: true,
      data: {
        nodeVersion: process.version,
        platform: os.platform(),
        arch: os.arch(),
        uptime: process.uptime(),
        memory: {
          rss: memUsage.rss,
          heapUsed: memUsage.heapUsed,
          heapTotal: memUsage.heapTotal,
          external: memUsage.external
        },
        cpuCount: os.cpus().length,
        loadAvg: os.loadavg(),
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
        hostname: os.hostname()
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── Comprehensive Health ─────────────────────────────────────
exports.getHealth = async (req, res) => {
  try {
    const memUsage = process.memoryUsage();

    // Check data directory
    let dataDirSize = 0;
    let dataFileCount = 0;
    if (fs.existsSync(DATA_DIR)) {
      const files = fs.readdirSync(DATA_DIR);
      dataFileCount = files.length;
      files.forEach(f => {
        try {
          const stat = fs.statSync(path.join(DATA_DIR, f));
          if (stat.isFile()) dataDirSize += stat.size;
        } catch {}
      });
    }

    // Check database
    let dbCollections = 0;
    let dbRecords = 0;
    const dbPath = path.join(__dirname, '..', 'database');
    if (fs.existsSync(dbPath)) {
      const dbFiles = fs.readdirSync(dbPath).filter(f => f.endsWith('.json'));
      dbCollections = dbFiles.length;
      dbFiles.forEach(f => {
        try {
          const data = JSON.parse(fs.readFileSync(path.join(dbPath, f), 'utf-8'));
          if (Array.isArray(data)) dbRecords += data.length;
        } catch {}
      });
    }

    res.json({
      success: true,
      data: {
        status: 'ok',
        uptime: process.uptime(),
        memory: {
          used: memUsage.heapUsed,
          total: memUsage.heapTotal,
          rss: memUsage.rss,
          percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)
        },
        storage: {
          dataDir: dataDirSize,
          dataDirFormatted: formatBytes(dataDirSize),
          dataFileCount,
          dbCollections,
          dbRecords
        },
        cpu: {
          loadAvg: os.loadavg(),
          cores: os.cpus().length
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── Storage Details ──────────────────────────────────────────
exports.getStorage = async (req, res) => {
  try {
    const dirs = {
      data: DATA_DIR,
      database: path.join(__dirname, '..', 'database'),
      uploads: path.join(__dirname, '..', 'uploads'),
      vector: path.join(__dirname, '..', 'vector')
    };

    const result = {};
    for (const [name, dirPath] of Object.entries(dirs)) {
      if (fs.existsSync(dirPath)) {
        const info = getDirInfo(dirPath);
        result[name] = info;
      } else {
        result[name] = { exists: false, size: 0, files: 0 };
      }
    }

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── Process Info ─────────────────────────────────────────────
exports.getProcessInfo = async (req, res) => {
  try {
    const mem = process.memoryUsage();
    res.json({
      success: true,
      data: {
        pid: process.pid,
        uptime: process.uptime(),
        memory: {
          rss: formatBytes(mem.rss),
          heapUsed: formatBytes(mem.heapUsed),
          heapTotal: formatBytes(mem.heapTotal),
          external: formatBytes(mem.external)
        },
        cpu: os.loadavg(),
        platform: os.platform(),
        nodeVersion: process.version,
        argv: process.argv
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── Knowledge Items CRUD ─────────────────────────────────────
exports.getKnowledgeItems = async (req, res) => {
  try {
    const sourceRegistry = path.join(DATA_DIR, 'source-registry.json');
    if (!fs.existsSync(sourceRegistry)) {
      return res.json({ success: true, data: { sources: [] } });
    }
    const registry = JSON.parse(fs.readFileSync(sourceRegistry, 'utf-8'));
    res.json({ success: true, data: registry });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.createKnowledgeItem = async (req, res) => {
  try {
    const sourceRegistry = path.join(DATA_DIR, 'source-registry.json');
    let registry = { version: '1.0.0', sources: [] };
    if (fs.existsSync(sourceRegistry)) {
      registry = JSON.parse(fs.readFileSync(sourceRegistry, 'utf-8'));
    }

    const newItem = {
      id: req.body.id || `source-${Date.now()}`,
      name: req.body.name,
      authority: req.body.authority || '',
      documentType: req.body.documentType || 'statute',
      parser: req.body.parser || 'auto',
      sourceUrl: req.body.sourceUrl || '',
      effectiveDate: req.body.effectiveDate || null,
      tags: req.body.tags || [],
      isActive: true,
      integrityStatus: 'pending',
      createdAt: new Date().toISOString()
    };

    registry.sources.push(newItem);
    registry.lastUpdated = new Date().toISOString();
    fs.writeFileSync(sourceRegistry, JSON.stringify(registry, null, 2));

    res.json({ success: true, data: newItem });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.updateKnowledgeItem = async (req, res) => {
  try {
    const sourceRegistry = path.join(DATA_DIR, 'source-registry.json');
    if (!fs.existsSync(sourceRegistry)) {
      return res.status(404).json({ success: false, error: 'Registry not found' });
    }

    const registry = JSON.parse(fs.readFileSync(sourceRegistry, 'utf-8'));
    const index = registry.sources.findIndex(s => s.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Source not found' });
    }

    registry.sources[index] = { ...registry.sources[index], ...req.body, updatedAt: new Date().toISOString() };
    registry.lastUpdated = new Date().toISOString();
    fs.writeFileSync(sourceRegistry, JSON.stringify(registry, null, 2));

    res.json({ success: true, data: registry.sources[index] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.deleteKnowledgeItem = async (req, res) => {
  try {
    const sourceRegistry = path.join(DATA_DIR, 'source-registry.json');
    if (!fs.existsSync(sourceRegistry)) {
      return res.status(404).json({ success: false, error: 'Registry not found' });
    }

    const registry = JSON.parse(fs.readFileSync(sourceRegistry, 'utf-8'));
    const index = registry.sources.findIndex(s => s.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Source not found' });
    }

    registry.sources.splice(index, 1);
    registry.lastUpdated = new Date().toISOString();
    fs.writeFileSync(sourceRegistry, JSON.stringify(registry, null, 2));

    res.json({ success: true, message: 'Source deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── Graph CRUD ───────────────────────────────────────────────
exports.getGraph = async (req, res) => {
  try {
    const graphPath = path.join(DATA_DIR, 'knowledge-graph.json');
    if (!fs.existsSync(graphPath)) {
      return res.json({ success: true, data: { nodes: [], edges: [] } });
    }
    const graph = JSON.parse(fs.readFileSync(graphPath, 'utf-8'));
    res.json({ success: true, data: graph });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.addGraphNode = async (req, res) => {
  try {
    const graphPath = path.join(DATA_DIR, 'knowledge-graph.json');
    let graph = { version: '2.0.0', nodes: [], edges: [] };
    if (fs.existsSync(graphPath)) {
      graph = JSON.parse(fs.readFileSync(graphPath, 'utf-8'));
    }

    const node = {
      id: req.body.id || `node-${Date.now()}`,
      type: req.body.type || 'statutory_provision',
      title: req.body.title,
      act: req.body.act || '',
      keywords: req.body.keywords || [],
      legalTopics: req.body.legalTopics || [],
      createdAt: new Date().toISOString()
    };

    graph.nodes.push(node);
    graph.lastUpdated = new Date().toISOString();
    fs.writeFileSync(graphPath, JSON.stringify(graph, null, 2));

    res.json({ success: true, data: node });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.updateGraphNode = async (req, res) => {
  try {
    const graphPath = path.join(DATA_DIR, 'knowledge-graph.json');
    if (!fs.existsSync(graphPath)) {
      return res.status(404).json({ success: false, error: 'Graph not found' });
    }

    const graph = JSON.parse(fs.readFileSync(graphPath, 'utf-8'));
    const index = graph.nodes.findIndex(n => n.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Node not found' });
    }

    graph.nodes[index] = { ...graph.nodes[index], ...req.body, updatedAt: new Date().toISOString() };
    graph.lastUpdated = new Date().toISOString();
    fs.writeFileSync(graphPath, JSON.stringify(graph, null, 2));

    res.json({ success: true, data: graph.nodes[index] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.deleteGraphNode = async (req, res) => {
  try {
    const graphPath = path.join(DATA_DIR, 'knowledge-graph.json');
    if (!fs.existsSync(graphPath)) {
      return res.status(404).json({ success: false, error: 'Graph not found' });
    }

    const graph = JSON.parse(fs.readFileSync(graphPath, 'utf-8'));
    graph.nodes = graph.nodes.filter(n => n.id !== req.params.id);
    graph.edges = graph.edges.filter(e => e.source !== req.params.id && e.target !== req.params.id);
    graph.lastUpdated = new Date().toISOString();
    fs.writeFileSync(graphPath, JSON.stringify(graph, null, 2));

    res.json({ success: true, message: 'Node deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.addGraphEdge = async (req, res) => {
  try {
    const graphPath = path.join(DATA_DIR, 'knowledge-graph.json');
    let graph = { version: '2.0.0', nodes: [], edges: [] };
    if (fs.existsSync(graphPath)) {
      graph = JSON.parse(fs.readFileSync(graphPath, 'utf-8'));
    }

    const edge = {
      id: req.body.id || `edge-${Date.now()}`,
      source: req.body.source,
      target: req.body.target,
      relationship: req.body.relationship || 'RELATED_TO',
      metadata: req.body.metadata || {}
    };

    graph.edges.push(edge);
    graph.lastUpdated = new Date().toISOString();
    fs.writeFileSync(graphPath, JSON.stringify(graph, null, 2));

    res.json({ success: true, data: edge });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.deleteGraphEdge = async (req, res) => {
  try {
    const graphPath = path.join(DATA_DIR, 'knowledge-graph.json');
    if (!fs.existsSync(graphPath)) {
      return res.status(404).json({ success: false, error: 'Graph not found' });
    }

    const graph = JSON.parse(fs.readFileSync(graphPath, 'utf-8'));
    graph.edges = graph.edges.filter(e => e.id !== req.params.id);
    graph.lastUpdated = new Date().toISOString();
    fs.writeFileSync(graphPath, JSON.stringify(graph, null, 2));

    res.json({ success: true, message: 'Edge deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── Search Config ────────────────────────────────────────────
exports.getSearchConfig = async (req, res) => {
  try {
    const configPath = path.join(DATA_DIR, 'search-config.json');
    let config = { mode: 'hybrid', weights: { vector: 0.6, keyword: 0.3, graph: 0.1 }, maxResults: 10 };
    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    }
    res.json({ success: true, data: config });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.updateSearchConfig = async (req, res) => {
  try {
    const configPath = path.join(DATA_DIR, 'search-config.json');
    const config = { ...req.body, updatedAt: new Date().toISOString() };
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    res.json({ success: true, data: config });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── AI Config ────────────────────────────────────────────────
exports.getAIConfig = async (req, res) => {
  try {
    const configPath = path.join(DATA_DIR, 'ai-config.json');
    let config = {
      provider: 'groq',
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      maxTokens: 4096,
      topK: 5,
      reranking: true,
      streaming: true
    };
    if (fs.existsSync(configPath)) {
      config = { ...config, ...JSON.parse(fs.readFileSync(configPath, 'utf-8')) };
    }
    res.json({ success: true, data: config });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.updateAIConfig = async (req, res) => {
  try {
    const configPath = path.join(DATA_DIR, 'ai-config.json');
    const config = { ...req.body, updatedAt: new Date().toISOString() };
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    res.json({ success: true, data: config });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── Theme ────────────────────────────────────────────────────
exports.getTheme = async (req, res) => {
  try {
    const themePath = path.join(DATA_DIR, 'studio-theme.json');
    let theme = {
      primaryColor: '#6366f1',
      accentColor: '#8b5cf6',
      fontFamily: 'Inter',
      borderRadius: 10,
      spacing: 16
    };
    if (fs.existsSync(themePath)) {
      theme = { ...theme, ...JSON.parse(fs.readFileSync(themePath, 'utf-8')) };
    }
    res.json({ success: true, data: theme });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.updateTheme = async (req, res) => {
  try {
    const themePath = path.join(DATA_DIR, 'studio-theme.json');
    const theme = { ...req.body, updatedAt: new Date().toISOString() };
    fs.writeFileSync(themePath, JSON.stringify(theme, null, 2));
    res.json({ success: true, data: theme });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── Helpers ──────────────────────────────────────────────────
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function getDirInfo(dirPath) {
  let size = 0;
  let files = 0;
  try {
    const items = fs.readdirSync(dirPath);
    items.forEach(item => {
      const fullPath = path.join(dirPath, item);
      try {
        const stat = fs.statSync(fullPath);
        if (stat.isFile()) {
          size += stat.size;
          files++;
        }
      } catch {}
    });
  } catch {}
  return { exists: true, size, sizeFormatted: formatBytes(size), files };
}

// ══════════════════════════════════════════════════════════════
// AUDIT LOG
// ══════════════════════════════════════════════════════════════
exports.getAuditLogs = async (req, res) => {
  try {
    const { entity, action, userId, startDate, endDate, limit, offset } = req.query;
    const result = auditLog.query({
      entity, action, userId, startDate, endDate,
      limit: parseInt(limit) || 50,
      offset: parseInt(offset) || 0
    });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getAuditStats = async (req, res) => {
  try {
    const stats = auditLog.getStats();
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.recordAudit = async (req, res) => {
  try {
    const entry = auditLog.record({
      ...req.body,
      userId: req.user?.id,
      userName: req.user?.name
    });
    res.json({ success: true, data: entry });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ══════════════════════════════════════════════════════════════
// BACKGROUND JOBS
// ══════════════════════════════════════════════════════════════
exports.getJobs = async (req, res) => {
  try {
    const { type, status, limit, offset } = req.query;
    const result = jobQueue.query({
      type, status,
      limit: parseInt(limit) || 50,
      offset: parseInt(offset) || 0
    });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getJobStats = async (req, res) => {
  try {
    const stats = jobQueue.getStats();
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.createJob = async (req, res) => {
  try {
    const job = jobQueue.create({
      ...req.body,
      metadata: { ...req.body.metadata, userId: req.user?.id }
    });
    auditLog.record({
      action: 'job_created',
      entity: 'job',
      entityId: job.id,
      after: job,
      userId: req.user?.id,
      userName: req.user?.name,
      metadata: { jobType: job.type, jobName: job.name }
    });
    res.json({ success: true, data: job });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getJob = async (req, res) => {
  try {
    const job = jobQueue.get(req.params.id);
    if (!job) return res.status(404).json({ success: false, error: 'Job not found' });
    res.json({ success: true, data: job });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.cancelJob = async (req, res) => {
  try {
    const job = jobQueue.cancel(req.params.id);
    if (!job) return res.status(404).json({ success: false, error: 'Job not found' });
    auditLog.record({
      action: 'job_cancelled',
      entity: 'job',
      entityId: job.id,
      userId: req.user?.id,
      userName: req.user?.name
    });
    res.json({ success: true, data: job });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.retryJob = async (req, res) => {
  try {
    const job = jobQueue.retry(req.params.id);
    if (!job) return res.status(404).json({ success: false, error: 'Job not retryable' });
    res.json({ success: true, data: job });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ══════════════════════════════════════════════════════════════
// PAGE BUILDER
// ══════════════════════════════════════════════════════════════
exports.getPages = async (req, res) => {
  try {
    const pagesPath = path.join(DATA_DIR, 'pages.json');
    let pages = [];
    if (fs.existsSync(pagesPath)) {
      pages = JSON.parse(fs.readFileSync(pagesPath, 'utf-8'));
    }
    res.json({ success: true, data: pages });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.savePage = async (req, res) => {
  try {
    const pagesPath = path.join(DATA_DIR, 'pages.json');
    let pages = [];
    if (fs.existsSync(pagesPath)) {
      pages = JSON.parse(fs.readFileSync(pagesPath, 'utf-8'));
    }

    const page = {
      id: req.body.id || `page-${Date.now()}`,
      name: req.body.name || 'Untitled Page',
      slug: req.body.slug || 'untitled',
      blocks: req.body.blocks || [],
      metadata: req.body.metadata || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const existing = pages.findIndex(p => p.id === page.id);
    if (existing >= 0) {
      page.createdAt = pages[existing].createdAt;
      pages[existing] = page;
    } else {
      pages.push(page);
    }

    fs.writeFileSync(pagesPath, JSON.stringify(pages, null, 2));

    auditLog.record({
      action: existing >= 0 ? 'page_updated' : 'page_created',
      entity: 'page',
      entityId: page.id,
      after: page,
      userId: req.user?.id,
      userName: req.user?.name
    });

    res.json({ success: true, data: page });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.deletePage = async (req, res) => {
  try {
    const pagesPath = path.join(DATA_DIR, 'pages.json');
    if (!fs.existsSync(pagesPath)) return res.status(404).json({ success: false, error: 'No pages' });

    let pages = JSON.parse(fs.readFileSync(pagesPath, 'utf-8'));
    const page = pages.find(p => p.id === req.params.id);
    if (!page) return res.status(404).json({ success: false, error: 'Page not found' });

    pages = pages.filter(p => p.id !== req.params.id);
    fs.writeFileSync(pagesPath, JSON.stringify(pages, null, 2));

    auditLog.record({
      action: 'page_deleted',
      entity: 'page',
      entityId: req.params.id,
      before: page,
      userId: req.user?.id,
      userName: req.user?.name
    });

    res.json({ success: true, message: 'Page deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ══════════════════════════════════════════════════════════════
// KNOWLEDGE OS — Full hierarchy management
// ══════════════════════════════════════════════════════════════
exports.lkosListActs = async (req, res) => {
  try {
    const { status, search } = req.query;
    const acts = lkos.listActs({ status, search });
    res.json({ success: true, data: acts });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.lkosGetAct = async (req, res) => {
  try {
    const act = lkos.getAct(req.params.actId);
    if (!act) return res.status(404).json({ success: false, error: 'Act not found' });
    res.json({ success: true, data: act });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.lkosCreateAct = async (req, res) => {
  try {
    const sanitized = sanitizeObject(req.body);
    const act = lkos.createAct(sanitized);
    auditLog.record({
      action: 'act_created', entity: 'knowledge', entityId: act.id,
      after: act, userId: req.user?.id, userName: req.user?.name
    });
    res.json({ success: true, data: act });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.lkosUpdateAct = async (req, res) => {
  try {
    const sanitized = sanitizeObject(req.body);
    const act = lkos.updateAct(req.params.actId, sanitized, req.user?.id, req.user?.name);
    if (!act) return res.status(404).json({ success: false, error: 'Act not found' });
    auditLog.record({
      action: 'act_updated', entity: 'knowledge', entityId: act.id,
      after: act, userId: req.user?.id, userName: req.user?.name
    });
    res.json({ success: true, data: act });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.lkosDeleteAct = async (req, res) => {
  try {
    const deleted = lkos.deleteAct(req.params.actId);
    if (!deleted) return res.status(404).json({ success: false, error: 'Act not found' });
    auditLog.record({
      action: 'act_deleted', entity: 'knowledge', entityId: req.params.actId,
      userId: req.user?.id, userName: req.user?.name
    });
    res.json({ success: true, message: 'Act deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.lkosPublishAct = async (req, res) => {
  try {
    const act = lkos.publishAct(req.params.actId, req.user?.id, req.user?.name);
    if (!act) return res.status(404).json({ success: false, error: 'Act not found' });
    auditLog.record({
      action: 'act_published', entity: 'knowledge', entityId: act.id,
      after: act, userId: req.user?.id, userName: req.user?.name
    });
    res.json({ success: true, data: act });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.lkosArchiveAct = async (req, res) => {
  try {
    const act = lkos.archiveAct(req.params.actId, req.user?.id, req.user?.name);
    if (!act) return res.status(404).json({ success: false, error: 'Act not found' });
    auditLog.record({
      action: 'act_archived', entity: 'knowledge', entityId: act.id,
      after: act, userId: req.user?.id, userName: req.user?.name
    });
    res.json({ success: true, data: act });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.lkosAddSection = async (req, res) => {
  try {
    const sanitized = sanitizeObject(req.body);
    const section = lkos.addSection(req.params.actId, sanitized);
    if (!section) return res.status(404).json({ success: false, error: 'Act not found' });
    auditLog.record({
      action: 'section_added', entity: 'knowledge',
      entityId: `${req.params.actId}/${section.id}`,
      after: section, userId: req.user?.id, userName: req.user?.name
    });
    res.json({ success: true, data: section });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.lkosUpdateSection = async (req, res) => {
  try {
    const sanitized = sanitizeObject(req.body);
    const section = lkos.updateSection(req.params.actId, req.params.sectionId, sanitized, req.user?.id, req.user?.name);
    if (!section) return res.status(404).json({ success: false, error: 'Section not found' });
    auditLog.record({
      action: 'section_updated', entity: 'knowledge',
      entityId: `${req.params.actId}/${req.params.sectionId}`,
      after: section, userId: req.user?.id, userName: req.user?.name
    });
    res.json({ success: true, data: section });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.lkosDeleteSection = async (req, res) => {
  try {
    const deleted = lkos.deleteSection(req.params.actId, req.params.sectionId);
    if (!deleted) return res.status(404).json({ success: false, error: 'Section not found' });
    auditLog.record({
      action: 'section_deleted', entity: 'knowledge',
      entityId: `${req.params.actId}/${req.params.sectionId}`,
      userId: req.user?.id, userName: req.user?.name
    });
    res.json({ success: true, message: 'Section deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.lkosGetVersions = async (req, res) => {
  try {
    const versions = lkos.getVersionHistory(req.params.actId);
    res.json({ success: true, data: versions });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.lkosRestoreVersion = async (req, res) => {
  try {
    const act = lkos.restoreVersion(req.params.actId, req.params.timestamp, req.user?.id, req.user?.name);
    if (!act) return res.status(404).json({ success: false, error: 'Version not found' });
    auditLog.record({
      action: 'version_restored', entity: 'knowledge', entityId: req.params.actId,
      after: act, userId: req.user?.id, userName: req.user?.name,
      metadata: { restoredTo: req.params.timestamp }
    });
    res.json({ success: true, data: act });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.lkosGetStats = async (req, res) => {
  try {
    const stats = lkos.getStats();
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ══════════════════════════════════════════════════════════════
// SOURCE TRACKER — Official source monitoring
// ══════════════════════════════════════════════════════════════
exports.sourceTrackerList = async (req, res) => {
  try {
    const { category, trustLevel } = req.query;
    let sources = sourceTracker.getAllSources();
    if (category) sources = sources.filter(s => s.category === category);
    if (trustLevel) sources = sources.filter(s => s.trustLevel === trustLevel);
    res.json({ success: true, data: sources });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.sourceTrackerGet = async (req, res) => {
  try {
    const source = sourceTracker.getSource(req.params.id);
    if (!source) return res.status(404).json({ success: false, error: 'Source not found' });
    res.json({ success: true, data: source });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.sourceTrackerStats = async (req, res) => {
  try {
    const stats = sourceTracker.getStats();
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.sourceTrackerCheck = async (req, res) => {
  try {
    const result = await sourceTracker.checkSource(req.params.id);
    auditLog.record({
      action: 'source_checked', entity: 'source',
      entityId: req.params.id,
      after: result, userId: req.user?.id, userName: req.user?.name
    });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.sourceTrackerCheckAll = async (req, res) => {
  try {
    const job = jobQueue.create({
      type: 'source_check',
      name: 'Check All Sources',
      description: 'Checking all official sources for changes',
      metadata: { userId: req.user?.id }
    });

    // Run check asynchronously
    sourceTracker.checkAllDue().then(result => {
      if (result.changed > 0) {
        jobQueue.complete(job.id, result);
      } else {
        jobQueue.complete(job.id, { message: 'No changes detected', ...result });
      }
    }).catch(err => {
      jobQueue.fail(job.id, err.message);
    });

    res.json({ success: true, data: { jobId: job.id, message: 'Source check started' } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.sourceTrackerApprove = async (req, res) => {
  try {
    const source = sourceTracker.approveChange(req.params.id);
    if (!source) return res.status(404).json({ success: false, error: 'Source not found' });
    auditLog.record({
      action: 'source_approved', entity: 'source',
      entityId: req.params.id,
      after: source, userId: req.user?.id, userName: req.user?.name
    });
    res.json({ success: true, data: source });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.sourceTrackerReject = async (req, res) => {
  try {
    const source = sourceTracker.rejectChange(req.params.id);
    if (!source) return res.status(404).json({ success: false, error: 'Source not found' });
    auditLog.record({
      action: 'source_rejected', entity: 'source',
      entityId: req.params.id,
      after: source, userId: req.user?.id, userName: req.user?.name
    });
    res.json({ success: true, data: source });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.sourceTrackerToggle = async (req, res) => {
  try {
    const source = sourceTracker.toggleSource(req.params.id);
    if (!source) return res.status(404).json({ success: false, error: 'Source not found' });
    auditLog.record({
      action: source.isActive ? 'source_enabled' : 'source_disabled',
      entity: 'source', entityId: req.params.id,
      after: source, userId: req.user?.id, userName: req.user?.name
    });
    res.json({ success: true, data: source });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.sourceTrackerAdd = async (req, res) => {
  try {
    const source = sourceTracker.addSource(req.body);
    auditLog.record({
      action: 'source_added', entity: 'source',
      entityId: source.id, after: source,
      userId: req.user?.id, userName: req.user?.name
    });
    res.json({ success: true, data: source });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.sourceTrackerRemove = async (req, res) => {
  try {
    const removed = sourceTracker.removeSource(req.params.id);
    if (!removed) return res.status(404).json({ success: false, error: 'Source not found' });
    auditLog.record({
      action: 'source_removed', entity: 'source',
      entityId: req.params.id,
      userId: req.user?.id, userName: req.user?.name
    });
    res.json({ success: true, message: 'Source removed' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
