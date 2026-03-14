
require('dotenv').config();
const nodemailer = require('nodemailer');

async function checkSMTP() {
  console.log('--- Verificando Configuração SMTP ---');
  
  const config = {
    host: process.env.SMTP_HOST,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS ? '******' : undefined,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE,
    from: process.env.SMTP_FROM
  };
  
  console.log('Configurações encontradas:', config);
  
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error('❌ Faltam variáveis de ambiente obrigatórias!');
    console.log('Configure SMTP_HOST, SMTP_USER e SMTP_PASS no arquivo .env');
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Tentando conectar ao servidor SMTP...');
    await transporter.verify();
    console.log('✅ Conexão SMTP estabelecida com sucesso!');
    
    // Tentar enviar um email de teste
    console.log('📧 Tentando enviar email de teste para o próprio remetente...');
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: process.env.SMTP_USER, // Envia para si mesmo
      subject: 'Teste de Configuração SMTP - Beef Sync',
      text: 'Se você recebeu este email, a configuração SMTP do Beef Sync está funcionando corretamente!',
      html: '<h1>Teste SMTP Sucesso</h1><p>Se você recebeu este email, a configuração SMTP do Beef Sync está funcionando corretamente!</p>'
    });
    
    console.log('✅ Email de teste enviado com sucesso!');
    console.log('   ID da mensagem:', info.messageId);
    console.log('   Verifique sua caixa de entrada (e spam).');
    
  } catch (error) {
    console.error('❌ Falha na conexão ou envio SMTP:', error.message);
    if (error.code === 'EAUTH') {
      console.error('   -> Verifique usuário e senha.');
    }
    if (error.response) {
      console.error('   -> Resposta do servidor:', error.response);
    }
  }
}

checkSMTP();
