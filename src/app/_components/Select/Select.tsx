import classNames from 'classnames/bind';
import React from 'react';

import styles from './Select.module.css';

const cx = classNames.bind(styles);

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
}

export interface SelectProps {
  id: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  error?: boolean;
  errorMessage?: string;
  label?: string;
  required?: boolean;
  className?: string;
  placeholder?: string;
}

const Select: React.FC<SelectProps> = ({
  id,
  value,
  options,
  onChange,
  onBlur,
  disabled = false,
  error = false,
  errorMessage,
  label,
  required = false,
  className,
  placeholder,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className={cx('field-group', className)}>
      {label && (
        <label className={cx('field-label')} htmlFor={id}>
          {label}
          {required && <span className={cx('required-mark')}> *</span>}
        </label>
      )}
      
      <div className={cx('select-wrapper')}>
        <select
          id={id}
          className={cx('field-select', {
            error,
            disabled,
          })}
          value={value}
          onChange={handleChange}
          onBlur={onBlur}
          disabled={disabled}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
              {option.description && ` - ${option.description}`}
            </option>
          ))}
        </select>
      </div>
      
      {error && errorMessage && (
        <div className={cx('field-error')}>
          {errorMessage}
        </div>
      )}
    </div>
  );
};

export default Select;