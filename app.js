/* WPMS frontend integration - Phase 1 + Phase 2
 * Authentication is session-cookie based. The frontend never stores a password/token.
 */
const API = '';

const routes = {
  LoginServlet: '/api/auth/login',
  SignupServlet: '/api/auth/register',
  MyTasksServlet: '/api/my-tasks',
  ProjectServlet: id => `/api/projects/${encodeURIComponent(id)}`,
  ProjectTimelineServlet: id => `/api/projects/${encodeURIComponent(id)}/timeline`,
  TaskServlet: id => `/api/tasks/${encodeURIComponent(id)}`,
  TaskStatusServlet: id => `/api/tasks/${encodeURIComponent(id)}/status`,
  TimeLogServlet: id => `/api/tasks/${encodeURIComponent(id)}/time-logs`
};

const PUBLIC_PAGES = new Set(['login.html', 'signup.html']);
const DASHBOARD_PAGES = new Set(['', 'index.html', 'dashboard.html']);

async function apiFetch(path, options = {}) {
  const response = await fetch(API + path, {
    credentials: 'same-origin',
    ...options,
    headers: {
      ...(options.body && !(options.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {})
    }
  });

  let payload = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    payload = await response.json().catch(() => null);
  }

  if (!response.ok) {
    const error = new Error(payload?.error || `Request failed (${response.status})`);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

function currentPage() {
  return location.pathname.split('/').pop() || '';
}

function isPublicPage() {
  return PUBLIC_PAGES.has(currentPage());
}

function isDashboardPage() {
  return DASHBOARD_PAGES.has(currentPage());
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[character]));
}

function formatNumber(value, digits = 1) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(digits) : '0.0';
}

function formatStatus(status) {
  return String(status || 'todo')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, letter => letter.toUpperCase());
}

function initials(name) {
  const parts = String(name || 'User').trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map(part => part[0].toUpperCase()).join('') || 'U';
}

function showPageMessage(message, type = 'info') {
  let box = document.querySelector('[data-app-message]');
  if (!box) {
    box = document.createElement('div');
    box.dataset.appMessage = 'true';
    box.className = `app-message ${type}`;
    const main = document.querySelector('main');
    if (main) main.prepend(box);
    else document.body.prepend(box);
  }
  box.textContent = message;
  box.hidden = false;
}

function setLoading(element, loading) {
  if (!element) return;
  element.setAttribute('aria-busy', String(loading));
  element.classList.toggle('is-loading', loading);
}

async function getCurrentUser() {
  const payload = await apiFetch('/api/auth/me');
  return payload?.user || payload?.data?.user || null;
}

async function requireSession() {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('Authentication required.');
    return user;
  } catch (error) {
    if (error.status === 401 || error.status === 403) {
      const next = encodeURIComponent(location.pathname + location.search + location.hash);
      location.replace(`login.html?next=${next}`);
      return null;
    }
    throw error;
  }
}

function redirectAfterLogin() {
  const params = new URLSearchParams(location.search);
  const next = params.get('next');
  if (next && next.startsWith('/')) {
    location.replace(next);
  } else {
    location.replace('dashboard.html');
  }
}

async function handleLoginForm(form) {
  const button = form.querySelector('button[type="submit"]');
  setLoading(button, true);
  try {
    await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(Object.fromEntries(new FormData(form)))
    });
    redirectAfterLogin();
  } catch (error) {
    showPageMessage(error.message, 'error');
  } finally {
    setLoading(button, false);
  }
}

async function handleSignupForm(form) {
  const values = Object.fromEntries(new FormData(form));
  if (values.password !== values.confirm_password) {
    showPageMessage('Passwords do not match.', 'error');
    return;
  }

  delete values.confirm_password;
  const button = form.querySelector('button[type="submit"]');
  setLoading(button, true);
  try {
    await apiFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(values)
    });
    location.replace('login.html');
  } catch (error) {
    showPageMessage(error.message, 'error');
  } finally {
    setLoading(button, false);
  }
}

async function logout() {
  try {
    await apiFetch('/api/auth/logout', { method: 'POST' });
  } catch (error) {
    // A stale/expired session should still take the user to the login page.
    if (error.status !== 401 && error.status !== 403) console.error(error);
  } finally {
    location.replace('login.html');
  }
}

function renderUserChrome(user) {
  document.querySelectorAll('[data-user-name]').forEach(element => {
    element.textContent = user?.name || 'User';
  });
  document.querySelectorAll('[data-user-email]').forEach(element => {
    element.textContent = user?.email || '';
  });
  document.querySelectorAll('[data-user-initials]').forEach(element => {
    element.textContent = initials(user?.name);
  });
  document.querySelectorAll('[data-user-role]').forEach(element => {
    element.textContent = user?.role || user?.account_role || 'Member';
  });
}

function installLogoutControls() {
  document.querySelectorAll('[data-action="logout"]').forEach(button => {
    button.addEventListener('click', event => {
      event.preventDefault();
      logout();
    });
  });
}

async function loadMyTasks(user) {
  const list = document.querySelector('[data-my-tasks]');
  if (!list) return [];

  try {
    const payload = await apiFetch(routes.MyTasksServlet);
    const rawTasks = Array.isArray(payload?.data) ? payload.data :
      Array.isArray(payload?.tasks) ? payload.tasks :
      Array.isArray(payload) ? payload : [];

    const userId = String(user?.user_id ?? user?.id ?? '');
    // The task endpoint may return the user's tasks directly or a broader list.
    // Once we know the signed-in ID, only explicitly assigned records belong in
    // the personal workspace; unassigned tasks must not appear here.
    const mine = userId
      ? rawTasks.filter(task => {
          const assignee = task.assigned_to ?? task.assignee_id ?? task.user_id;
          return assignee != null && String(assignee) === userId;
        })
      : rawTasks;

    renderMyTasks(mine.slice(0, 8), list);
    return mine;
  } catch (error) {
    list.innerHTML = `<div class="empty-panel compact-empty"><strong>My tasks are temporarily unavailable.</strong><span>${escapeHtml(error.message)}</span></div>`;
    return [];
  }
}

