import { useState } from 'react';
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import type { Task } from '../types';

interface TaskListProps {
  tasks: Task[];
  onAdd: (text: string) => void;
  onEdit: (id: string, text: string) => void;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
}

export function TaskList({ tasks, onAdd, onEdit, onToggle, onRemove }: TaskListProps) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onAdd(input);
    setInput('');
  };

  const pending = tasks.filter((t) => !t.completed);
  const done = tasks.filter((t) => t.completed);

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Tasks</h2>
        {pending.length > 0 && <span className="count-tag">{pending.length} open</span>}
      </div>
      <p className="panel-hint">Added once — shows up every day. Check off fresh each morning.</p>

      <form className="inline-form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="What needs doing?"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          aria-label="New task"
        />
        <button type="submit" className="btn" disabled={!input.trim()}>
          <Plus size={16} />
          Add
        </button>
      </form>

      {tasks.length === 0 ? (
        <p className="empty">Add your daily tasks here. They'll repeat each day.</p>
      ) : (
        <ul className="task-list">
          {pending.map((task) => (
            <TaskItem key={task.id} task={task} onEdit={onEdit} onToggle={onToggle} onRemove={onRemove} />
          ))}
          {done.length > 0 && (
            <>
              <li className="list-divider">Done</li>
              {done.map((task) => (
                <TaskItem key={task.id} task={task} onEdit={onEdit} onToggle={onToggle} onRemove={onRemove} />
              ))}
            </>
          )}
        </ul>
      )}
    </section>
  );
}

function TaskItem({
  task,
  onEdit,
  onToggle,
  onRemove,
}: {
  task: Task;
  onEdit: (id: string, text: string) => void;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(task.text);

  const saveEdit = () => {
    if (editText.trim()) {
      onEdit(task.id, editText);
      setEditing(false);
    }
  };

  return (
    <li className={`task-row ${task.completed ? 'done' : ''}`}>
      <button
        type="button"
        className={`check ${task.completed ? 'on' : ''}`}
        onClick={() => onToggle(task.id)}
        aria-label={task.completed ? 'Undo' : 'Complete'}
      >
        {task.completed && <Check size={12} strokeWidth={3} />}
      </button>

      {editing ? (
        <div className="edit-inline">
          <input
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveEdit();
              if (e.key === 'Escape') setEditing(false);
            }}
            autoFocus
          />
          <button type="button" className="icon-btn" onClick={saveEdit}><Check size={14} /></button>
          <button type="button" className="icon-btn" onClick={() => setEditing(false)}><X size={14} /></button>
        </div>
      ) : (
        <span className="task-label">{task.text}</span>
      )}

      {!editing && (
        <button type="button" className="icon-btn ghost" onClick={() => setEditing(true)} aria-label="Edit">
          <Pencil size={13} />
        </button>
      )}
      <button type="button" className="icon-btn ghost danger" onClick={() => onRemove(task.id)} aria-label="Delete">
        <Trash2 size={13} />
      </button>
    </li>
  );
}
