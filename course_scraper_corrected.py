#!/usr/bin/env python3
"""
UW CSE Course Scraper - Corrected Version
Extracts course data in the exact format requested by the user
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
    
    def extract_description_and_prerequisites(self, description_text: str) -> tuple:
        """Extract description and prerequisites from the full description text"""
        # Look for "Prerequisite:" pattern
        prereq_match = re.search(r'Prerequisite[s]?:\s*(.+)', description_text, re.IGNORECASE)
        
        if prereq_match:
            # Split at the prerequisite marker
            prereq_start = prereq_match.start()
            description = description_text[:prereq_start].strip()
            prerequisites = prereq_match.group(1).strip()
        else:
            description = description_text.strip()
            prerequisites = ""
        
        return description, prerequisites
    
    def parse_course_from_text(self, course_line: str, description_line: str) -> Optional[Dict]:
        """Parse course information from course line and description line"""
        # Extract course number
        course_number = self.extract_course_number(course_line)
        if not course_number:
            return None
        
        # Extract course title
        course_title = self.extract_course_title(course_line, course_number)
        
        # Extract description and prerequisites
        description, prerequisites = self.extract_description_and_prerequisites(description_line)
        
        return {
            'course_number': course_number,
            'course_title': course_title,
            'description': description,
            'prerequisites': prerequisites
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
        
        self.courses = all_courses
        print(f"Successfully extracted {len(all_courses)} courses")
        return all_courses
    
    def save_to_csv(self, filename: str = "cse_courses_corrected.csv"):
        """Save CSE courses to CSV file in the exact format requested"""
        if not self.courses:
            print("No courses to save")
            return
        
        df = pd.DataFrame(self.courses)
        # Reorder columns to match user's request
        column_order = ['course_number', 'course_title', 'description', 'prerequisites']
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
        print(f"Courses with prerequisites: {courses_with_prereqs}")
        print(f"Courses without prerequisites: {len(self.courses) - courses_with_prereqs}")
        
        # Show sample courses
        print(f"\nSample courses:")
        for i, course in enumerate(self.courses[:10]):
            print(f"{i+1}. {course['course_number']}: {course['course_title']}")
            print(f"   Description: {course['description'][:100]}...")
            print(f"   Prerequisites: {course['prerequisites'] or 'None'}")
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
