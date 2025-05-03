import { useState, useCallback } from 'react'

/**
 * Custom hook for form validation
 * 
 * @param {Object} initialValues - Initial form values
 * @param {Object} validationRules - Validation rules for each field
 * @returns {Object} Form state and handlers
 */
export const useFormValidation = (initialValues = {}, validationRules = {}) => {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateField = useCallback((name, value) => {
    if (!validationRules[name]) return ''
    
    const fieldRules = validationRules[name]
    
    if (fieldRules.required && (!value || value === '')) {
      return fieldRules.required === true 
        ? 'Este campo é obrigatório' 
        : fieldRules.required
    }
    
    if (fieldRules.minLength && value && value.length < fieldRules.minLength.value) {
      return fieldRules.minLength.message || `Mínimo de ${fieldRules.minLength.value} caracteres`
    }
    
    if (fieldRules.maxLength && value && value.length > fieldRules.maxLength.value) {
      return fieldRules.maxLength.message || `Máximo de ${fieldRules.maxLength.value} caracteres`
    }
    
    if (fieldRules.pattern && value && !fieldRules.pattern.value.test(value)) {
      return fieldRules.pattern.message || 'Formato inválido'
    }
    
    if (fieldRules.validate && typeof fieldRules.validate === 'function') {
      const customError = fieldRules.validate(value, values)
      if (customError) return customError
    }
    
    return ''
  }, [validationRules, values])

  const validateForm = useCallback(() => {
    const newErrors = {}
    let isValid = true
    
    Object.keys(validationRules).forEach(key => {
      const error = validateField(key, values[key])
      if (error) {
        newErrors[key] = error
        isValid = false
      }
    })
    
    setErrors(newErrors)
    return isValid
  }, [validateField, values, validationRules])

  const handleChange = useCallback((e) => {
    const { name, value } = e.target
    
    setValues(prev => ({
      ...prev,
      [name]: value
    }))
    
    if (touched[name]) {
      const error = validateField(name, value)
      setErrors(prev => ({
        ...prev,
        [name]: error
      }))
    }
  }, [touched, validateField])

  // Handle input blur (marks field as touched)
  const handleBlur = useCallback((e) => {
    const { name, value } = e.target
    
    setTouched(prev => ({
      ...prev,
      [name]: true
    }))
    
    const error = validateField(name, value)
    setErrors(prev => ({
      ...prev,
      [name]: error
    }))
  }, [validateField])

  // Handle form submission
  const handleSubmit = useCallback(async (submitFn) => {
    setIsSubmitting(true)
    
    // Touch all fields to show all errors
    const touchedFields = {}
    Object.keys(validationRules).forEach(key => {
      touchedFields[key] = true
    })
    setTouched(touchedFields)
    
    const isValid = validateForm()
    
    if (isValid && submitFn) {
      try {
        await submitFn(values)
      } catch (error) {
        console.error('Form submission error:', error)
      }
    }
    
    setIsSubmitting(false)
    return isValid
  }, [validateForm, validationRules, values])

  // Set form values programmatically
  const setFormValues = useCallback((newValues) => {
    setValues(prev => ({
      ...prev,
      ...newValues
    }))
  }, [])

  // Reset the form to initial values
  const resetForm = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
    setIsSubmitting(false)
  }, [initialValues])

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    setFormValues,
    resetForm,
    validateForm
  }
} 