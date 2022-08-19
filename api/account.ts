import * as express from "express";
import * as serverless from "serverless-http";
import * as AWS from "aws-sdk";
import * as Snoowrap from "snoowrap";
import {ScanInput} from "aws-sdk/clients/dynamodb";
import {Account} from "./accounts";

const app = express();
const dynamodb = new AWS.DynamoDB.DocumentClient({ region: "us-east-1" });


// create a function to save an account's data to the database
async function saveAccount (account: Account) {
  // create a new item to save to the database
  const snoo = new Snoowrap({
    userAgent: "replicant_v1",
    clientId: account.client_id,
    clientSecret: account.client_secret,
    username: account.account_name,
    password: account.password,
  })

  // @ts-ignore
  const me = await snoo.getMe();
  const item = {
    user_agent: "replicant_v1",
    client_id: account.client_id,
    client_secret: account.client_secret,
    account_name: account.account_name,
    password: account.password,
    post_karma: me.link_karma,
    comment_karma: me.comment_karma,
    is_sold: false,
    is_harvested: false,
    is_suspended: me.is_suspended,
    cake_day: me.created_utc,
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
      "set #ua = :ua, #pk = :pk, #ck = :ck, #sold = :sold, #harvested = :harvested, #suspended = :suspended, #cake = :cake",
    ExpressionAttributeNames: {
      "#ua": "user_agent",
      "#pk": "post_karma",
      "#ck": "comment_karma",
      "#sold": "is_sold",
      "#harvested": "is_harvested",
      "#suspended": "is_suspended",
      "#cake": "cake_day",
    },
    ExpressionAttributeValues: {
      ":ua": account.user_agent,
      ":pk": account.post_karma,
      ":ck": account.comment_karma,
      ":sold": account.is_sold,
      ":harvested": account.is_harvested,
      ":suspended": account.is_suspended,
      ":cake": account.cake_day,
    },
  };
  // patch the account in the database
  await dynamodb.update(params).promise();
}

// create a function to get all accounts from the database with pagination
async function getAllAccounts(limit: number, nextToken: ScanInput) {
  // create a query to get all accounts from the database
  return await dynamodb.scan({
    TableName: process.env.ACCOUNTS_TABLE,
    Limit: limit,
    ExclusiveStartKey: nextToken,
  }).promise();
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

// @ts-ignore
async function getKarma(account_name: string) {
  const account = await getAccount(account_name);
  const snoo = new Snoowrap({
    userAgent: account.user_agent.toString(),
    clientId: account.client_id.toString(),
    clientSecret: account.client_secret.toString(),
    username: account.account_name.toString(),
    password: account.password.toString(),
  });
  return snoo.getMe();
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
  const nextToken = req.query.nextToken as unknown as ScanInput;
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

app.delete(`/${process.env.STAGE}/accounts/:account_name`, async function (req, res) {
  await deleteAccount(req.params.account_name);
  res.send("accounts deleted successfully");
});

app.get(`/${process.env.STAGE}/karma/:account_name`, async function (req, res) {
  const me = await getKarma(req.params.account_name);
  res.json({totalKarma: me.total_karma, linkKarma: me.link_karma, commentKarma: me.comment_karma});
});

export const handler = serverless(app);
