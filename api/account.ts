import * as express from 'express';
import * as serverless from 'serverless-http';
const app = express()

app.get('/accounts/fetch', function (req, res) {
    res.send('accounts get response')
})
app.post('/accounts/create', function (req, res) {
    res.send('accounts post response')
})
app.patch('/accounts/patch', function (req, res) {
    res.send('accounts patch response')
})
app.delete('/accounts/delete', function (req, res) {
    res.send('accounts delete response')
})

export const handler = serverless(app);
