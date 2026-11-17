import React, {useSyncExternalStore} from 'react';
import './WorkspaceActivity.css';

const active = new Map();
const listeners = new Set();
let snapshot = {};
let recentWrite, recentRead, expiry;

function publish() {
  const operations = [...active.values()];
  snapshot = {operations, recent: recentWrite || recentRead};
  listeners.forEach(listener => listener());
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function resetWorkspaceActivity() {
  clearTimeout(expiry);
  active.clear();
  recentWrite = recentRead = undefined;
  publish();
}

export function beginActivity(kind, subject = '') {
  const token = Symbol();
  active.set(token, {kind, subject});
  publish();
  return (confirmed, progress) => {
    if (!active.has(token)) return;
    if (confirmed === undefined) {
      active.set(token, {kind, subject, progress});
    } else {
      active.delete(token);
      const result = {kind, subject, confirmed};
      if (kind === 'load') recentRead = result;
      else {
        recentWrite = result;
        clearTimeout(expiry);
        expiry = setTimeout(() => { recentWrite = undefined; publish(); }, confirmed ? 6000 : 15000);
      }
    }
    publish();
  };
}

export async function trackActivity(kind, subject, work) {
  const finish = beginActivity(kind, subject);
  try {
    const result = await work(progress => finish(undefined, progress));
    finish(result !== false);
    return result;
  } catch (error) {
    finish(false);
    throw error;
  }
}

const labels = {
  load: ['Loading', 'Loaded', 'Load could not be completed'],
  save: ['Saving changes', 'Changes saved', 'Save could not be confirmed'],
  upload: ['Uploading', 'Upload complete', 'Upload could not be confirmed']
};

export default function WorkspaceActivity() {
  const {operations = [], recent} = useSyncExternalStore(subscribe, () => snapshot);
  const operation = operations.find(item => item.kind === 'upload')
    || operations.find(item => item.kind === 'save')
    || operations.find(item => item.subject)
    || operations[0];
  const item = operation || recent;
  const label = item ? labels[item.kind][operation ? 0 : item.confirmed ? 1 : 2] : 'Ready';
  const count = operations.length;
  return <div className="workspace-activity" role="status" aria-live="polite" aria-atomic="true">
    <span aria-hidden="true" className={operation ? 'workspace-activity-spinner' : ''}>
      {operation ? '' : item?.confirmed === false ? '!' : '✓'}
    </span>
    <span><strong>{label}{operation ? '…' : ''}</strong>
      {item?.subject && <small>{item.subject}</small>}
    </span>
    {operation?.progress != null && <span>{operation.progress === 100 ? 'Confirming…' : operation.progress + '%'}</span>}
    {count > 1 && <small>+{count - 1} more</small>}
  </div>;
}
