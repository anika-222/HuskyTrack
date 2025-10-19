import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

// Configuration
const REGION_NAME = "us-west-2";
const MODEL_ID = "anthropic.claude-3-5-haiku-20241022-v1:0";
const ANTHROPIC_API_VERSION = "bedrock-2023-05-31";
const S3_BUCKET_NAME = "uw-course-data-husky-track";
const S3_FILE_KEY = "datasets/course_information.csv";

// Initialize clients
const bedrockClient = new BedrockRuntimeClient({ region: REGION_NAME });
const s3 = new S3Client({ region: REGION_NAME });

async function readS3Text(bucket, key) {
  try {
    console.log(`Retrieving content from s3://${bucket}/${key}`);
    const cmd = new GetObjectCommand({ Bucket: bucket, Key: key });
    const resp = await s3.send(cmd);
    const stream = resp.Body;
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    return Buffer.concat(chunks).toString("utf8");
  } catch (error) {
    console.error("Error reading S3 file:", error);
    throw new Error(`Could not retrieve context: ${error.message}`);
  }
}

async function parseCSV(text) {
  // Simple CSV parser that handles quoted fields
  const rows = text.split("\n").map((line) => {
    let fields = [];
    let field = "";
    let inQuotes = false;

    for (let char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        fields.push(field.trim());
        field = "";
      } else {
        field += char;
      }
    }
    fields.push(field.trim());
    return fields;
  });

  const headers = rows[0];
  const data = rows.slice(1).map((row) => {
    const obj = {};
    headers.forEach((header, i) => {
      obj[header] = row[i];
    });
    return obj;
  });

  return { headers, data };
}

async function fetchCourseData() {
  try {
    // Read course data from S3
    const courseData = await readS3Text(
      process.env.COURSES_BUCKET || "huskytrack-data",
      "courses.csv"
    );
    const prereqsData = await readS3Text(
      process.env.COURSES_BUCKET || "huskytrack-data",
      "prerequisites.csv"
    );

    // Parse CSVs into structured data
    const courses = await parseCSV(courseData);
    const prereqs = await parseCSV(prereqsData);

    return {
      courses: courses.data,
      prerequisites: prereqs.data,
    };
  } catch (error) {
    console.error("Error fetching course data:", error);
    return null;
  }
}

