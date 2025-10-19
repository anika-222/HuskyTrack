import json
import boto3
from typing import Dict, List, Any

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    HuskyTrack Chat Agent Lambda Function
    
    Handles chat messages with transcript data for course recommendations
    """
    
    try:
        # Extract data from event
        message = event.get('message', '')
        transcript_data = event.get('transcriptData')
        context_info = event.get('context', {})
        
        # Check if we have transcript data
        has_transcript = context_info.get('hasTranscript', False)
        student_info = context_info.get('studentInfo', {})
        
        # Generate response based on whether transcript data is available
        if has_transcript and transcript_data:
            response = generate_transcript_based_response(message, transcript_data, student_info)
        else:
            response = generate_general_response(message)
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'response': response,
                'hasTranscript': has_transcript,
                'studentInfo': student_info
            })
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': str(e),
                'response': 'Sorry, I encountered an error processing your request.'
            })
        }

def generate_transcript_based_response(message: str, transcript_data: Dict, student_info: Dict) -> str:
    """Generate response based on transcript data"""
    
    # Extract key information
    courses = transcript_data.get('courses', [])
    gpa = transcript_data.get('gpa', 'N/A')
    major = transcript_data.get('major', 'Computer Science')
    total_credits = transcript_data.get('totalCredits', '0')
    
    # Analyze completed courses
    completed_cse_courses = [c for c in courses if c['courseCode'].startswith('CSE')]
    completed_math_courses = [c for c in courses if c['courseCode'].startswith('MATH')]
    
    # Course recommendation logic
    recommendations = []
    
    # Check for missing core CSE courses
    core_courses = {
        'CSE 333': ['CSE 143', 'CSE 311'],
        'CSE 341': ['CSE 143', 'CSE 311'],
        'CSE 344': ['CSE 143', 'CSE 311'],
        'CSE 351': ['CSE 143', 'CSE 311'],
        'CSE 401': ['CSE 331', 'CSE 332'],
        'CSE 402': ['CSE 331', 'CSE 332']
    }
    
    completed_codes = [c['courseCode'] for c in completed_cse_courses]
    
    for course, prereqs in core_courses.items():
        if course not in completed_codes:
            if all(prereq in completed_codes for prereq in prereqs):
                recommendations.append(course)
    
    # Generate response
    if 'course' in message.lower() or 'recommend' in message.lower() or 'next' in message.lower():
        if recommendations:
            response = f"""Based on your transcript analysis:

**Your Progress:**
- Major: {major}
- GPA: {gpa}
- Total Credits: {total_credits}
- Completed CSE Courses: {len(completed_cse_courses)}

**Recommended Next Courses:**
{chr(10).join([f"• {course}" for course in recommendations[:5]])}

**Why these courses?**
These courses build on your completed prerequisites and are essential for your Computer Science degree. Focus on CSE 333 (Systems Programming) and CSE 341 (Algorithms) as they're foundational for upper-level courses.

**Additional Suggestions:**
- Consider taking MATH 126 (Calculus III) if you haven't already
- Look into CSE 351 (Hardware/Software Interface) for systems knowledge
- Plan for CSE 401 (Capstone) in your senior year

Would you like more specific advice about any of these courses?"""
        else:
            response = f"""Based on your transcript, you've completed {len(completed_cse_courses)} CSE courses. 

**Your Progress:**
- Major: {major}
- GPA: {gpa}
- Total Credits: {total_credits}

**Next Steps:**
You may need to complete more prerequisites before taking advanced courses. Consider:
• CSE 311 (Foundations of Computing I) - if not completed
• CSE 312 (Foundations of Computing II) - if not completed
• MATH 124/125 (Calculus I/II) - if not completed

Would you like me to analyze your specific course history in more detail?"""
    
    elif 'gpa' in message.lower() or 'grade' in message.lower():
        response = f"""Your current GPA is {gpa} with {total_credits} total credits completed.

**Grade Analysis:**
{chr(10).join([f"• {c['courseCode']}: {c['grade']}" for c in courses[-5:]])}

**Academic Standing:**
Your GPA indicates {'strong' if float(gpa) >= 3.5 else 'good' if float(gpa) >= 3.0 else 'needs improvement'} academic performance.

**Recommendations:**
- Focus on maintaining or improving your GPA
- Consider retaking courses with grades below B- if needed
- Meet with your academic advisor to discuss your progress

Would you like specific advice about improving your grades or course selection?"""
    
    else:
        response = f"""I can see your transcript data! You're a {major} major with a {gpa} GPA and {total_credits} credits completed.

**Completed Courses:** {len(courses)} total
**CSE Courses:** {len(completed_cse_courses)}
**Math Courses:** {len(completed_math_courses)}

I can help you with:
• Course recommendations for next quarter
• Degree planning and requirements
• GPA analysis and improvement strategies
• Prerequisite checking

What would you like to know about your academic progress?"""
    
    return response

def generate_general_response(message: str) -> str:
    """Generate general response when no transcript data is available"""
    
    if 'course' in message.lower() or 'recommend' in message.lower():
        return """I'd be happy to help with course recommendations! 

To provide the most accurate advice, please upload your transcript PDF first. This will allow me to:
• Analyze your completed courses and grades
• Check prerequisites for recommended courses
• Suggest courses that fit your degree plan
• Consider your academic standing

Once you upload your transcript, I can give you personalized course recommendations based on your academic history."""
    
    elif 'transcript' in message.lower() or 'upload' in message.lower():
        return """To get started with personalized course recommendations:

1. **Upload your transcript PDF** using the upload feature
2. **Ask me questions** about your courses, GPA, or degree plan
3. **Get personalized advice** based on your academic history

I can help you with:
• Course recommendations for next quarter
• Degree planning and requirements
• Prerequisite checking
• Academic progress analysis

Upload your transcript and let's get started!"""
    
    else:
        return """Hello! I'm your HuskyTrack academic advisor. I can help you with:

• **Course Recommendations** - Based on your transcript and degree plan
• **Degree Planning** - Track your progress toward graduation
• **Prerequisite Checking** - Ensure you meet course requirements
• **Academic Advice** - GPA analysis and improvement strategies

To get started, upload your transcript PDF and ask me any questions about your academic journey!

What would you like to know?"""
