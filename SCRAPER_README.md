# UW CS Course Scraper

A Python web scraper designed to extract course information from the University of Washington Computer Science courses page and format it into structured data for course planning AI agents.

## Features

- Extracts course number, title, description, credits, and prerequisites
- Outputs data in both CSV and JSON formats
- Handles various course formats (CSE, CSEP, CSED, etc.)
- Automatically infers credit hours when not explicitly stated
- Parses prerequisite course codes

## Installation

1. Install required dependencies:
```bash
pip install -r requirements.txt
```

## Usage

### Basic Usage

Run the main scraper:
```bash
python course_scraper_improved.py
```

Or run the test script:
```bash
python test_scraper.py
```

### Output Files

The scraper generates two output files:
- `uw_cs_courses.csv` - Course data in CSV format
- `uw_cs_courses.json` - Course data in JSON format

### CSV Format

The CSV file contains the following columns:
- `course_number` - Course identifier (e.g., CSE142)
- `course_title` - Course name
- `credits` - Number of credit hours
- `prerequisites_text` - Prerequisite courses (comma-separated)
- `description` - Course description

### JSON Format

The JSON file contains an array of course objects with the following structure:
```json
{
  "course_number": "CSE142",
  "course_title": "Computer Programming I",
  "description": "Basic programming-in-the-small abilities...",
  "credits": 4,
  "prerequisites": ["CSE121"],
  "prerequisites_text": "CSE121"
}
```

## Course Data Structure

Each course entry includes:

- **Course Number**: Unique identifier (e.g., CSE142, CSEP546)
- **Course Title**: Full course name
- **Description**: Detailed course description
- **Credits**: Credit hours (automatically inferred if not specified)
- **Prerequisites**: List of prerequisite course codes
- **Prerequisites Text**: Human-readable prerequisite information

## Example Output

```
=== Course Scraping Summary ===
Total courses found: 45

Courses by prefix:
  CSE: 35 courses
  CSEP: 8 courses
  CSED: 2 courses

Sample courses:
  1. CSE142: Computer Programming I
     Credits: 4
     Prerequisites: None
     Description: Basic programming-in-the-small abilities and concepts...

  2. CSE143: Computer Programming II
     Credits: 4
     Prerequisites: CSE142
     Description: Continuation of CSE 142. Concepts of data abstraction...
```

## Notes

- The scraper respects website terms of service
- Uses appropriate delays and user-agent headers
- Handles various course numbering schemes
- Automatically infers credit hours based on course level
- Extracts prerequisite course codes for dependency mapping

## Troubleshooting

If the scraper fails to extract courses:

1. Check your internet connection
2. Verify the UW CS courses page is accessible
3. The website structure may have changed - check the HTML structure
4. Run with verbose output to see detailed parsing information

## Contributing

Feel free to improve the scraper by:
- Adding support for additional course formats
- Improving prerequisite parsing
- Adding more robust error handling
- Enhancing credit hour inference logic

