/**
 * Remove caracteres não numéricos de uma string
 * @param {string} value - String a ser processada
 * @returns {string} String contendo apenas números
 */
export const removeNonDigits = (value) => {
  return value ? value.replace(/\D/g, '') : '';
};

/**
 * Valida se um CPF é válido utilizando o algoritmo de verificação
 * @param {string} cpf - CPF a ser validado (com ou sem formatação)
 * @returns {boolean} true se o CPF for válido, false caso contrário
 */
export const isValidCPF = (cpf) => {
  const cleanCPF = removeNonDigits(cpf);

  if (cleanCPF.length !== 11) {
    return false;
  }

  if (/^(\d)\1{10}$/.test(cleanCPF)) {
    return false;
  }

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;

  if (parseInt(cleanCPF.charAt(9)) !== digit1) {
    return false;
  }

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  remainder = sum % 11;
  const digit2 = remainder < 2 ? 0 : 11 - remainder;

  return parseInt(cleanCPF.charAt(10)) === digit2;
};

/**
 * Formata um CPF com a máscara 999.999.999-99
 * @param {string} value - CPF a ser formatado
 * @returns {string} CPF formatado
 */
export const maskCPF = (value) => {
  if (!value) return '';

  const numbers = removeNonDigits(value);

  const truncated = numbers.substring(0, 11);

  if (truncated.length === 11) {
    return truncated.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  }

  // Aplica a máscara gradualmente
  if (truncated.length <= 3) {
    return truncated;
  } else if (truncated.length <= 6) {
    return truncated.replace(/^(\d{3})(\d{1,3})$/, '$1.$2');
  } else if (truncated.length <= 9) {
    return truncated.replace(/^(\d{3})(\d{3})(\d{1,3})$/, '$1.$2.$3');
  } else {
    return truncated.replace(/^(\d{3})(\d{3})(\d{3})(\d{1,2})$/, '$1.$2.$3-$4');
  }
};

/**
 * Formata um CEP com a máscara 99999-999
 * @param {string} value - CEP a ser formatado
 * @returns {string} CEP formatado
 */
export const maskCEP = (value) => {
  if (!value) return '';

  const numbers = removeNonDigits(value);

  const truncated = numbers.substring(0, 8);

  if (truncated.length === 8) {
    return truncated.replace(/^(\d{5})(\d{3})$/, '$1-$2');
  }

  if (truncated.length <= 5) {
    return truncated;
  } else {
    return truncated.replace(/^(\d{5})(\d{1,3})$/, '$1-$2');
  }
};

/**
 * Formata um número de telefone com a máscara (99) 99999-9999
 * @param {string} value - Número de telefone a ser formatado
 * @returns {string} Número de telefone formatado
 */
export const maskPhone = (value) => {
  if (!value) return '';

  const numbers = removeNonDigits(value);

  const truncated = numbers.substring(0, 11);

  if (truncated.length === 11) {
    return truncated.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
  } else if (truncated.length === 10) {
    return truncated.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
  }

  if (truncated.length <= 2) {
    return truncated;
  } else if (truncated.length <= 7) {
    return truncated.replace(/^(\d{2})(\d{1,5})$/, '($1) $2');
  } else {
    if (truncated.length <= 10) {
      return truncated.replace(/^(\d{2})(\d{4})(\d{1,4})$/, '($1) $2-$3');
    } else {
      return truncated.replace(/^(\d{2})(\d{5})(\d{1,4})$/, '($1) $2-$3');
    }
  }
};

/**
 * Formata uma data com a máscara DD/MM/YYYY
 * @param {string} value - Data a ser formatada
 * @returns {string} Data formatada
 */
export const maskDate = (value) => {
  if (!value) return '';

  const numbers = removeNonDigits(value);

  const truncated = numbers.substring(0, 8);

  if (truncated.length === 8) {
    return truncated.replace(/^(\d{2})(\d{2})(\d{4})$/, '$1/$2/$3');
  }

  if (truncated.length <= 2) {
    return truncated;
  } else if (truncated.length <= 4) {
    return truncated.replace(/^(\d{2})(\d{1,2})$/, '$1/$2');
  } else {
    return truncated.replace(/^(\d{2})(\d{2})(\d{1,4})$/, '$1/$2/$3');
  }
}; 