/**
 * Testes para sistema de validação
 */
import {
  required,
  email,
  minLength,
  min,
  validateAnimal,
  validateCusto,
} from '@/lib/validator';
import type { Animal, Custo } from '@/types';

describe('Validadores Base', () => {
  describe('required', () => {
    it('deve retornar erro quando valor é vazio', () => {
      expect(required('', 'Nome')).toEqual({
        field: 'Nome',
        message: 'Nome é obrigatório',
      });
    });

    it('deve retornar null quando valor é fornecido', () => {
      expect(required('John', 'Nome')).toBeNull();
    });
  });

  describe('email', () => {
    it('deve retornar erro para email inválido', () => {
      expect(email('invalid', 'Email')).toEqual({
        field: 'Email',
        message: 'Email deve ser um email válido',
      });
    });

    it('deve retornar null para email válido', () => {
      expect(email('test@example.com', 'Email')).toBeNull();
    });
  });

  describe('minLength', () => {
    it('deve retornar erro quando tamanho é menor que mínimo', () => {
      expect(minLength('abc', 5, 'Nome')).toEqual({
        field: 'Nome',
        message: 'Nome deve ter no mínimo 5 caracteres',
      });
    });

    it('deve retornar null quando tamanho é válido', () => {
      expect(minLength('abcdef', 5, 'Nome')).toBeNull();
    });
  });

  describe('min', () => {
    it('deve retornar erro quando valor é menor que mínimo', () => {
      expect(min(5, 10, 'Idade')).toEqual({
        field: 'Idade',
        message: 'Idade deve ser no mínimo 10',
      });
    });

    it('deve retornar null quando valor é válido', () => {
      expect(min(15, 10, 'Idade')).toBeNull();
    });
  });
});

describe('Validadores Específicos', () => {
  describe('validateAnimal', () => {
    it('deve validar animal válido', () => {
      const animal: Partial<Animal> = {
        serie: 'A1',
        rg: '12345',
        sexo: 'Macho',
        raca: 'Angus',
      };

      const errors = validateAnimal(animal);
      expect(errors).toEqual([]);
    });

    it('deve retornar erros para campos obrigatórios faltando', () => {
      const animal: Partial<Animal> = {};
      const errors = validateAnimal(animal);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.field === 'Série')).toBe(true);
      expect(errors.some(e => e.field === 'RG')).toBe(true);
    });

    it('deve validar peso dentro do range', () => {
      const animal: Partial<Animal> = {
        serie: 'A1',
        rg: '12345',
        sexo: 'Macho',
        raca: 'Angus',
        peso: 3000, // Acima do máximo
      };

      const errors = validateAnimal(animal);
      expect(errors.some(e => e.field === 'Peso')).toBe(true);
    });
  });

  describe('validateCusto', () => {
    it('deve validar custo válido', () => {
      const custo: Partial<Custo> = {
        animal_id: 1,
        tipo: 'Medicamentos',
        valor: 100,
        data: new Date(),
      };

      const errors = validateCusto(custo);
      expect(errors).toEqual([]);
    });

    it('deve retornar erros para campos obrigatórios faltando', () => {
      const custo: Partial<Custo> = {};
      const errors = validateCusto(custo);

      expect(errors.length).toBeGreaterThan(0);
    });
  });
});

