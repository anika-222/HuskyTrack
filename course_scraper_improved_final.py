#!/usr/bin/env python3
"""
UW CSE Course Scraper - Final Improved Version
Fixes column naming and extracts specific courses from grade requirements
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
    
    def extract_courses_from_grade_requirement(self, text: str) -> str:
        """Extract specific courses from grade requirements like 'minimum grade of 2.0 in either CSE 123 or CSE 143'"""
        # Look for patterns like "minimum grade of X in either A, B, or C"
        grade_patterns = [
            r'minimum grade of [\d.]+ in either ([^.]+)',
            r'minimum grade of [\d.]+ in ([^.]+)',
            r'grade of [\d.]+ in either ([^.]+)',
            r'grade of [\d.]+ in ([^.]+)'
        ]
        
        for pattern in grade_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                courses_text = match.group(1).strip()
                # Clean up the courses text and add "either" prefix
                courses_text = re.sub(r'\s+', ' ', courses_text)
                return f"either {courses_text}"
        
        # If no specific courses found, return the original text
        return text
    
    def extract_prerequisites_and_conflicts(self, description_text: str) -> tuple:
        """Extract prerequisites, simultaneous prerequisites, and credit conflicts from the full description text"""
        prerequisites = ""
        simultaneous_prereqs = ""
        credit_conflicts = ""
        
        # Look for prerequisite patterns - capture everything after "Prerequisite:" until end of sentence
        prereq_patterns = [
            r'Prerequisite[s]?:\s*([^.]*(?:\.[^.]*)*\.)',
            r'Prereq[s]?:\s*([^.]*(?:\.[^.]*)*\.)',
            r'Required:\s*([^.]*(?:\.[^.]*)*\.)'
        ]
        
        for pattern in prereq_patterns:
            match = re.search(pattern, description_text, re.IGNORECASE)
            if match:
                prereq_text = match.group(1).strip()
                # Extract specific courses from grade requirements
                prerequisites = self.extract_courses_from_grade_requirement(prereq_text)
                break
        
        # Look for simultaneous prerequisite patterns
        simultaneous_patterns = [
            r'Must be taken with\s*([^.]+)',
            r'Taken with\s*([^.]+)',
            r'Concurrent with\s*([^.]+)'
        ]
        
        for pattern in simultaneous_patterns:
            match = re.search(pattern, description_text, re.IGNORECASE)
            if match:
                simultaneous_prereqs = f"{match.group(1).strip()} (taken simultaneously)"
                break
        
        # Look for credit conflict patterns
        conflict_patterns = [
            r'Cannot be taken for credit if credit received for\s*([^.]+)',
            r'No credit if\s*([^.]+)',
            r'Cannot be taken for credit if\s*([^.]+)',
            r'No credit to students who have taken\s*([^.]+)',
            r'No credit to students who have completed\s*([^.]+)'
        ]
        
        for pattern in conflict_patterns:
            match = re.search(pattern, description_text, re.IGNORECASE)
            if match:
                credit_conflicts = match.group(1).strip()
                break
        
        # Clean description - remove prerequisite/conflict text
        clean_description = description_text
        
        # Remove prerequisite text
        for pattern in prereq_patterns:
            clean_description = re.sub(pattern, '', clean_description, flags=re.IGNORECASE)
        
        # Remove simultaneous prerequisite text
        for pattern in simultaneous_patterns:
            clean_description = re.sub(pattern, '', clean_description, flags=re.IGNORECASE)
        
        # Remove credit conflict text
        for pattern in conflict_patterns:
            clean_description = re.sub(pattern, '', clean_description, flags=re.IGNORECASE)
        
        # Clean up extra whitespace and punctuation
        clean_description = re.sub(r'\s+', ' ', clean_description)
        clean_description = re.sub(r'\s*\.\s*$', '', clean_description)
        clean_description = clean_description.strip()
        
        return clean_description, prerequisites, simultaneous_prereqs, credit_conflicts
    
    def parse_course_from_text(self, course_line: str, description_line: str) -> Optional[Dict]:
        """Parse course information from course line and description line"""
        # Extract course number
        course_number = self.extract_course_number(course_line)
        if not course_number:
            return None
        
        # Extract course title
        course_title = self.extract_course_title(course_line, course_number)
        
        # Extract description, prerequisites, simultaneous prereqs, and credit conflicts
        description, prerequisites, simultaneous_prereqs, credit_conflicts = self.extract_prerequisites_and_conflicts(description_line)
        
        # Determine course category
        category = self.determine_course_category(course_number, description_line)
        
        return {
            'course_number': course_number,
            'course_title': course_title,
            'description': description,
            'prerequisites': prerequisites,
            'simultaneous_prerequisites': simultaneous_prereqs,
            'credit_conflicts': credit_conflicts,
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
                        if course_data['simultaneous_prerequisites']:
                            print(f"  Simultaneous: {course_data['simultaneous_prerequisites']}")
                        if course_data['credit_conflicts']:
                            print(f"  Credit Conflicts: {course_data['credit_conflicts']}")
        
        self.courses = all_courses
        print(f"Successfully extracted {len(all_courses)} courses")
        return all_courses
    
    def save_to_csv(self, filename: str = "course_information_final.csv"):
        """Save CSE courses to CSV file with improved naming and course extraction"""
        if not self.courses:
            print("No courses to save")
            return
        
        df = pd.DataFrame(self.courses)
        # Reorder columns with improved naming
        column_order = ['course_number', 'course_title', 'description', 'prerequisites', 'simultaneous_prerequisites', 'credit_conflicts', 'category']
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
        
        # Count courses with different types of requirements
        courses_with_prereqs = sum(1 for course in self.courses if course['prerequisites'])
        courses_with_simultaneous = sum(1 for course in self.courses if course['simultaneous_prerequisites'])
        courses_with_conflicts = sum(1 for course in self.courses if course['credit_conflicts'])
        
        print(f"Courses with prerequisites: {courses_with_prereqs}")
        print(f"Courses with simultaneous prerequisites: {courses_with_simultaneous}")
        print(f"Courses with credit conflicts: {courses_with_conflicts}")
        
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
            print(f"   Simultaneous: {course['simultaneous_prerequisites'] or 'None'}")
            print(f"   Credit Conflicts: {course['credit_conflicts'] or 'None'}")
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
