interface FormFieldProps {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}

export function FormField({ label, htmlFor, hint, error, children }: FormFieldProps) {
  return (
    <label className="flex w-full flex-col gap-2 text-sm" htmlFor={htmlFor}>
      <div className="flex items-center justify-between gap-4">
        <span className="font-medium text-foreground">{label}</span>
        {hint ? <span className="text-xs text-text-soft">{hint}</span> : null}
      </div>
      {children}
      {error ? <span className="text-xs text-danger">{error}</span> : null}
    </label>
  );
}
