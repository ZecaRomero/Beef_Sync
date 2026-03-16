import { query } from '../lib/database'

let nitrogenioSchemaReady = false

export async function ensureNitrogenioTables() {
  if (nitrogenioSchemaReady) return

  await query(`
    CREATE TABLE IF NOT EXISTS abastecimento_nitrogenio (
      id SERIAL PRIMARY KEY,
      data_abastecimento DATE NOT NULL,
      quantidade_litros DECIMAL(10,2) NOT NULL,
      valor_unitario DECIMAL(10,2),
      valor_total DECIMAL(10,2),
      motorista VARCHAR(100) NOT NULL,
      observacoes TEXT,
      proximo_abastecimento DATE,
      notificacao_enviada BOOLEAN DEFAULT false,
      notificacao_enviada_2dias BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  await query(`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'abastecimento_nitrogenio' AND column_name = 'proximo_abastecimento'
      ) THEN
        ALTER TABLE abastecimento_nitrogenio ADD COLUMN proximo_abastecimento DATE;
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'abastecimento_nitrogenio' AND column_name = 'notificacao_enviada'
      ) THEN
        ALTER TABLE abastecimento_nitrogenio ADD COLUMN notificacao_enviada BOOLEAN DEFAULT false;
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'abastecimento_nitrogenio' AND column_name = 'notificacao_enviada_2dias'
      ) THEN
        ALTER TABLE abastecimento_nitrogenio ADD COLUMN notificacao_enviada_2dias BOOLEAN DEFAULT false;
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'abastecimento_nitrogenio' AND column_name = 'updated_at'
      ) THEN
        ALTER TABLE abastecimento_nitrogenio ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
      END IF;
    END $$;
  `)

  await query(`
    CREATE TABLE IF NOT EXISTS nitrogenio_whatsapp_contatos (
      id SERIAL PRIMARY KEY,
      nome VARCHAR(100) NOT NULL,
      whatsapp VARCHAR(20) NOT NULL UNIQUE,
      ativo BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  await query(`CREATE INDEX IF NOT EXISTS idx_abastecimento_nitrogenio_data ON abastecimento_nitrogenio(data_abastecimento)`)
  await query(`CREATE INDEX IF NOT EXISTS idx_abastecimento_nitrogenio_motorista ON abastecimento_nitrogenio(motorista)`)
  await query(`CREATE INDEX IF NOT EXISTS idx_nitrogenio_whatsapp_ativo ON nitrogenio_whatsapp_contatos(ativo)`)

  nitrogenioSchemaReady = true
}

