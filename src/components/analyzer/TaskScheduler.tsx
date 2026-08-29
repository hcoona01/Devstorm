import React, { useState, useEffect } from 'react';

export interface ActionPlanTask {
  id: string;
  title: string;
  description: string;
  estimated_time?: string;
  priority?: 'High' | 'Medium' | 'Low';
  github_repo_recommendation?: string;
}

interface TaskSchedulerProps {
  tasks: ActionPlanTask[];
}

interface Column {
  name: string;
  items: ActionPlanTask[];
}

export default function TaskScheduler({ tasks }: TaskSchedulerProps) {
  const [columns, setColumns] = useState<Record<string, Column>>({
    todo: { name: 'To Do', items: [] },
    inProgress: { name: 'In Progress', items: [] },
    done: { name: 'Done', items: [] },
  });

  useEffect(() => {
    if (tasks && tasks.length > 0) {
      setColumns((prev) => ({
        ...prev,
        todo: { ...prev.todo, items: tasks },
      }));
    }
  }, [tasks]);

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

    setColumns((prev) => {
      const sourceItems = prev[sourceColumn].items.filter((i) => i.id !== item.id);
      const destItems = [...prev[destColumn].items, item];

      return {
        ...prev,
        [sourceColumn]: { ...prev[sourceColumn], items: sourceItems },
        [destColumn]: { ...prev[destColumn], items: destItems },
      };
    });
  };

  if (!tasks || tasks.length === 0) return null;

  const getPriorityClass = (priority?: string) => {
    if (priority === 'High') return 'priority-high';
    if (priority === 'Medium') return 'priority-medium';
    return 'priority-low';
  };

  return (
    <div
      className="lab-panel"
      style={{ borderTop: 'none', marginTop: 0 }}
    >
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
          <h3 className="lab-heading" style={{ fontSize: 18, margin: 0 }}>
            AI Learning Roadmap & Task Scheduler
          </h3>
          <span className="lab-label lab-mono">{tasks.length} Tasks</span>
        </div>
        <p className="lab-body" style={{ margin: 0, fontSize: 12 }}>
          Based on your gap analysis, AI has recommended these tasks and
          GitHub repos. Drag and drop to track your progress.
        </p>
      </div>

      <div className="lab-grid-3" style={{ minHeight: 280, border: '1px solid var(--lab-border)' }}>
        {Object.entries(columns).map(([columnId, column]) => (
          <div
            key={columnId}
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, columnId)}
            className="lab-kanban-col"
            style={{ border: 'none' }}
          >
            <div
              className="lab-label"
              style={{
                paddingBottom: 10,
                marginBottom: 4,
                borderBottom: '1px solid var(--lab-border)',
              }}
            >
              {column.name} <span className="lab-mono">({column.items.length})</span>
            </div>

            {column.items.map((item) => (
              <div
                key={item.id}
                draggable
                onDragStart={(e) => onDragStart(e, item, columnId)}
                className={`lab-kanban-card ${getPriorityClass(item.priority)}`}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                  <strong
                    className="lab-heading"
                    style={{ fontSize: 13, letterSpacing: '-0.01em' }}
                  >
                    {item.title}
                  </strong>
                  {item.estimated_time && (
                    <span className="lab-tag lab-tag-ink lab-mono" style={{ flexShrink: 0 }}>
                      {item.estimated_time}
                    </span>
                  )}
                </div>

                <p className="lab-body" style={{ marginBottom: 12, fontSize: 12 }}>
                  {item.description}
                </p>

                {item.github_repo_recommendation && (
                  <a
                    href={
                      item.github_repo_recommendation.startsWith('http')
                        ? item.github_repo_recommendation
                        : `https://github.com/${item.github_repo_recommendation}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="lab-btn-sm lab-hover-underline"
                  >
                    View Repo ↗
                  </a>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
