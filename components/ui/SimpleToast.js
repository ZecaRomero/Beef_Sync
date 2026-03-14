// Toast simples para uso global
const Toast = {
  success: (message, duration = 3000) => {
    // Em produÃ§Ã£o, vocÃª pode implementar um toast visual aqui
    if (process.env.NODE_ENV === 'development') {
      console.log('âÅ“â€¦', message);
    }
  },
  error: (message, duration = 5000) => {
    console.error('â�Å’', message);
    // Em produÃ§Ã£o, vocÃª pode implementar um toast visual aqui
  },
  warning: (message, duration = 4000) => {
    console.warn('âÅ¡ ï¸�', message);
    // Em produÃ§Ã£o, vocÃª pode implementar um toast visual aqui
  },
  info: (message, duration = 3000) => {
    console.info('ââ€ž¹ï¸�', message);
    // Em produÃ§Ã£o, vocÃª pode implementar um toast visual aqui
  }
};

export default Toast;
