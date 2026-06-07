import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { Expense, ExpenseCategory } from '../types';
import { CATEGORY_LABELS } from '../utils/analysis';
import { formatMoney } from '../utils/currency';

const CATEGORIES: ExpenseCategory[] = [
  'food', 'transport', 'shopping', 'bills', 'entertainment', 'health', 'other',
];

const QUICK_AMOUNTS = [50, 100, 200, 500];

interface ExpenseTrackerProps {
  expenses: Expense[];
  currency: string;
  onAdd: (amount: number, category: ExpenseCategory, note: string) => void;
  onRemove: (id: string) => void;
}

export function ExpenseTracker({ expenses, currency, onAdd, onRemove }: ExpenseTrackerProps) {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('food');
  const [note, setNote] = useState('');

  const submit = (amt: number, cat = category, n = note) => {
    if (amt <= 0) return;
    onAdd(amt, cat, n);
    setAmount('');
    setNote('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit(parseFloat(amount));
  };

  const total = expenses.reduce((s, e) => s + e.amount, 0);

  const categoryTotals = expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + e.amount;
    return acc;
  }, {});

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Spending</h2>
        <span className="count-tag">{formatMoney(total, currency)}</span>
      </div>

      <div className="quick-chips">
        {QUICK_AMOUNTS.map((a) => (
          <button key={a} type="button" className="chip" onClick={() => submit(a)}>
            {currency}{a}
          </button>
        ))}
      </div>

      <form className="expense-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="field">
            <label htmlFor="amount">Amount</label>
            <div className="money-field">
              <span>{currency}</span>
              <input
                id="amount"
                type="number"
                min="1"
                step="1"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>
          <div className="field">
            <label htmlFor="category">Category</label>
            <select id="category" value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="field">
          <label htmlFor="note">Note</label>
          <input id="note" type="text" placeholder="Optional" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <button type="submit" className="btn" disabled={!amount || parseFloat(amount) <= 0}>
          <Plus size={16} /> Log expense
        </button>
      </form>

      {Object.keys(categoryTotals).length > 0 && (
        <div className="cat-bars">
          {Object.entries(categoryTotals)
            .sort((a, b) => b[1] - a[1])
            .map(([cat, amt]) => (
              <div key={cat} className="cat-bar">
                <div className="cat-bar-top">
                  <span>{CATEGORY_LABELS[cat as ExpenseCategory]}</span>
                  <span>{formatMoney(amt, currency)}</span>
                </div>
                <div className="cat-track">
                  <div className={`cat-fill c-${cat}`} style={{ width: `${(amt / total) * 100}%` }} />
                </div>
              </div>
            ))}
        </div>
      )}

      {expenses.length === 0 ? (
        <p className="empty">Tap a quick amount or log below.</p>
      ) : (
        <ul className="expense-list">
          {[...expenses].reverse().map((exp) => (
            <li key={exp.id} className="expense-row">
              <span className={`exp-dot c-${exp.category}`} />
              <div className="exp-meta">
                <span className="exp-cat">{CATEGORY_LABELS[exp.category]}</span>
                {exp.note && <span className="exp-note">{exp.note}</span>}
              </div>
              <span className="exp-amt">{formatMoney(exp.amount, currency)}</span>
              <button type="button" className="icon-btn ghost danger" onClick={() => onRemove(exp.id)} aria-label="Remove">
                <Trash2 size={13} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
