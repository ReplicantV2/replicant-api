import * as express from 'express';
import * as serverless from 'serverless-http';
import * as AWS from 'aws-sdk';
const app = express()

// create account type
interface Account {
    user_agent: string;
    client_id: string;
    client_secret: string;
    account_name: string;
    password: string;
    post_karma: number;
    comment_karma: number;
    account_age: number;
    is_sold: boolean;
    is_harvested: boolean;
    is_suspended: boolean;
    is_banned: boolean;
    cake_day: number;
}

// create a function to save an account's data to the database
async function saveAccount(account: Account) {
    // connect to the dynamoDB database
    const dynamodb = new AWS.DynamoDB.DocumentClient();
    // create a new item to save to the database
    const item = {
        user_agent: '',
        client_id: account.client_id,
        client_secret: account.client_secret,
        account_name: account.account_name,
        password: account.password,
        post_karma: 0,
        comment_karma: 0,
        account_age: 0,
        is_sold: false,
        is_harvested: false,
        is_suspended: false,
        is_banned: false,
        cake_day: 0,
    }
    // save the item to the database
    await dynamodb.put({
        TableName: process.env.ACCOUNTS_TABLE,
        Item: item,
    }, (err, data) => {
        if (err) {
            return err;
        } else {
            return data;
        }
    })
}

app.get(`/${process.env.STAGE}/accounts/fetch`, function (req, res) {
    res.json(req.query)
})
app.post(`/${process.env.STAGE}/accounts/create`, async function (req, res) {
    res.json(await saveAccount(req.body))
})
app.patch(`/${process.env.STAGE}/accounts/patch`, function (req, res) {
    res.send('accounts patch response')
})
app.delete(`/${process.env.STAGE}/accounts/delete`, function (req, res) {
    res.send('accounts delete response')
})

export const handler = serverless(app);