export async function handler(event) {
  try {
    // Parse the event body to get the prompt and user data
    let body;
    try {
      body =
        typeof event.body === "string" ? JSON.parse(event.body) : event.body;
    } catch (e) {
      console.error("Error parsing event body:", e);
      throw new Error("Invalid request body format");
    }

    const prompt = body.prompt;
    if (!prompt) {
      throw new Error("No prompt provided in request");
    }

    // Fetch course data from S3
    const courseData = await readS3Text(S3_BUCKET_NAME, S3_FILE_KEY);
    if (!courseData) {
      throw new Error("Failed to fetch course data from S3");
    }

    // Parse the course data
    const parsedCourseData = await parseCSV(courseData);
    if (!parsedCourseData) {
      throw new Error("Failed to parse course data");
    }

    // Use default values if user profile is not provided
    const currentCourses = body.currentCourses || [];
    const completedCourses = body.completedCourses || [];

    // Structure context for the prompt
    const courseContext = {
      availableCourses: parsedCourseData.data,
      studentContext: {
        major: user.degree,
        currentCourses,
        completedCourses,
        expectedGraduation: user.expectedGraduation,
      },
    };

    // Format courses for better readability
    const formatCourses = (courses) =>
      courses
        .map(
          (c) =>
            `${c.course_code}: ${c.course_name} (${c.credits} credits) - ${c.description}`
        )
        .join("\n");

    // Format prerequisites more clearly
    const formatPrereqs = (prereqs) =>
      prereqs
        .map(
          (p) =>
            `${p.course_code} requires: ${p.prerequisite_code} (${p.prerequisite_name})`
        )
        .join("\n");

    // Get the last message from the conversation as the prompt
    const userPrompt =
      messages[messages.length - 1]?.text ||
      "What courses would you recommend?";

    const contextPrompt = `You are an academic advisor assistant named HuskyBot for University of Washington's Computer Science program.

STUDENT PROFILE:
- Major: ${courseContext.studentContext.major}
- Expected Graduation: ${courseContext.studentContext.expectedGraduation}
- Current Courses: ${currentCourses.join(", ")}
- Completed Courses: ${completedCourses.join(", ")}

AVAILABLE COURSES:
${formatCourses(courseContext.availableCourses)}

RECENT CONVERSATION:
${messages.map((m) => `${m.sender}: ${m.text}`).join("\n")}

1. Academic Progress Analysis:
   - Review completed courses and verify prerequisites
   - Consider the student's academic level and progression
   - Ensure alignment with graduation timeline
   - Factor in current course load and balance

2. Personalization Factors:
   - Consider any specific interests or career goals mentioned in the conversation
   - Look for course synergies with current classes
   - Balance core requirements with electives
   - Consider course difficulty and workload distribution

3. Response Format:
Respond in a conversational yet professional tone. Structure your response as follows:

{
  "conversation": "Brief, friendly response addressing the student's question or concerns",
  "recommendations": [
    {
      "course": "Course code and full name",
      "credits": "Number of credits",
      "description": "Brief course description",
      "prerequisites_met": true/false,
      "reasoning": "Detailed explanation of why this course is recommended",
      "timing": "Suggested semester to take this course"
    }
  ],
  "additional_notes": "Any important considerations or alternative suggestions"
}

Provide recommendations in this JSON format:
{
  "recommendations": [
    {
      "course": "course code and name",
      "reason": "detailed justification including prerequisites and fit"
    }
  ]
}`;

    // Format course data for better readability
    const formatCourseData = (courses) => {
      return courses.map((course) => ({
        code: course.course_number || course.code,
        name: course.course_name || course.name,
        description: course.description || "",
        prerequisites: course.prerequisites || [],
      }));
    };

    // Construct the system prompt and messages
    const systemPrompt = `You are HuskyBot, an expert academic advisor for University of Washington's Computer Science program.
Your goal is to provide personalized course recommendations based on the student's profile and course history.

ROLE AND GOAL:
- Analyze the student's academic profile and course history
- Recommend suitable courses based on their progress and interests
- Consider prerequisites and course sequencing
- Provide clear explanations for your recommendations

STUDENT PROFILE:
${JSON.stringify(courseContext.studentContext, null, 2)}

AVAILABLE COURSES:
${JSON.stringify(
  formatCourseData(courseContext.availableCourses.slice(0, 15)),
  null,
  2
)}

YOUR RESPONSE SHOULD:
1. Greet the student professionally
2. Consider their current courses and completed prerequisites
3. Recommend 2-3 specific courses with clear explanations
4. Consider course difficulty and workload balance
5. End with a brief note about registration or next steps

Format your response in a clear, conversational style. Avoid technical jargon unless necessary.`;

    // Invoke Claude via Bedrock
    const response = await bedrockClient.send(
      new InvokeModelCommand({
        modelId: MODEL_ID,
        contentType: "application/json",
        accept: "application/json",
        body: JSON.stringify({
          anthropic_version: ANTHROPIC_API_VERSION,
          messages: [
            {
              role: "system",
              content: [
                {
                  type: "text",
                  text: systemPrompt,
                },
              ],
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `
Course Data:
${JSON.stringify(parsedCourseData.data.slice(0, 15), null, 2)}

Current Courses: ${currentCourses.join(", ")}
Completed Courses: ${completedCourses.join(", ")}

User Question: ${prompt}`,
                },
              ],
            },
          ],
          max_tokens: 1024,
          temperature: 0.3,
          top_p: 1,
          stop_sequences: [],
          stream: false,
        }),
      })
    );

    const responseBody = new TextDecoder().decode(response.body);
    const responseJson = JSON.parse(responseBody);

    // Extract the generated text from Claude's response
    const generatedText =
      responseJson.content?.[0]?.text || responseJson.completion;

    if (!generatedText) {
      throw new Error("No response generated from Claude");
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        prompt: userPrompt,
        generated_text: generatedText,
        context_source: `s3://${S3_BUCKET_NAME}/${S3_FILE_KEY}`,
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (err) {
    console.error("lambda error", err);
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) };
  }
}
