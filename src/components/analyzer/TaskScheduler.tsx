import React, { useState, useEffect } from 'react';

export interface ActionPlanTask {
  id: string;
  title: string;
  description: string;
  estimated_time?: string;
  priority?: 'High' | 'Medium' | 'Low';
  github_repo_recommendation?: string;
  isUserAdded?: boolean;
}

interface TaskSchedulerProps {
  tasks: ActionPlanTask[];
  storageKey?: string;
}

interface Column {
  name: string;
  items: ActionPlanTask[];
}

export default function TaskScheduler({ tasks, storageKey = 'default' }: TaskSchedulerProps) {
  const LOCAL_STORAGE_KEY = `stackalign_todo_board_${storageKey}`;

  const [columns, setColumns] = useState<Record<string, Column>>({
    todo: { name: 'To Do', items: [] },
    inProgress: { name: 'In Progress', items: [] },
    done: { name: 'Done', items: [] },
  });

  const [showAddForm, setShowAddForm] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'High' | 'Medium' | 'Low'>('High');
  const [newTaskTime, setNewTaskTime] = useState('1 week');
  const [newTaskLink, setNewTaskLink] = useState('');

  // 1. Initial load from localStorage & merge incoming AI tasks
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedData) {
        const parsed = JSON.parse(savedData) as Record<string, Column>;
        if (parsed.todo && parsed.inProgress && parsed.done) {
          // Collect all existing task IDs across columns
          const existingIds = new Set([
            ...parsed.todo.items.map((t) => t.id),
            ...parsed.inProgress.items.map((t) => t.id),
            ...parsed.done.items.map((t) => t.id),
          ]);

          // Find any new AI tasks that aren't in cached columns yet
          const newAiTasks = (tasks || []).filter((t) => !existingIds.has(t.id));

          const merged: Record<string, Column> = {
            todo: { ...parsed.todo, items: [...parsed.todo.items, ...newAiTasks] },
            inProgress: parsed.inProgress,
            done: parsed.done,
          };

          setColumns(merged);
          return;
        }
      }
    } catch (err) {
      console.error('Failed to parse saved task board:', err);
    }

    // Default if no cache exists
    setColumns({
      todo: { name: 'To Do', items: tasks || [] },
      inProgress: { name: 'In Progress', items: [] },
      done: { name: 'Done', items: [] },
    });
  }, [tasks, LOCAL_STORAGE_KEY]);

  // 2. Save columns state to localStorage whenever columns change
  const saveColumnsToStorage = (updatedColumns: Record<string, Column>) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedColumns));
    } catch (err) {
      console.error('Failed to save task board to localStorage:', err);
    }
  };

  // Drag and drop handlers
  const onDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    item: ActionPlanTask,
    sourceColumn: string
  ) => {
    e.dataTransfer.setData('item', JSON.stringify(item));
    e.dataTransfer.setData('sourceColumn', sourceColumn);
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>, destColumn: string) => {
    const itemStr = e.dataTransfer.getData('item');
    if (!itemStr) return;
    const item = JSON.parse(itemStr) as ActionPlanTask;
    const sourceColumn = e.dataTransfer.getData('sourceColumn');

    if (sourceColumn === destColumn) return;

    moveTask(item, sourceColumn, destColumn);
  };

  // Direct move helper for click buttons
  const moveTask = (item: ActionPlanTask, sourceColId: string, destColId: string) => {
    setColumns((prev) => {
      const sourceItems = prev[sourceColId].items.filter((i) => i.id !== item.id);
      const destItems = [...prev[destColId].items, item];

      const updated = {
        ...prev,
        [sourceColId]: { ...prev[sourceColId], items: sourceItems },
        [destColId]: { ...prev[destColId], items: destItems },
      };
      saveColumnsToStorage(updated);
      return updated;
    });
  };

  // Delete task
  const deleteTask = (itemId: string, colId: string) => {
    setColumns((prev) => {
      const updatedColItems = prev[colId].items.filter((i) => i.id !== itemId);
      const updated = {
        ...prev,
        [colId]: { ...prev[colId], items: updatedColItems },
      };
      saveColumnsToStorage(updated);
      return updated;
    });
  };

  // Add custom user To-Do task
  const handleAddCustomTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const customTask: ActionPlanTask = {
      id: `user_task_${Date.now()}`,
      title: newTaskTitle.trim(),
      description: newTaskDesc.trim() || 'Custom user action item',
      priority: newTaskPriority,
      estimated_time: newTaskTime.trim() || '1 week',
      github_repo_recommendation: newTaskLink.trim(),
      isUserAdded: true,
    };

    setColumns((prev) => {
      const updated = {
        ...prev,
        todo: { ...prev.todo, items: [customTask, ...prev.todo.items] },
      };
      saveColumnsToStorage(updated);
      return updated;
    });

    setNewTaskTitle('');
    setNewTaskDesc('');
    setNewTaskLink('');
    setShowAddForm(false);
  };

  // Reset to original AI tasks
  const handleResetBoard = () => {
    if (window.confirm('Reset task board to original state? Custom progress will be cleared.')) {
      const resetCols = {
        todo: { name: 'To Do', items: tasks || [] },
        inProgress: { name: 'In Progress', items: [] },
        done: { name: 'Done', items: [] },
      };
      setColumns(resetCols);
      saveColumnsToStorage(resetCols);
    }
  };

  const totalTaskCount =
    columns.todo.items.length + columns.inProgress.items.length + columns.done.items.length;
  const doneCount = columns.done.items.length;
  const progressPercent = totalTaskCount > 0 ? Math.round((doneCount / totalTaskCount) * 100) : 0;

  const getPriorityClass = (priority?: string) => {
    if (priority === 'High') return 'priority-high';
    if (priority === 'Medium') return 'priority-medium';
    return 'priority-low';
  };

  return (
    <div className="lab-panel" style={{ borderTop: 'none', marginTop: 0 }}>
      {/* Header Bar */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 8 }}>
          <div>
            <span className="lab-label lab-mono">Task Manager & Progress Tracker</span>
            <h3 className="lab-heading" style={{ fontSize: 20, margin: '2px 0 0' }}>
              Interactive To-Do List & Task Scheduler
            </h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              className="lab-btn-sm"
              onClick={() => setShowAddForm(!showAddForm)}
              style={{ fontSize: 11, padding: '6px 12px', background: 'var(--lab-ink)', color: '#fff' }}
            >
              {showAddForm ? '✕ Cancel' : '+ Add Custom To-Do'}
            </button>
            <button
              type="button"
              className="lab-btn-sm"
              onClick={handleResetBoard}
              style={{ fontSize: 10, padding: '6px 10px', borderColor: 'var(--lab-border)' }}
            >
              ↺ Reset Board
            </button>
          </div>
        </div>

        <p className="lab-body" style={{ margin: 0, fontSize: 12 }}>
          Drag and drop tasks or use status controls to track progress. Your task progress and custom To-Dos are automatically saved across browser refreshes.
        </p>

        {/* Progress Indicator */}
        <div style={{ marginTop: 14, background: 'var(--lab-paper-warm)', padding: 12, border: '1px solid var(--lab-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
            <span className="lab-heading" style={{ fontSize: 13, fontWeight: 600 }}>
              Overall Task Completion: <span className="lab-mono">{progressPercent}%</span>
            </span>
            <span className="lab-label lab-mono">
              {doneCount} / {totalTaskCount} Tasks Completed
            </span>
          </div>
          <div style={{ width: '100%', height: 8, background: '#E5DFD7', border: '1px solid var(--lab-border)', overflow: 'hidden' }}>
            <div
              style={{
                width: `${progressPercent}%`,
                height: '100%',
                background: progressPercent === 100 ? '#6B7D6B' : 'var(--lab-ink)',
                transition: 'width 0.4s ease',
              }}
            />
          </div>
        </div>
      </div>

      {/* Custom Task Addition Form */}
      {showAddForm && (
        <form
          onSubmit={handleAddCustomTask}
          style={{
            marginBottom: 20,
            padding: 16,
            border: '1px solid var(--lab-border)',
            background: 'var(--lab-paper-warm)',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <span className="lab-label-dark" style={{ fontSize: 12, fontWeight: 700 }}>
            Create Custom User To-Do Task
          </span>

          <div className="lab-grid-2" style={{ gap: 12 }}>
            <input
              type="text"
              className="lab-input"
              placeholder="Task Title (e.g. Implement JWT Authentication)..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              required
            />
            <input
              type="text"
              className="lab-input"
              placeholder="Estimated Time (e.g. 2 hours, 1 week)..."
              value={newTaskTime}
              onChange={(e) => setNewTaskTime(e.target.value)}
            />
          </div>

          <textarea
            className="lab-textarea"
            rows={2}
            placeholder="Task Description / Details..."
            value={newTaskDesc}
            onChange={(e) => setNewTaskDesc(e.target.value)}
          />

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <label className="lab-label">Priority:</label>
              <select
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value as any)}
                className="lab-input"
                style={{ padding: '4px 8px', fontSize: 12, width: 'auto' }}
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <input
              type="text"
              className="lab-input"
              placeholder="GitHub Repo or Reference Link (optional)..."
              value={newTaskLink}
              onChange={(e) => setNewTaskLink(e.target.value)}
              style={{ flex: 1, minWidth: 200 }}
            />

            <button type="submit" className="lab-btn" style={{ width: 'auto', padding: '8px 20px', fontSize: 12 }}>
              Add to To-Do List →
            </button>
          </div>
        </form>
      )}

      {/* Task Kanban Columns */}
      <div className="lab-grid-3" style={{ minHeight: 320, gap: 16 }}>
        {Object.entries(columns).map(([colId, column]) => (
          <div
            key={colId}
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, colId)}
            className="lab-kanban-col"
            style={{
              background: colId === 'done' ? 'rgba(107, 125, 107, 0.05)' : 'var(--lab-paper)',
              border: '1px solid var(--lab-border)',
              padding: 12,
            }}
          >
            {/* Column Title */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: 8,
                marginBottom: 12,
                borderBottom: '2px solid var(--lab-ink)',
              }}
            >
              <span className="lab-heading" style={{ fontSize: 14, fontWeight: 700 }}>
                {column.name}
              </span>
              <span className="lab-tag lab-tag-ink lab-mono">{column.items.length}</span>
            </div>

            {/* Empty State */}
            {column.items.length === 0 && (
              <div style={{ textAlign: 'center', padding: '24px 12px', color: 'var(--lab-warm-gray)', fontSize: 12 }}>
                {colId === 'todo' ? 'No pending To-Dos' : colId === 'inProgress' ? 'Drag tasks here when working' : 'No completed tasks yet'}
              </div>
            )}

            {/* Task Items */}
            {column.items.map((item) => (
              <div
                key={item.id}
                draggable
                onDragStart={(e) => onDragStart(e, item, colId)}
                className={`lab-kanban-card ${getPriorityClass(item.priority)}`}
                style={{
                  background: 'var(--lab-white)',
                  border: '1px solid var(--lab-border)',
                  padding: 12,
                  marginBottom: 10,
                  cursor: 'grab',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                }}
              >
                {/* Card Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                  <strong className="lab-heading" style={{ fontSize: 13, lineHeight: 1.3 }}>
                    {item.title}
                  </strong>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                    {item.estimated_time && (
                      <span className="lab-tag lab-tag-ink lab-mono" style={{ fontSize: 9, padding: '2px 6px' }}>
                        {item.estimated_time}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => deleteTask(item.id, colId)}
                      title="Delete task"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#8B4C39',
                        cursor: 'pointer',
                        fontSize: 12,
                        padding: '0 2px',
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <p className="lab-body" style={{ margin: '0 0 10px', fontSize: 12, color: 'var(--lab-ink-2)', lineHeight: 1.4 }}>
                  {item.description}
                </p>

                {/* Actions / Repositories & Column Move Controls */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, flexWrap: 'wrap', paddingTop: 6, borderTop: '1px dashed var(--lab-border)' }}>
                  {item.github_repo_recommendation ? (
                    <a
                      href={
                        item.github_repo_recommendation.startsWith('http')
                          ? item.github_repo_recommendation
                          : `https://github.com/${item.github_repo_recommendation}`
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="lab-btn-sm lab-hover-underline"
                      style={{ fontSize: 9, padding: '3px 8px' }}
                    >
                      Repo ↗
                    </a>
                  ) : <span />}

                  {/* One-Click Move Controls */}
                  <div style={{ display: 'flex', gap: 4 }}>
                    {colId !== 'todo' && (
                      <button
                        type="button"
                        onClick={() => moveTask(item, colId, 'todo')}
                        className="lab-btn-sm"
                        style={{ fontSize: 9, padding: '3px 6px' }}
                        title="Move to To Do"
                      >
                        ← To Do
                      </button>
                    )}
                    {colId !== 'inProgress' && (
                      <button
                        type="button"
                        onClick={() => moveTask(item, colId, 'inProgress')}
                        className="lab-btn-sm"
                        style={{ fontSize: 9, padding: '3px 6px' }}
                        title="Move to In Progress"
                      >
                        {colId === 'todo' ? 'Start →' : '← In Progress'}
                      </button>
                    )}
                    {colId !== 'done' && (
                      <button
                        type="button"
                        onClick={() => moveTask(item, colId, 'done')}
                        className="lab-btn-sm"
                        style={{ fontSize: 9, padding: '3px 6px', borderColor: '#6B7D6B', color: '#6B7D6B' }}
                        title="Mark Done"
                      >
                        ✓ Done
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
