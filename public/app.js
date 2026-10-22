const $ = (id) => document.getElementById(id);
const state = { orders: [], updates: [], saved: [], investigation: null, revisionId: null, busy: false };
const statusLabels = { 'on-track': 'On track', 'at-risk': 'At risk', undetermined: 'Undetermined' };

function node(tag, className, content) {
  const result = document.createElement(tag);
  if (className) result.className = className;
  if (content !== undefined && content !== null) result.textContent = String(content);
  return result;
}

function valueText(value) {
  if (value === undefined || value === null) return 'Not reported';
  if (Array.isArray(value)) return value.map(valueText).join(', ') || 'None';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function dateText(value) {
  if (!value) return 'Not reported';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return 'Not reported';
  return `${date.toISOString().replace('T', ' ').slice(0, 19)} UTC`;
}

function announce(message, isError = false) {
  $('notice').hidden = !message;
  $('notice').className = isError ? 'notice error' : 'notice';
  $('notice').textContent = message;
}

function setBusy(busy, label) {
  state.busy = busy;
  $('investigate').disabled = busy || !state.orders.length;
  $('order').disabled = busy || !state.orders.length;
  $('mode').disabled = busy;
  $('refresh-saved').disabled = busy;
  $('investigate-form').setAttribute('aria-busy', String(busy));
  $('investigate').textContent = busy ? (label || 'Working…') : 'Investigate order ↗';
  document.querySelectorAll('.saved-item').forEach((button) => { button.disabled = busy; });
  updateActionStates();
}

async function api(path, body) {
  const response = await fetch(path, body === undefined
    ? { headers: { Accept: 'application/json' } }
    : { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(body) });
  let result;
  try { result = await response.json(); }
  catch { throw new Error('The workspace returned an unreadable response. Try again.'); }
  if (!response.ok) throw new Error(result?.error?.message || 'The request could not be completed.');
  return result;
}

function modeHelp() {
  $('mode-help').textContent = $('mode').value === 'preview'
    ? 'Offline preview uses synthetic local evidence and deterministic policy through the Markovian engine. It is excluded from live acceptance.'
    : 'Live mode uses Zetaris evidence and Nightshift inference. Integration failures stay visible.';
}

async function loadStatus() {
  try {
    const status = await api('/api/status');
    const strip = $('integrations');
    strip.replaceChildren();
    for (const [key, label] of [['zetaris', 'Zetaris'], ['nightshift', 'Nightshift'], ['engine', 'Markovian']]) {
      const integration = status[key] || {};
      const reported = integration.state || 'unknown';
      const ready = ['online', 'ready', 'available', 'connected', 'healthy'].includes(reported);
      const failed = ['offline', 'unconfigured', 'error', 'failed', 'unavailable', 'blocked', 'stopped'].includes(reported);
      const item = node('span', 'integration-status');
      item.append(node('span', `status-dot${ready ? ' ready' : failed ? ' failed' : ''}`), node('span', '', `${label} · ${ready ? 'Available' : failed ? 'Unavailable' : 'Not verified'}`));
      strip.append(item);
    }
  } catch {
    $('integrations').replaceChildren(node('span', '', 'Integration availability could not be checked. Investigation requests will report any failures.'));
  }
}

function currentRevision() {
  return state.investigation?.revisions?.find((revision) => revision.id === (state.revisionId || state.investigation.currentRevisionId));
}

function draftText(draft) {
  if (typeof draft === 'string') return draft;
  return draft?.text || draft?.body || draft?.content || draft?.message || '';
}

function updateActionStates() {
  const investigation = state.investigation;
  const revision = currentRevision();
  const historical = revision && revision.id !== investigation.currentRevisionId;
  const approved = investigation?.approvals?.some((approval) => approval.revisionId === revision?.id && !approval.invalidatedAt);
  $('approve').disabled = state.busy || !revision || historical || approved || !draftText(revision?.assessment?.draft);
  $('apply-update').disabled = state.busy || !$('update').value || !investigation;
  $('update').disabled = state.busy || !$('update').options.length;
  document.querySelectorAll('#revisions button').forEach((button) => { button.disabled = state.busy; });
}

function section(title) {
  const element = node('section', 'result-section');
  element.append(node('h3', '', title));
  return element;
}

function metadataList(pairs, className = 'record-meta') {
  const list = node('dl', className);
  for (const [label, value] of pairs) list.append(node('dt', '', label), node('dd', '', valueText(value)));
  return list;
}

function evidenceTarget(index) { return `evidence-${index + 1}`; }

function evidenceCitation(id, records) {
  const index = records.findIndex((record) => record.id === id);
  if (index === -1) return node('span', 'citation', 'Reference unavailable');
  const link = node('a', 'citation', `[${index + 1}] ${records[index].sourceId}`);
  link.href = `#${evidenceTarget(index)}`;
  link.addEventListener('click', () => {
    const target = $(evidenceTarget(index));
    target.open = true;
    target.querySelector('summary').focus({ preventScroll: true });
  });
  return link;
}

function renderEvidence(records) {
  $('evidence-count').textContent = `${records.length} ${records.length === 1 ? 'record' : 'records'}`;
  const list = $('evidence');
  list.replaceChildren();
  if (!records.length) {
    list.append(node('p', 'empty-state compact muted small', 'No source records were returned for this revision.'));
    return;
  }
  records.forEach((record, index) => {
    const details = node('details', 'evidence-record');
    details.id = evidenceTarget(index);
    const summary = node('summary');
    const label = node('span', 'evidence-name', record.sourceId || 'Unnamed source');
    label.append(node('small', '', `${record.kind || 'Record'} · ${record.recordId || record.id} · v${record.version ?? '?'}`));
    summary.append(node('span', 'evidence-index', String(index + 1).padStart(2, '0')), label, node('span', 'disclosure', '›'));
    const body = node('div', 'evidence-details');
    body.append(metadataList([
      ['Reference', record.id], ['Source', record.sourceId], ['Record', record.recordId], ['Version', record.version],
      ['Observed', dateText(record.observedAt)], ['Effective', dateText(record.effectiveAt)],
    ]));
    body.append(metadataList(Object.entries(record.fields || {}).map(([key, value]) => [key.replace(/([A-Z])/g, ' $1').toLowerCase(), value]), 'record-fields'));
    details.append(summary, body);
    list.append(details);
  });
}

function renderResult() {
  const investigation = state.investigation;
  const revision = currentRevision();
  if (!investigation || !revision) return;
  const assessment = revision.assessment || {};
  const records = Array.isArray(revision.records) ? revision.records : [];
  const result = $('result');
  result.replaceChildren();
  $('investigation-meta').textContent = `Revision ${revision.number}`;
  const heading = node('div', 'result-heading');
  const flags = node('div', 'result-flags');
  flags.append(node('span', 'badge', investigation.orderId), node('span', 'badge', investigation.mode === 'preview' ? 'Offline preview' : 'Live integrations'));
  if (revision.id !== investigation.currentRevisionId) flags.append(node('span', 'badge', 'Historical revision'));
  heading.append(flags, node('h3', 'result-status', statusLabels[assessment.status] || 'Status not reported'), node('p', 'result-context', `Assessed ${dateText(revision.assessmentAt)} · Saved ${dateText(revision.createdAt)}`));
  result.append(heading);
  const causes = section('Assessment');
  const causeList = node('ul', 'plain-list');
  if (assessment.causes?.length) {
    for (const cause of assessment.causes) causeList.append(node('li', '', String(cause).replaceAll('_', ' ').replaceAll('-', ' ')));
  } else causeList.append(node('li', 'muted small', 'No supported cause reported.'));
  causes.append(causeList);
  result.append(causes);
  const claims = section('Supported findings');
  const claimList = node('ul', 'claim-list');
  for (const claim of assessment.claims || []) {
    const row = node('li');
    row.append(node('p', '', claim.text));
    if (!claim.evidenceIds?.length) row.append(node('span', 'citation', 'No supporting reference'));
    for (const id of claim.evidenceIds || []) row.append(evidenceCitation(id, records));
    claimList.append(row);
  }
  if (!claimList.children.length) claimList.append(node('li', 'muted small', 'No supported finding is available.'));
  claims.append(claimList);
  result.append(claims);
  const uncertainty = assessment.uncertainty;
  if ((Array.isArray(uncertainty) && uncertainty.length) || (typeof uncertainty === 'string' && uncertainty) || (uncertainty && !Array.isArray(uncertainty) && typeof uncertainty === 'object')) {
    const missing = section('Needs clarification');
    const items = node('ul', 'plain-list');
    for (const item of Array.isArray(uncertainty) ? uncertainty : [uncertainty]) items.append(node('li', 'missing-note', typeof item === 'object' ? item.text || item.message || item.request || valueText(item) : item));
    missing.append(items);
    result.append(missing);
  }
  if (assessment.options?.length) {
    const options = section('Review options');
    for (const option of assessment.options) {
      const row = node('div', 'option-row');
      row.append(node('div', '', typeof option === 'string' ? option : option.label || option.id));
      if (option.text) row.append(node('p', '', option.text));
      options.append(row);
    }
    result.append(options);
  }
  const timeline = section('Evidence timeline');
  const datedRecords = records.filter((record) => record.effectiveAt || record.observedAt).toSorted((a, b) => String(a.effectiveAt || a.observedAt).localeCompare(String(b.effectiveAt || b.observedAt)));
  for (const record of datedRecords) {
    const row = node('div', 'history-row');
    const label = node('div', '', `${record.kind || 'Record'} · ${record.sourceId}`);
    label.append(node('small', '', `${record.effectiveAt ? 'Effective' : 'Observed'} ${dateText(record.effectiveAt || record.observedAt)}`), evidenceCitation(record.id, records));
    row.append(label);
    timeline.append(row);
  }
  if (!datedRecords.length) timeline.append(node('p', 'muted small', 'No source timestamps are available.'));
  result.append(timeline);
  const traceSection = section('Run record');
  const trace = node('details', 'trace-details');
  trace.append(node('summary', '', 'Execution and source receipts'));
  trace.append(metadataList([
    ['Engine', revision.engine?.status || revision.engine?.state || 'Not reported'],
    ['Model', revision.provider?.model || revision.provider?.modelId || (investigation.mode === 'preview' ? 'Offline policy, no model inference' : 'Not reported')],
    ['Usage', revision.provider?.usage ? valueText(revision.provider.usage) : 'Not reported'],
    ['Cost', revision.provider?.cost === undefined || revision.provider?.cost === null ? 'Unpriced' : valueText(revision.provider.cost)],
    ['Receipts', Array.isArray(revision.receipts) ? `${revision.receipts.length} recorded` : 'Not reported'],
    ['Changed refs', revision.changedEvidenceIds?.length ? revision.changedEvidenceIds.join(', ') : 'None reported'],
  ]));
  traceSection.append(trace);
  result.append(traceSection);
  renderEvidence(records);
  renderReview(investigation, revision);
  renderUpdates(investigation, revision);
}

function renderReview(investigation, revision) {
  $('draft-section').hidden = false;
  const draft = draftText(revision.assessment?.draft);
  $('draft').textContent = draft || 'No reviewable draft is available for this revision.';
  const active = investigation.approvals?.find((approval) => approval.revisionId === revision.id && !approval.invalidatedAt);
  $('approval-state').textContent = revision.id !== investigation.currentRevisionId
    ? 'Historical revision, approval unavailable'
    : active ? `Approved ${dateText(active.createdAt)}` : 'Awaiting human review';
  $('approve').textContent = active ? 'Draft approved' : 'Approve this draft';
  const list = $('approvals');
  list.replaceChildren();
  for (const approval of [...(investigation.approvals || [])].reverse()) {
    const approvedRevision = investigation.revisions.find((item) => item.id === approval.revisionId);
    const row = node('div', 'history-row');
    const label = node('div', '', `Revision ${approvedRevision?.number ?? '?'} · ${approval.invalidatedAt ? 'Invalidated by changed evidence' : 'Approved'}`);
    label.append(node('small', '', dateText(approval.createdAt)));
    if (approval.invalidatedAt) label.append(node('small', '', `Invalidated ${dateText(approval.invalidatedAt)}`));
    row.append(label);
    list.append(row);
  }
  if (!list.children.length) list.append(node('p', 'muted small', 'No approvals recorded.'));
}

function renderUpdates(investigation) {
  $('changes-section').hidden = false;
  const updates = investigation.mode === 'preview' ? state.updates.filter((update) => update.orderId === investigation.orderId) : [];
  $('update').replaceChildren();
  for (const update of updates) {
    const option = node('option', '', update.label || update.id);
    option.value = update.id;
    $('update').append(option);
  }
  if (!updates.length) {
    const option = node('option', '', investigation.mode === 'live' ? 'Live changes must come from the source' : 'No synthetic update available for this order');
    option.value = '';
    $('update').append(option);
  }
  const list = $('revisions');
  list.replaceChildren();
  for (const revision of [...investigation.revisions].reverse()) {
    const row = node('div', 'history-row');
    const label = node('div');
    const button = node('button', '', `Revision ${revision.number}${revision.id === investigation.currentRevisionId ? ' · Current' : ''}`);
    button.type = 'button';
    button.disabled = state.busy;
    button.setAttribute('aria-pressed', String(revision.id === state.revisionId));
    button.addEventListener('click', () => { state.revisionId = revision.id; renderResult(); updateActionStates(); });
    label.append(button, node('small', '', dateText(revision.createdAt)));
    row.append(label, node('span', 'mono', statusLabels[revision.assessment?.status] || 'Unknown'));
    list.append(row);
  }
  updateActionStates();
}

function selectInvestigation(investigation) {
  if (!investigation?.id || !Array.isArray(investigation.revisions) || !investigation.revisions.some((revision) => revision.id === investigation.currentRevisionId)) throw new Error('The saved investigation has no readable current revision.');
  state.investigation = investigation;
  state.revisionId = investigation.currentRevisionId;
  $('order').value = investigation.orderId;
  $('mode').value = investigation.mode;
  modeHelp();
  renderResult();
  renderSaved();
}

function renderSaved() {
  const list = $('saved');
  list.replaceChildren();
  if (!state.saved.length) {
    list.append(node('p', 'muted small', 'No saved investigations yet.'));
    return;
  }
  for (const investigation of state.saved) {
    const button = node('button', 'saved-item');
    button.type = 'button';
    button.disabled = state.busy;
    if (investigation.id === state.investigation?.id) button.setAttribute('aria-current', 'true');
    const label = node('span', '', investigation.orderId);
    label.append(node('small', '', investigation.mode === 'preview' ? 'Offline preview' : 'Live integrations'));
    const revision = investigation.revisions?.find((item) => item.id === investigation.currentRevisionId);
    button.append(label, node('span', 'mono', revision ? `Revision ${revision.number}` : 'Open →'));
    button.addEventListener('click', async () => {
      setBusy(true, 'Opening…');
      announce('');
      try { selectInvestigation(await api(`/api/investigations/${encodeURIComponent(investigation.id)}`)); }
      catch (error) { announce(error.message, true); }
      finally { setBusy(false); }
    });
    list.append(button);
  }
}

async function loadSaved() {
  const result = await api('/api/investigations');
  state.saved = Array.isArray(result) ? result : result.investigations || [];
  renderSaved();
}

$('mode').addEventListener('change', modeHelp);
$('update').addEventListener('change', updateActionStates);
$('investigate-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (state.busy || !$('order').value) return;
  const mode = $('mode').value;
  setBusy(true, 'Investigating…');
  announce(mode === 'preview' ? 'Running offline preview with synthetic evidence…' : 'Retrieving live evidence and assessing this order…');
  try {
    selectInvestigation(await api('/api/investigate', { orderId: $('order').value, mode }));
    await loadSaved();
    announce(mode === 'preview' ? 'Offline preview saved. This result does not verify live integrations.' : 'Investigation saved. Review its evidence before approving the draft.');
  } catch (error) { announce(error.message, true); }
  finally { setBusy(false); await loadStatus(); }
});

