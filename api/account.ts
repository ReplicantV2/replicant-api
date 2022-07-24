import * as express from 'express';
import * as serverless from 'serverless-http';
const app = express()

app.get(`/${process.env.STAGE}/accounts/fetch`, function (req, res) {
    res.send('accounts get response')
})
app.post(`/${process.env.STAGE}/accounts/create`, function (req, res) {
    res.send('accounts post response')
})
app.patch(`/${process.env.STAGE}/accounts/patch`, function (req, res) {
    res.send('accounts patch response')
})
app.delete(`/${process.env.STAGE}/accounts/delete`, function (req, res) {
    res.send('accounts delete response')
})

export const handler = serverless(app);
