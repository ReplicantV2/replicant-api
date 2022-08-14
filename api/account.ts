import * as express from "express";
import * as serverless from "serverless-http";
import * as AWS from "aws-sdk";
import * as snoowrap from "snoowrap";

const app = express();
const dynamodb = new AWS.DynamoDB.DocumentClient({ region: "us-east-1" });

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
  // create a new item to save to the database
  const item = {
    user_agent: "",
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
  };
  // save the item to the database
  await dynamodb
    .put({
      TableName: process.env.ACCOUNTS_TABLE,
      Item: item,
    })
    .promise();
}

//create a function to get an account's data from the dynamoDB database
async function getAccount(account_name: string) {
  // create a query to get the account from the database
  const params = {
    TableName: process.env.ACCOUNTS_TABLE,
    Key: {
      account_name: account_name,
    },
  };
  // get the account from the database
  const data = await dynamodb.get(params).promise();
  // return the account
  return data.Item;
}
// patch an account's data in the database
async function updateAccount(account: Account) {
  // create a query to patch the account in the database
  const params = {
    TableName: process.env.ACCOUNTS_TABLE,
    Key: {
      account_name: account.account_name,
    },
    UpdateExpression:
      "set #ua = :ua, #pk = :pk, #ck = :ck, #age = :age, #sold = :sold, #harvested = :harvested, #suspended = :suspended, #banned = :banned, #cake = :cake",
    ExpressionAttributeNames: {
      "#ua": "user_agent",
      "#pk": "post_karma",
      "#ck": "comment_karma",
      "#age": "account_age",
      "#sold": "is_sold",
      "#harvested": "is_harvested",
      "#suspended": "is_suspended",
      "#banned": "is_banned",
      "#cake": "cake_day",
    },
    ExpressionAttributeValues: {
      ":ua": account.user_agent,
      ":pk": account.post_karma,
      ":ck": account.comment_karma,
      ":age": account.account_age,
      ":sold": account.is_sold,
      ":harvested": account.is_harvested,
      ":suspended": account.is_suspended,
      ":banned": account.is_banned,
      ":cake": account.cake_day,
    },
  };
  // patch the account in the database
  await dynamodb.update(params).promise();
}

// create a function to get all accounts from the database with pagination
async function getAllAccounts(limit: number, nextToken: string) {
  // create a query to get all accounts from the database
  const params = {
    TableName: process.env.ACCOUNTS_TABLE,
    Limit: limit,
    ExclusiveStartKey: nextToken,
  };

  return await dynamodb.scan(params).promise();
}

//delete an account from the database
async function deleteAccount(account_name: string) {
  // create a query to delete the account from the database
  const params = {
    TableName: process.env.ACCOUNTS_TABLE,
    Key: {
      account_name: account_name,
    },
  };
  // delete the account from the database
  await dynamodb.delete(params).promise();
}

async function getKarma(account_name: string) {
  const account = await getAccount(account_name);
  const snoo = new snoowrap({
    userAgent: account.user_agent,
    clientId: account.client_id,
    clientSecret: account.client_secret,
    username: account.username,
    password: account.password,
  });
  return snoo.getMe().getComments();
}
app.use(express.json());

app.get(
  `/${process.env.STAGE}/accounts/:account_name`,
  async function (req, res) {
    res.json(await getAccount(req.params.account_name));
  }
);

app.get(`/${process.env.STAGE}/accounts`, async function (req, res) {
  const limit = parseInt(req.query.limit as string);
  const nextToken = req.query.nextToken as string;
  res.json(await getAllAccounts(limit, nextToken));
});

app.post(`/${process.env.STAGE}/accounts`, async function (req, res) {
  try {
    await saveAccount(req.body);
    res.json({ message: "Account added successfully" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
app.patch(`/${process.env.STAGE}/accounts/`, async function (req, res) {
  await updateAccount(req.body);
  res.send("accounts patched successfully");
});

app.delete(`/${process.env.STAGE}/accounts/`, async function (req, res) {
  await deleteAccount(req.body.account_name);
  res.send("accounts deleted successfully");
});

app.get(`/${process.env.STAGE}/karma/:account_name`, async function (req, res) {
  const karma = await getKarma(req.params.account_name);
  res.send(karma);
});

export const handler = serverless(app);
