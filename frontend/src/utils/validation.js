import React from 'react';

/**
 * Real-time validation utilities for forms
 */

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Password strength requirements
const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  hasUpperCase: /[A-Z]/.test,
  hasLowerCase: /[a-z]/.test,
  hasNumbers: /\d/.test,
  hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test
};

// Username requirements
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

/**
 * Email validation with real-time feedback
 */
export const validateEmail = (email) => {
  if (!email) {
    return { isValid: false, message: 'Email is required' };
  }
  
  if (!EMAIL_REGEX.test(email)) {
    return { isValid: false, message: 'Please enter a valid email address' };
  }
  
  return { isValid: true, message: '' };
};

/**
 * Password validation with strength indicator
 */
export const validatePassword = (password) => {
  if (!password) {
    return { 
      isValid: false, 
      strength: 0,
      message: 'Password is required',
      requirements: {
        minLength: false,
        hasUpperCase: false,
        hasLowerCase: false,
        hasNumbers: false,
        hasSpecialChar: false
      }
    };
  }

  const requirements = {
    minLength: password.length >= PASSWORD_REQUIREMENTS.minLength,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumbers: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  };

  const strength = Object.values(requirements).filter(Boolean).length;
  
  return {
    isValid: Object.values(requirements).every(Boolean),
    strength,
    message: Object.values(requirements).every(Boolean)
      ? ''
      : strength < 3
        ? 'Password is too weak'
        : 'Password must include uppercase, lowercase, number, and special character',
    requirements
  };
};

/**
 * Password confirmation validation
 */
export const validatePasswordConfirm = (password, confirmPassword) => {
  if (!confirmPassword) {
    return { isValid: false, message: 'Please confirm your password' };
  }
  
  if (password !== confirmPassword) {
    return { isValid: false, message: 'Passwords do not match' };
  }
  
  return { isValid: true, message: '' };
};

/**
 * Username validation
 */
export const validateUsername = (username) => {
  if (!username) {
    return { isValid: false, message: 'Username is required' };
  }
  
  if (username.length < 3) {
    return { isValid: false, message: 'Username must be at least 3 characters' };
  }
  
  if (username.length > 20) {
    return { isValid: false, message: 'Username must be less than 20 characters' };
  }
  
  if (!USERNAME_REGEX.test(username)) {
    return { isValid: false, message: 'Username can only contain letters, numbers, and underscores' };
  }
  
  return { isValid: true, message: '' };
};

/**
 * Name validation
 */
export const validateName = (name) => {
  if (!name) {
    return { isValid: false, message: 'Name is required' };
  }
  
  if (name.trim().length < 2) {
    return { isValid: false, message: 'Name must be at least 2 characters' };
  }
  
  if (name.length > 100) {
    return { isValid: false, message: 'Name must be less than 100 characters' };
  }
  
  return { isValid: true, message: '' };
};

/**
 * Required field validation
 */
export const validateRequired = (value, fieldName) => {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return { isValid: false, message: `${fieldName} is required` };
  }
  
  return { isValid: true, message: '' };
};

/**
 * Number validation with range
 */
export const validateNumber = (value, min, max, fieldName) => {
  if (!value && value !== 0) {
    return { isValid: false, message: `${fieldName} is required` };
  }
  
  const num = Number(value);
  
  if (isNaN(num)) {
    return { isValid: false, message: `${fieldName} must be a valid number` };
  }
  
  if (min !== undefined && num < min) {
    return { isValid: false, message: `${fieldName} must be at least ${min}` };
  }
  
  if (max !== undefined && num > max) {
    return { isValid: false, message: `${fieldName} must be less than ${max}` };
  }
  
  return { isValid: true, message: '' };
};

/**
 * Date validation
 */
export const validateDate = (date, minDate = null, maxDate = null) => {
  if (!date) {
    return { isValid: false, message: 'Date is required' };
  }
  
  const selectedDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (minDate) {
    const min = new Date(minDate);
    if (selectedDate < min) {
      return { isValid: false, message: 'Date cannot be in the past' };
    }
  }
  
  if (maxDate) {
    const max = new Date(maxDate);
    if (selectedDate > max) {
      return { isValid: false, message: 'Date is too far in the future' };
    }
  }
  
  return { isValid: true, message: '' };
};

/**
 * Text length validation
 */
export const validateTextLength = (text, minLength, maxLength, fieldName) => {
  if (!text) {
    return { isValid: false, message: `${fieldName} is required` };
  }
  
  const trimmed = text.trim();
  
  if (minLength !== undefined && trimmed.length < minLength) {
    return { isValid: false, message: `${fieldName} must be at least ${minLength} characters` };
  }
  
  if (maxLength !== undefined && trimmed.length > maxLength) {
    return { isValid: false, message: `${fieldName} must be less than ${maxLength} characters` };
  }
  
  return { isValid: true, message: '' };
};

/**
 * Real-time validation hook for forms
 */
export const useRealTimeValidation = (initialValues = {}) => {
  const [values, setValues] = React.useState(initialValues);
  const [errors, setErrors] = React.useState({});
  const [touched, setTouched] = React.useState({});

  const validateField = (name, value) => {
    let validation = { isValid: true, message: '' };
    
    switch (name) {
      case 'email':
        validation = validateEmail(value);
        break;
      case 'password':
        validation = validatePassword(value);
        break;
      case 'confirmPassword':
        validation = validatePasswordConfirm(values.password, value);
        break;
      case 'username':
        validation = validateUsername(value);
        break;
      case 'name':
        validation = validateName(value);
        break;
      case 'title':
        validation = validateTextLength(value, 10, 100, 'Title');
        break;
      case 'description':
        validation = validateTextLength(value, 20, 1000, 'Description');
        break;
      case 'purpose':
        validation = validateTextLength(value, 5, 500, 'Purpose');
        break;
      default:
        if (value && typeof value === 'string' && value.trim() !== '') {
          validation = { isValid: true, message: '' };
        } else {
          validation = { isValid: false, message: 'This field is required' };
        }
    }
    
    setErrors(prev => ({ ...prev, [name]: validation.message }));
    return validation;
  };

  const handleChange = (name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
    setTouched(prev => ({ ...prev, [name]: true }));
    
    // Validate immediately for real-time feedback
    validateField(name, value);
  };

  const handleBlur = (name) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    validateField(name, values[name]);
  };

  const validateAll = () => {
    const newErrors = {};
    let isValid = true;
    
    Object.keys(values).forEach(key => {
      const validation = validateField(key, values[key]);
      if (!validation.isValid) {
        newErrors[key] = validation.message;
        isValid = false;
      }
    });
    
    setErrors(newErrors);
    return isValid;
  };

  const resetValidation = () => {
    setErrors({});
    setTouched({});
  };

  return {
    values,
    errors,
    touched,
    setValues,
    handleChange,
    handleBlur,
    validateAll,
    validateField,
    resetValidation,
    isFormValid: Object.keys(errors).every(key => !errors[key]) && Object.keys(values).every(key => values[key])
  };
};
