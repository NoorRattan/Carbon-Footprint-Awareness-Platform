import React from 'react'

interface InputProps {
  readonly id: string
  readonly label: string
  readonly type?: 'text' | 'email' | 'password' | 'number' | 'date' | 'tel' | 'url'
  readonly value: string
  readonly onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  readonly placeholder?: string
  readonly error?: string
  readonly disabled?: boolean
  readonly required?: boolean
  readonly helpText?: string
  readonly suffix?: string
  readonly className?: string
}

/**
 * Accessible form input component with label, optional error message, help text, and suffix unit.
 * @param props - Input configuration props.
 * @returns A styled form input with label and validation feedback.
 */
const Input: React.FC<InputProps> = ({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  disabled = false,
  required = false,
  helpText,
  suffix,
  className = '',
}) => {
  const errorId = `${id}-error`
  const helpId = `${id}-help`

  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1">
        {label}
        {required && (
          <span className="text-error ml-1" aria-hidden="true">
            *
          </span>
        )}
      </label>
      <div className="relative">
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={
            [error ? errorId : '', helpText ? helpId : ''].filter(Boolean).join(' ') || undefined
          }
          className={`
            w-full rounded-lg border px-3 py-2 text-sm
            transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-offset-0
            disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed
            ${
              error
                ? 'border-error focus:ring-error text-slate-900'
                : 'border-slate-300 focus:ring-primary focus:border-primary text-slate-900'
            }
            ${suffix ? 'pr-12' : ''}
          `}
        />
        {suffix && (
          <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-slate-500 pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
      {error && (
        <p id={errorId} className="mt-1 text-sm text-error" role="alert">
          {error}
        </p>
      )}
      {helpText && !error && (
        <p id={helpId} className="mt-1 text-sm text-slate-500">
          {helpText}
        </p>
      )}
    </div>
  )
}

export default Input
