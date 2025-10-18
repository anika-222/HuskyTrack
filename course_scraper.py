#!/usr/bin/env python3
"""
UW CS Course Scraper
Extracts course information from the UW Computer Science courses page
and formats it into a structured table with course number, description, credits, and prerequisites.
"""

import requests
from bs4 import BeautifulSoup
import pandas as pd
import re
import json
from typing import List, Dict, Optional
import time

class UWCourseScraper:
    def __init__(self):
        self.base_url = "https://www.cs.washington.edu/academics/courses/"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        self.courses = []
    
    def fetch_page(self, url: str) -> BeautifulSoup:
        """Fetch and parse a web page"""
        try:
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            return BeautifulSoup(response.content, 'html.parser')
        except requests.RequestException as e:
            print(f"Error fetching page: {e}")
            return None
    
    def extract_course_number(self, text: str) -> Optional[str]:
        """Extract course number from text (e.g., 'CSE142 Computer Programming I')"""
        match = re.search(r'([A-Z]{2,4}\d{3}[A-Z]?)', text)
        return match.group(1) if match else None
    
    def extract_credits(self, text: str) -> Optional[int]:
        """Extract credit hours from text"""
        # Look for patterns like "3 credits", "4 credits", etc.
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
            num = int(re.search(r'\d+', course_num).group())
            if num < 200:
                return 3  # Lower division courses typically 3 credits
            elif num < 400:
                return 4  # Upper division courses typically 4 credits
            else:
                return 3  # Graduate courses vary, default to 3
        
        return None
    
    def extract_prerequisites(self, text: str) -> List[str]:
        """Extract prerequisites from course description"""
        prereqs = []
        
        # Look for prerequisite patterns
        prereq_patterns = [
            r'Prerequisite[s]?:\s*([^.]+)',
            r'Prereq[s]?:\s*([^.]+)',
            r'Required:\s*([^.]+)',
            r'Recommended:\s*([^.]+)'
        ]
        
        for pattern in prereq_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                # Split by common separators and clean up
                prereq_list = re.split(r'[,;]|\s+and\s+', match)
                prereqs.extend([p.strip() for p in prereq_list if p.strip()])
        
        # Extract course codes from prerequisites
        course_codes = []
        for prereq in prereqs:
            codes = re.findall(r'[A-Z]{2,4}\s*\d{3}[A-Z]?', prereq)
            course_codes.extend(codes)
        
        return list(set(course_codes))  # Remove duplicates
    
    def parse_course_section(self, section_element) -> List[Dict]:
        """Parse a course section (e.g., Undergraduate Major)"""
        courses = []
        
        # Find all course entries in this section
        course_elements = section_element.find_all(['li', 'div'], class_=lambda x: x and 'course' in x.lower() if x else False)
        
        if not course_elements:
            # Try to find course entries by looking for course number patterns
            text_content = section_element.get_text()
            course_blocks = re.split(r'\n\s*\n', text_content)
            
            for block in course_blocks:
                if re.search(r'[A-Z]{2,4}\d{3}[A-Z]?', block):
                    course_data = self.parse_course_text(block)
                    if course_data:
                        courses.append(course_data)
        else:
            for element in course_elements:
                course_data = self.parse_course_element(element)
                if course_data:
                    courses.append(course_data)
        
        return courses
    
    def parse_course_element(self, element) -> Optional[Dict]:
        """Parse a single course element"""
        text = element.get_text(strip=True)
        return self.parse_course_text(text)
    
    def parse_course_text(self, text: str) -> Optional[Dict]:
        """Parse course information from text"""
        course_number = self.extract_course_number(text)
        if not course_number:
            return None
        
        # Extract course title
        title_match = re.search(rf'{re.escape(course_number)}\s+(.+?)(?:\s+This|$)', text)
        course_title = title_match.group(1).strip() if title_match else ""
        
        # Extract description (everything after the title)
        description_start = text.find(course_title) + len(course_title)
        description = text[description_start:].strip()
        
        # Clean up description
        description = re.sub(r'\s+', ' ', description)
        
        # Extract credits
        credits = self.extract_credits(text)
        
        # Extract prerequisites
        prerequisites = self.extract_prerequisites(text)
        
        return {
            'course_number': course_number,
            'course_title': course_title,
            'description': description,
            'credits': credits,
            'prerequisites': prerequisites,
            'prerequisites_text': ', '.join(prerequisites) if prerequisites else ''
        }
    
    def scrape_courses(self) -> List[Dict]:
        """Main method to scrape all courses"""
        print("Fetching UW CS courses page...")
        soup = self.fetch_page(self.base_url)
        
        if not soup:
            print("Failed to fetch the page")
            return []
        
        print("Parsing course information...")
        
        # Find all course sections
        sections = soup.find_all(['h2', 'h3'], string=lambda text: text and any(keyword in text.lower() for keyword in ['course', 'major', 'minor', 'graduate']))
        
        all_courses = []
        
        for section in sections:
            section_name = section.get_text(strip=True)
            print(f"Processing section: {section_name}")
            
            # Find the content associated with this section
            section_content = section.find_next_sibling()
            if section_content:
                courses = self.parse_course_section(section_content)
                for course in courses:
                    course['section'] = section_name
                all_courses.extend(courses)
        
        # If we didn't find courses in sections, try to parse the entire page
        if not all_courses:
            print("No courses found in sections, parsing entire page...")
            page_text = soup.get_text()
            
            # Split by course patterns and parse each
            course_pattern = r'([A-Z]{2,4}\d{3}[A-Z]?\s+[^A-Z]+?)(?=[A-Z]{2,4}\d{3}[A-Z]?\s+[^A-Z]|$)'
            course_matches = re.findall(course_pattern, page_text, re.DOTALL)
            
            for match in course_matches:
                course_data = self.parse_course_text(match)
                if course_data:
                    all_courses.append(course_data)
        
        self.courses = all_courses
        print(f"Successfully extracted {len(all_courses)} courses")
        return all_courses
    
    def save_to_csv(self, filename: str = "uw_cs_courses.csv"):
        """Save courses to CSV file"""
        if not self.courses:
            print("No courses to save")
            return
        
        df = pd.DataFrame(self.courses)
        df.to_csv(filename, index=False)
        print(f"Saved {len(self.courses)} courses to {filename}")
    
    def save_to_json(self, filename: str = "uw_cs_courses.json"):
        """Save courses to JSON file"""
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
        
        print(f"\n=== Course Scraping Summary ===")
        print(f"Total courses found: {len(self.courses)}")
        
        # Group by course number prefix
        prefixes = {}
        for course in self.courses:
            prefix = course['course_number'][:3]
            prefixes[prefix] = prefixes.get(prefix, 0) + 1
        
        print(f"\nCourses by prefix:")
        for prefix, count in sorted(prefixes.items()):
            print(f"  {prefix}: {count} courses")
        
        # Show sample courses
        print(f"\nSample courses:")
        for i, course in enumerate(self.courses[:5]):
            print(f"  {i+1}. {course['course_number']}: {course['course_title']}")
            print(f"     Credits: {course['credits']}")
            print(f"     Prerequisites: {course['prerequisites_text'] or 'None'}")
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

