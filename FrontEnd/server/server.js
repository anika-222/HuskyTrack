import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import {
  InvokeCommand,
  LambdaClient,
  ListFunctionsCommand,
} from "@aws-sdk/client-lambda";
import { STSClient, GetCallerIdentityCommand } from "@aws-sdk/client-sts";
import bodyParser from "body-parser";

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 5000;

// Test endpoint to verify AWS credentials
app.get("/api/aws-test", async (req, res) => {
  try {
    const cmd = new GetCallerIdentityCommand({});
    const resp = await stsClient.send(cmd);

    // Also list Lambda functions
    const listCmd = new ListFunctionsCommand({});
    const lambdaResp = await lambdaClient.send(listCmd);
    const functions = lambdaResp.Functions || [];

    return res.json({
      account: resp.Account,
      userId: resp.UserId?.split(":")[0] || "unknown",
      region: AWS_REGION,
      lambdaFunctions: functions.map((f) => ({
        name: f.FunctionName,
        runtime: f.Runtime,
        handler: f.Handler,
      })),
    });
  } catch (err) {
    return res.status(500).json({
      error: "AWS credential check failed",
      message: err.message,
      region: AWS_REGION,
    });
  }
});

// AWS Lambda client configuration - reads region and credentials from env or default provider
// Use explicit fallback for region so developer mistakes are easier to diagnose.
const AWS_REGION =
  process.env.AWS_REGION ||
  process.env.AWS_DEFAULT_REGION ||
  process.env.AWS_REGION_ENV ||
  "us-east-1";
const lambdaClient = new LambdaClient({ region: AWS_REGION });
const stsClient = new STSClient({ region: AWS_REGION });

async function checkAwsCredentials() {
  try {
    const cmd = new GetCallerIdentityCommand({});
    const resp = await stsClient.send(cmd);
    console.log("AWS credentials OK. Effective AWS region:", AWS_REGION);
    console.log("Caller identity: ", {
      Account: resp.Account,
      Arn: resp.Arn,
      UserId: resp.UserId,
    });
    return true;
  } catch (err) {
    console.warn(
      "Warning: unable to validate AWS credentials. Lambda calls may fail."
    );
    console.warn("STS error:", err && err.message ? err.message : String(err));
    console.warn("Effective AWS region used by the SDK:", AWS_REGION);
    console.warn("Suggestions:");
    console.warn(
      " - Add a `.env` file in FrontEnd/server with AWS_REGION and credentials (this project includes .env.example)"
    );
    console.warn(
      " - Or set environment variables in PowerShell: $env:AWS_REGION, $env:AWS_ACCESS_KEY_ID, $env:AWS_SECRET_ACCESS_KEY"
    );
    console.warn(
      " - Or configure the AWS CLI (aws configure) and set AWS_PROFILE to use a named profile"
    );
    return false;
  }
}

// POST /api/chat -> invokes configured Lambda and returns the result
app.post("/api/chat", async (req, res) => {
  try {
    const payload = req.body;

    if (!process.env.CHAT_LAMBDA_NAME) {
      return res
        .status(500)
        .json({ error: "CHAT_LAMBDA_NAME not configured on server" });
    }

    console.log(
      "Invoking Lambda with payload:",
      JSON.stringify(payload, null, 2)
    );

    const invokeCmd = new InvokeCommand({
      FunctionName: process.env.CHAT_LAMBDA_NAME,
      Payload: Buffer.from(JSON.stringify(payload)),
      InvocationType: "RequestResponse",
    });

    const invokeResp = await lambdaClient.send(invokeCmd);

    if (invokeResp.FunctionError) {
      const errPayload = invokeResp.Payload
        ? Buffer.from(invokeResp.Payload).toString()
        : "Unknown Lambda error";
      console.error("Lambda returned error:", errPayload);
      return res.status(500).json({
        error: "lambda_error",
        message: "Lambda invocation failed",
        details: errPayload,
      });
    }

    if (!invokeResp.Payload) {
      console.error("Lambda returned no payload");
      return res.status(500).json({
        error: "empty_response",
        message: "Lambda returned no response",
      });
    }

    const responseText = Buffer.from(invokeResp.Payload).toString();

    try {
      const parsed = JSON.parse(responseText);
      return res.json({ lambda: parsed });
    } catch (parseErr) {
      console.error("Failed to parse Lambda response:", parseErr);
      return res.status(500).json({
        error: "parse_error",
        message: "Could not parse Lambda response",
        details: responseText.substring(0, 200), // First 200 chars for debugging
      });
    }
  } catch (err) {
    console.error("Server error invoking lambda:", err);
    return res.status(500).json({
      error: "server_error",
      message: "Internal server error",
      details: err.message,
    });
  }
});

// Start server after checking AWS credentials (best-effort)
(async () => {
  await checkAwsCredentials();
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
})();
