import * as express from "express";
import * as serverless from "serverless-http";
import * as AWS from "aws-sdk";

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

app.use(express.json());

app.get(
  `/${process.env.STAGE}/accounts/:account_name`,
  async function (req, res) {
    res.json(await getAccount(req.params.account_name));
  }
);

app.post(`/${process.env.STAGE}/accounts`, async function (req, res) {
  try {
    await saveAccount(req.body);
    res.json({ message: "Account added successfully" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
app.patch(`/${process.env.STAGE}/accounts/patch`, function (req, res) {
  res.send("accounts patch response");
});
app.delete(`/${process.env.STAGE}/accounts/delete`, function (req, res) {
  res.send("accounts delete response");
});

export const handler = serverless(app);
