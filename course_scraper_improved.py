#!/usr/bin/env python3
"""
UW CS Course Scraper - Improved Version
Specifically designed to extract course information from the UW CS courses page
with better handling of the page structure and course data formatting.
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
        """Extract course number from text (e.g., 'CSE142 Computer Programming I')"""
        # Look for patterns like CSE142, CSE143X, CSEP546, etc.
        match = re.search(r'([A-Z]{2,4}\d{3}[A-Z]?)', text)
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
    
    def parse_course_entry(self, text: str) -> Optional[Dict]:
        """Parse a single course entry from text"""
        # Extract course number
        course_number = self.extract_course_number(text)
        if not course_number:
            return None
        
        # Extract course title - look for text after course number
        title_pattern = rf'{re.escape(course_number)}\s+([^A-Z]+?)(?:\s+[A-Z]|$)'
        title_match = re.search(title_pattern, text)
        course_title = title_match.group(1).strip() if title_match else ""
        
        # Clean up title
        course_title = re.sub(r'\s+', ' ', course_title).strip()
        
        # Extract description - everything after the title
        if course_title:
            desc_start = text.find(course_title) + len(course_title)
            description = text[desc_start:].strip()
        else:
            # If no clear title, take everything after course number
            desc_start = text.find(course_number) + len(course_number)
            description = text[desc_start:].strip()
        
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
        
        # Get all text content
        page_text = soup.get_text()
        
        # Split the text into sections based on course patterns
        # Look for course entries that start with course numbers
        course_pattern = r'([A-Z]{2,4}\d{3}[A-Z]?\s+[^A-Z]+?)(?=[A-Z]{2,4}\d{3}[A-Z]?\s+[^A-Z]|$)'
        course_matches = re.findall(course_pattern, page_text, re.DOTALL)
        
        print(f"Found {len(course_matches)} potential course entries")
        
        all_courses = []
        
        for i, match in enumerate(course_matches):
            course_data = self.parse_course_entry(match)
            if course_data:
                all_courses.append(course_data)
                print(f"Parsed: {course_data['course_number']} - {course_data['course_title']}")
        
        # If we didn't find enough courses with the pattern, try a different approach
        if len(all_courses) < 10:
            print("Trying alternative parsing approach...")
            
            # Look for all course numbers in the text
            course_numbers = re.findall(r'[A-Z]{2,4}\d{3}[A-Z]?', page_text)
            unique_course_numbers = list(set(course_numbers))
            
            print(f"Found {len(unique_course_numbers)} unique course numbers")
            
            # For each course number, try to extract surrounding text
            for course_num in unique_course_numbers:
                # Find the position of this course number
                pattern = rf'{re.escape(course_num)}\s+[^A-Z]+?'
                match = re.search(pattern, page_text, re.DOTALL)
                
                if match:
                    course_text = match.group(0)
                    course_data = self.parse_course_entry(course_text)
                    if course_data and not any(c['course_number'] == course_num for c in all_courses):
                        all_courses.append(course_data)
                        print(f"Alternative parsing: {course_data['course_number']} - {course_data['course_title']}")
        
        self.courses = all_courses
        print(f"Successfully extracted {len(all_courses)} courses")
        return all_courses
    
    def save_to_csv(self, filename: str = "uw_cs_courses.csv"):
        """Save courses to CSV file"""
        if not self.courses:
            print("No courses to save")
            return
        
        df = pd.DataFrame(self.courses)
        # Reorder columns for better readability
        column_order = ['course_number', 'course_title', 'credits', 'prerequisites_text', 'description']
        df = df[column_order]
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
        for i, course in enumerate(self.courses[:10]):
            print(f"  {i+1}. {course['course_number']}: {course['course_title']}")
            print(f"     Credits: {course['credits']}")
            print(f"     Prerequisites: {course['prerequisites_text'] or 'None'}")
            print(f"     Description: {course['description'][:100]}...")
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