function renderMyTasks(tasks, list) {
  if (!tasks.length) {
    list.innerHTML = '<div class="empty-panel compact-empty"><strong>No active tasks</strong><span>Tasks assigned to you will appear here.</span><a class="btn ghost small" href="tasks.html">Open Tasks</a></div>';
    return;
  }

  const active = tasks.filter(task => task.status !== 'done');
  const display = active.length ? active : tasks;

  list.innerHTML = display.map(task => {
    const status = String(task.status || 'todo');
    const stateClass = status === 'in_progress' ? 'progress-state' : '';
    const title = escapeHtml(task.title || 'Untitled task');
    const priority = escapeHtml(task.priority || 'medium');
    const due = escapeHtml(task.due_date || 'No due date');
    const project = escapeHtml(task.project_name || task.project_title || 'Project');
    return `<a class="sample-task" href="tasks.html#details" data-task-id="${escapeHtml(task.task_id ?? task.id ?? '')}">
      <span class="task-state ${stateClass}"></span>
      <span><strong>${title}</strong><small>${project} · ${priority} · Due ${due}</small></span>
      <span class="tag">${escapeHtml(formatStatus(status))}</span>
    </a>`;
  }).join('');
}

function extractDashboardMetrics(payload) {
  const metrics = payload?.dashboard || payload?.metrics || payload?.data?.dashboard || payload?.data?.metrics || payload?.data || payload || {};
  return {
    completed: metrics.completed_tasks ?? metrics.tasks_completed ?? 0,
    onTime: metrics.on_time_percentage,
    logged: metrics.logged_hours ?? (Number(metrics.logged_minutes) / 60),
    estimated: metrics.estimated_hours,
    variance: metrics.effort_variance_hours,
    ratio: metrics.effort_ratio
  };
}

async function loadMyDashboard(user) {
  const metricNodes = {
    completed: document.querySelector('[data-metric="completed"]'),
    onTime: document.querySelector('[data-metric="on-time"]'),
    logged: document.querySelector('[data-metric="logged"]'),
    estimated: document.querySelector('[data-metric="estimated"]'),
    variance: document.querySelector('[data-metric="variance"]')
  };

  if (!Object.values(metricNodes).some(Boolean)) return;

  try {
    const payload = await apiFetch('/api/analytics/me/dashboard');
    const metrics = extractDashboardMetrics(payload);
    if (metricNodes.completed) metricNodes.completed.textContent = String(metrics.completed);
    if (metricNodes.onTime) metricNodes.onTime.textContent = metrics.onTime == null ? '—' : `${formatNumber(metrics.onTime)}%`;
    if (metricNodes.logged) metricNodes.logged.textContent = `${formatNumber(metrics.logged)} h`;
    if (metricNodes.estimated) metricNodes.estimated.textContent = metrics.estimated == null ? '—' : `${formatNumber(metrics.estimated)} h`;
    if (metricNodes.variance) metricNodes.variance.textContent = metrics.variance == null ? '—' : `${formatNumber(metrics.variance)} h`;
  } catch (error) {
    // Keep the dashboard usable even if analytics has not been mounted on the backend yet.
    Object.values(metricNodes).forEach(node => {
      if (node) node.textContent = '—';
    });
    const note = document.querySelector('[data-analytics-status]');
    if (note) note.textContent = 'Personal metrics will appear when analytics is available.';
    console.warn('Analytics dashboard unavailable:', error.message);
  }
}

function updateTaskSummary(tasks) {
  const active = tasks.filter(task => task.status !== 'done');
  const blocked = tasks.filter(task => ['waiting_approval', 'blocked'].includes(task.status));
  const waiting = tasks.filter(task => task.status === 'waiting_approval');
  const done = tasks.filter(task => task.status === 'done');

  const values = {
    active: active.length,
    blocked: blocked.length,
    waiting: waiting.length,
    done: done.length
  };

  Object.entries(values).forEach(([key, value]) => {
    const node = document.querySelector(`[data-task-count="${key}"]`);
    if (node) node.textContent = String(value);
  });
}

async function loadDashboard(user) {
  renderUserChrome(user);
  const greeting = document.querySelector('[data-dashboard-greeting]');
  if (greeting) greeting.textContent = `Welcome back, ${user.name || 'there'}`;

  const tasks = await loadMyTasks(user);
  updateTaskSummary(tasks);
  await loadMyDashboard(user);
}

async function protectApplicationPage() {
  if (isPublicPage()) return null;
  try {
    const user = await requireSession();
    if (user) {
      renderUserChrome(user);
      return user;
    }
  } catch (error) {
    showPageMessage('Unable to verify your session. Check that the backend is running.', 'error');
  }
  return null;
}