$('approve').addEventListener('click', async () => {
  if (state.busy || $('approve').disabled || !state.investigation) return;
  setBusy(true, 'Saving review…');
  try {
    const investigation = await api(`/api/investigations/${encodeURIComponent(state.investigation.id)}/approve`, { revisionId: state.revisionId });
    selectInvestigation(investigation);
    announce('Draft approved for this revision. No message sent and no order changed.');
    await loadSaved();
  } catch (error) { announce(error.message, true); }
  finally { setBusy(false); }
});

$('update-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (state.busy || !$('update').value || !state.investigation) return;
  setBusy(true, 'Applying update…');
  try {
    const previousId = state.investigation.currentRevisionId;
    selectInvestigation(await api(`/api/investigations/${encodeURIComponent(state.investigation.id)}/update`, { updateId: $('update').value }));
    announce(previousId === state.investigation.currentRevisionId
      ? 'Evidence unchanged. The existing revision was retained.'
      : 'New evidence saved as a revision. Previous approval remains in history; this revision needs review.');
    await loadSaved();
  } catch (error) { announce(error.message, true); }
  finally { setBusy(false); await loadStatus(); }
});

$('refresh-saved').addEventListener('click', async () => {
  setBusy(true, 'Refreshing…');
  try { await loadSaved(); announce('Saved investigations refreshed.'); }
  catch (error) { announce(error.message, true); }
  finally { setBusy(false); }
});

async function init() {
  modeHelp();
  loadStatus();
  await Promise.allSettled([
    loadSaved().catch(() => { $('saved').replaceChildren(node('p', 'muted small', 'Saved investigations could not be loaded. Use Refresh to try again.')); }),
    (async () => {
      try {
        const result = await api('/api/orders');
        state.orders = Array.isArray(result.orders) ? result.orders : [];
        state.updates = Array.isArray(result.updates) ? result.updates : [];
        $('order').replaceChildren();
        for (const order of state.orders) {
          const option = node('option', '', order.label || order.id);
          option.value = order.id;
          $('order').append(option);
        }
        if (!state.orders.length) $('order').append(node('option', '', 'No orders available'));
      } catch { $('order').replaceChildren(node('option', '', 'Orders unavailable')); announce('Orders could not be loaded. Refresh the page when the local workspace is available.', true); }
    })(),
  ]);
  setBusy(false);
}

init();
