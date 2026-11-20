/* RAN Operations Intelligence — shared ingestion utilities
 * Dependency-free browser helpers. Keep raw source values; normalize only known values.
 */
(function (global) {
  'use strict';

  function parseCSV(input) {
    const text = String(input == null ? '' : input).replace(/^\uFEFF/, '');
    const rows = [];
    let row = [], field = '', quoted = false, afterQuote = false;

    for (let i = 0; i < text.length; i++) {
      const ch = text[i], next = text[i + 1];
      if (quoted) {
        if (ch === '"' && next === '"') { field += '"'; i++; }
        else if (ch === '"') { quoted = false; afterQuote = true; }
        else field += ch;
        continue;
      }
      if (ch === '"' && field.length === 0) { quoted = true; afterQuote = false; continue; }
      if (ch === ',' ) { row.push(field); field = ''; afterQuote = false; continue; }
      if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && next === '\n') i++;
        row.push(field); field = ''; afterQuote = false;
        if (row.some(v => String(v).trim() !== '')) rows.push(row);
        row = [];
        continue;
      }
      if (afterQuote && ch !== ' ' && ch !== '\t') {
        throw new Error('CSV tidak valid: ditemukan karakter setelah penutup quote.');
      }
      if (!afterQuote) field += ch;
    }
    if (quoted) throw new Error('CSV tidak valid: quoted field belum ditutup.');
    if (field.length || row.length) {
      row.push(field);
      if (row.some(v => String(v).trim() !== '')) rows.push(row);
    }
    return rows;
  }

  async function fetchText(url, options) {
    const opts = options || {};
    const timeoutMs = Number(opts.timeoutMs) > 0 ? Number(opts.timeoutMs) : 30000;
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    let timer = null;
    try {
      if (controller) timer = setTimeout(() => controller.abort(), timeoutMs);
      const response = await fetch(url, {
        cache: 'no-store',
        signal: controller ? controller.signal : undefined,
        headers: { 'Accept': 'text/csv,text/plain;q=0.9,*/*;q=0.8' }
      });
      if (!response.ok) throw new Error('HTTP ' + response.status + ' saat membaca sumber data.');
      const body = await response.text();
      const trimmed = body.trimStart();
      if (!trimmed) throw new Error('Sumber data mengembalikan konten kosong.');
      if (/^<(?:!doctype\s+html|html|head|body)\b/i.test(trimmed)) {
        throw new Error('Sumber mengembalikan HTML, bukan CSV. Periksa publikasi/izin Google Sheets.');
      }
      return body;
    } catch (error) {
      if (error && error.name === 'AbortError') throw new Error('Waktu tunggu sumber data habis (' + timeoutMs + ' ms).');
      throw error;
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  function escapeHTML(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[ch]);
  }

  function csvCell(value) {
    const text = String(value == null ? '' : value);
    return '"' + text.replace(/"/g, '""') + '"';
  }

  function normalizeStatus(value) {
    const raw = String(value == null ? '' : value).trim().toLowerCase();
    if (!raw) return 'Unknown';
    if (/^(closed|close|resolved|completed|done)$/.test(raw)) return 'Closed';
    if (/^(open|opened|ongoing|in progress|in-progress|pending)$/.test(raw)) return 'Open';
    return 'Unknown';
  }

  function normalizePriority(value) {
    const raw = String(value == null ? '' : value).trim().toUpperCase();
    if (!raw) return 'Unknown';
    if (raw.includes('CRITICAL') || /\bP1\b/.test(raw)) return 'P1';
    if (raw.includes('MAJOR') || /\bP2\b/.test(raw)) return 'P2';
    if (raw.includes('MINOR') || /\bP3\b/.test(raw)) return 'P3';
    if (raw.includes('WARNING') || raw.includes('WARN') || /\bP4\b/.test(raw)) return 'P4';
    return 'Unknown';
  }

  global.RANData = Object.freeze({
    parseCSV, fetchText, escapeHTML, csvCell, normalizeStatus, normalizePriority
  });
})(window);
