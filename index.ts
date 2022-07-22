import * as express from 'express';
import * as serverless from 'serverless-http';
const app = express()

app.get('/', function (req, res) {
    res.send('Hello World!')
})

export const handler = serverless(app);
