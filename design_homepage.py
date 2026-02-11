from PIL import Image, ImageDraw, ImageFont, ImageFilter
import numpy as np

# 创建画布 - 手机屏幕尺寸
SCREEN_WIDTH = 1179
SCREEN_HEIGHT = 2556

# 创建新图片 - 浅蓝色渐变背景
img = Image.new('RGB', (SCREEN_WIDTH, SCREEN_HEIGHT), color='#E8F4FC')
draw = ImageDraw.Draw(img)

# 绘制浅蓝色渐变背景
for y in range(SCREEN_HEIGHT):
    # 从顶部浅蓝色渐变到底部更浅的蓝色
    ratio = y / SCREEN_HEIGHT
    r = int(232 + (245 - 232) * ratio)
    g = int(244 + (250 - 244) * ratio)
    b = int(252 + (255 - 252) * ratio)
    draw.line([(0, y), (SCREEN_WIDTH, y)], fill=(r, g, b))

# 尝试加载字体
try:
    # 尝试使用系统字体
    font_title = ImageFont.truetype("C:/Windows/Fonts/simhei.ttf", 70)
    font_subtitle = ImageFont.truetype("C:/Windows/Fonts/simhei.ttf", 40)
    font_text = ImageFont.truetype("C:/Windows/Fonts/simhei.ttf", 45)
    font_small = ImageFont.truetype("C:/Windows/Fonts/simhei.ttf", 35)
    font_button = ImageFont.truetype("C:/Windows/Fonts/simhei.ttf", 50)
except:
    # 使用默认字体
    font_title = ImageFont.load_default()
    font_subtitle = ImageFont.load_default()
    font_text = ImageFont.load_default()
    font_small = ImageFont.load_default()
    font_button = ImageFont.load_default()

# 绘制状态栏区域（模拟）
status_bar_height = 120
draw.rectangle([(0, 0), (SCREEN_WIDTH, status_bar_height)], fill='#E8F4FC')

# 绘制标题区域
# "风表" 主标题
draw.text((60, 160), "风表", font=font_title, fill='#1E88E5')
# 副标题
draw.text((280, 180), "北风旗下课表查询小程序", font=font_subtitle, fill='#666666')

# 绘制右侧更多按钮
draw.ellipse([(SCREEN_WIDTH-200, 170), (SCREEN_WIDTH-120, 250)], outline='#CCCCCC', width=3)
draw.ellipse([(SCREEN_WIDTH-100, 170), (SCREEN_WIDTH-20, 250)], outline='#CCCCCC', width=3)

# 绘制主标题区域 - "千家校园 海量课表"
main_title_y = 350
draw.text((60, main_title_y), "千家校园", font=ImageFont.truetype("C:/Windows/Fonts/simhei.ttf", 90) if 'simhei' in locals() else font_title, fill='#333333')
draw.text((60, main_title_y + 110), "海量课表", font=ImageFont.truetype("C:/Windows/Fonts/simhei.ttf", 90) if 'simhei' in locals() else font_title, fill='#333333')

# 绘制右侧装饰图形 - 课表主题
# 绘制一个圆角矩形代表课表
card_x = SCREEN_WIDTH - 450
card_y = 320
card_width = 380
card_height = 280
draw.rounded_rectangle([(card_x, card_y), (card_x + card_width, card_y + card_height)], radius=30, fill='#FFFFFF', outline='#E0E0E0', width=2)

# 在卡片上绘制课表元素
draw.text((card_x + 30, card_y + 30), "课程表", font=font_text, fill='#1E88E5')
draw.text((card_x + 30, card_y + 100), "周一", font=font_small, fill='#666666')
draw.text((card_x + 150, card_y + 100), "数学", font=font_small, fill='#333333')
draw.text((card_x + 30, card_y + 160), "周二", font=font_small, fill='#666666')
draw.text((card_x + 150, card_y + 160), "英语", font=font_small, fill='#333333')

# 绘制标签 - "课表核验保障"
tag_x = card_x + 200
tag_y = card_y - 40
draw.rounded_rectangle([(tag_x, tag_y), (tag_x + 220, tag_y + 60)], radius=30, fill='#1E88E5')
draw.text((tag_x + 20, tag_y + 10), "课表核验", font=font_small, fill='#FFFFFF')

# 绘制标签 - "安心查课表"
tag2_x = card_x + 50
tag2_y = card_y + card_height - 30
draw.rounded_rectangle([(tag2_x, tag2_y), (tag2_x + 200, tag2_y + 60)], radius=30, fill='#FFFFFF', outline='#1E88E5', width=2)
draw.text((tag2_x + 20, tag2_y + 10), "安心查课表", font=font_small, fill='#1E88E5')

# 绘制标签栏
tab_y = 680
tabs = ["全部", "热门", "最新", "收藏", "我的"]
tab_width = SCREEN_WIDTH // len(tabs)
for i, tab in enumerate(tabs):
    x = i * tab_width + 60
    if i == 0:  # 第一个标签高亮
        draw.text((x, tab_y), tab, font=font_text, fill='#1E88E5')
        # 下划线
        draw.line([(x, tab_y + 60), (x + 80, tab_y + 60)], fill='#1E88E5', width=4)
    else:
        draw.text((x, tab_y), tab, font=font_text, fill='#666666')