function installForms() {
  for (const form of document.forms) {
    const action = form.getAttribute('action');
    if (action === 'LoginServlet') {
      form.addEventListener('submit', event => {
        event.preventDefault();
        handleLoginForm(form);
      });
      continue;
    }
    if (action === 'SignupServlet') {
      form.addEventListener('submit', event => {
        event.preventDefault();
        handleSignupForm(form);
      });
      continue;
    }

    form.addEventListener('submit', async event => {
      event.preventDefault();
      const button = form.querySelector('button[type="submit"]');
      setLoading(button, true);
      try {
        const method = (form.getAttribute('method') || 'post').toUpperCase();
        const values = Object.fromEntries(new FormData(form));
        let endpoint;
        let body = values;

        if (action === 'TaskServlet') {
          const projectId = values.project_id;
          if (!/^\d+$/.test(String(projectId || ''))) throw new Error('A valid project ID is required.');
          delete body.project_id;
          endpoint = `/api/projects/${encodeURIComponent(projectId)}/tasks`;
        } else if (action === 'UserServlet') {
          endpoint = routes.SignupServlet;
          delete body.account_status;
        } else if (action === 'ProjectMemberServlet') {
          const projectId = values.project_id;
          if (!/^\d+$/.test(String(projectId || ''))) throw new Error('A valid project ID is required.');
          if (!values.email) throw new Error("An existing user email is required.");
          endpoint = `/api/projects/${encodeURIComponent(projectId)}/members`;
          body = { email: values.email, role: values.role };
        } else {
          const endpointValue = routes[action];
          if (typeof endpointValue !== 'string') return;
          endpoint = endpointValue;
        }

        const payload = await apiFetch(endpoint, {
          method,
          ...(method === 'GET' ? {} : { body: JSON.stringify(body) })
        });
        showPageMessage(payload?.data?.message || payload?.message || 'Saved successfully.', 'success');
        if (method !== 'GET') setTimeout(() => location.reload(), 350);
      } catch (error) {
        showPageMessage(error.message, 'error');
      } finally {
        setLoading(button, false);
      }
    });
  }
}

async function boot() {
  installLogoutControls();
  installForms();

  if (isPublicPage()) return;

  const user = await protectApplicationPage();
  if (!user) return;

  if (isDashboardPage()) await loadDashboard(user);
  if (currentPage() === 'tasks.html') await loadTaskPage(user);
  if (currentPage() === 'project.html') await loadProjectPage(user);
  if (currentPage() === 'insights.html') await loadInsightsPage(user);
}

document.addEventListener('DOMContentLoaded', () => {
  boot().catch(error => {
    console.error(error);
    showPageMessage(error.message || 'Unable to load WPMS.', 'error');
  });
});

/* ========================= Phase 3 + 4 ========================= */
const TASK_FEATURES = {
  detail: id => `/api/tasks/${encodeURIComponent(id)}`,
  status: id => `/api/tasks/${encodeURIComponent(id)}/status`,
  checklist: id => `/api/tasks/${encodeURIComponent(id)}/checklist`,
  comments: id => `/api/tasks/${encodeURIComponent(id)}/comments`,
  attachments: id => `/api/tasks/${encodeURIComponent(id)}/attachments`,
  dependencies: id => `/api/tasks/${encodeURIComponent(id)}/dependencies`,
  timeLogs: id => `/api/tasks/${encodeURIComponent(id)}/time-logs`,
  startTimeLog: id => `/api/tasks/${encodeURIComponent(id)}/time-logs/start`,
  stopTimeLog: id => `/api/tasks/${encodeURIComponent(id)}/time-logs/stop`,
  manualTimeLog: id => `/api/tasks/${encodeURIComponent(id)}/time-logs/manual`,
  effort: id => `/api/tasks/${encodeURIComponent(id)}/effort`,
  projectTimeline: id => `/api/projects/${encodeURIComponent(id)}/timeline`
};

function unwrapCollection(payload, keys = []) {
  for (const key of keys) if (Array.isArray(payload?.[key])) return payload[key];
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  return [];
}

function taskIdOf(task) { return task?.task_id ?? task?.id; }
function hoursFromMinutes(value) { const n = Number(value); return Number.isFinite(n) ? n / 60 : 0; }
function formatHours(value) { return `${formatNumber(value, 2)} h`; }
function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
}

async function loadTaskCollection(path, keys = []) {
  try { return unwrapCollection(await apiFetch(path), keys); }
  catch (error) {
    if (error.status === 404) return [];
    throw error;
  }
}

async function loadTaskDetails(taskId) {
  const [taskResult, checklistResult, commentsResult, attachmentsResult, dependenciesResult, logsResult] = await Promise.allSettled([
    apiFetch(TASK_FEATURES.detail(taskId)),
    loadTaskCollection(TASK_FEATURES.checklist(taskId), ['items', 'checklist']),
    loadTaskCollection(TASK_FEATURES.comments(taskId), ['comments']),
    loadTaskCollection(TASK_FEATURES.attachments(taskId), ['attachments']),
    loadTaskCollection(TASK_FEATURES.dependencies(taskId), ['dependencies']),
    loadTaskCollection(TASK_FEATURES.timeLogs(taskId), ['time_logs', 'timeLogs', 'logs'])
  ]);

  const task = taskResult.status === 'fulfilled'
    ? (taskResult.value?.task || taskResult.value?.data?.task || taskResult.value?.data || taskResult.value)
    : null;

  return {
    task: task || { task_id: taskId },
    checklist: checklistResult.status === 'fulfilled' ? checklistResult.value : [],
    comments: commentsResult.status === 'fulfilled' ? commentsResult.value : [],
    attachments: attachmentsResult.status === 'fulfilled' ? attachmentsResult.value : [],
    dependencies: dependenciesResult.status === 'fulfilled' ? dependenciesResult.value : [],
    logs: logsResult.status === 'fulfilled' ? logsResult.value : [],
    warnings: [taskResult, checklistResult, commentsResult, attachmentsResult, dependenciesResult, logsResult]
      .filter(r => r.status === 'rejected').map(r => r.reason?.message).filter(Boolean)
  };
}

