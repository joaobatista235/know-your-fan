/**
 * Common validation patterns for form fields
 */
export const validationPatterns = {
  // Email validation regex
  email: {
    value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    message: 'Digite um e-mail válido'
  },
  
  // CPF validation regex (999.999.999-99 or 99999999999)
  cpf: {
    value: /^(\d{3}\.\d{3}\.\d{3}-\d{2}|\d{11})$/,
    message: 'CPF inválido'
  },
  
  // Phone number validation regex ((99) 99999-9999 or 99 99999-9999 or 9999999999)
  phone: {
    value: /^(\(\d{2}\)\s?|\d{2}\s?)?\d{5}-?\d{4}$/,
    message: 'Telefone inválido'
  },
  
  // CEP validation regex (99999-999 or 99999999)
  cep: {
    value: /^(\d{5}-\d{3}|\d{8})$/,
    message: 'CEP inválido'
  },
  
  // URL validation regex
  url: {
    value: /^(https?:\/\/)?(www\.)?[a-zA-Z0-9]+([\-\.]{1}[a-zA-Z0-9]+)*\.[a-zA-Z]{2,}(:[0-9]{1,5})?(\/.*)?$/,
    message: 'URL inválida'
  }
}

/**
 * Formats CPF with mask (999.999.999-99)
 * @param {string} value - CPF value to format
 * @returns {string} Formatted CPF
 */
export const formatCPF = (value) => {
  if (!value) return value
  
  // Remove any non-digit character
  const numbers = value.replace(/\D/g, '')
  
  // Limit to 11 digits
  const truncated = numbers.substring(0, 11)
  
  // Apply mask
  return truncated
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

/**
 * Formats phone number with mask ((99) 99999-9999)
 * @param {string} value - Phone number to format
 * @returns {string} Formatted phone number
 */
export const formatPhone = (value) => {
  if (!value) return value
  
  // Remove any non-digit character
  const numbers = value.replace(/\D/g, '')
  
  // Limit to 11 digits
  const truncated = numbers.substring(0, 11)
  
  // Apply mask
  if (truncated.length <= 10) {
    return truncated
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
  } else {
    return truncated
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
  }
}

/**
 * Formats CEP with mask (99999-999)
 * @param {string} value - CEP to format
 * @returns {string} Formatted CEP
 */
export const formatCEP = (value) => {
  if (!value) return value
  
  // Remove any non-digit character
  const numbers = value.replace(/\D/g, '')
  
  // Limit to 8 digits
  const truncated = numbers.substring(0, 8)
  
  // Apply mask
  return truncated.replace(/(\d{5})(\d)/, '$1-$2')
} 