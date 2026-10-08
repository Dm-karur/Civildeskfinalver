import { forwardRef } from 'react';
import { cn } from '../../utils/cn';

export const Toggle = forwardRef(({ className, id, label, checked, onChange, disabled, ...props }, ref) => {
  const isChecked = Boolean(checked);

  return (
    <label htmlFor={id} className={cn("inline-flex items-center gap-2.5 cursor-pointer select-none", disabled && "cursor-not-allowed opacity-50")}>
      <div className="relative inline-flex items-center shrink-0">
        <input
          type="checkbox"
          id={id}
          ref={ref}
          checked={isChecked}
          onChange={onChange}
          disabled={disabled}
          className="sr-only peer"
          {...props}
        />
        <div className={cn(
          "w-9 h-5 rounded-full transition-colors duration-200 ease-in-out relative flex items-center p-0.5",
          isChecked ? "bg-primary" : "bg-slate-300 dark:bg-slate-700",
          className
        )}>
          <div className={cn(
            "w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200 ease-in-out",
            isChecked ? "translate-x-4" : "translate-x-0"
          )} />
        </div>
      </div>
      {label && (
        <span className="text-xs font-medium text-text-primary">
          {label}
        </span>
      )}
    </label>
  );
});

Toggle.displayName = 'Toggle';
