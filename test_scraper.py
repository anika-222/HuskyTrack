#!/usr/bin/env python3
"""
Test script for UW CS Course Scraper
Run this to test the scraper and see the extracted data
"""

from course_scraper_improved import UWCourseScraper

def test_scraper():
    """Test the course scraper"""
    print("Testing UW CS Course Scraper...")
    print("=" * 50)
    
    scraper = UWCourseScraper()
    
    try:
        courses = scraper.scrape_courses()
        
        if courses:
            print(f"\n✅ Successfully extracted {len(courses)} courses!")
            scraper.print_summary()
            
            # Save the data
            scraper.save_to_csv("uw_cs_courses.csv")
            scraper.save_to_json("uw_cs_courses.json")
            
            print("\n📁 Files saved:")
            print("  - uw_cs_courses.csv")
            print("  - uw_cs_courses.json")
            
        else:
            print("❌ No courses were extracted.")
            print("This might be due to:")
            print("  - Website structure changes")
            print("  - Network issues")
            print("  - Anti-bot measures")
    
    except Exception as e:
        print(f"❌ Error occurred: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_scraper()

