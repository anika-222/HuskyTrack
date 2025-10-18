#!/usr/bin/env python3
"""
UW CSE Course Scraper - Improved Prerequisites Version
Extracts only Computer Science courses (CSE prefix) with better prerequisite parsing
"""

import requests
from bs4 import BeautifulSoup
import pandas as pd
import re
import json
from typing import List, Dict, Optional

class UWCourseScraper:
    def __init__(self):
        self.base_url = "https://www.cs.washington.edu/academics/courses/"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        })
        self.courses = []
    
    def fetch_page(self, url: str) -> BeautifulSoup:
        """Fetch and parse a web page"""
        try:
            print(f"Fetching: {url}")
            response = self.session.get(url, timeout=15)
            response.raise_for_status()
            return BeautifulSoup(response.content, 'html.parser')
        except requests.RequestException as e:
            print(f"Error fetching page: {e}")
            return None
    
    def extract_course_number(self, text: str) -> Optional[str]:
        """Extract course number from text - only CSE courses"""
        match = re.search(r'(CSE\d{3}[A-Z]?)', text)
        return match.group(1) if match else None
    
    def extract_credits(self, text: str) -> Optional[int]:
        """Extract credit hours from text"""
        # Look for explicit credit mentions
        credit_patterns = [
            r'(\d+)\s*credits?',
            r'(\d+)\s*credit\s*hours?',
            r'(\d+)\s*units?'
        ]
        
        for pattern in credit_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return int(match.group(1))
        
        # Default credit values based on course level
        course_num = self.extract_course_number(text)
        if course_num:
            num_match = re.search(r'\d+', course_num)
            if num_match:
                num = int(num_match.group())
                if num < 200:
                    return 3  # Lower division courses typically 3 credits
                elif num < 400:
                    return 4  # Upper division courses typically 4 credits
                else:
                    return 3  # Graduate courses vary, default to 3
        
        return 4  # Default fallback
    
    def extract_prerequisites(self, text: str) -> List[str]:
        """Extract CSE prerequisites from course description"""
        prereqs = []
        
        # Look for prerequisite patterns - more comprehensive
        prereq_patterns = [
            r'Prerequisite[s]?:\s*([^.]+)',
            r'Prereq[s]?:\s*([^.]+)',
            r'Required:\s*([^.]+)',
            r'Must be taken with\s*([^.]+)',
            r'Cannot be taken for credit if credit received for\s*([^.]+)'
        ]
        
        for pattern in prereq_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                # Extract CSE course codes from the prerequisite text
                cse_codes = re.findall(r'CSE\s*\d{3}[A-Z]?', match)
                prereqs.extend(cse_codes)
        
        # Clean up and standardize format
        cleaned_prereqs = []
        for prereq in prereqs:
            # Remove extra spaces and standardize format
            cleaned = re.sub(r'\s+', '', prereq)  # Remove all spaces
            if cleaned not in cleaned_prereqs:  # Avoid duplicates
                cleaned_prereqs.append(cleaned)
        
        return sorted(cleaned_prereqs)  # Sort for consistency
    
    def parse_course_from_text(self, course_line: str, description_line: str) -> Optional[Dict]:
        """Parse course information from course line and description line"""
        # Extract course number
        course_number = self.extract_course_number(course_line)
        if not course_number:
            return None
        
        # Extract course title - everything after the course number
        title_match = re.search(rf'{re.escape(course_number)}\s+(.+)', course_line)
        course_title = title_match.group(1).strip() if title_match else ""
        
        # Clean up title
        course_title = re.sub(r'\s+', ' ', course_title).strip()
        
        # Clean up description
        description = re.sub(r'\s+', ' ', description_line).strip()
        
        # Extract credits
        credits = self.extract_credits(description)
        
        # Extract prerequisites
        prerequisites = self.extract_prerequisites(description)
        
        # Create prerequisites text for display
        prereqs_text = ', '.join(prerequisites) if prerequisites else ''
        
        return {
            'course_number': course_number,
            'course_title': course_title,
            'description': description,
            'credits': credits,
            'prerequisites': prerequisites,
            'prerequisites_text': prereqs_text
        }
    
    def scrape_courses(self) -> List[Dict]:
        """Main method to scrape all courses"""
        print("Fetching UW CS courses page...")
        soup = self.fetch_page(self.base_url)
        
        if not soup:
            print("Failed to fetch the page")
            return []
        
        print("Parsing course information...")
        
        # Get all text content
        page_text = soup.get_text()
        
        # Split into lines
        lines = page_text.split('\n')
        
        all_courses = []
        
        # Look for course patterns: course number followed by description
        for i, line in enumerate(lines):
            line = line.strip()
            
            # Check if this line contains a course number
            course_number = self.extract_course_number(line)
            if course_number and len(line) > len(course_number) + 5:  # Must have more than just the course number
                
                # Look for the description in the next few lines
                description = ""
                for j in range(i + 1, min(i + 5, len(lines))):
                    next_line = lines[j].strip()
                    if next_line and not self.extract_course_number(next_line):  # Not another course
                        description = next_line
                        break
                
                if description:
                    course_data = self.parse_course_from_text(line, description)
                    if course_data:
                        all_courses.append(course_data)
                        print(f"Parsed: {course_data['course_number']} - {course_data['course_title']}")
                        if course_data['prerequisites']:
                            print(f"  Prerequisites: {course_data['prerequisites_text']}")
        
        self.courses = all_courses
        print(f"Successfully extracted {len(all_courses)} courses")
        return all_courses
    
    def save_to_csv(self, filename: str = "cse_courses_improved.csv"):
        """Save CSE courses to CSV file with improved prerequisites column"""
        if not self.courses:
            print("No courses to save")
            return
        
        df = pd.DataFrame(self.courses)
        # Reorder columns for better readability
        column_order = ['course_number', 'course_title', 'credits', 'prerequisites', 'prerequisites_text', 'description']
        df = df[column_order]
        df.to_csv(filename, index=False)
        print(f"Saved {len(self.courses)} courses to {filename}")
    
    def save_to_json(self, filename: str = "cse_courses_improved.json"):
        """Save CSE courses to JSON file"""
        if not self.courses:
            print("No courses to save")
            return
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(self.courses, f, indent=2, ensure_ascii=False)
        print(f"Saved {len(self.courses)} courses to {filename}")
    
    def print_summary(self):
        """Print a summary of scraped courses"""
        if not self.courses:
            print("No courses found")
            return
        
        print(f"\n=== CSE Course Scraping Summary ===")
        print(f"Total CSE courses found: {len(self.courses)}")
        
        # Count courses with prerequisites
        courses_with_prereqs = sum(1 for course in self.courses if course['prerequisites'])
        print(f"Courses with prerequisites: {courses_with_prereqs}")
        print(f"Courses without prerequisites: {len(self.courses) - courses_with_prereqs}")
        
        # Group by course level
        levels = {'100': 0, '200': 0, '300': 0, '400': 0, '500+': 0}
        for course in self.courses:
            course_num = course['course_number']
            num_match = re.search(r'\d+', course_num)
            if num_match:
                num = int(num_match.group())
                if num < 200:
                    levels['100'] += 1
                elif num < 300:
                    levels['200'] += 1
                elif num < 400:
                    levels['300'] += 1
                elif num < 500:
                    levels['400'] += 1
                else:
                    levels['500+'] += 1
        
        print(f"\nCSE courses by level:")
        for level, count in levels.items():
            if count > 0:
                print(f"  {level}-level: {count} courses")
        
        # Show sample courses with prerequisites
        print(f"\nSample courses with prerequisites:")
        prereq_courses = [course for course in self.courses if course['prerequisites']]
        for i, course in enumerate(prereq_courses[:10]):
            print(f"  {i+1}. {course['course_number']}: {course['course_title']}")
            print(f"     Prerequisites: {course['prerequisites_text']}")
            print()

def main():
    """Main function to run the scraper"""
    scraper = UWCourseScraper()
    
    try:
        courses = scraper.scrape_courses()
        
        if courses:
            scraper.print_summary()
            scraper.save_to_csv()
            scraper.save_to_json()
        else:
            print("No courses were extracted. Please check the website structure.")
    
    except Exception as e:
        print(f"An error occurred: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()

