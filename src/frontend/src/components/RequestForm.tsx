import { useState, type FormEvent } from "react";
import { createRequest, uploadReceipt, type Category, type ReimbursementRequest } from "../lib/requests";
import { ApiError } from "../lib/api";

const CATEGORY_OPTIONS: Array<{ value: Category; label: string }> = [
  { value: "TRAVEL", label: "Travel" },
  { value: "MEALS", label: "Meals" },
  { value: "OFFICE_SUPPLIES", label: "Office Supplies" },
  { value: "SOFTWARE_SUBSCRIPTIONS", label: "Software / Subscriptions" },
  { value: "EVENT_EXPENSES", label: "Event Expenses" },
  { value: "TRAINING", label: "Training" },
  { value: "OTHER", label: "Other" },
];

export function RequestForm({ onCreated }: { onCreated: (request: ReimbursementRequest) => void }) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState("");
  const [category, setCategory] = useState<Category | "">("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<"draft" | "submit" | null>(null);

  function reset() {
    setTitle("");
    setAmount("");
    setExpenseDate("");
    setCategory("");
    setDescription("");
    setFile(null);
  }

  async function handleSave(e: FormEvent, submit: boolean) {
    e.preventDefault();
    setError(null);

    const parsedAmount = Number(amount);
    if (!title.trim() || !expenseDate || !category || !description.trim()) {
      setError("Please fill in all required fields.");
      return;
    }
    if (!(parsedAmount > 0)) {
      setError("Amount must be greater than zero.");
      return;
    }

    setIsSubmitting(submit ? "submit" : "draft");
    try {
      const { request } = await createRequest({
        title: title.trim(),
        amount: parsedAmount,
        expenseDate,
        category,
        description: description.trim(),
        submit,
      });

      if (file) {
        try {
          await uploadReceipt(request.id, file);
        } catch (uploadErr) {
          setError(
            uploadErr instanceof Error
              ? `Request saved, but the receipt failed to upload: ${uploadErr.message}`
              : "Request saved, but the receipt failed to upload.",
          );
        }
      }

      onCreated(request);
      reset();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to save the request. Please try again.");
    } finally {
      setIsSubmitting(null);
    }
  }

  return (
    <form className="request-form" onSubmit={(e) => handleSave(e, false)}>
      <h2>New Reimbursement Request</h2>

      <label htmlFor="title">Title / Purpose</label>
      <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />

      <div className="request-form-row">
        <div>
          <label htmlFor="amount">Amount ($)</label>
          <input
            id="amount"
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="expenseDate">Expense Date</label>
          <input
            id="expenseDate"
            type="date"
            value={expenseDate}
            onChange={(e) => setExpenseDate(e.target.value)}
            required
          />
        </div>
      </div>

      <label htmlFor="category">Category</label>
      <select id="category" value={category} onChange={(e) => setCategory(e.target.value as Category)} required>
        <option value="" disabled>
          Select a category
        </option>
        {CATEGORY_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <label htmlFor="description">Description / Business Justification</label>
      <textarea
        id="description"
        rows={3}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        required
      />

      <label htmlFor="receipt">Receipt (JPEG, PNG, or PDF)</label>
      <input
        id="receipt"
        type="file"
        accept="image/jpeg,image/png,application/pdf"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
      />

      {error && (
        <p role="alert" className="auth-error">
          {error}
        </p>
      )}

      <div className="request-form-actions">
        <button type="submit" disabled={isSubmitting !== null}>
          {isSubmitting === "draft" ? "Saving…" : "Save as Draft"}
        </button>
        <button type="button" onClick={(e) => handleSave(e, true)} disabled={isSubmitting !== null}>
          {isSubmitting === "submit" ? "Submitting…" : "Submit for Review"}
        </button>
      </div>
    </form>
  );
}
