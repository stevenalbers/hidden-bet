import app from './index';

const PORT = process.env.PORT || 3001;

if (process.env.NODE_ENV === 'development') {
  app.listen(PORT, () => {
    console.log(`API Server running on http://localhost:${PORT}`);
  });
}

export default app;