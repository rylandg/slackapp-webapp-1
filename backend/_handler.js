import express from 'express';
import { defaultHandler } from '@reshuffle/server-function';
import { authHandler } from '@reshuffle/passport';

const app = express();
app.use(authHandler);

// Example of accessing a user
//
// app.get('/hello-user', (req, res) => {
//   console.log(`This is a user ${req.user}`);
// });

app.use(defaultHandler)

export default app;
