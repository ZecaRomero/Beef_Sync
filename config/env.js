/**
 * ConfiguraÃ§Ã£o e validaÃ§Ã£o de variÃ¡veis de ambiente
 */

/**
 * ObtÃ©m uma variÃ¡vel de ambiente ou retorna valor padrÃ£o
 */
function getEnv(key, defaultValue = '') {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || defaultValue;
  }
  return defaultValue;
}

/**
 * Valida se todas as variÃ¡veis obrigatÃ³rias estÃ£o presentes
 */
function validateEnv() {
  const required = [];
  
  const missing = required.filter(key => !getEnv(key));
  
  if (missing.length > 0) {
    console.warn(
      `âÅ¡ ï¸� VariÃ¡veis de ambiente faltando: ${missing.join(', ')}\n` +
      'O aplicativo usarÃ¡ valores padrÃ£o, mas algumas funcionalidades podem nÃ£o funcionar corretamente.'
    );
  }
}

// Validar no carregamento
if (typeof window === 'undefined') {
  validateEnv();
}

// ConfiguraÃ§Ãµes da aplicaÃ§Ã£o
export const config = {
  app: {
    name: getEnv('NEXT_PUBLIC_APP_NAME', 'Beef Sync'),
    version: getEnv('NEXT_PUBLIC_APP_VERSION', '3.0.0'),
    env: getEnv('NODE_ENV', 'development'),
    isDevelopment: getEnv('NODE_ENV', 'development') === 'development',
    isProduction: getEnv('NODE_ENV', 'development') === 'production',
  },
  
  database: {
    host: getEnv('DB_HOST', 'localhost'),
    port: parseInt(getEnv('DB_PORT', '5432')),
    name: getEnv('DB_NAME', 'estoque_semen'),
    user: getEnv('DB_USER', 'postgres'),
    password: getEnv('DB_PASSWORD', 'jcromero85'),
  },
  
  api: {
    timeout: parseInt(getEnv('API_TIMEOUT', '30000')),
  },
  
  logging: {
    level: getEnv('NEXT_PUBLIC_LOG_LEVEL', 'DEBUG'),
  },
  
  backup: {
    dir: getEnv('BACKUP_DIR', './backups'),
    retentionDays: parseInt(getEnv('BACKUP_RETENTION_DAYS', '30')),
  },
  
  email: {
    host: getEnv('SMTP_HOST', ''),
    port: parseInt(getEnv('SMTP_PORT', '587')),
    user: getEnv('SMTP_USER', ''),
    password: getEnv('SMTP_PASSWORD', ''),
    from: getEnv('SMTP_FROM', ''),
    enabled: !!getEnv('SMTP_HOST'),
  },
};

export default config;