function renderTaskList(tasks, selectedId) {
  const list = document.querySelector('[data-task-list]');
  if (!list) return;
  if (!tasks.length) {
    list.innerHTML = '<div class="empty-panel compact-empty"><strong>No tasks found</strong><span>Try another status filter or create a task.</span></div>';
    return;
  }
  list.innerHTML = tasks.map(task => {
    const id = taskIdOf(task);
    const status = String(task.status || 'todo');
    const selected = String(id) === String(selectedId) ? ' selected' : '';
    const stateClass = status === 'in_progress' ? ' progress-state' : '';
    return `<button type="button" class="sample-task${selected}" data-open-task="${escapeHtml(id)}">
      <span class="task-state${stateClass}"></span><span><strong>${escapeHtml(task.title || 'Untitled task')}</strong>
      <small>${escapeHtml(task.project_name || task.project_title || `Project ${task.project_id ?? ''}`)} · ${escapeHtml(task.priority || 'medium')} · Due ${escapeHtml(task.due_date || '—')}</small></span>
      <span class="tag">${escapeHtml(formatStatus(status))}</span>
    </button>`;
  }).join('');
  list.querySelectorAll('[data-open-task]').forEach(button => button.addEventListener('click', () => selectTask(button.dataset.openTask)));
}

function taskEffort(task, logs) {
  const estimated = Number(task?.estimated_hours);
  const loggedFromTask = Number(task?.logged_hours);
  const logged = Number.isFinite(loggedFromTask) ? loggedFromTask : logs.reduce((sum, log) => {
    if (Number.isFinite(Number(log.duration))) return sum + hoursFromMinutes(log.duration);
    if (log.started_at && log.ended_at) return sum + (new Date(log.ended_at) - new Date(log.started_at)) / 3600000;
    return sum;
  }, 0);
  return { estimated: Number.isFinite(estimated) ? estimated : 0, logged, remaining: Math.max(0, (Number.isFinite(estimated) ? estimated : 0) - logged) };
}

function renderTaskContext(data) {
  const root = document.querySelector('[data-task-details]');
  if (!root) return;
  const { task, checklist, comments, attachments, dependencies, logs } = data;
  const id = taskIdOf(task);
  const effort = taskEffort(task, logs);
  const percent = effort.estimated > 0 ? Math.min(100, (effort.logged / effort.estimated) * 100) : 0;
  const waiting = task.status === 'waiting_approval';

  root.innerHTML = `<div class="selected-task-head"><div><span class="demo-label">Task #${escapeHtml(id)}</span><h2>${escapeHtml(task.title || 'Task')}</h2></div>
    <select class="status-select" data-task-status><option value="todo">To do</option><option value="in_progress">In progress</option><option value="waiting_approval">Waiting approval</option><option value="done">Done</option></select></div>
    <p class="context-description">${escapeHtml(task.description || 'No description provided.')}</p>
    <div class="task-meta-grid"><span>Assignee<strong>${escapeHtml(task.assignee_name || task.assignee || task.assigned_to || 'Unassigned')}</strong></span><span>Priority<strong>${escapeHtml(task.priority || 'medium')}</strong></span><span>Start<strong>${escapeHtml(task.start_date || '—')}</strong></span><span>Due<strong>${escapeHtml(task.due_date || '—')}</strong></span></div>

    <div class="context-grid">
      <section class="context-panel"><h3>Definition of Done</h3><div class="context-list" data-checklist-list>${renderChecklist(checklist)}</div><form class="inline-form" data-checklist-form><input class="mini-input" name="description" required placeholder="Add acceptance criterion"><button class="btn ghost small">Add</button></form></section>
      <section class="context-panel"><h3>Discussion</h3><div class="context-list" data-comments-list>${renderComments(comments)}</div><form class="inline-form" data-comment-form><textarea class="mini-input" name="content" rows="2" required placeholder="Write a comment"></textarea><button class="btn ghost small">Post</button></form></section>
      <section class="context-panel"><h3>Attachments</h3><div class="context-list" data-attachments-list>${renderAttachments(attachments)}</div><form class="inline-form" data-attachment-form enctype="multipart/form-data"><input class="file-input" type="file" name="file" required><button class="btn ghost small">Upload</button></form></section>
      <section class="context-panel"><h3>Dependencies</h3><div class="context-list" data-dependencies-list>${renderDependencies(dependencies)}</div><form class="inline-form" data-dependency-form><input class="mini-input" name="blocked_task_id" required inputmode="numeric" placeholder="Task ID this task blocks"><button class="btn ghost small">Add</button></form></section>
      <section class="context-panel context-panel-wide"><h3>Effort & SLA</h3><div class="effort-bars"><div class="effort-line"><span>Estimated</span><strong>${formatHours(effort.estimated)}</strong></div><div class="effort-line"><span>Logged</span><strong>${formatHours(effort.logged)}</strong></div><div class="progress-track"><div class="progress-fill" style="width:${percent}%"></div></div><div class="effort-line"><span>Remaining</span><strong>${formatHours(effort.remaining)}</strong></div></div><div class="context-actions"><span class="${waiting ? 'sla-paused' : 'sla-active'}">${waiting ? '● SLA paused while waiting for approval' : '● SLA active'}</span><span class="muted">${effort.estimated > 0 ? `${formatNumber(percent, 0)}% of estimate logged` : 'No estimate set'}</span></div></section>
      <section class="context-panel context-panel-wide"><h3>Time tracking</h3><div class="context-actions"><span class="timer-display" data-timer-display>00:00:00</span><button class="btn small" type="button" data-timer-start>Start timer</button><button class="btn ghost small" type="button" data-timer-stop disabled>Stop timer</button></div><div class="context-list" data-time-log-list>${renderTimeLogs(logs)}</div><form class="inline-form" data-manual-log-form><input class="mini-input" name="started_at" type="datetime-local" required><input class="mini-input" name="ended_at" type="datetime-local" required><button class="btn ghost small">Log manually</button></form></section>
    </div>`;

  const status = root.querySelector('[data-task-status]'); status.value = task.status || 'todo';
  status.addEventListener('change', () => updateTaskStatus(id, status.value));
  root.querySelector('[data-checklist-form]').addEventListener('submit', e => addChecklistItem(e, id));
  root.querySelector('[data-comment-form]').addEventListener('submit', e => addComment(e, id));
  root.querySelector('[data-attachment-form]').addEventListener('submit', e => uploadAttachment(e, id));
  root.querySelector('[data-dependency-form]').addEventListener('submit', e => addDependency(e, id));
  root.querySelector('[data-manual-log-form]').addEventListener('submit', e => addManualTimeLog(e, id));
  root.querySelectorAll('[data-checklist-toggle]').forEach(el => el.addEventListener('change', () => toggleChecklist(el, id)));
  root.querySelectorAll('[data-delete-attachment]').forEach(el => el.addEventListener('click', () => deleteAttachment(el.dataset.deleteAttachment, id)));
  root.querySelectorAll('[data-delete-dependency]').forEach(el => el.addEventListener('click', () => deleteDependency(el.dataset.deleteDependency, id)));
  installTimer(root, id);
}

