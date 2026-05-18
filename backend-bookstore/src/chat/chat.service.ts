import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';
  private readonly MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

  constructor(private readonly prisma: PrismaService) {}

  // ── 1. SYSTEM PROMPT ──
  private buildSystemPrompt(): string {
    return `Bạn là trợ lý AI của Modern Book — hệ thống bán sách trực tuyến hàng đầu Việt Nam.

Nhiệm vụ:
- Giúp khách hàng tìm sách phù hợp với nhu cầu
- Tra cứu trạng thái đơn hàng
- Gợi ý sách hay dựa trên sở thích
- Trả lời câu hỏi về sách và cửa hàng

Quy tắc bắt buộc:
- Trả lời bằng tiếng Việt, thân thiện và ngắn gọn (tối đa 300 từ)
- Khi gợi ý sách, LUÔN bao gồm: tên sách, giá (định dạng VNĐ), đánh giá sao, và đường dẫn dạng [Xem chi tiết](/book/ID)
- Format giá: 125.000đ (dùng dấu chấm phân cách nghìn)
- Nếu không tìm thấy thông tin, nói rõ và đề xuất cách khác
- TUYỆT ĐỐI không bịa thêm thông tin sách không có trong context
- Khi user hỏi về đơn hàng mà chưa đăng nhập, yêu cầu đăng nhập tại [đây](/login)
- Sử dụng emoji phù hợp để làm nội dung sinh động`;
  }

  // ── 2. INTENT CLASSIFICATION ──
  classifyIntent(
    message: string,
  ): 'book_search' | 'order_tracking' | 'recommendation' | 'general' {
    const lower = message.toLowerCase();

    if (
      /đơn hàng|order|giao hàng|vận chuyển|trạng thái đơn|đơn của tôi|theo dõi|shipper|mã đơn/.test(
        lower,
      )
    )
      return 'order_tracking';

    if (
      /tương tự|giống|gợi ý|recommend|hay như|nên đọc gì|sách nào hay|đọc gì|sách gì/.test(
        lower,
      )
    )
      return 'recommendation';

    if (
      /tìm sách|sách về|sách cho|mua sách|giá.*dưới|giá.*trên|thể loại|tác giả|tìm kiếm|có sách|bán sách/.test(
        lower,
      )
    )
      return 'book_search';

    return 'general';
  }

  // ── 3. CONTEXT BUILDERS ──

  async buildBookSearchContext(message: string): Promise<string> {
    // Extract price from message (e.g. "150k", "200.000", "100 nghìn")
    const priceMatch = message.match(/(\d+)\s*k|(\d[\d.]+)\s*(?:nghìn|ngàn|000đ?)/i);
    const maxPrice = priceMatch
      ? parseInt((priceMatch[1] || priceMatch[2]).replace(/\./g, '')) *
        (priceMatch[1] ? 1000 : 1)
      : undefined;

    // Extract keyword from message
    const keyword = message
      .replace(
        /tìm sách|sách về|sách cho|mua sách|giá.*dưới.*|giá.*trên.*|thể loại|tác giả|có sách không/gi,
        '',
      )
      .trim()
      .slice(0, 50);

    const books = await this.prisma.book.findMany({
      where: {
        is_active: true,
        ...(maxPrice ? { price: { lte: maxPrice } } : {}),
        ...(keyword
          ? {
              OR: [
                { title: { contains: keyword, mode: 'insensitive' } },
                { description: { contains: keyword, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: {
        book_categories: { include: { category: true }, take: 2 },
        book_authors: { include: { author: true }, take: 1 },
      },
      orderBy: [{ avg_rating: 'desc' }, { sold_count: 'desc' }],
      take: 6,
    });

    // Fallback: search by avg_rating if no keyword match
    if (books.length === 0) {
      const fallback = await this.prisma.book.findMany({
        where: {
          is_active: true,
          ...(maxPrice ? { price: { lte: maxPrice } } : {}),
        },
        include: {
          book_categories: { include: { category: true }, take: 2 },
          book_authors: { include: { author: true }, take: 1 },
        },
        orderBy: [{ avg_rating: 'desc' }, { sold_count: 'desc' }],
        take: 6,
      });
      if (fallback.length === 0)
        return 'Không tìm thấy sách phù hợp trong hệ thống.';
      return this.formatBooksContext(fallback);
    }

    return this.formatBooksContext(books);
  }

  private formatBooksContext(books: any[]): string {
    return `📚 DỮ LIỆU SÁCH TÌM ĐƯỢC (${books.length} kết quả):
${books
  .map(
    (b, i) => `
${i + 1}. "${b.title}"
   - Giá: ${Number(b.price).toLocaleString('vi-VN')}đ
   - Đánh giá: ${Number(b.avg_rating).toFixed(1)}⭐ (${b.rating_count} lượt đánh giá)
   - Thể loại: ${b.book_categories?.map((bc: any) => bc.category.name).join(', ') || 'Chưa phân loại'}
   - Tác giả: ${b.book_authors?.map((ba: any) => ba.author.name).join(', ') || 'Đang cập nhật'}
   - ID (dùng cho link): ${b.book_id}`,
  )
  .join('')}`;
  }

  async buildOrderContext(userId: string): Promise<string> {
    const orders = await this.prisma.order.findMany({
      where: { user_id: userId },
      include: {
        items: { include: { book: { select: { title: true } } } },
      },
      orderBy: { created_at: 'desc' },
      take: 5,
    });

    if (orders.length === 0) return 'Khách hàng chưa có đơn hàng nào.';

    const statusMap: Record<string, string> = {
      pending: '⏳ Chờ xác nhận',
      confirmed: '✅ Đã xác nhận',
      shipping: '🚚 Đang giao hàng',
      delivered: '📦 Đã giao thành công',
      cancelled: '❌ Đã hủy',
      refunded: '💰 Đã hoàn tiền',
    };

    return `📋 ĐƠN HÀNG GẦN ĐÂY CỦA KHÁCH HÀNG:
${orders
  .map(
    (o, i) => `
${i + 1}. Mã đơn: ${o.order_code}
   - Trạng thái: ${statusMap[o.status] || o.status}
   - Tổng tiền: ${Number(o.total_amount).toLocaleString('vi-VN')}đ
   - Ngày đặt: ${o.created_at.toLocaleDateString('vi-VN')}
   - Sản phẩm: ${o.items.map((it) => it.book.title).join(', ')}`,
  )
  .join('')}`;
  }

  async buildRecommendationContext(userId?: string): Promise<string> {
    let recentBookTitles: string[] = [];
    let recentCategoryIds: string[] = [];

    if (userId) {
      const purchases = await this.prisma.orderItem.findMany({
        where: {
          order: {
            user_id: userId,
            status: { in: ['delivered', 'confirmed', 'shipping'] },
          },
        },
        include: {
          book: {
            select: {
              title: true,
              book_id: true,
              book_categories: { select: { category_id: true }, take: 2 },
            },
          },
        },
        orderBy: { order: { created_at: 'desc' } },
        take: 5,
      });
      recentBookTitles = purchases.map((p) => p.book.title);
      recentCategoryIds = purchases
        .flatMap((p) => p.book.book_categories.map((bc) => bc.category_id))
        .filter((id, idx, arr) => arr.indexOf(id) === idx);
    }

    const trending = await this.prisma.book.findMany({
      where: {
        is_active: true,
        ...(recentCategoryIds.length > 0
          ? {
              book_categories: {
                some: { category_id: { in: recentCategoryIds } },
              },
            }
          : {}),
      },
      include: {
        book_categories: { include: { category: true }, take: 2 },
        book_authors: { include: { author: true }, take: 1 },
      },
      orderBy: [{ avg_rating: 'desc' }, { sold_count: 'desc' }],
      take: 8,
    });

    const trendingStr = trending
      .map(
        (b, i) =>
          `${i + 1}. "${b.title}" — ${Number(b.price).toLocaleString('vi-VN')}đ — ${Number(b.avg_rating).toFixed(1)}⭐ — ${b.book_categories?.map((bc: any) => bc.category.name).join(', ')} — ID: ${b.book_id}`,
      )
      .join('\n');

    return `${recentBookTitles.length > 0 ? `📖 SÁCH KHÁCH ĐÃ MUA GẦN ĐÂY: ${recentBookTitles.join(', ')}\n\n` : ''}📚 SÁCH GỢI Ý (dựa trên sở thích):\n${trendingStr}`;
  }

  // ── 4. MAIN CHAT METHOD (Streaming) ──
  async *chat(
    message: string,
    conversationHistory: { role: string; content: string }[],
    userId?: string,
  ): AsyncGenerator<string> {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      yield '⚠️ Chatbot chưa được cấu hình API key. Vui lòng liên hệ quản trị viên.';
      return;
    }

    // Step 1: Classify intent
    const intent = this.classifyIntent(message);
    this.logger.log(`Intent: ${intent} | Message: "${message.slice(0, 50)}"`);

    // Step 2: Build context
    let context = '';
    try {
      switch (intent) {
        case 'book_search':
          context = await this.buildBookSearchContext(message);
          break;
        case 'order_tracking':
          if (!userId) {
            yield 'Bạn cần **đăng nhập** để tra cứu đơn hàng. Vui lòng [đăng nhập tại đây](/login) rồi hỏi lại nhé! 😊';
            return;
          }
          context = await this.buildOrderContext(userId);
          break;
        case 'recommendation':
          context = await this.buildRecommendationContext(userId);
          break;
        default:
          context =
            'Đây là hệ thống bán sách trực tuyến Modern Book. Website bán sách online với hàng ngàn đầu sách đa dạng.';
      }
    } catch (err) {
      this.logger.error('Context build error:', err);
      context = 'Không thể tải dữ liệu ngữ cảnh lúc này.';
    }

    // Step 3: Compose messages
    const messages = [
      { role: 'system', content: this.buildSystemPrompt() },
      {
        role: 'system',
        content: `--- NGỮ CẢNH DỮ LIỆU HỆ THỐNG ---\n${context}\n--- KẾT THÚC NGỮ CẢNH ---`,
      },
      ...conversationHistory.slice(-8), // Keep last 8 turns
      { role: 'user', content: message },
    ];

    // Step 4: Call DeepSeek API (streaming)
    let response: Response;
    try {
      response = await fetch(this.DEEPSEEK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: this.MODEL,
          messages,
          stream: true,
          temperature: 0.7,
          max_tokens: 1024,
        }),
      });
    } catch (err) {
      this.logger.error('DeepSeek fetch error:', err);
      yield '❌ Không thể kết nối đến AI. Vui lòng thử lại sau.';
      return;
    }

    if (!response.ok) {
      const errText = await response.text();
      this.logger.error(`DeepSeek error ${response.status}: ${errText}`);
      yield `❌ AI trả về lỗi (${response.status}). Vui lòng thử lại.`;
      return;
    }

    // Step 5: Parse SSE stream
    const reader = response.body?.getReader();
    if (!reader) {
      yield '❌ Không thể đọc phản hồi từ AI.';
      return;
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // keep incomplete line

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === 'data: [DONE]') continue;
          if (!trimmed.startsWith('data: ')) continue;

          try {
            const json = JSON.parse(trimmed.slice(6));
            const delta = json?.choices?.[0]?.delta?.content;
            if (delta) yield delta;
          } catch {
            // Skip malformed SSE lines
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}
