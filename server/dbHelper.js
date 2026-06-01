import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_DIR = path.join(__dirname, 'db');

export function initLocalDb() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
    console.log(`📂 Created local database folder: ${DB_DIR}`);
  }
}

export function getFilePath(collection) {
  return path.join(DB_DIR, `${collection}.json`);
}

export function readLocalCollection(collection) {
  initLocalDb();
  const filePath = getFilePath(collection);
  if (!fs.existsSync(filePath)) {
    return [];
  }
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content || '[]');
  } catch (err) {
    console.error(`❌ Error reading local collection ${collection}:`, err.message);
    return [];
  }
}

export function writeLocalCollection(collection, data) {
  initLocalDb();
  const filePath = getFilePath(collection);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error(`❌ Error writing local collection ${collection}:`, err.message);
    return false;
  }
}

export function localInsert(collection, document) {
  const data = readLocalCollection(collection);
  const docToInsert = { ...document };
  if (!docToInsert._id) {
    docToInsert._id = `local_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  }
  if (!docToInsert.timestamp) {
    docToInsert.timestamp = new Date().toISOString();
  }
  data.push(docToInsert);
  writeLocalCollection(collection, data);
  console.log(`💾 Local DB: Inserted 1 document into [${collection}]`);
  return { result: { ok: 1, insertedId: docToInsert._id }, documents: [docToInsert] };
}

function matchFilter(doc, filter) {
  if (!filter) return true;
  for (const key in filter) {
    const filterVal = filter[key];
    const docVal = doc[key];

    if (filterVal && typeof filterVal === 'object') {
      if (filterVal.$lt !== undefined) {
        const val = filterVal.$lt;
        if (!(new Date(docVal) < new Date(val))) return false;
      } else if (filterVal.$gt !== undefined) {
        const val = filterVal.$gt;
        if (!(new Date(docVal) > new Date(val))) return false;
      } else {
        // Fallback direct comparison for nested structures
        if (JSON.stringify(docVal) !== JSON.stringify(filterVal)) return false;
      }
    } else {
      if (docVal !== filterVal) return false;
    }
  }
  return true;
}

export function localFind(collection, filter = {}, limit = 100) {
  const data = readLocalCollection(collection);
  const matched = data.filter(doc => matchFilter(doc, filter));
  const resultDocs = matched.slice(0, limit);
  return { documents: resultDocs, result: resultDocs };
}

export function localUpdate(collection, filter = {}, update = {}) {
  const data = readLocalCollection(collection);
  let updatedCount = 0;

  const nextData = data.map(doc => {
    if (matchFilter(doc, filter)) {
      let updatedDoc = { ...doc };
      if (update.$set) {
        updatedDoc = { ...updatedDoc, ...update.$set };
      } else {
        updatedDoc = { ...updatedDoc, ...update };
      }
      updatedCount++;
      return updatedDoc;
    }
    return doc;
  });

  if (updatedCount > 0) {
    writeLocalCollection(collection, nextData);
    console.log(`💾 Local DB: Updated ${updatedCount} documents in [${collection}]`);
  }
  return { result: { ok: 1, nModified: updatedCount } };
}

export function localDelete(collection, filter = {}) {
  const data = readLocalCollection(collection);
  const remaining = data.filter(doc => !matchFilter(doc, filter));
  const deletedCount = data.length - remaining.length;

  if (deletedCount > 0) {
    writeLocalCollection(collection, remaining);
    console.log(`💾 Local DB: Deleted ${deletedCount} documents from [${collection}]`);
  }
  return { result: { ok: 1, deletedCount } };
}
