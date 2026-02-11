from PIL import Image, ImageDraw
import numpy as np

# 手机屏幕尺寸（以iPhone 14 Pro为例，可根据需要调整）
SCREEN_WIDTH = 1179
SCREEN_HEIGHT = 2556

# 加载原始图片
input_path = "tk/Screenshot 2026-02-10 222837.png"
output_path = "miniprogram/images/background.png"

img = Image.open(input_path)
original_width, original_height = img.size

# 裁剪掉顶部包含"风表"文字的区域
# 根据图片分析，"风表"文字在顶部约150像素高度
crop_top = 150
img_cropped = img.crop((0, crop_top, original_width, original_height))
cropped_width, cropped_height = img_cropped.size

print(f"原始尺寸: {original_width}x{original_height}")
print(f"裁剪后尺寸: {cropped_width}x{cropped_height}")
print(f"裁剪掉顶部: {crop_top}像素")

# 计算缩放比例，使图片宽度与屏幕宽度一致
scale_factor = SCREEN_WIDTH / cropped_width
new_width = SCREEN_WIDTH
new_height = int(cropped_height * scale_factor)

# 按比例缩小图片
img_resized = img_cropped.resize((new_width, new_height), Image.Resampling.LANCZOS)

# 创建新的画布，尺寸为手机屏幕尺寸
new_img = Image.new('RGB', (SCREEN_WIDTH, SCREEN_HEIGHT), color='white')

# 图片顶部与屏幕顶部对齐
image_top_position = 0

# 将缩放后的图片粘贴到新画布的顶部
new_img.paste(img_resized, (0, image_top_position))

# 获取图片底部颜色用于渐变
bottom_color = img_resized.getpixel((new_width // 2, new_height - 1))

# 处理底部空白区域（底部渐变填充）
image_bottom_position = new_height
blank_height = SCREEN_HEIGHT - image_bottom_position

if blank_height > 0:
    # 创建底部渐变区域
    bottom_gradient = Image.new('RGB', (SCREEN_WIDTH, blank_height))
    draw_bottom = ImageDraw.Draw(bottom_gradient)
    
    # 创建渐变效果（从上到下的渐变）
    # 从图片底部颜色渐变到白色
    for y in range(blank_height):
        # 计算渐变比例
        ratio = y / blank_height
        
        # 从图片底部颜色渐变到白色
        r = int(bottom_color[0] + (255 - bottom_color[0]) * ratio)
        g = int(bottom_color[1] + (255 - bottom_color[1]) * ratio)
        b = int(bottom_color[2] + (255 - bottom_color[2]) * ratio)
        
        draw_bottom.line([(0, y), (SCREEN_WIDTH, y)], fill=(r, g, b))
    
    # 将底部渐变区域粘贴到画布底部
    new_img.paste(bottom_gradient, (0, image_bottom_position))

# 保存处理后的图片
new_img.save(output_path, quality=95)
print(f"图片处理完成！")
print(f"最终尺寸: {SCREEN_WIDTH}x{SCREEN_HEIGHT}")
print(f"图片顶部位置: {image_top_position} (与屏幕顶部对齐)")
print(f"图片底部位置: {image_bottom_position}")
print(f"底部渐变高度: {blank_height}")
print(f"输出路径: {output_path}")
