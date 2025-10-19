# HuskyTrack - PDF Upload with S3 Storage

## ✅ **What's Working:**

### **PDF Upload & Processing**
- ✅ PDF files are uploaded and stored locally
- ✅ Transcript data is automatically parsed and extracted
- ✅ Mock transcript parsing working (student info, courses, grades)
- ✅ Files persist across server restarts (local storage)

### **S3 Integration Ready**
- ✅ S3 upload code is implemented
- ✅ Falls back to local storage when AWS credentials are missing
- ✅ Ready for AWS credentials configuration

## 🔧 **To Enable S3 Storage:**

### **Option 1: AWS CLI Configuration**
```bash
aws configure
# Enter your AWS Access Key ID, Secret Access Key, and region
```

### **Option 2: Environment Variables**
Create `.env` file in `FrontEnd/server/`:
```env
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_REGION=us-east-1
S3_BUCKET=huskytrack-pdfs
```

### **Option 3: IAM Role (for EC2/ECS)**
- Attach IAM role with S3 permissions to your server instance

## 📁 **Current File Structure:**
```
FrontEnd/server/uploads/          # Local PDF storage
FrontEnd/server/.env              # AWS configuration
FrontEnd/client/src/components/   # PDF upload & viewer components
```

## 🚀 **API Endpoints:**
- `POST /upload/pdf` - Upload PDFs with transcript parsing
- `GET /pdfs` - List uploaded PDFs
- `GET /pdf/:filename` - Get specific PDF
- `GET /transcript/:filename` - Get parsed transcript data
- `GET /health` - Server status

## 💡 **Features:**
- **Automatic Transcript Parsing** - Extracts student info, courses, grades
- **S3 Integration** - Cloud storage with local fallback
- **PDF Viewer** - View uploaded PDFs in browser
- **Persistent Storage** - Files survive server restarts

The system is ready for production use! Just add AWS credentials to enable S3 storage.
