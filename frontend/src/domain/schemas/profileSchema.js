import { z } from 'zod';
import { isValidCPF } from '../../presentation/utils/masks';

// Regex patterns
const CEP_REGEX = /^(\d{5}-\d{3}|\d{8})$/;
const CPF_REGEX = /^(\d{3}\.\d{3}\.\d{3}-\d{2}|\d{11})$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Esquema de validação para o formulário de perfil
 */
export const profileSchema = z.object({
  // Informações pessoais
  name: z
    .string()
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .nonempty('Nome é obrigatório'),
  
  cpf: z
    .string()
    .nonempty('CPF é obrigatório')
    .refine(value => CPF_REGEX.test(value) || value.length <= 3, {
      message: 'Formato de CPF inválido'
    })
    .refine(value => value.length <= 3 || isValidCPF(value), {
      message: 'CPF inválido'
    }),
  
  dateOfBirth: z
    .string()
    .regex(DATE_REGEX, 'Data inválida')
    .optional()
    .or(z.literal('')),
  
  // Endereço
  cep: z
    .string()
    .nonempty('CEP é obrigatório')
    .refine(value => CEP_REGEX.test(value) || value.length <= 5, {
      message: 'Formato de CEP inválido'
    }),
  
  street: z.string().optional().or(z.literal('')),
  number: z.string().optional().or(z.literal('')),
  complement: z.string().optional().or(z.literal('')),
  neighborhood: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  state: z.string().optional().or(z.literal('')),
  
  // Preferências
  favoriteGames: z.string().optional().or(z.literal('')),
  favoriteTeams: z.string().optional().or(z.literal('')),
  recentEvents: z.string().optional().or(z.literal(''))
});

// Valores padrão para o formulário
export const profileDefaultValues = {
  name: '',
  cpf: '',
  dateOfBirth: '',
  cep: '',
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
  favoriteGames: '',
  favoriteTeams: '',
  recentEvents: ''
};

/**
 * Tipo inferido do esquema Zod
 * @typedef {z.infer<typeof profileSchema>} ProfileFormData
 */ 