/**
 * LawLens Legal Knowledge Operating System (LKOS) v2
 * Full hierarchy management with versioning, audit, and workflow
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DATA_DIR = path.join(__dirname, '..', 'data');
const VERSIONS_DIR = path.join(DATA_DIR, 'versions');

class LegalKnowledgeOS {
  constructor() {
    if (!fs.existsSync(VERSIONS_DIR)) {
      fs.mkdirSync(VERSIONS_DIR, { recursive: true });
    }
  }

  // ══════════════════════════════════════════════════════════════
  // HIERARCHY: Act > Part > Chapter > Section > Subsection > Clause > Explanation > Illustration
  // ══════════════════════════════════════════════════════════════

  _getHierarchyPath(actId) {
    return path.join(DATA_DIR, 'hierarchy', `${actId}.json`);
  }

  _loadAct(actId) {
    const filePath = this._getHierarchyPath(actId);
    if (!fs.existsSync(filePath)) return null;
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch {
      return null;
    }
  }

  _saveAct(actId, data) {
    const dir = path.join(DATA_DIR, 'hierarchy');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    data.updatedAt = new Date().toISOString();
    fs.writeFileSync(this._getHierarchyPath(actId), JSON.stringify(data, null, 2));
  }

  /**
   * Create a new Act with full hierarchy
   */
  createAct({ title, actNumber, year, authority, description, tags = [] }) {
    const actId = `act-${uuidv4().slice(0, 8)}`;
    const act = {
      id: actId,
      type: 'act',
      title,
      actNumber: actNumber || null,
      year: year || null,
      authority: authority || '',
      description: description || '',
      tags,
      status: 'draft', // draft, published, archived
      version: 1,
      parts: [],
      metadata: {
        totalSections: 0,
        lastEditedBy: null,
        createdAt: new Date().toISOString()
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this._saveAct(actId, act);
    this._recordVersion(actId, act, 'created');
    return act;
  }

  /**
   * Get full act hierarchy
   */
  getAct(actId) {
    return this._loadAct(actId);
  }

  /**
   * List all acts
   */
  listActs({ status, search } = {}) {
    const dir = path.join(DATA_DIR, 'hierarchy');
    if (!fs.existsSync(dir)) return [];

    const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
    let acts = files.map(f => {
      try {
        return JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8'));
      } catch {
        return null;
      }
    }).filter(Boolean);

    if (status) acts = acts.filter(a => a.status === status);
    if (search) {
      const q = search.toLowerCase();
      acts = acts.filter(a => (a.title || '').toLowerCase().includes(q) || (a.actNumber || '').toLowerCase().includes(q));
    }

    return acts.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }

  /**
   * Update act metadata
   */
  updateAct(actId, updates, userId, userName) {
    const act = this._loadAct(actId);
    if (!act) return null;

    const before = JSON.parse(JSON.stringify(act));
    Object.assign(act, updates, { updatedAt: new Date().toISOString() });
    act.metadata.lastEditedBy = userName || userId;

    this._saveAct(actId, act);
    this._recordVersion(actId, act, 'updated', before, userId, userName);
    return act;
  }

  /**
   * Publish an act
   */
  publishAct(actId, userId, userName) {
    return this.updateAct(actId, { status: 'published' }, userId, userName);
  }

  /**
   * Archive an act
   */
  archiveAct(actId, userId, userName) {
    return this.updateAct(actId, { status: 'archived' }, userId, userName);
  }

  /**
   * Delete an act
   */
  deleteAct(actId) {
    const filePath = this._getHierarchyPath(actId);
    if (!fs.existsSync(filePath)) return false;
    fs.unlinkSync(filePath);
    return true;
  }

  // ══════════════════════════════════════════════════════════════
  // SECTIONS: Add, update, delete within an act
  // ══════════════════════════════════════════════════════════════

  /**
   * Add a section to an act
   */
  addSection(actId, { parentId, type, number, title, content, keywords = [], legalTopics = [] }) {
    const act = this._loadAct(actId);
    if (!act) return null;

    const section = {
      id: `sec-${uuidv4().slice(0, 8)}`,
      type: type || 'section', // part, chapter, section, subsection, clause, explanation, illustration, schedule
      number: number || '',
      title: title || '',
      content: content || '',
      keywords,
      legalTopics,
      children: [],
      order: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (parentId) {
      const parent = this._findNode(act, parentId);
      if (parent) {
        section.order = (parent.children?.length || 0);
        parent.children = parent.children || [];
        parent.children.push(section);
      }
    } else {
      section.order = act.parts.length;
      act.parts.push(section);
    }

    act.metadata.totalSections = this._countNodes(act);
    this._saveAct(actId, act);
    this._recordVersion(actId, act, 'section_added');
    return section;
  }

  /**
   * Update a section
   */
  updateSection(actId, sectionId, updates, userId, userName) {
    const act = this._loadAct(actId);
    if (!act) return null;

    const node = this._findNode(act, sectionId);
    if (!node) return null;

    const before = JSON.parse(JSON.stringify(node));
    Object.assign(node, updates, { updatedAt: new Date().toISOString() });

    this._saveAct(actId, act);
    this._recordVersion(actId, act, 'section_updated', before, userId, userName);
    return node;
  }

  /**
   * Delete a section
   */
  deleteSection(actId, sectionId) {
    const act = this._loadAct(actId);
    if (!act) return false;

    const removed = this._removeNode(act, sectionId);
    if (removed) {
      act.metadata.totalSections = this._countNodes(act);
      this._saveAct(actId, act);
      this._recordVersion(actId, act, 'section_deleted');
    }
    return removed;
  }

  /**
   * Reorder sections
   */
  reorderSections(actId, parentPath, orderedIds) {
    const act = this._loadAct(actId);
    if (!act) return false;

    if (!parentPath) {
      act.parts = orderedIds.map(id => act.parts.find(p => p.id === id)).filter(Boolean);
    } else {
      const parent = this._findNodeByPath(act, parentPath);
      if (parent && parent.children) {
        parent.children = orderedIds.map(id => parent.children.find(c => c.id === id)).filter(Boolean);
      }
    }

    this._saveAct(actId, act);
    return true;
  }

  // ══════════════════════════════════════════════════════════════
  // VERSIONING
  // ══════════════════════════════════════════════════════════════

  _recordVersion(actId, data, action, before = null, userId = null, userName = null) {
    const versionFile = path.join(VERSIONS_DIR, `${actId}.jsonl`);
    const entry = {
      timestamp: new Date().toISOString(),
      action,
      version: data.version || 1,
      userId: userId || 'system',
      userName: userName || 'System',
      snapshot: JSON.parse(JSON.stringify(data)),
      before: before ? JSON.stringify(before) : null
    };

    fs.appendFileSync(versionFile, JSON.stringify(entry) + '\n');

    // Increment version
    data.version = (data.version || 0) + 1;
    this._saveAct(actId, data);
  }

  /**
   * Get version history for an act
   */
  getVersionHistory(actId, limit = 50) {
    const versionFile = path.join(VERSIONS_DIR, `${actId}.jsonl`);
    if (!fs.existsSync(versionFile)) return [];

    const lines = fs.readFileSync(versionFile, 'utf-8').trim().split('\n').filter(Boolean);
    return lines.slice(-limit).reverse().map(line => {
      try {
        const entry = JSON.parse(line);
        return {
          timestamp: entry.timestamp,
          action: entry.action,
          version: entry.version,
          userId: entry.userId,
          userName: entry.userName
        };
      } catch {
        return null;
      }
    }).filter(Boolean);
  }

  /**
   * Restore a specific version
   */
  restoreVersion(actId, timestamp, userId, userName) {
    const versionFile = path.join(VERSIONS_DIR, `${actId}.jsonl`);
    if (!fs.existsSync(versionFile)) return null;

    const lines = fs.readFileSync(versionFile, 'utf-8').trim().split('\n').filter(Boolean);
    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        if (entry.timestamp === timestamp && entry.snapshot) {
          this._saveAct(actId, entry.snapshot);
          this._recordVersion(actId, entry.snapshot, 'restored', null, userId, userName);
          return entry.snapshot;
        }
      } catch {}
    }
    return null;
  }

  // ══════════════════════════════════════════════════════════════
  // TREE HELPERS
  // ══════════════════════════════════════════════════════════════

  _findNode(node, id) {
    if (node.id === id) return node;
    if (node.children) {
      for (const child of node.children) {
        const found = this._findNode(child, id);
        if (found) return found;
      }
    }
    if (node.parts) {
      for (const part of node.parts) {
        const found = this._findNode(part, id);
        if (found) return found;
      }
    }
    return null;
  }

  _findNodeByPath(act, pathStr) {
    const parts = pathStr.split('/');
    let current = act;
    for (const part of parts) {
      if (part === 'parts') continue;
      if (current.children) {
        current = current.children.find(c => c.id === part);
      } else if (current.parts) {
        current = current.parts.find(p => p.id === part);
      }
      if (!current) return null;
    }
    return current;
  }

  _removeNode(node, id) {
    if (node.children) {
      const idx = node.children.findIndex(c => c.id === id);
      if (idx >= 0) {
        node.children.splice(idx, 1);
        return true;
      }
      for (const child of node.children) {
        if (this._removeNode(child, id)) return true;
      }
    }
    if (node.parts) {
      const idx = node.parts.findIndex(p => p.id === id);
      if (idx >= 0) {
        node.parts.splice(idx, 1);
        return true;
      }
    }
    return false;
  }

  _countNodes(node) {
    let count = 0;
    if (node.children) {
      count += node.children.length;
      node.children.forEach(c => { count += this._countNodes(c); });
    }
    if (node.parts) {
      count += node.parts.length;
      node.parts.forEach(p => { count += this._countNodes(p); });
    }
    return count;
  }

  /**
   * Get stats
   */
  getStats() {
    const acts = this.listActs();
    const dir = path.join(DATA_DIR, 'hierarchy');
    let totalSections = 0;
    let totalNodes = 0;

    acts.forEach(act => {
      totalSections += act.metadata?.totalSections || 0;
      totalNodes += this._countNodes(act);
    });

    return {
      totalActs: acts.length,
      published: acts.filter(a => a.status === 'published').length,
      draft: acts.filter(a => a.status === 'draft').length,
      archived: acts.filter(a => a.status === 'archived').length,
      totalSections,
      totalNodes
    };
  }
}

module.exports = LegalKnowledgeOS;
