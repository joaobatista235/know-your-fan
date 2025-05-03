import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

/**
 * Hook personalizado para integrar Zod com react-hook-form
 * 
 * @param {object} schema - Schema Zod para validação
 * @param {object} defaultValues - Valores padrão para o formulário
 * @param {object} options - Opções adicionais para useForm
 * @returns {object} - Objeto com métodos e propriedades do react-hook-form
 */
export const useZodForm = (schema, defaultValues = {}, options = {}) => {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues,
    mode: 'onTouched',
    ...options,
  });

  return {
    ...form,
    
    /**
     * Verifica se um campo tem erro
     * @param {string} name - Nome do campo
     * @returns {boolean} - Se o campo tem erro
     */
    hasError: (name) => {
      return !!form.formState.errors[name];
    },
    
    /**
     * Obtém a mensagem de erro de um campo
     * @param {string} name - Nome do campo
     * @returns {string} - Mensagem de erro
     */
    getError: (name) => {
      return form.formState.errors[name]?.message || '';
    },
    
    /**
     * Verifica se um campo foi tocado
     * @param {string} name - Nome do campo
     * @returns {boolean} - Se o campo foi tocado
     */
    isTouched: (name) => {
      return !!form.formState.touchedFields[name];
    },
    
    /**
     * Atualiza vários valores do formulário de uma vez
     * @param {object} values - Valores a serem atualizados
     */
    updateValues: (values) => {
      Object.entries(values).forEach(([key, value]) => {
        form.setValue(key, value, { 
          shouldValidate: form.formState.touchedFields[key],
          shouldDirty: true 
        });
      });
    }
  };
}; 