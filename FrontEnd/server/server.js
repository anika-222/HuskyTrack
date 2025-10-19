import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import { STSClient, GetCallerIdentityCommand } from "@aws-sdk/client-sts";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import bodyParser from "body-parser";
import path from "path";
import fs from "fs";
// Mock PDF parsing for demonstration - in production, use a proper PDF parser

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 5000;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// Serve uploaded files statically
app.use('/uploads', express.static('uploads', {
  setHeaders: (res, path) => {
    if (path.endsWith('.pdf')) {
      res.setHeader('Content-Type', 'application/pdf');
    }
  }
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    message: 'Server is working properly'
  });
});

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

// AWS S3 client configuration
const AWS_REGION =
  process.env.AWS_REGION ||
  process.env.AWS_DEFAULT_REGION ||
  process.env.AWS_REGION_ENV ||
  "us-east-1";
const stsClient = new STSClient({ region: AWS_REGION });
const s3Client = new S3Client({ region: AWS_REGION });

const S3_BUCKET = process.env.S3_BUCKET || "huskytrack-pdfs";

// Function to parse transcript data from PDF
async function parseTranscriptPDF(filePath) {
  try {
    // Mock transcript data for demonstration
    // In production, this would parse the actual PDF
    const mockTranscriptData = {
      studentId: "12345678",
      name: "Jane Doe",
      major: "Computer Science",
      gpa: "3.75",
      totalCredits: "120",
      courses: [
        { courseCode: "CSE 142", courseName: "Computer Programming I", credits: "5", grade: "A" },
        { courseCode: "CSE 143", courseName: "Computer Programming II", credits: "5", grade: "A-" },
        { courseCode: "CSE 311", courseName: "Foundations of Computing I", credits: "4", grade: "B+" },
        { courseCode: "CSE 312", courseName: "Foundations of Computing II", credits: "4", grade: "A" },
        { courseCode: "CSE 331", courseName: "Software Design and Implementation", credits: "4", grade: "A-" },
        { courseCode: "CSE 332", courseName: "Data Structures and Parallelism", credits: "4", grade: "B+" },
        { courseCode: "CSE 351", courseName: "Hardware/Software Interface", credits: "4", grade: "A" },
        { courseCode: "MATH 124", courseName: "Calculus I", credits: "5", grade: "B" },
        { courseCode: "MATH 125", courseName: "Calculus II", credits: "5", grade: "B+" },
        { courseCode: "PHYS 121", courseName: "Mechanics", credits: "5", grade: "A-" }
      ],
      rawText: "Mock transcript data - in production this would be the actual PDF text"
    };
    
    return mockTranscriptData;
  } catch (error) {
    console.error('Error parsing PDF:', error);
    return null;
  }
}

// Function to parse DARS (Degree Audit Report System) data from PDF
async function parseDARSPDF(filePath) {
  try {
    // Mock DARS data for demonstration
    // In production, this would parse the actual DARS PDF
    const mockDARSData = {
      studentId: "12345678",
      name: "Jane Doe",
      major: "Computer Science",
      degreeProgress: {
        totalCreditsRequired: 180,
        creditsCompleted: 95,
        creditsInProgress: 12,
        creditsRemaining: 73,
        progressPercentage: 53, // (95/180) * 100
        expectedGraduation: "Spring 2026"
      },
      requirements: {
        coreRequirements: {
          required: 60,
          completed: 45,
          remaining: 15,
          courses: [
            { code: "CSE 142", name: "Computer Programming I", status: "Completed", credits: 5 },
            { code: "CSE 143", name: "Computer Programming II", status: "Completed", credits: 5 },
            { code: "CSE 311", name: "Foundations of Computing I", status: "Completed", credits: 4 },
            { code: "CSE 312", name: "Foundations of Computing II", status: "Completed", credits: 4 },
            { code: "CSE 331", name: "Software Design and Implementation", status: "Completed", credits: 4 },
            { code: "CSE 332", name: "Data Structures and Parallelism", status: "Completed", credits: 4 },
            { code: "CSE 333", name: "Systems Programming", status: "In Progress", credits: 4 },
            { code: "CSE 341", name: "Algorithms", status: "Not Started", credits: 4 },
            { code: "CSE 344", name: "Distributed Systems", status: "Not Started", credits: 4 },
            { code: "CSE 351", name: "Hardware/Software Interface", status: "Completed", credits: 4 }
          ]
        },
        mathRequirements: {
          required: 20,
          completed: 15,
          remaining: 5,
          courses: [
            { code: "MATH 124", name: "Calculus I", status: "Completed", credits: 5 },
            { code: "MATH 125", name: "Calculus II", status: "Completed", credits: 5 },
            { code: "MATH 126", name: "Calculus III", status: "In Progress", credits: 5 },
            { code: "MATH 308", name: "Linear Algebra", status: "Not Started", credits: 5 }
          ]
        },
        scienceRequirements: {
          required: 15,
          completed: 10,
          remaining: 5,
          courses: [
            { code: "PHYS 121", name: "Mechanics", status: "Completed", credits: 5 },
            { code: "PHYS 122", name: "Electromagnetism", status: "In Progress", credits: 5 },
            { code: "CHEM 142", name: "General Chemistry", status: "Not Started", credits: 5 }
          ]
        },
        electives: {
          required: 30,
          completed: 15,
          remaining: 15,
          courses: [
            { code: "CSE 401", name: "Capstone Project", status: "Not Started", credits: 6 },
            { code: "CSE 402", name: "Software Engineering", status: "Not Started", credits: 4 },
            { code: "CSE 403", name: "Database Systems", status: "Not Started", credits: 4 }
          ]
        }
      },
      rawText: "Mock DARS data - in production this would be the actual DARS PDF text"
    };
    
    return mockDARSData;
  } catch (error) {
    console.error('Error parsing DARS PDF:', error);
    return null;
  }
}

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


