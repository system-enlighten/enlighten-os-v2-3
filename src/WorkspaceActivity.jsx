import React, {useSyncExternalStore} from 'react';
import './WorkspaceActivity.css';

const active = new Map();
const listeners = new Set();
let snapshot = {};
const recentWrites = new Map();
let currentPage;

export function setActivityPage(page) {
  currentPage = page;
}

function publish() {
  const operations = [...active.values()];
  snapshot = {operations, recent: new Map(recentWrites)};
  listeners.forEach(listener => listener());
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function resetWorkspaceActivity() {
  recentWrites.forEach(item => clearTimeout(item.expiry));
  recentWrites.clear();
  active.clear();
  currentPage = undefined;
  publish();
}

export function beginActivity(kind, subject = '', page = currentPage) {
  const token = Symbol();
  active.set(token, {kind, subject, page});
  publish();
  return (confirmed, progress) => {
    if (!active.has(token)) return;
    if (confirmed === undefined) {
      active.set(token, {kind, subject, page, progress});
    } else {
      active.delete(token);
      if (kind !== 'load') {
        clearTimeout(recentWrites.get(page)?.expiry);
        const expiry = setTimeout(() => {
          recentWrites.delete(page);
          publish();
        }, confirmed ? 6000 : 15000);
        recentWrites.set(page, {kind, subject, confirmed, expiry});
      }
    }
    publish();
  };
}

export async function trackActivity(kind, subject, work, page) {
  const finish = beginActivity(kind, subject, page);
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
  save: ['Saving changes', 'Changes saved', 'Save could not be confirmed'],
  upload: ['Uploading', 'Upload complete', 'Upload could not be confirmed']
};

export default function WorkspaceActivity({page}) {
  const {operations = [], recent} = useSyncExternalStore(subscribe, () => snapshot);
  const pageOperations = operations.filter(item => item.page === page);
  const write = pageOperations.find(item => item.kind === 'upload')
    || pageOperations.find(item => item.kind === 'save');
  const loading = pageOperations.some(item => item.kind === 'load');
  const item = write || (!loading && recent?.get(page));
  const subjects = loadingSubjects(pageOperations);

  return <div className="workspace-activity" role="status" aria-live="polite" aria-atomic="true">
    {item ? <span>
      <strong>{labels[item.kind][item.confirmed === undefined ? 0 : item.confirmed ? 1 : 2]}
        {item.confirmed === undefined ? '…' : ''}</strong>
      {item.subject && <small>{item.subject}</small>}
      {item.progress != null && <small>{item.progress === 100 ? 'Confirming…' : item.progress + '%'}</small>}
    </span> : loading && <span><strong>Loading…</strong>
      {subjects.length > 0 && <small>{subjects.join(' · ')}</small>}
    </span>}
  </div>;
}

function loadingSubjects(operations) {
  return [...new Set(operations
    .filter(item => item.kind === 'load' && item.subject)
    .map(item => item.subject))];
}

export function StudioLoadingDetail() {
  const {operations = []} = useSyncExternalStore(subscribe, () => snapshot);
  const subjects = loadingSubjects(operations);
  return <div role="status" aria-atomic="true" style={{
    fontSize: 12, textAlign: 'center', maxWidth: 520, minHeight: '1.5em', lineHeight: 1.5
  }}>{subjects.join(' · ')}</div>;
}