function renderChecklist(items) { return items.length ? items.map(item => `<label class="context-row"><span class="${item.is_completed ? 'check-done' : ''}"><input type="checkbox" data-checklist-toggle data-item-id="${escapeHtml(item.item_id ?? item.id)}" ${item.is_completed ? 'checked' : ''}> ${escapeHtml(item.description || item.title || 'Criterion')}</span><small>${item.completed_at ? 'Complete' : 'Open'}</small></label>`).join('') : '<span class="muted">No acceptance criteria yet.</span>'; }
function renderComments(items) { return items.length ? items.map(c => `<div class="context-row"><span><strong>${escapeHtml(c.user_name || c.author_name || 'User')}</strong><br>${escapeHtml(c.content || '')}</span><small>${escapeHtml(formatDateTime(c.created_at))}</small></div>`).join('') : '<span class="muted">No comments yet.</span>'; }
function renderAttachments(items) { return items.length ? items.map(a => `<div class="context-row"><span><strong>${escapeHtml(a.file_name || a.filename || 'Attachment')}</strong><br><small>${escapeHtml(a.file_size ? `${Math.round(a.file_size/1024)} KB` : '')}</small></span><button type="button" class="btn ghost small danger-btn" data-delete-attachment="${escapeHtml(a.attachment_id ?? a.id)}">Delete</button></div>`).join('') : '<span class="muted">No attachments yet.</span>'; }
function renderDependencies(items) { return items.length ? items.map(d => `<div class="context-row"><span>${escapeHtml(d.blocking_task_title || d.blocked_task_title || `Task ${d.blocking_task_id || d.blocked_task_id}`)}</span><button type="button" class="btn ghost small danger-btn" data-delete-dependency="${escapeHtml(d.dependency_id ?? d.id)}">Remove</button></div>`).join('') : '<span class="muted">No dependencies yet.</span>'; }
function renderTimeLogs(items) { return items.length ? items.slice(-5).reverse().map(log => `<div class="context-row"><span>${escapeHtml(formatDateTime(log.started_at))}<br><small>${log.ended_at ? formatDateTime(log.ended_at) : 'Running'}</small></span><strong>${log.duration != null ? formatHours(hoursFromMinutes(log.duration)) : 'Running'}</strong></div>`).join('') : '<span class="muted">No time logs yet.</span>'; }

async function selectTask(id) {
  if (!id) return;
  const root = document.querySelector('[data-task-details]');
  setLoading(root, true);
  root.innerHTML = '<div class="empty-panel"><strong>Loading task context…</strong><span>Fetching task records.</span></div>';
  try {
    const data = await loadTaskDetails(id);
    renderTaskContext(data);
    document.querySelectorAll('[data-open-task]').forEach(button => button.classList.toggle('selected', String(button.dataset.openTask) === String(id)));
    history.replaceState(null, '', `tasks.html#details-${encodeURIComponent(id)}`);
  } catch (error) {
    root.innerHTML = `<div class="empty-panel"><strong>Unable to load task</strong><span>${escapeHtml(error.message)}</span></div>`;
  } finally { setLoading(root, false); }
}

