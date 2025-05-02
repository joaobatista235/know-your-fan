import {
  FormControl,
  FormLabel,
  Input,
  FormErrorMessage,
  FormHelperText,
  InputGroup,
  InputRightElement,
} from '@chakra-ui/react'

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
export const FormField = ({
  name,
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  isRequired = false,
  error,
  helperText,
  rightElement,
  inputProps = {},
}) => {
  return (
    <FormControl isInvalid={!!error} isRequired={isRequired} mb={4}>
      {label && <FormLabel>{label}</FormLabel>}
      
      <InputGroup>
        <Input
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          type={type}
          data-lpignore="true"
          autoCorrect="off"
          spellCheck="false"
          {...inputProps}
        />
        {rightElement && (
          <InputRightElement>
            {rightElement}
          </InputRightElement>
        )}
      </InputGroup>
      
      {error ? (
        <FormErrorMessage>{error}</FormErrorMessage>
      ) : (
        helperText && <FormHelperText>{helperText}</FormHelperText>
      )}
    </FormControl>
  )
} 