// PDF upload endpoint
app.post("/upload/pdf", upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    const file = req.file;
    const s3Key = `pdfs/${Date.now()}-${file.originalname}`;

    // Parse transcript or DARS data based on file type
    let parsedData = null;
    if (file.originalname.toLowerCase().includes('transcript')) {
      parsedData = await parseTranscriptPDF(file.path);
    } else if (file.originalname.toLowerCase().includes('dars') || file.originalname.toLowerCase().includes('degree')) {
      parsedData = await parseDARSPDF(file.path);
    }

    // Upload to S3
    const uploadParams = {
      Bucket: S3_BUCKET,
      Key: s3Key,
      Body: fs.createReadStream(file.path),
      ContentType: 'application/pdf',
      Metadata: {
        originalName: file.originalname,
        uploadDate: new Date().toISOString(),
        parsedData: parsedData ? JSON.stringify(parsedData) : ''
      }
    };

    try {
      await s3Client.send(new PutObjectCommand(uploadParams));
      
      // Generate S3 URL
      const s3Url = `https://${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${s3Key}`;
      
      res.json({
        message: 'PDF uploaded successfully',
        filename: file.filename,
        originalName: file.originalname,
        fileSize: file.size,
        path: file.path,
        s3Url: s3Url,
        s3Key: s3Key,
        parsedData: parsedData
      });
    } catch (s3Error) {
      console.error('S3 upload error:', s3Error);
      // Still return success for local upload even if S3 fails
      res.json({
        message: 'PDF uploaded locally (S3 upload failed)',
        filename: file.filename,
        originalName: file.originalname,
        fileSize: file.size,
        path: file.path,
        error: s3Error.message,
        parsedData: parsedData
      });
    }
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload PDF' });
  }
});

// List PDFs endpoint
app.get("/pdfs", async (req, res) => {
  try {
    const uploadDir = 'uploads';
    if (!fs.existsSync(uploadDir)) {
      return res.json({ pdfs: [] });
    }

    const files = fs.readdirSync(uploadDir)
      .filter(file => file.toLowerCase().endsWith('.pdf'))
      .map(file => ({
        filename: file,
        path: path.join(uploadDir, file),
        url: `/uploads/${file}`
      }));

    res.json({ pdfs: files });
  } catch (error) {
    console.error('Error listing PDFs:', error);
    res.status(500).json({ error: 'Failed to list PDFs' });
  }
});

// Get specific PDF endpoint
app.get("/pdf/:filename", async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join('uploads', filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'PDF not found' });
    }

    res.json({
      message: `PDF ${filename} found`,
      filename: filename,
      path: filePath,
      url: `/uploads/${filename}`
    });
  } catch (error) {
    console.error('Error getting PDF:', error);
    res.status(500).json({ error: 'Failed to get PDF' });
  }
});

// Get transcript data endpoint
app.get("/transcript/:filename", async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join('uploads', filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'PDF not found' });
    }

    // Parse transcript data
    const transcriptData = await parseTranscriptPDF(filePath);
    
    if (!transcriptData) {
      return res.status(400).json({ error: 'Could not parse transcript data' });
    }

    res.json({
      message: `Transcript data for ${filename}`,
      filename: filename,
      transcriptData: transcriptData
    });
  } catch (error) {
    console.error('Error getting transcript data:', error);
    res.status(500).json({ error: 'Failed to get transcript data' });
  }
});

// Debug endpoint to see raw PDF text
app.get("/debug-pdf/:filename", async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join('uploads', filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'PDF not found' });
    }

    // Return mock data for demonstration
    res.json({
      message: `Mock PDF data for ${filename}`,
      filename: filename,
      text: "This is mock transcript data. In production, this would be the actual PDF text extracted from the uploaded file.",
      mockTranscriptData: await parseTranscriptPDF(filePath)
    });
  } catch (error) {
    console.error('Error getting PDF text:', error);
    res.status(500).json({ error: 'Failed to get PDF text' });
  }
});


// Start server after checking AWS credentials (best-effort)
(async () => {
  await checkAwsCredentials();
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
})();
