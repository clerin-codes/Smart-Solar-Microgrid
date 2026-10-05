import { useEffect, useMemo, useState } from "react";

import toast from "react-hot-toast";

import { changeMyPassword } from "../../services/api/accountService";

import { getApiErrorMessage } from "../../utils/apiError";

import { CheckIcon, CloseIcon, EyeIcon, LockIcon } from "./ProfileIcons";

import { validateChangePasswordForm } from "./profileUtils";

function FieldError({ message }) {
  if (!message) {
    return null;
  }

  return <p className="mt-1.5 text-sm font-medium text-red-600">{message}</p>;
}

function PasswordInput({
  id,
  label,
  name,
  value,
  error,
  visible,
  onToggle,
  onChange,
}) {
  return (
    <div>
      <label htmlFor={id} className="text-[15px] font-semibold text-slate-800">
        {label}
      </label>

      <div className="relative mt-2">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          value={value}
          onChange={onChange}
          autoComplete={
            name === "currentPassword" ? "current-password" : "new-password"
          }
          className={`h-12 w-full rounded-xl border bg-white px-4 pr-12 text-[15px] font-medium text-slate-900 outline-none transition focus:ring-4 ${
            error
              ? "border-red-300 focus:border-red-400 focus:ring-red-50"
              : "border-slate-300 focus:border-blue-600 focus:ring-blue-50"
          }`}
        />

        <button
          type="button"
          onClick={onToggle}
          className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-400 transition hover:text-slate-700"
        >
          <EyeIcon visible={visible} />
        </button>
      </div>

      <FieldError message={error} />
    </div>
  );
}

/** Handles the account-security password workflow without changing profile UI. */
export default function ChangePasswordModal({ open, onClose }) {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm({
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    });

    setErrors({});
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
  }, [open]);

  const requirements = useMemo(
    () => ({
      length: form.newPassword.length >= 12,
      uppercase: /[A-Z]/.test(form.newPassword),
      lowercase: /[a-z]/.test(form.newPassword),
      number: /\d/.test(form.newPassword),
      special: /[^A-Za-z0-9]/.test(form.newPassword),
    }),
    [form.newPassword],
  );

  if (!open) {
    return null;
  }

  function updateField(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setErrors((current) => ({
      ...current,
      [name]: "",
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const validationErrors = validateChangePasswordForm(form);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);

    try {
      await changeMyPassword({
        currentPassword: form.currentPassword,

        newPassword: form.newPassword,

        confirmNewPassword: form.confirmNewPassword,
      });

      toast.success("Password changed successfully.");

      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to change password."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.24)]">
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-700">
              <LockIcon />
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-950">
                Change Password
              </h2>

              <p className="mt-1 text-sm leading-5 text-slate-500">
                Enter your current password and choose a new secure password.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
          >
            <CloseIcon />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-5 px-6 py-6">
            <PasswordInput
              id="current-password"
              label="Current Password"
              name="currentPassword"
              value={form.currentPassword}
              error={errors.currentPassword}
              visible={showCurrent}
              onToggle={() => setShowCurrent((current) => !current)}
              onChange={updateField}
            />

            <PasswordInput
              id="new-password"
              label="New Password"
              name="newPassword"
              value={form.newPassword}
              error={errors.newPassword}
              visible={showNew}
              onToggle={() => setShowNew((current) => !current)}
              onChange={updateField}
            />

            <PasswordInput
              id="confirm-new-password"
              label="Confirm New Password"
              name="confirmNewPassword"
              value={form.confirmNewPassword}
              error={errors.confirmNewPassword}
              visible={showConfirm}
              onToggle={() => setShowConfirm((current) => !current)}
              onChange={updateField}
            />

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-800">
                Password requirements
              </p>

              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {[
                  ["length", "12+ characters"],
                  ["uppercase", "Uppercase letter"],
                  ["lowercase", "Lowercase letter"],
                  ["number", "Number"],
                  ["special", "Special character"],
                ].map(([key, label]) => (
                  <div
                    key={key}
                    className={`flex items-center gap-2 text-sm ${
                      requirements[key] ? "text-emerald-700" : "text-slate-500"
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full ${
                        requirements[key]
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-200 text-slate-400"
                      }`}
                    >
                      {requirements[key] && <CheckIcon />}
                    </span>

                    {label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50/70 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="h-11 rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="h-11 min-w-[155px] rounded-xl bg-orange-600 px-5 text-sm font-semibold text-white transition hover:bg-orange-700 focus:outline-none focus:ring-4 focus:ring-orange-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Updating..." : "Update Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