# 绘制搜索栏
search_y = 780
search_height = 100
search_margin = 60
draw.rounded_rectangle([(search_margin, search_y), (SCREEN_WIDTH - search_margin, search_y + search_height)], radius=50, fill='#FFFFFF', outline='#E0E0E0', width=2)

# 搜索图标（简化为圆形）
draw.ellipse([(search_margin + 30, search_y + 25), (search_margin + 70, search_y + 65)], outline='#999999', width=3)
draw.line([(search_margin + 65, search_y + 60), (search_margin + 85, search_y + 80)], fill='#999999', width=3)

# 搜索提示文字
draw.text((search_margin + 110, search_y + 25), "学校/课程/教师", font=font_text, fill='#999999')

# 绘制主按钮 - "查看课表"
button_y = 920
button_height = 120
button_margin = 80
draw.rounded_rectangle([(button_margin, button_y), (SCREEN_WIDTH - button_margin, button_y + button_height)], radius=60, fill='#333333')

# 按钮文字居中
button_text = "查看课表"
bbox = draw.textbbox((0, 0), button_text, font=font_button)
text_width = bbox[2] - bbox[0]
text_x = (SCREEN_WIDTH - text_width) // 2
draw.text((text_x, button_y + 30), button_text, font=font_button, fill='#FFFFFF')

# 绘制分隔线
line_y = 1100
draw.line([(60, line_y), (SCREEN_WIDTH - 60, line_y)], fill='#E0E0E0', width=2)

# 绘制"课表排行榜"区块标题
ranking_title_y = 1150
draw.text((60, ranking_title_y), "课表排行榜", font=ImageFont.truetype("C:/Windows/Fonts/simhei.ttf", 55) if 'simhei' in locals() else font_title, fill='#333333')
draw.text((SCREEN_WIDTH - 250, ranking_title_y + 10), "查看更多", font=font_small, fill='#1E88E5')

# 绘制课表排行榜卡片
card_start_y = 1250
card_height = 400
card_margin = 40

# 第一个卡片
for i in range(3):
    card_y = card_start_y + i * (card_height + card_margin)
    
    # 卡片背景
    draw.rounded_rectangle([(60, card_y), (SCREEN_WIDTH - 60, card_y + card_height)], radius=30, fill='#FFFFFF', outline='#E0E0E0', width=2)
    
    # 排名数字
    rank_colors = ['#FF6B6B', '#4ECDC4', '#45B7D1']
    draw.text((100, card_y + 30), f"{i+1}", font=ImageFont.truetype("C:/Windows/Fonts/simhei.ttf", 80) if 'simhei' in locals() else font_title, fill=rank_colors[i])
    
    # 学校名称
    schools = ["清华大学", "北京大学", "复旦大学"]
    draw.text((200, card_y + 40), schools[i], font=font_text, fill='#333333')
    
    # 课程数量
    course_counts = ["1,234", "1,156", "987"]
    draw.text((200, card_y + 110), f"课程数: {course_counts[i]}", font=font_small, fill='#666666')
    
    # 查看人数
    view_counts = ["12.5万", "11.2万", "9.8万"]
    draw.text((200, card_y + 170), f"查看: {view_counts[i]}", font=font_small, fill='#999999')
    
    # 右侧箭头
draw.polygon([(SCREEN_WIDTH - 120, card_y + 180), (SCREEN_WIDTH - 100, card_y + 200), (SCREEN_WIDTH - 120, card_y + 220)], fill='#CCCCCC')

# 绘制底部导航栏
nav_bar_height = 180
nav_bar_y = SCREEN_HEIGHT - nav_bar_height
draw.rectangle([(0, nav_bar_y), (SCREEN_WIDTH, SCREEN_HEIGHT)], fill='#FFFFFF')
draw.line([(0, nav_bar_y), (SCREEN_WIDTH, nav_bar_y)], fill='#E0E0E0', width=2)

# 导航项
nav_items = ["首页", "消息", "我的"]
nav_icons = ["🏠", "💬", "👤"]
nav_width = SCREEN_WIDTH // len(nav_items)

for i, (item, icon) in enumerate(zip(nav_items, nav_icons)):
    x = i * nav_width + nav_width // 2
    
    if i == 0:  # 首页高亮
        draw.text((x - 30, nav_bar_y + 30), icon, font=ImageFont.truetype("C:/Windows/Fonts/seguisym.ttf", 50) if 'seguisym' in locals() else font_text, fill='#1E88E5')
        draw.text((x - 35, nav_bar_y + 100), item, font=font_small, fill='#1E88E5')
    else:
        draw.text((x - 30, nav_bar_y + 30), icon, font=ImageFont.truetype("C:/Windows/Fonts/seguisym.ttf", 50) if 'seguisym' in locals() else font_text, fill='#999999')
        draw.text((x - 35, nav_bar_y + 100), item, font=font_small, fill='#999999')

# 保存图片
output_path = "miniprogram/images/background.png"
img.save(output_path, quality=95)
print(f"设计完成！")
print(f"图片尺寸: {SCREEN_WIDTH}x{SCREEN_HEIGHT}")
print(f"输出路径: {output_path}")
