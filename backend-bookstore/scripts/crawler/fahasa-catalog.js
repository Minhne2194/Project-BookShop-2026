const fs = require('fs/promises');
const path = require('path');
const puppeteer = require('puppeteer');

const OUTPUT_DIR = path.join(__dirname, 'output');
const LIST_URL = 'https://www.fahasa.com/sach-trong-nuoc.html?p=';
const START_PAGE = Number(process.env.FAHASA_START_PAGE || 1);
const PAGE_COUNT = Number(process.env.FAHASA_PAGE_COUNT || 2);
const DETAIL_CONCURRENCY = Number(process.env.FAHASA_DETAIL_CONCURRENCY || 4);

function normalizeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function createSlug(text) {
  return normalizeText(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^0-9a-z\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parsePrice(text) {
  const digits = normalizeText(text).replace(/[^\d]/g, '');
  return digits ? Number(digits) : 0;
}

function parseInteger(text) {
  const digits = normalizeText(text).replace(/[^\d]/g, '');
  return digits ? Number(digits) : null;
}

function parseSoldCount(text) {
  const normalized = normalizeText(text).toLowerCase();
  const match = normalized.match(/đã bán\s+([\d.,]+)\s*([km]?)/i);
  if (!match) return 0;

  const rawValue = match[1].replace(/,/g, '.');
  const suffix = match[2];
  if (suffix === 'k') return Math.round(Number(rawValue) * 1000);
  if (suffix === 'm') return Math.round(Number(rawValue) * 1000000);

  return Number(rawValue.replace(/\./g, '')) || 0;
}

function inferLanguage(categories) {
  const joined = categories.join(' ').toLowerCase();
  if (joined.includes('english') || joined.includes('foreign books')) {
    return 'en';
  }
  return 'vi';
}

function splitAuthors(authorText) {
  const normalized = normalizeText(authorText);
  if (!normalized) return [];

  return Array.from(
    new Set(
      normalized
        .split(',')
        .map((item) => normalizeText(item))
        .filter(Boolean),
    ),
  );
}

async function closePopup(page) {
  const closeButton = await page.$('#fhs_pop_details_close');
  if (closeButton) {
    await closeButton.click().catch(() => {});
  }
}

async function openPage(browser) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1600 });
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  );
  await page.setExtraHTTPHeaders({
    'accept-language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
  });
  return page;
}

