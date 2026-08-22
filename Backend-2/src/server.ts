import dotenv from 'dotenv';
dotenv.config();

import app from './app';

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`  DAYFLOW HRMS — BE-2 SERVER RUNNING     `);
  console.log(`  Port: ${PORT}                          `);
  console.log(`  Health: http://localhost:${PORT}/health `);
  console.log(`=========================================`);
});

export default server;
