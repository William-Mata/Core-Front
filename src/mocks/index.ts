import { worker } from './servidor';

export const iniciarMocks = async () => {
  console.log('🚀 Iniciando MSW...');
  if (process.env.NODE_ENV === 'development') {
    try {
      await worker.start({
        onUnhandledRequest: 'bypass',
      });
      console.log('✅ MSW iniciado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao iniciar MSW:', error);
    }
  } else {
    console.log('ℹ️ MSW não iniciado (ambiente não é development)');
  }
};