async function loadTaskPage(user) {
  renderUserChrome(user);
  const list = document.querySelector('[data-task-list]');
  if (!list) return;
  const load = async () => {
    try {
      const payload = await apiFetch(routes.MyTasksServlet);
      const tasks = unwrapCollection(payload, ['tasks']);
      const filter = document.querySelector('#task-filter select')?.value || '';
      const filtered = filter ? tasks.filter(t => t.status === filter) : tasks;
      renderTaskList(filtered, taskIdOf(filtered[0]));
      const hashMatch = location.hash.match(/^#details-(\d+)$/);
      await selectTask(hashMatch?.[1] || taskIdOf(filtered[0]));
    } catch (error) {
      list.innerHTML = `<div class="empty-panel"><strong>Tasks are unavailable.</strong><span>${escapeHtml(error.message)}</span></div>`;
    }
  };
  document.querySelector('#task-filter')?.addEventListener('submit', e => { e.preventDefault(); load(); });
  await load();
}

async function updateTaskStatus(taskId, status) {
  try { await apiFetch(TASK_FEATURES.status(taskId), { method: 'PATCH', body: JSON.stringify({ status }) }); showPageMessage('Task status updated.', 'success'); }
  catch (error) { showPageMessage(error.message, 'error'); }
}

async function addChecklistItem(event, taskId) {
  event.preventDefault(); const form = event.currentTarget;
  try { await apiFetch(TASK_FEATURES.checklist(taskId), { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(form))) }); await selectTask(taskId); }
  catch (error) { showPageMessage(error.message, 'error'); }
}
async function toggleChecklist(input, taskId) {
  try { await apiFetch(`${TASK_FEATURES.checklist(taskId)}/${encodeURIComponent(input.dataset.itemId)}`, { method: 'PATCH', body: JSON.stringify({ is_completed: input.checked }) }); }
  catch (error) { input.checked = !input.checked; showPageMessage(error.message, 'error'); }
}
async function addComment(event, taskId) { event.preventDefault(); const form = event.currentTarget; try { await apiFetch(TASK_FEATURES.comments(taskId), { method:'POST', body:JSON.stringify(Object.fromEntries(new FormData(form))) }); form.reset(); await selectTask(taskId); } catch(error){ showPageMessage(error.message,'error'); } }
async function uploadAttachment(event, taskId) {
  event.preventDefault();
  const form = event.currentTarget;
  const file = form.querySelector('input[type=\"file\"]')?.files?.[0];
  if (!file) { showPageMessage('Please select a file.', 'error'); return; }
  if (file.size > 750 * 1024) { showPageMessage('Attachment must be 750 KB or smaller.', 'error'); return; }
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    let binary = '';
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
    await apiFetch(TASK_FEATURES.attachments(taskId), {
      method: 'POST',
      body: JSON.stringify({ file_name: file.name, file_type: file.type || 'application/octet-stream', file_data_base64: btoa(binary) })
    });
    form.reset();
    await selectTask(taskId);
  } catch(error) { showPageMessage(error.message, 'error'); }
}
async function deleteAttachment(id, taskId) { if(!confirm('Delete this attachment?')) return; try { await apiFetch(`${TASK_FEATURES.attachments(taskId)}/${encodeURIComponent(id)}`,{method:'DELETE'}); await selectTask(taskId); } catch(error){showPageMessage(error.message,'error');} }
async function addDependency(event, taskId) { event.preventDefault(); const form=event.currentTarget; const values=Object.fromEntries(new FormData(form)); try { await apiFetch(TASK_FEATURES.dependencies(taskId),{method:'POST',body:JSON.stringify(values)}); form.reset(); await selectTask(taskId); } catch(error){showPageMessage(error.message,'error');} }
async function deleteDependency(id, taskId) { try { await apiFetch(`${TASK_FEATURES.dependencies(taskId)}/${encodeURIComponent(id)}`,{method:'DELETE'}); await selectTask(taskId); } catch(error){showPageMessage(error.message,'error');} }
async function addManualTimeLog(event, taskId) { event.preventDefault(); const form=event.currentTarget; const v=Object.fromEntries(new FormData(form)); try { await apiFetch(TASK_FEATURES.manualTimeLog(taskId),{method:'POST',body:JSON.stringify({started_at:v.started_at,ended_at:v.ended_at})}); form.reset(); await selectTask(taskId); } catch(error){showPageMessage(error.message,'error');} }

function installTimer(root, taskId) {
  const start=root.querySelector('[data-timer-start]'), stop=root.querySelector('[data-timer-stop]'), display=root.querySelector('[data-timer-display]');
  let startedAt=null, interval=null, logId=null;
  const draw=()=>{ if(!startedAt)return; const sec=Math.max(0,Math.floor((Date.now()-startedAt)/1000)); display.textContent=[Math.floor(sec/3600),Math.floor(sec/60)%60,sec%60].map(n=>String(n).padStart(2,'0')).join(':'); };
  start.addEventListener('click',async()=>{ try { const result=await apiFetch(TASK_FEATURES.startTimeLog(taskId),{method:'POST',body:JSON.stringify({})}); logId=result?.time_log?.time_log_id||result?.data?.time_log?.time_log_id||result?.time_log_id||result?.data?.time_log_id||null; startedAt=Date.now(); interval=setInterval(draw,1000); start.disabled=true; stop.disabled=false; draw(); } catch(error){showPageMessage(error.message,'error');} });
  stop.addEventListener('click',async()=>{ try { if(!logId){throw new Error('The running time log ID was not returned by the server.');} await apiFetch(TASK_FEATURES.stopTimeLog(taskId),{method:'POST',body:JSON.stringify({time_log_id:Number(logId)})}); clearInterval(interval); interval=null; start.disabled=false; stop.disabled=true; startedAt=null; logId=null; display.textContent='00:00:00'; await selectTask(taskId); } catch(error){showPageMessage(error.message,'error');} });
}


/* ========================= Phase 5 + 6 ========================= */
function projectIdFromPage() {
  const params = new URLSearchParams(location.search);
  const id = params.get('project_id') || params.get('projectId');
  return id && /^\d+$/.test(id) ? Number(id) : null;
}

