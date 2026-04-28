import pandas as pd

def extract_unique_categories(df: pd.DataFrame) -> list:
    print("[*] Đang trích xuất và chuẩn hóa Categories...")
    # Lấy tất cả categories, flatten list, và lấy unique
    all_cats = df['categories'].explode().dropna().unique()
    
    cat_list =[]
    for cat in all_cats:
        # Chuẩn hóa (VD: tạo slug cơ bản)
        slug = str(cat).lower().replace(' ', '-').replace('đ', 'd')
        cat_list.append({
            "name": str(cat),
            "slug": slug,
            "level": 1 # Đơn giản hóa thành level 1 trước
        })
    return cat_list