import pandas as pd
import json
import os
from crawler import FahasaCrawler
from categories_seed import extract_unique_categories

def run_pipeline():
    print("BAT DAU CRAWL DATA...")
    crawler = FahasaCrawler()
    all_books =[]
    
    # Cào 2 trang để chạy thử nhanh
    for page in range(1, 3):
        books = crawler.get_books(page=page)
        all_books.extend(books)
        
    # Đưa vào Pandas để Clean Data
    df = pd.DataFrame(all_books)
    if df.empty:
        print("Khong co du lieu de xu ly. Vui long kiem tra lai Crawler (co the bi ban IP).")
        return
        
    print(f"Da cao tong cong: {len(df)} sach")
    
    # Xử lý missing values, loại bỏ sách trùng ISBN
    df = df.drop_duplicates(subset=['isbn'])
    df['price'] = df['price'].fillna(0).astype(int)
    
    # Trích xuất dữ liệu related
    categories_data = extract_unique_categories(df)
    
    # Chuẩn bị file xuất
    output_dir = os.path.join(os.path.dirname(__file__), 'output')
    os.makedirs(output_dir, exist_ok=True)
    
    # Export ra JSON
    books_json_path = os.path.join(output_dir, 'books_seed.json')
    cats_json_path = os.path.join(output_dir, 'categories_seed.json')
    
    # Orient='records' để xuất ra list object chuẩn JSON
    df.to_json(books_json_path, orient='records', force_ascii=False, indent=2)
    with open(cats_json_path, 'w', encoding='utf-8') as f:
        json.dump(categories_data, f, ensure_ascii=False, indent=2)

    print(f"Hoan tat! Du lieu da luu tai: {output_dir}")

if __name__ == "__main__":
    run_pipeline()