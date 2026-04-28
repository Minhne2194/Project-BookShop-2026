from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
import random

class FahasaCrawler:
    def __init__(self):
        chrome_options = Options()
        chrome_options.add_argument("--headless")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("window-size=1920,1080")
        chrome_options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")

        self.driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=chrome_options)

    def get_books(self, page=1):
        url = f"https://www.fahasa.com/sach-trong-nuoc.html?p={page}"
        print(f"[*] Dang truy cap: {url}")
        
        try:
            self.driver.get(url)
            
            # Đóng popup nếu xuất hiện
            try:
                WebDriverWait(self.driver, 5).until(EC.element_to_be_clickable((By.ID, "fhs_pop_details_close"))).click()
                print("[+] Da dong popup quang cao.")
            except:
                pass

            # Đợi load danh sách sản phẩm
            WebDriverWait(self.driver, 15).until(
                EC.presence_of_element_located((By.CSS_NAME, ".product-item"))
            )
            
            # Cuộn trang từ từ để load ảnh (Lazy Load)
            for i in range(1, 5):
                self.driver.execute_script(f"window.scrollTo(0, {i * 800});")
                time.sleep(0.5)

            items = self.driver.find_elements(By.CSS_NAME, ".product-item")
            formatted_books = []
            
            for item in items:
                try:
                    title_el = item.find_element(By.CSS_NAME, ".product-name")
                    title = title_el.text.strip()
                    
                    # Giá (Lấy Special Price nếu có, không thì lấy Price thường)
                    try:
                        price_text = item.find_element(By.CSS_NAME, ".special-price .price").text
                    except:
                        price_text = item.find_element(By.CSS_NAME, ".price").text
                    
                    price = int(price_text.replace('đ', '').replace('.', '').strip())
                    
                    # Ảnh (Ưu tiên data-src của Lazy load)
                    img_el = item.find_element(By.TAG_NAME, "img")
                    img_url = img_el.get_attribute("data-src") or img_el.get_attribute("src")
                    
                    # Tác giả (nếu có hiện ở grid)
                    author = "Nhiều tác giả"
                    
                    formatted_books.append({
                        "isbn": f"FHS-{random.randint(100000, 999999)}-{page}",
                        "title": title,
                        "description": f"Cuốn sách '{title}' được cung cấp bởi Fahasa.",
                        "price": price,
                        "compare_price": int(price * 1.1),
                        "stock_qty": random.randint(20, 50),
                        "author": author,
                        "publisher": "NXB Trẻ",
                        "categories": ["Sách Trong Nước"],
                        "cover_url": img_url
                    })
                except Exception as e:
                    continue
            
            print(f"[+] Da lay duoc {len(formatted_books)} sach tu trang {page}")
            return formatted_books
            
        except Exception as e:
            print(f"[!] Loi Selenium: {e}")
            # Fallback nếu lỗi nặng (như bị ban IP trình duyệt)
            return self._get_fallback_data(page)

    def _get_fallback_data(self, page):
        print("[!] Dang dung du lieu du phong...")
        fallback_samples = [
            {"title": "Nhà Giả Kim", "author": "Paulo Coelho", "price": 79000, "img": "https://cdn0.fahasa.com/media/catalog/product/i/m/image_195509_1_36793.jpg", "isbn": "8935235226272"},
            {"title": "Đắc Nhân Tâm", "author": "Dale Carnegie", "price": 76000, "img": "https://cdn0.fahasa.com/media/catalog/product/8/9/8935086854181.jpg", "isbn": "8935086854181"},
            {"title": "Cây Cam Ngọt Của Tôi", "author": "José Mauro de Vasconcelos", "price": 108000, "img": "https://cdn0.fahasa.com/media/catalog/product/i/m/image_195509_1_51886.jpg", "isbn": "8935235232143"},
            {"title": "Tuổi Trẻ Đáng Giá Bao Nhiêu", "author": "Rosie Nguyễn", "price": 80000, "img": "https://cdn0.fahasa.com/media/catalog/product/8/9/8936071861276.jpg", "isbn": "8936071861276"}
        ]
        results = []
        for i in range(10):
            item = random.choice(fallback_samples)
            results.append({
                "isbn": f"{item['isbn']}-{page}-{i}",
                "title": f"{item['title']} (Vol {page}.{i})",
                "description": f"Cuốn sách kinh điển của {item['author']}.",
                "price": item['price'],
                "compare_price": int(item['price'] * 1.2),
                "stock_qty": 50,
                "author": item['author'],
                "publisher": "NXB Trẻ",
                "categories": ["Sách Văn Học"],
                "cover_url": item['img']
            })
        return results

    def __del__(self):
        try:
            self.driver.quit()
        except:
            pass
