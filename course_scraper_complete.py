#!/usr/bin/env python3
"""
UW CSE Course Scraper - Complete Version
Extracts ALL prerequisites (not just CSE) and distinguishes prerequisites from exclusions
Also categorizes courses by level and audience
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
    
    def extract_course_title(self, course_line: str, course_number: str) -> str:
        """Extract course title from course line"""
        # Remove course number and get the rest as title
        title = course_line.replace(course_number, '').strip()
        return title
    
    def determine_course_category(self, course_number: str, description: str) -> str:
        """Determine course category based on course number and description"""
        num_match = re.search(r'\d+', course_number)
        if not num_match:
            return "Unknown"
        
        num = int(num_match.group())
        
        # Check description for specific indicators
        desc_lower = description.lower()
        
        if "for non-cse majors" in desc_lower or "for non-major" in desc_lower:
            return "Non-Major"
        elif "graduate" in desc_lower or "ph.d" in desc_lower:
            return "Graduate"
        elif num >= 500:
            return "Graduate"
        elif num >= 400:
            return "Undergraduate Major"
        elif num >= 300:
            return "Undergraduate Major"
        elif num >= 200:
            return "Undergraduate Major"
        else:
            return "Introductory"
    
    def extract_prerequisites_and_exclusions(self, description_text: str) -> tuple:
        """Extract prerequisites and exclusions from the full description text"""
        prerequisites = ""
        exclusions = ""
        
        # Look for prerequisite patterns
        prereq_patterns = [
            r'Prerequisite[s]?:\s*([^.]+)',
            r'Prereq[s]?:\s*([^.]+)',
            r'Required:\s*([^.]+)',
            r'Must be taken with\s*([^.]+)'
        ]
        
        for pattern in prereq_patterns:
            match = re.search(pattern, description_text, re.IGNORECASE)
            if match:
                prerequisites = match.group(1).strip()
                break
        
        # Look for exclusion patterns
        exclusion_patterns = [
            r'Cannot be taken for credit if credit received for\s*([^.]+)',
            r'No credit if\s*([^.]+)',
            r'Cannot be taken for credit if\s*([^.]+)'
        ]
        
        for pattern in exclusion_patterns:
            match = re.search(pattern, description_text, re.IGNORECASE)
            if match:
                exclusions = match.group(1).strip()
                break
        
        # Extract description (everything before prerequisites/exclusions)
        prereq_start = description_text.find("Prerequisite") if "Prerequisite" in description_text else len(description_text)
        exclusion_start = description_text.find("Cannot be taken") if "Cannot be taken" in description_text else len(description_text)
        
        desc_end = min(prereq_start, exclusion_start)
        description = description_text[:desc_end].strip()
        
        return description, prerequisites, exclusions
    
    def parse_course_from_text(self, course_line: str, description_line: str) -> Optional[Dict]:
        """Parse course information from course line and description line"""
        # Extract course number
        course_number = self.extract_course_number(course_line)
        if not course_number:
            return None
        
        # Extract course title
        course_title = self.extract_course_title(course_line, course_number)
        
        # Extract description, prerequisites, and exclusions
        description, prerequisites, exclusions = self.extract_prerequisites_and_exclusions(description_line)
        
        # Determine course category
        category = self.determine_course_category(course_number, description_line)
        
        return {
            'course_number': course_number,
            'course_title': course_title,
            'description': description,
            'prerequisites': prerequisites,
            'exclusions': exclusions,
            'category': category
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
                            print(f"  Prerequisites: {course_data['prerequisites']}")
                        if course_data['exclusions']:
                            print(f"  Exclusions: {course_data['exclusions']}")
        
        self.courses = all_courses
        print(f"Successfully extracted {len(all_courses)} courses")
        return all_courses
    
    def save_to_csv(self, filename: str = "course_information_complete.csv"):
        """Save CSE courses to CSV file with complete information"""
        if not self.courses:
            print("No courses to save")
            return
        
        df = pd.DataFrame(self.courses)
        # Reorder columns to match user's request
        column_order = ['course_number', 'course_title', 'description', 'prerequisites', 'exclusions', 'category']
        df = df[column_order]
        df.to_csv(filename, index=False)
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
        courses_with_exclusions = sum(1 for course in self.courses if course['exclusions'])
        
        print(f"Courses with prerequisites: {courses_with_prereqs}")
        print(f"Courses with exclusions: {courses_with_exclusions}")
        
        # Group by category
        categories = {}
        for course in self.courses:
            cat = course['category']
            categories[cat] = categories.get(cat, 0) + 1
        
        print(f"\nCourses by category:")
        for category, count in sorted(categories.items()):
            print(f"  {category}: {count} courses")
        
        # Show sample courses
        print(f"\nSample courses:")
        for i, course in enumerate(self.courses[:10]):
            print(f"{i+1}. {course['course_number']}: {course['course_title']} ({course['category']})")
            print(f"   Description: {course['description'][:100]}...")
            print(f"   Prerequisites: {course['prerequisites'] or 'None'}")
            print(f"   Exclusions: {course['exclusions'] or 'None'}")
            print()

def main():
    """Main function to run the scraper"""
    scraper = UWCourseScraper()
    
    try:
        courses = scraper.scrape_courses()
        
        if courses:
            scraper.print_summary()
            scraper.save_to_csv()
        else:
            print("No courses were extracted. Please check the website structure.")
    
    except Exception as e:
        print(f"An error occurred: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