function projectIdOf(project) { return project?.project_id ?? project?.id; }
function taskProjectIdOf(task) { return task?.project_id ?? task?.projectId; }
function taskStart(task) { return task?.start_date || task?.start_at || task?.started_at || null; }
function taskDue(task) { return task?.due_date || task?.deadline || task?.end_date || null; }
function isDone(task) { return String(task?.status || '').toLowerCase() === 'done'; }
function isWaiting(task) { return ['waiting_approval', 'blocked'].includes(String(task?.status || '').toLowerCase()); }
function dateOnly(value) { return value ? String(value).slice(0, 10) : null; }
function dateLabel(value) { if (!value) return '—'; const d = new Date(value); return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString(undefined, {month:'short', day:'numeric'}); }
function daysBetween(a,b) { const x=new Date(a), y=new Date(b); if(Number.isNaN(x)||Number.isNaN(y)) return 0; return Math.max(1, Math.ceil((y-x)/86400000)); }

function projectHealth(tasks) {
  const today = new Date(); today.setHours(0,0,0,0);
  const overdue = tasks.filter(t => !isDone(t) && taskDue(t) && new Date(taskDue(t)) < today).length;
  const waiting = tasks.filter(isWaiting).length;
  if (overdue > 0) return {label:'Red', key:'red', reason:`${overdue} overdue task${overdue === 1 ? '' : 's'}`};
  if (waiting > 0) return {label:'Yellow', key:'yellow', reason:`${waiting} blocked or waiting task${waiting === 1 ? '' : 's'}`};
  return {label:'Green', key:'green', reason:'No overdue or blocked tasks'};
}

function renderProjectHealth(tasks) {
  const health = projectHealth(tasks);
  const node=document.querySelector('[data-project-health]');
  if(node) node.innerHTML=`<span class="health-dot health-${health.key}"></span><strong>${health.label}</strong><small>${escapeHtml(health.reason)}</small>`;
  return health;
}

function renderProjectBoard(tasks) {
  const columns = ['todo','in_progress','waiting_approval','done'];
  const board=document.querySelector('[data-project-board]'); if(!board) return;
  board.innerHTML=columns.map(status=>{
    const items=tasks.filter(t=>String(t.status||'').toLowerCase()===status);
    return `<section class="board-col"><div class="board-heading">${formatStatus(status)} <span>${items.length}</span></div>${items.length ? items.map(t=>`<a class="board-card" href="tasks.html#details-${encodeURIComponent(taskIdOf(t))}"><h3>${escapeHtml(t.title || t.name || 'Untitled task')}</h3><p>${escapeHtml(t.description || '')}</p><div class="board-meta"><span class="tag">${escapeHtml(t.priority || 'medium')}</span><small>${escapeHtml(dateLabel(taskDue(t)))} · ${escapeHtml(t.assignee_name || t.assignee || 'Unassigned')}</small></div></a>`).join('') : '<div class="empty-panel compact-empty">No tasks</div>'}</section>`;
  }).join('');
}

function renderProjectTimeline(tasks) {
  const root=document.querySelector('[data-project-timeline]'); if(!root) return;
  const dated=tasks.filter(t=>taskStart(t)||taskDue(t));
  if(!dated.length){ root.innerHTML='<div class="empty-panel compact-empty"><strong>No dated tasks</strong><span>Add start and due dates to see the project timeline.</span></div>'; return; }
  let min=dated.reduce((v,t)=>{const d=new Date(taskStart(t)||taskDue(t)); return !v||d<v?d:v},null);
  let max=dated.reduce((v,t)=>{const d=new Date(taskDue(t)||taskStart(t)); return !v||d>v?d:v},null);
  const span=Math.max(1, daysBetween(min,max));
  root.innerHTML=`<div class="timeline-head"><span>Task</span><span>${dateLabel(min)}</span><span>${dateLabel(max)}</span></div>` + dated.map(t=>{
    const start=new Date(taskStart(t)||taskDue(t)), end=new Date(taskDue(t)||taskStart(t));
    const left=Math.max(0, Math.min(96, ((start-min)/86400000)/span*100));
    const width=Math.max(4, Math.min(100-left, daysBetween(start,end)/span*100));
    return `<div class="timeline-row"><div class="timeline-name">${escapeHtml(t.title || t.name || 'Untitled task')}<small>${escapeHtml(t.assignee_name || t.assignee || 'Unassigned')} · ${escapeHtml(formatStatus(t.status))}</small></div><div class="timeline-track"><i style="left:${left}%;width:${width}%" class="timeline-dynamic-bar"></i></div></div>`;
  }).join('');
}

