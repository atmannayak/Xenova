import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Pencil,
  Trash2,
  ArrowUpCircle,
  ArrowDownCircle,
  Loader2,
  AlertTriangle,
  BellRing,
  Settings,
} from 'lucide-react';
import { financeApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import ConfirmDialog from '../components/ConfirmDialog';

const CATEGORIES = ['Food', 'Transport', 'Books', 'Entertainment', 'Shopping', 'Health', 'Education', 'Other'];

const emptyForm = {
  title: '',
  amount: '',
  type: 'expense',
  category: 'Food',
  date: new Date().toISOString().slice(0, 10),
  description: '',
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);

const CATEGORY_STYLES = {
  Food: 'bg-sage-600/10 text-sage-700 dark:text-sage-400',
  Transport: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  Books: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  Entertainment: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  Shopping: 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
  Health: 'bg-red-500/10 text-red-600 dark:text-red-400',
  Education: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
  Other: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400',
};

const Finance = () => {
  const toast = useToast();
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Budget modal / input state
  const [showBudgetInput, setShowBudgetInput] = useState(false);
  const [newBudget, setNewBudget] = useState('');
  const [savingBudget, setSavingBudget] = useState(false);

  // Check and trigger budget alerts for 50%, 80%, and zero-budget conditions
  const checkBudgetAlerts = (summaryData) => {
    if (!summaryData) return;

    const budget = summaryData.monthlyBudget || 0;
    const spent = summaryData.monthExpenses || 0;

    if (budget === 0 && spent > 0) {
      toast.error(
        `🚨 Budget Alert: You have spent ${formatCurrency(spent)} but your monthly budget is set to ₹0! Please set a budget limit.`
      );
      return;
    }

    if (budget > 0) {
      const percentUsed = Math.round((spent / budget) * 100);

      if (percentUsed >= 80) {
        toast.error(
          `🚨 Critical Budget Warning! You have spent ${percentUsed}% (${formatCurrency(spent)} of ${formatCurrency(budget)}) of your monthly budget!`
        );
      } else if (percentUsed >= 50) {
        toast.info(
          `⚠️ Budget Alert: You have crossed 50% spending (${percentUsed}% - ${formatCurrency(spent)} of ${formatCurrency(budget)}).`
        );
      }
    }
  };

  const loadAll = async () => {
    setLoading(true);
    try {
      const [summaryRes, txRes] = await Promise.all([
        financeApi.getSummary(),
        financeApi.getTransactions(),
      ]);
      setSummary(summaryRes.data);
      setTransactions(txRes.data.transactions);
      checkBudgetAlerts(summaryRes.data);
    } catch (error) {
      toast.error('Could not load your finance data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.amount) {
      toast.error('Please enter a title and an amount');
      return;
    }

    setSubmitting(true);
    try {
      const payload = { ...form, amount: parseFloat(form.amount) };
      if (editingId) {
        const { data } = await financeApi.updateTransaction(editingId, payload);
        setTransactions((prev) => prev.map((t) => (t._id === editingId ? data.transaction : t)));
        toast.success('Transaction updated');
      } else {
        const { data } = await financeApi.createTransaction(payload);
        setTransactions((prev) => [data.transaction, ...prev]);
        toast.success('Transaction added');
      }
      resetForm();
      const { data: summaryData } = await financeApi.getSummary();
      setSummary(summaryData);
      checkBudgetAlerts(summaryData);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateBudget = async (e) => {
  e.preventDefault();

  const budget = parseFloat(newBudget);

  if (
    !newBudget ||
    Number.isNaN(budget) ||
    budget <= 0
  ) {
    toast.error(
      'Please enter a valid monthly budget amount'
    );
    return;
  }

  setSavingBudget(true);

  try {
    const { data } =
      await financeApi.updateBudget({
        monthlyBudget: budget,
      });

    toast.success(
      `Monthly budget set to ${formatCurrency(
        data.monthlyBudget
      )}`
    );

    setShowBudgetInput(false);
    setNewBudget('');

    // Reload the latest summary
    const { data: summaryData } =
      await financeApi.getSummary();

    setSummary(summaryData);

    // Check budget alerts
    checkBudgetAlerts(summaryData);
  } catch (error) {
    console.error(
      'Budget update error:',
      error
    );

    toast.error(
      error.response?.data?.message ||
        'Failed to update monthly budget'
    );
  } finally {
    setSavingBudget(false);
  }
};

  const startEdit = (t) => {
    setEditingId(t._id);
    setForm({
      title: t.title,
      amount: String(t.amount),
      type: t.type,
      category: t.category,
      date: new Date(t.date).toISOString().slice(0, 10),
      description: t.description || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await financeApi.deleteTransaction(deleteTarget._id);
      setTransactions((prev) => prev.filter((t) => t._id !== deleteTarget._id));
      toast.success('Transaction deleted');
      const { data: summaryData } = await financeApi.getSummary();
      setSummary(summaryData);
      checkBudgetAlerts(summaryData);
    } catch (error) {
      toast.error('Could not delete transaction');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (typeFilter && t.type !== typeFilter) return false;
      if (categoryFilter && t.category !== categoryFilter) return false;
      if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [transactions, typeFilter, categoryFilter, search]);

  const monthlyBudget = summary?.monthlyBudget || 0;
  const monthExpenses = summary?.monthExpenses || 0;
  const budgetPercent = monthlyBudget > 0 ? Math.round((monthExpenses / monthlyBudget) * 100) : 0;
  const budgetColor = budgetPercent >= 80 ? 'bg-red-500' : budgetPercent >= 50 ? 'bg-amber-500' : 'bg-sage-600';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Finance & Budget
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Track every rupee coming in and going out
        </p>
      </div>

      {/* Dynamic Budget Alert Banner */}
      {((monthlyBudget > 0 && budgetPercent >= 50) || (monthlyBudget === 0 && monthExpenses > 0)) && (
        <div
          className={`flex items-center justify-between rounded-xl p-4 border ${
            budgetPercent >= 80 || monthlyBudget === 0
              ? 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'
              : 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400'
          }`}
        >
          <div className="flex items-center gap-3">
            {budgetPercent >= 80 || monthlyBudget === 0 ? <AlertTriangle size={20} /> : <BellRing size={20} />}
            <div>
              <p className="text-sm font-semibold">
                {monthlyBudget === 0
                  ? 'No Monthly Budget Set!'
                  : budgetPercent >= 80
                  ? 'Critical Budget Warning (80%+ Used)'
                  : 'Budget Caution (50%+ Used)'}
              </p>
              <p className="text-xs opacity-90">
                {monthlyBudget === 0
                  ? `You have spent ${formatCurrency(monthExpenses)} without setting a monthly budget limit.`
                  : `You have used ${budgetPercent}% of your monthly limit (${formatCurrency(monthExpenses)} / ${formatCurrency(monthlyBudget)}).`}
              </p>
            </div>
          </div>
          {monthlyBudget === 0 && (
            <button
              onClick={() => setShowBudgetInput(true)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
            >
              Set Budget
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Quick add form */}
        <form onSubmit={handleSubmit} className="card space-y-3 p-5 lg:col-span-1">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {editingId ? 'Edit transaction' : 'Quick add transaction'}
          </h2>

          <div>
            <label className="label">Title</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              className="input"
              placeholder="e.g. Grocery run / Books"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Amount (₹)</label>
              <input
                name="amount"
                type="number"
                step="0.01"
                min="0"
                value={form.amount}
                onChange={handleChange}
                className="input"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="label">Type</label>
              <select name="type" value={form.type} onChange={handleChange} className="input">
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Category</label>
              <select name="category" value={form.category} onChange={handleChange} className="input">
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Date</label>
              <input name="date" type="date" value={form.date} onChange={handleChange} className="input" />
            </div>
          </div>

          <div>
            <label className="label">Description (optional)</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={2}
              className="input resize-none"
              placeholder="Add a note…"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button type="submit" className="btn-primary flex-1" disabled={submitting}>
              {submitting && <Loader2 size={16} className="animate-spin" />}
              {editingId ? 'Save changes' : 'Add transaction'}
            </button>
            {editingId && (
              <button type="button" className="btn-secondary" onClick={resetForm}>
                Cancel
              </button>
            )}
          </div>
        </form>

        <div className="space-y-6 lg:col-span-2">
          {/* Budget overview */}
          <div className="card p-5 relative">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Budget overview
              </h2>
              <button
                type="button"
                onClick={() => setShowBudgetInput(!showBudgetInput)}
                className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-600 font-medium"
              >
                <Settings size={14} />
                {showBudgetInput ? 'Cancel' : 'Set Budget'}
              </button>
            </div>

            {/* Set Budget Form */}
            {showBudgetInput && (
              <form onSubmit={handleUpdateBudget} className="mb-4 flex items-center gap-2 bg-zinc-800/40 p-3 rounded-lg">
                <input
                  type="number"
                  placeholder="Enter Monthly Budget (₹)"
                  value={newBudget}
                  onChange={(e) => setNewBudget(e.target.value)}
                  className="input text-xs flex-1"
                />
                <button type="submit" disabled={savingBudget} className="btn-primary text-xs py-1.5 px-3">
                  {savingBudget ? <Loader2 size={12} className="animate-spin" /> : 'Save'}
                </button>
              </form>
            )}

            <div className="grid grid-cols-3 gap-4 text-center sm:text-left">
              <div>
                <p className="text-xs text-zinc-500">Monthly budget</p>
                <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  {formatCurrency(monthlyBudget)}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Total spent</p>
                <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  {formatCurrency(monthExpenses)}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Remaining</p>
                <p
                  className={`text-lg font-semibold ${
                    (summary?.remainingBudget || 0) < 0 ? 'text-red-500' : 'text-sage-600 dark:text-sage-400'
                  }`}
                >
                  {formatCurrency(summary?.remainingBudget)}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <div className="mb-1 flex justify-between text-xs text-zinc-500">
                <span>{budgetPercent}% used</span>
                <span>{formatCurrency(monthExpenses)} / {formatCurrency(monthlyBudget)}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                <div
                  className={`h-full rounded-full ${budgetColor} transition-all duration-500`}
                  style={{ width: `${Math.min(budgetPercent, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Transaction table */}
          <div className="card p-5">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Transactions</h2>
              <div className="flex flex-wrap gap-2">
                <div className="relative">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search…"
                    className="input w-36 pl-8 text-xs"
                  />
                </div>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="input w-28 text-xs"
                >
                  <option value="">All types</option>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="input w-32 text-xs"
                >
                  <option value="">All categories</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {loading ? (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-10 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
                ))}
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-sm text-zinc-400">No transactions match your filters yet.</p>
              </div>
            ) : (
              <div className="-mx-5 overflow-x-auto px-5">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className="border-b border-zinc-100 text-left text-xs text-zinc-500 dark:border-zinc-800">
                      <th className="pb-2 font-medium">Title</th>
                      <th className="pb-2 font-medium">Category</th>
                      <th className="pb-2 font-medium">Date</th>
                      <th className="pb-2 text-right font-medium">Amount</th>
                      <th className="pb-2 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {filteredTransactions.map((t) => (
                      <tr key={t._id}>
                        <td className="py-2.5">
                          <div className="flex items-center gap-2">
                            {t.type === 'income' ? (
                              <ArrowUpCircle size={16} className="text-sage-600 dark:text-sage-400" />
                            ) : (
                              <ArrowDownCircle size={16} className="text-zinc-400" />
                            )}
                            <span className="font-medium text-zinc-900 dark:text-zinc-100">{t.title}</span>
                          </div>
                        </td>
                        <td className="py-2.5">
                          <span className={`badge ${CATEGORY_STYLES[t.category] || CATEGORY_STYLES.Other}`}>
                            {t.category}
                          </span>
                        </td>
                        <td className="py-2.5 text-zinc-500">{new Date(t.date).toLocaleDateString()}</td>
                        <td
                          className={`py-2.5 text-right font-semibold ${
                            t.type === 'income' ? 'text-sage-600 dark:text-sage-400' : 'text-zinc-700 dark:text-zinc-300'
                          }`}
                        >
                          {t.type === 'income' ? '+' : '-'}
                          {formatCurrency(t.amount)}
                        </td>
                        <td className="py-2.5">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => startEdit(t)}
                              className="btn-ghost p-1.5"
                              aria-label="Edit transaction"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(t)}
                              className="btn-ghost p-1.5 hover:text-red-500"
                              aria-label="Delete transaction"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete transaction?"
        message={`This will permanently remove "${deleteTarget?.title}". This can't be undone.`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={deleting}
      />
    </div>
  );
};

export default Finance;