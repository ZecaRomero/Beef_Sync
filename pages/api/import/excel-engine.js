import formidable from 'formidable';
import fs from 'fs';
import { query } from '@/lib/database';
import { processExcelImport } from '@/lib/import/importProcessor';
import { CustomerSchema } from '@/schemas/customerSchema';
import { sendError, sendMethodNotAllowed, sendSuccess, sendValidationError } from '@/utils/apiResponse';
import { blockIfNotZecaDeveloper } from '@/utils/importAccess';

export const config = {
  api: {
    bodyParser: false,
  },
};

const customerImportConfig = {
  expectedColumns: ['name', 'email', 'age', 'cpf', 'phone', 'birthDate'],
  schema: CustomerSchema,
  normalizeConfig: {
    lowercaseFields: ['email'],
    uppercaseFields: ['cpf'],
    dateFields: ['birthDate'],
    removeInvalidChars: true,
  },
  uniqueBy: ['email'],
  checkDuplicatesAgainstDatabase: async (rows) => {
    if (!rows.length) return [];

    try {
      const emails = rows
        .map((item) => String(item.row.email ?? '').trim().toLowerCase())
        .filter(Boolean);

      if (!emails.length) return [];

      await query(`
        CREATE TABLE IF NOT EXISTS excel_import_customers (
          id SERIAL PRIMARY KEY,
          name VARCHAR(120) NOT NULL,
          email VARCHAR(180) NOT NULL UNIQUE,
          age INTEGER,
          cpf VARCHAR(20),
          phone VARCHAR(20),
          birth_date DATE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      const result = await query(
        `SELECT LOWER(email) AS email
         FROM excel_import_customers
         WHERE LOWER(email) = ANY($1::text[])`,
        [emails]
      );

      return result.rows.map((item) => String(item.email));
    } catch {
      return [];
    }
  },
};

function parseMultipart(req) {
  const form = formidable({
    multiples: false,
    maxFileSize: 50 * 1024 * 1024,
  });

  return new Promise((resolve, reject) => {
    form.parse(req, (error, fields, files) => {
      if (error) {
        reject(error);
        return;
      }
      resolve({ fields, files });
    });
  });
}

async function persistCustomers(rows) {
  if (!rows.length) return 0;

  await query(`
    CREATE TABLE IF NOT EXISTS excel_import_customers (
      id SERIAL PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      email VARCHAR(180) NOT NULL UNIQUE,
      age INTEGER,
      cpf VARCHAR(20),
      phone VARCHAR(20),
      birth_date DATE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  let importedCount = 0;
  for (const item of rows) {
    const customer = item.row;
    await query(
      `INSERT INTO excel_import_customers
      (name, email, age, cpf, phone, birth_date, updated_at)
      VALUES ($1, LOWER($2), $3, $4, $5, $6, CURRENT_TIMESTAMP)
      ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        age = EXCLUDED.age,
        cpf = EXCLUDED.cpf,
        phone = EXCLUDED.phone,
        birth_date = EXCLUDED.birth_date,
        updated_at = CURRENT_TIMESTAMP`,
      [customer.name, customer.email, customer.age, customer.cpf, customer.phone, customer.birthDate]
    );
    importedCount += 1;
  }

  return importedCount;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendMethodNotAllowed(res, req.method);
  }

  const blocked = blockIfNotZecaDeveloper(req, res);
  if (blocked) return blocked;

  let filepathToClean = null;

  try {
    const { fields, files } = await parseMultipart(req);
    let file = files?.file;
    if (Array.isArray(file)) file = file[0];

    if (!file) {
      return sendValidationError(res, [{ field: 'file', message: 'Arquivo Excel é obrigatório' }]);
    }

    const modeRaw = Array.isArray(fields?.mode) ? fields.mode[0] : fields?.mode;
    const mode = String(modeRaw || 'preview').toLowerCase();
    const importTypeRaw = Array.isArray(fields?.importType) ? fields.importType[0] : fields?.importType;
    const importType = String(importTypeRaw || 'customer').toLowerCase();

    if (importType !== 'customer') {
      return sendValidationError(res, [
        { field: 'importType', message: 'Tipo de importação inválido. Use "customer".' },
      ]);
    }

    filepathToClean = file.filepath || file.path;
    if (!filepathToClean) {
      return sendError(res, 'Arquivo não recebido corretamente', 400);
    }

    const buffer = fs.readFileSync(filepathToClean);
    const processed = await processExcelImport({
      file: buffer,
      config: customerImportConfig,
    });

    if (!processed.columnValidation.isValid) {
      return sendValidationError(
        res,
        {
          missingColumns: processed.columnValidation.missingColumns,
          unexpectedColumns: processed.columnValidation.unexpectedColumns,
          report: processed.report,
        },
        'Colunas obrigatórias ausentes. Corrija o arquivo antes da importação.'
      );
    }

    if (mode === 'import') {
      // Backend revalida novamente antes de salvar, mesmo que frontend já tenha feito preview.
      const revalidated = await processExcelImport({
        file: buffer,
        config: customerImportConfig,
      });

      const importedCount = await persistCustomers(revalidated.validRows);

      return sendSuccess(
        res,
        {
          importedCount,
          validRows: revalidated.report.validRows,
          invalidRows: revalidated.report.invalidRows,
          report: revalidated.report,
          previewRows: revalidated.previewRows,
        },
        `Importação concluída: ${importedCount} linha(s) válida(s) salva(s).`,
        201
      );
    }

    return sendSuccess(
      res,
      {
        previewRows: processed.previewRows,
        validRows: processed.report.validRows,
        invalidRows: processed.report.invalidRows,
        report: processed.report,
        columnValidation: processed.columnValidation,
      },
      'Preview gerado com sucesso.'
    );
  } catch (error) {
    return sendError(res, error?.message || 'Erro ao processar importação Excel');
  } finally {
    if (filepathToClean) {
      try {
        fs.unlinkSync(filepathToClean);
      } catch {
        // Ignore cleanup errors
      }
    }
  }
}