async function loadProjectPage(user) {
  renderUserChrome(user);
  const root = document.querySelector('[data-project-workspace]');
  if (!root) return;
  try {
    const requested = projectIdFromPage();
    const myTasksPayload = await apiFetch(routes.MyTasksServlet);
    const myTasks = unwrapCollection(myTasksPayload, ['tasks']);
    const pid = requested || projectIdOf(myTasks[0]) || taskProjectIdOf(myTasks[0]);
    if (!pid) {
      root.innerHTML = '<div class="empty-panel"><strong>No project available</strong><span>Open a project from an assigned task or provide a project_id in the URL.</span></div>';
      return;
    }

    const [projectPayload, timelinePayload] = await Promise.all([
      apiFetch(routes.ProjectServlet(pid)),
      apiFetch(routes.ProjectTimelineServlet(pid))
    ]);
    const project = projectPayload?.project || projectPayload?.data?.project || projectPayload?.data || projectPayload;
    const timeline = timelinePayload?.timeline || timelinePayload?.data?.timeline || timelinePayload?.data || timelinePayload;
    const tasks = Array.isArray(timeline?.tasks) ? timeline.tasks : [];
    const dependencies = Array.isArray(timeline?.dependencies) ? timeline.dependencies : [];

    const title = document.querySelector('[data-project-name]');
    if (title) title.textContent = project?.name_title || project?.name || project?.title || `Project ${pid}`;
    const desc = document.querySelector('[data-project-description]');
    if (desc) desc.textContent = project?.description || 'Project workspace';
    const select = document.querySelector('[data-project-selector]');
    if (select) {
      select.innerHTML = `<option value="${escapeHtml(pid)}">${escapeHtml(project?.name_title || project?.name || project?.title || `Project ${pid}`)}</option>`;
      select.value = String(pid);
    }

    document.querySelector('[data-project-task-count]')?.replaceChildren(document.createTextNode(String(tasks.length)));
    const done = tasks.filter(isDone).length;
    const progress = tasks.length ? Math.round(done / tasks.length * 100) : 0;
    const progressNode = document.querySelector('[data-project-progress]');
    if (progressNode) progressNode.textContent = `${progress}%`;
    renderProjectHealth(tasks);
    renderProjectBoard(tasks);
    renderProjectTimeline(tasks);

    const depNode = document.querySelector('[data-project-dependencies]');
    if (depNode) {
      depNode.innerHTML = dependencies.length
        ? dependencies.map(d => `<div class="context-row"><span><strong>Task ${escapeHtml(d.blocked_task_id)}</strong><small>blocked by Task ${escapeHtml(d.blocking_task_id)}</small></span><span class="tag">Dependency</span></div>`).join('')
        : '<div class="empty-panel compact-empty"><strong>No dependencies</strong><span>Task dependencies will appear here automatically.</span></div>';
    }

    const health = timeline?.health;
    const healthNode = document.querySelector('[data-project-health]');
    if (healthNode && health) {
      const key = String(health).toLowerCase();
      healthNode.innerHTML = `<span class="health-dot health-${escapeHtml(key)}"></span><strong>${escapeHtml(String(health).replace(/^./, c => c.toUpperCase()))}</strong><small>Backend project health</small>`;
    }
  } catch(error) {
    root.innerHTML = `<div class="empty-panel"><strong>Project workspace unavailable</strong><span>${escapeHtml(error.message)}</span></div>`;
  }
}
function currentQuarter() { return Math.floor(new Date().getMonth()/3)+1; }
function currentYear() { return new Date().getFullYear(); }
function metricValue(metrics, keys) { for(const k of keys){ if(metrics?.[k] != null) return metrics[k]; } return null; }
function renderInsightMetrics(data) {
  const metrics=data?.metrics || data?.data?.metrics || data?.data || data || {};
  const values={
    completed: metricValue(metrics,['completed_tasks','tasks_completed']),
    ontime: metricValue(metrics,['on_time_percentage','onTimePercentage']),
    logged: metricValue(metrics,['logged_hours','actual_hours']),
    estimated: metricValue(metrics,['estimated_hours','estimated_effort_hours']),
    variance: metricValue(metrics,['effort_variance_hours'])
  };
  const map={completed: values.completed == null ? '—' : values.completed, ontime: values.ontime == null ? '—' : `${formatNumber(values.ontime,1)}%`, logged: values.logged == null ? '—' : `${formatNumber(values.logged,2)} h`, estimated: values.estimated == null ? '—' : `${formatNumber(values.estimated,2)} h`, variance: values.variance == null ? '—' : `${formatNumber(values.variance,2)} h`};
  Object.entries(map).forEach(([k,v])=>{document.querySelectorAll(`[data-insight-metric="${k}"]`).forEach(n=>n.textContent=v);});
  const fill=document.querySelector('[data-on-time-fill]'); if(fill) fill.style.width=`${Math.max(0,Math.min(100,Number(values.ontime)||0))}%`;
  const effortFill=document.querySelector('[data-effort-fill]'); const ratio=values.estimated>0 ? Number(values.logged)/Number(values.estimated)*100 : 0; if(effortFill) effortFill.style.width=`${Math.max(0,Math.min(100,ratio))}%`;
}

async function loadInsightsPage(user) {
  renderUserChrome(user);
  const yearNode=document.querySelector('[data-insight-year]'), quarterNode=document.querySelector('[data-insight-quarter]');
  if(yearNode && !yearNode.value) yearNode.value=String(currentYear());
  if(quarterNode && !quarterNode.value) quarterNode.value=String(currentQuarter());
  const year=Number(yearNode?.value)||currentYear(), quarter=Number(quarterNode?.value)||currentQuarter();
  const load=async()=>{
    try {
      const [dashboard,quarterly]=await Promise.allSettled([apiFetch(`/api/analytics/me/dashboard?year=${year}&quarter=${quarter}`),apiFetch(`/api/analytics/me/quarterly?year=${year}&quarter=${quarter}`)]);
      if(dashboard.status==='fulfilled') renderInsightMetrics(dashboard.value); else if(quarterly.status==='fulfilled') renderInsightMetrics(quarterly.value); else throw dashboard.reason;
      const period=document.querySelector('[data-insight-period]'); if(period) period.textContent=`Q${quarter} ${year}`;
      const status=document.querySelector('[data-insights-status]'); if(status) status.textContent='Live metrics from your task and time-log records.';
    } catch(error) { const status=document.querySelector('[data-insights-status]'); if(status) status.textContent=`Analytics unavailable: ${error.message}`; }
  };
  document.querySelector('[data-insight-filter]')?.addEventListener('submit',e=>{e.preventDefault(); load();});
  await load();
}
