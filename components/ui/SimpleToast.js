// Toast simples para uso global
const Toast = {
  success: (message, duration = 3000) => {
    // Em produção, você pode implementar um toast visual aqui
    if (process.env.NODE_ENV === 'development') {
      console.log('✅', message);
    }
  },
  error: (message, duration = 5000) => {
    console.error('❌', message);
    // Em produção, você pode implementar um toast visual aqui
  },
  warning: (message, duration = 4000) => {
    console.warn('⚠️', message);
    // Em produção, você pode implementar um toast visual aqui
  },
  info: (message, duration = 3000) => {
    console.info('ℹ️', message);
    // Em produção, você pode implementar um toast visual aqui
  }
};

export default Toast;
