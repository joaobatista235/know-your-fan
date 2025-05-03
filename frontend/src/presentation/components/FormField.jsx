import React, { forwardRef } from 'react';
import {
  FormControl,
  FormLabel,
  Input,
  FormErrorMessage,
  Textarea,
  Select,
  InputGroup,
  InputRightElement,
  useColorModeValue,
} from '@chakra-ui/react';
import { Controller } from 'react-hook-form';

/**
 * FormField component for consistent form input styling
 * 
 * @param {Object} props
 * @param {string} props.name - Field name for form state
 * @param {string} props.label - Label text
 * @param {string} props.value - Field value
 * @param {Function} props.onChange - Change handler function
 * @param {string} props.placeholder - Input placeholder text
 * @param {string} props.type - Input type (text, password, date, etc)
 * @param {boolean} props.isRequired - Whether the field is required
 * @param {string} props.error - Error message
 * @param {string} props.helperText - Helper text below the input
 * @param {React.ReactNode} props.rightElement - Element to display at the right side of the input
 * @param {Object} props.inputProps - Additional props to pass to the Input component
 */
const FormFieldComponent = forwardRef(({
  // Props de controle
  name,
  control,
  
  // Props de UI
  label,
  placeholder,
  isRequired = false,
  isReadOnly = false,
  isDisabled = false,
  
  // Tipo e variantes
  type = 'text',
  variant = null,
  size = 'md',
  as,
  options = [],
  rows,
  
  // Manipuladores de eventos
  onChange,
  onBlur,
  
  // Estado
  value,
  defaultValue,
  error,
  
  // Elementos extras
  rightElement,
  leftElement,
  
  // Props para passar diretamente ao Input
  ...restProps
}, ref) => {
  const errorTextColor = useColorModeValue('red.600', 'red.300');
  
  const renderField = ({ field = {}, fieldState = {} }) => {
    const hasError = !!fieldState.error || !!error;
    const errorMessage = fieldState.error?.message || error;

    const inputProps = {
      id: name,
      name,
      placeholder,
      isReadOnly,
      isDisabled,
      variant,
      size,
      borderColor: hasError ? 'red.500' : undefined,
      focusBorderColor: hasError ? 'red.500' : 'brand.primary',
      _hover: hasError ? { borderColor: 'red.500' } : undefined,
      ...(field.ref ? { ref: field.ref } : { ref }),
      ...restProps,
      ...(field ? { ...field, ref: field.ref } : { value, onChange, onBlur }),
    };

    let FieldComponent;

    if (as === 'textarea') {
      FieldComponent = (
        <Textarea 
          rows={rows || 4} 
          h="auto"
          minH="120px"
          py={3}
          {...inputProps} 
        />
      );
    } else if (as === 'select') {
      FieldComponent = (
        <Select 
          h="56px" 
          {...inputProps}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      );
    } else {
      FieldComponent = (
        <InputGroup>
          {leftElement}
          <Input 
            type={type} 
            h="56px"
            data-lpignore="true"
            autoCorrect="off"
            spellCheck="false"
            {...inputProps} 
          />
          {rightElement && (
            <InputRightElement h="56px" pr={4}>
              {rightElement}
            </InputRightElement>
          )}
        </InputGroup>
      );
    }

    return (
      <FormControl 
        isInvalid={hasError} 
        isRequired={isRequired}
        mb={4}
      >
        {label && <FormLabel htmlFor={name}>{label}</FormLabel>}
        {FieldComponent}
        {errorMessage && (
          <FormErrorMessage color={errorTextColor}>
            {errorMessage}
          </FormErrorMessage>
        )}
      </FormControl>
    );
  };

  if (control) {
    return (
      <Controller
        name={name}
        control={control}
        defaultValue={defaultValue || ''}
        render={({ field, fieldState }) => renderField({ field, fieldState })}
      />
    );
  }

  return renderField({});
});

FormFieldComponent.displayName = 'FormField';

export const FormField = FormFieldComponent; 