async function fetchListingPage(browser, pageNumber) {
  const page = await openPage(browser);
  try {
    const url = `${LIST_URL}${pageNumber}`;
    console.log(`[*] Crawling listing page ${pageNumber}: ${url}`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await closePopup(page);
    await page.waitForSelector('.item-inner', { timeout: 30000 });

    return await page.evaluate(() => {
      const normalize = (value) => String(value || '').replace(/\s+/g, ' ').trim();
      const pickCover = (node) => {
        const sources = Array.from(node.querySelectorAll('.product-image img'))
          .map((img) => img.getAttribute('data-src') || img.getAttribute('src') || '')
          .map((src) => src.trim())
          .filter(Boolean);

        return (
          sources.find((src) => /^https?:/i.test(src) && !src.includes('FrameQuaTang')) ||
          sources.find((src) => /^https?:/i.test(src)) ||
          null
        );
      };

      return Array.from(document.querySelectorAll('.item-inner'))
        .map((node) => {
          const titleLink = node.querySelector('h2.product-name-no-ellipsis a');
          const priceNode =
            node.querySelector('.special-price .price') ||
            node.querySelector('.price-label .price');
          const comparePriceNode = node.querySelector('.old-price .price');

          return {
            title: normalize(titleLink?.textContent),
            url: titleLink?.href || null,
            cover_url: pickCover(node),
            price: normalize(priceNode?.textContent),
            compare_price: normalize(comparePriceNode?.textContent),
          };
        })
        .filter((item) => item.title && item.url);
    });
  } finally {
    await page.close();
  }
}

async function fetchBookDetail(browser, item, index, total) {
  const page = await openPage(browser);
  try {
    console.log(`    [${index + 1}/${total}] ${item.title}`);
    await page.goto(item.url, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await closePopup(page);
    await page.waitForSelector('.breadcrumb, #product_view_info', { timeout: 30000 });

    const detail = await page.evaluate(() => {
      const normalize = (value) => String(value || '').replace(/\s+/g, ' ').trim();
      const rows = {};

      document.querySelectorAll('#product_view_info tr').forEach((row) => {
        const label = normalize(row.querySelector('th')?.textContent);
        const value = normalize(row.querySelector('td')?.textContent);
        if (label && value) {
          rows[label] = value;
        }
      });

      const categories = Array.from(document.querySelectorAll('.breadcrumb a'))
        .map((node) => normalize(node.getAttribute('title') || node.textContent))
        .filter(Boolean);

      const title =
        normalize(document.querySelector('h1')?.textContent) ||
        normalize(document.querySelector('.product_name')?.textContent);

      const description =
        normalize(document.querySelector('#desc_content')?.innerText) ||
        normalize(document.querySelector('#product_tabs_description_contents')?.innerText);

      const bodyText = normalize(document.body.innerText);
      const soldMatch = bodyText.match(/Đã bán\s+([0-9.,kKmM]+)/);
      const storeMatch = bodyText.match(/(\d+)\s+nhà sách còn hàng/);

      return {
        title,
        categories,
        description,
        infoRows: rows,
        soldText: soldMatch ? soldMatch[0] : '',
        storeCount: storeMatch ? storeMatch[1] : '',
      };
    });

    const authors = splitAuthors(detail.infoRows['Tác giả']);
    const supplier = detail.infoRows['Tên Nhà Cung Cấp'] || '';
    const publisher = detail.infoRows['NXB'] || supplier || 'Đang cập nhật';
    const isbn = detail.infoRows['Mã hàng'] || item.url.split('/').pop().replace('.html', '');
    const stockQty = parseInteger(detail.storeCount) || 50;

    return {
      isbn,
      title: detail.title || item.title,
      description: detail.description || item.title,
      price: parsePrice(item.price),
      compare_price: parsePrice(item.compare_price) || null,
      stock_qty: stockQty,
      sold_count: parseSoldCount(detail.soldText),
      author: authors[0] || 'Khuyết danh',
      authors,
      publisher,
      categories: detail.categories.length ? detail.categories : ['Sách tiếng Việt'],
      cover_url: item.cover_url,
      page_count: parseInteger(detail.infoRows['Số trang']),
      publish_year: parseInteger(detail.infoRows['Năm XB']),
      language: inferLanguage(detail.categories),
      metadata: {
        supplier,
        source_url: item.url,
        weight_g: parseInteger(detail.infoRows['Trọng lượng (gr)']),
        size_cm: detail.infoRows['Kích Thước Bao Bì'] || null,
        binding: detail.infoRows['Hình thức'] || null,
      },
    };
  } finally {
    await page.close();
  }
}

async function mapWithConcurrency(items, concurrency, worker) {
  const results = new Array(items.length);
  let cursor = 0;

  async function runner() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await worker(items[index], index);
    }
  }

  const runners = Array.from({ length: Math.min(concurrency, items.length) }, () => runner());
  await Promise.all(runners);
  return results;
}

function buildCategorySeed(books) {
  const categories = new Map();

  books.forEach((book) => {
    let parentSlug = null;
    book.categories.forEach((name, levelIndex) => {
      const normalizedName = normalizeText(name);
      const slug = createSlug(normalizedName);
      if (!slug) return;

      if (!categories.has(slug)) {
        categories.set(slug, {
          name: normalizedName,
          slug,
          level: levelIndex + 1,
          parent_slug: parentSlug,
        });
      }

      parentSlug = slug;
    });
  });

  return Array.from(categories.values()).sort((left, right) => {
    if (left.level !== right.level) return left.level - right.level;
    return left.name.localeCompare(right.name, 'vi');
  });
}

async function main() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const listings = [];
    for (let pageNumber = START_PAGE; pageNumber < START_PAGE + PAGE_COUNT; pageNumber += 1) {
      const books = await fetchListingPage(browser, pageNumber);
      listings.push(...books);
    }

    const dedupedListings = Array.from(new Map(listings.map((item) => [item.url, item])).values());
    console.log(`[*] Found ${dedupedListings.length} book candidates`);

    const books = await mapWithConcurrency(
      dedupedListings,
      DETAIL_CONCURRENCY,
      (item, index) => fetchBookDetail(browser, item, index, dedupedListings.length),
    );

    const catalog = books.filter((book) => book && book.title && book.isbn);
    const categories = buildCategorySeed(catalog);

    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    await fs.writeFile(
      path.join(OUTPUT_DIR, 'books_seed.json'),
      `${JSON.stringify(catalog, null, 2)}\n`,
      'utf8',
    );
    await fs.writeFile(
      path.join(OUTPUT_DIR, 'categories_seed.json'),
      `${JSON.stringify(categories, null, 2)}\n`,
      'utf8',
    );

    console.log(`[+] Wrote ${catalog.length} books to ${path.join(OUTPUT_DIR, 'books_seed.json')}`);
    console.log(`[+] Wrote ${categories.length} categories to ${path.join(OUTPUT_DIR, 'categories_seed.json')}`);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error('[x] Catalog crawl failed:', error);
  process.exit(1);
});
