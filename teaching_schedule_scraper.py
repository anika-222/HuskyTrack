#!/usr/bin/env python3
"""
UW CSE Teaching Schedule Scraper
Extracts course offerings by quarter from the teaching schedule page
"""

import requests
from bs4 import BeautifulSoup
import pandas as pd
import re
from typing import List, Dict

class TeachingScheduleScraper:
    def __init__(self):
        self.url = "https://courses.cs.washington.edu/courses/cse000/time-sched/teaching2025-2026.html"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        })
        self.courses = []
    
    def fetch_page(self) -> BeautifulSoup:
        """Fetch and parse the teaching schedule page"""
        try:
            print(f"Fetching: {self.url}")
            response = self.session.get(self.url, timeout=15)
            response.raise_for_status()
            return BeautifulSoup(response.content, 'html.parser')
        except requests.RequestException as e:
            print(f"Error fetching page: {e}")
            return None
    
    def extract_course_data(self, soup: BeautifulSoup) -> List[Dict]:
        """Extract course data from the HTML table"""
        courses = []
        
        # Find the main table
        table = soup.find('table')
        if not table:
            print("No table found on the page")
            return courses
        
        # Get all rows
        rows = table.find_all('tr')
        print(f"Found {len(rows)} rows in the table")
        
        for i, row in enumerate(rows):
            # Skip header row
            if i == 0:
                continue
            
            cells = row.find_all(['td', 'th'])
            if len(cells) < 4:  # Need at least course_id, autumn, winter, spring
                continue
            
            # Extract course data
            course_data = {}
            
            # Course ID (first column)
            course_id_cell = cells[0]
            course_id = course_id_cell.get_text(strip=True)
            
            # Skip empty rows or non-course rows
            if not course_id or course_id in ['2025-2026', '100', '200-300 Majors', '400 Majors, Non-Capstones', 'Other Grad', 'PMP']:
                continue
            
            # Only process actual course numbers (CSE courses, EE courses, P courses)
            if not re.match(r'^[A-Z]{2,4}\d{3}[A-Z]?$', course_id) and not re.match(r'^P\d{3}$', course_id) and not re.match(r'^\d{3}[A-Z]?$', course_id):
                continue
            
            course_data['course_id'] = course_id
            
            # Autumn (second column)
            autumn_cell = cells[1]
            autumn_text = autumn_cell.get_text(strip=True)
            course_data['autumn'] = autumn_text if autumn_text else 'Not offered'
            
            # Winter (third column)
            winter_cell = cells[2]
            winter_text = winter_cell.get_text(strip=True)
            course_data['winter'] = winter_text if winter_text else 'Not offered'
            
            # Spring (fourth column)
            spring_cell = cells[3]
            spring_text = spring_cell.get_text(strip=True)
            course_data['spring'] = spring_text if spring_text else 'Not offered'
            
            courses.append(course_data)
            print(f"Extracted: {course_id} - Au:{autumn_text}, Wi:{winter_text}, Sp:{spring_text}")
        
        return courses
    
    def scrape_schedule(self) -> List[Dict]:
        """Main method to scrape the teaching schedule"""
        print("Fetching UW CSE teaching schedule...")
        soup = self.fetch_page()
        
        if not soup:
            print("Failed to fetch the page")
            return []
        
        print("Parsing teaching schedule...")
        courses = self.extract_course_data(soup)
        
        self.courses = courses
        print(f"Successfully extracted {len(courses)} courses")
        return courses
    
    def save_to_csv(self, filename: str = "teaching_schedule.csv"):
        """Save teaching schedule to CSV"""
        if not self.courses:
            print("No courses to save")
            return
        
        df = pd.DataFrame(self.courses)
        
        # Reorder columns
        column_order = ['course_id', 'autumn', 'winter', 'spring']
        df = df[column_order]
        
        df.to_csv(filename, index=False)
        print(f"Saved {len(self.courses)} courses to {filename}")
    
    def print_summary(self):
        """Print a summary of the teaching schedule"""
        if not self.courses:
            print("No courses found")
            return
        
        print(f"\n=== UW CSE Teaching Schedule Summary ===")
        print(f"Total courses: {len(self.courses)}")
        
        # Count courses by quarter
        autumn_courses = sum(1 for course in self.courses if course['autumn'])
        winter_courses = sum(1 for course in self.courses if course['winter'])
        spring_courses = sum(1 for course in self.courses if course['spring'])
        
        print(f"Autumn courses: {autumn_courses}")
        print(f"Winter courses: {winter_courses}")
        print(f"Spring courses: {spring_courses}")
        
        # Show sample courses
        print(f"\nSample courses:")
        for i, course in enumerate(self.courses[:10]):
            print(f"{i+1}. {course['course_id']}: Au={course['autumn']}, Wi={course['winter']}, Sp={course['spring']}")

def main():
    """Main function to run the scraper"""
    print("UW CSE Teaching Schedule Scraper")
    print("=" * 50)
    
    scraper = TeachingScheduleScraper()
    
    try:
        courses = scraper.scrape_schedule()
        
        if courses:
            scraper.print_summary()
            scraper.save_to_csv()
        else:
            print("No courses were extracted.")
    
    except Exception as e:
        print(f"An error occurred: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
