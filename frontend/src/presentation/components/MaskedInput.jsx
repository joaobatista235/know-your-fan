import { useState, useCallback } from 'react'
import { FormField } from './FormField'

/**
 * MaskedInput component for handling input masks
 * 
 * @param {Object} props
 * @param {string} props.name - Field name
 * @param {string} props.label - Field label
 * @param {string} props.value - Field value
 * @param {Function} props.onChange - onChange handler
 * @param {Function} props.onBlur - onBlur handler
 * @param {string} props.placeholder - Input placeholder
 * @param {boolean} props.isRequired - Whether the field is required
 * @param {string} props.error - Error message
 * @param {Function} props.formatFn - Function to format the input value
 * @param {Object} props.inputProps - Additional props for the Input component
 */
export const MaskedInput = ({
  name,
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  isRequired,
  error,
  formatFn,
  inputProps = {},
}) => {
  const [localValue, setLocalValue] = useState(formatFn ? formatFn(value) : value)

  const handleChange = useCallback((e) => {
    const { value: newValue } = e.target
    
    // Save formatted value to local state for display
    const formattedValue = formatFn ? formatFn(newValue) : newValue
    setLocalValue(formattedValue)
    
    // Create a synthetic event to pass to the parent component
    const syntheticEvent = {
      target: {
        name,
        value: newValue.replace(/\D/g, '') // Keep only digits for the actual value
      }
    }
    
    onChange(syntheticEvent)
  }, [formatFn, name, onChange])

  const handleBlur = useCallback((e) => {
    // Create a synthetic event to pass to the parent component
    if (onBlur) {
      const syntheticEvent = {
        target: {
          name,
          value: e.target.value.replace(/\D/g, '') // Keep only digits for the actual value
        }
      }
      
      onBlur(syntheticEvent)
    }
  }, [name, onBlur])

  return (
    <FormField
      name={name}
      label={label}
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      isRequired={isRequired}
      error={error}
      inputProps={inputProps}
    />
  )
} 