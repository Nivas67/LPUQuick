import os
import math
import shutil
from PIL import Image, ImageDraw, ImageFont

WIDTH = 740
HEIGHT = 300

FONT_BOLD_PATH = r"C:\Windows\Fonts\segoeuib.ttf"
FONT_REG_PATH = r"C:\Windows\Fonts\segoeui.ttf"

try:
    font_hero = ImageFont.truetype(FONT_BOLD_PATH, 18)
    font_title = ImageFont.truetype(FONT_BOLD_PATH, 15)
    font_bold_13 = ImageFont.truetype(FONT_BOLD_PATH, 13)
    font_bold_12 = ImageFont.truetype(FONT_BOLD_PATH, 12)
    font_bold_11 = ImageFont.truetype(FONT_BOLD_PATH, 11)
    font_bold_10 = ImageFont.truetype(FONT_BOLD_PATH, 10)
    font_bold_9 = ImageFont.truetype(FONT_BOLD_PATH, 9)
    font_reg_11 = ImageFont.truetype(FONT_REG_PATH, 11)
    font_reg_10 = ImageFont.truetype(FONT_REG_PATH, 10)
except Exception:
    font_hero = ImageFont.load_default()
    font_title = font_hero
    font_bold_13 = font_hero
    font_bold_12 = font_hero
    font_bold_11 = font_hero
    font_bold_10 = font_hero
    font_bold_9 = font_hero
    font_reg_11 = font_hero
    font_reg_10 = font_hero

COLOR_GREEN = (22, 163, 74)        # #16a34a
COLOR_GREEN_BRIGHT = (34, 197, 94) # #22c55e
COLOR_GREEN_DARK = (21, 128, 61)   # #15803d
COLOR_GREEN_PALE = (220, 252, 231) # #dcfce7
COLOR_GRAY_LINE = (226, 232, 240)  # #e2e8f0
COLOR_GRAY_TEXT = (100, 116, 139)  # #64748b
COLOR_DARK_TEXT = (30, 41, 59)     # #1e293b
COLOR_SKY_TOP = (224, 242, 254)    # #e0f2fe
COLOR_SKY_BOT = (240, 253, 244)    # #f0fdf4

STEPS = [
    {"name": "Confirmed", "x": 110},
    {"name": "Preparing", "x": 240},
    {"name": "Out for Delivery", "x": 370},
    {"name": "Arriving", "sub": "(1-2 min)", "x": 505},
    {"name": "Arrived", "x": 630}
]

def draw_scenery_background(draw):
    for y in range(175):
        ratio = y / 175.0
        r = int(COLOR_SKY_TOP[0] * (1 - ratio) + COLOR_SKY_BOT[0] * ratio)
        g = int(COLOR_SKY_TOP[1] * (1 - ratio) + COLOR_SKY_BOT[1] * ratio)
        b = int(COLOR_SKY_TOP[2] * (1 - ratio) + COLOR_SKY_BOT[2] * ratio)
        draw.line([(0, y), (WIDTH, y)], fill=(r, g, b))

    draw.rectangle([(0, 175), (WIDTH, HEIGHT)], fill=(255, 255, 255))
    draw.line([(0, 175), (WIDTH, 175)], fill=COLOR_GRAY_LINE, width=1)

    for tx, ty, tr, col in [
        (40, 168, 22, (200, 230, 210)),
        (80, 165, 26, (185, 225, 200)),
        (260, 168, 20, (190, 225, 205)),
        (300, 165, 24, (180, 220, 195)),
        (680, 165, 25, (190, 225, 205)),
        (715, 168, 22, (200, 230, 210))
    ]:
        draw.ellipse([(tx - tr, ty - tr), (tx + tr, ty + tr)], fill=col)

def draw_lpu_building(draw):
    bx1, bx2 = 120, 230
    by_base = 175

    draw.rectangle([(bx1 - 10, by_base - 6), (bx2 + 10, by_base)], fill=(226, 232, 240))
    draw.rectangle([(bx1 - 5, by_base - 12), (bx2 + 5, by_base - 6)], fill=(241, 245, 249))
    draw.rectangle([(bx1, 105), (bx2, by_base - 12)], fill=(234, 216, 200), outline=(210, 190, 170))

    for col_x in [132, 150, 168, 182, 200, 218]:
        draw.rectangle([(col_x - 3, 118), (col_x + 3, by_base - 12)], fill=(255, 255, 255))

    draw.polygon([(bx1 - 4, 106), ((bx1 + bx2) // 2, 85), (bx2 + 4, 106)], fill=(218, 195, 175), outline=(195, 170, 150))
    center_x = (bx1 + bx2) // 2
    draw.text((center_x - 14, 90), "LPU", fill=(153, 27, 27), font=font_bold_12)

    dome_cx, dome_cy, dome_r = center_x, 78, 20
    draw.pieslice([(dome_cx - dome_r, dome_cy - dome_r), (dome_cx + dome_r, dome_cy + dome_r)], 180, 360, fill=(245, 158, 11), outline=(217, 119, 6))
    draw.line([(dome_cx, dome_cy - dome_r - 8), (dome_cx, dome_cy - dome_r)], fill=(217, 119, 6), width=2)
    draw.polygon([(dome_cx, dome_cy - dome_r - 8), (dome_cx + 8, dome_cy - dome_r - 5), (dome_cx, dome_cy - dome_r - 2)], fill=(239, 68, 68))

    draw.ellipse([(95, 145), (135, 178)], fill=(34, 197, 94))
    draw.ellipse([(105, 140), (140, 175)], fill=(22, 163, 74))
    draw.ellipse([(215, 142), (250, 178)], fill=(34, 197, 94))
    draw.ellipse([(225, 147), (258, 178)], fill=(21, 128, 61))

def draw_hostel_room_door(draw, room_text="BH13"):
    dx1, dx2 = 625, 685
    dy1, dy2 = 82, 175

    draw.rectangle([(dx1 - 4, dy1 - 4), (dx2 + 4, dy2)], fill=(148, 163, 184))
    draw.rectangle([(dx1, dy1), (dx2, dy2)], fill=(241, 245, 249), outline=(203, 213, 225))
    draw.rectangle([(dx1 + 6, dy1 + 8), (dx2 - 6, dy1 + 42)], fill=(248, 250, 252), outline=(226, 232, 240))
    draw.rectangle([(dx1 + 6, dy1 + 48), (dx2 - 6, dy2 - 8)], fill=(248, 250, 252), outline=(226, 232, 240))
    draw.rectangle([(dx1 + 6, dy1 + 52), (dx1 + 10, dy1 + 62)], fill=(71, 85, 105))

    badge_w = 95
    badge_h = 28
    badge_x = dx1 - 70
    badge_y = dy1 - 2

    draw.rounded_rectangle([(badge_x + 1, badge_y + 2), (badge_x + badge_w + 1, badge_y + badge_h + 2)], radius=14, fill=(0, 0, 0, 40))
    draw.rounded_rectangle([(badge_x, badge_y), (badge_x + badge_w, badge_y + badge_h)], radius=14, fill=COLOR_GREEN, outline=(255, 255, 255), width=2)
    draw.ellipse([(badge_x + 6, badge_y + 6), (badge_x + 20, badge_y + 20)], fill=(255, 255, 255))
    draw.ellipse([(badge_x + 10, badge_y + 10), (badge_x + 16, badge_y + 16)], fill=COLOR_GREEN)
    draw.text((badge_x + 25, badge_y + 4), f"ROOM {room_text}", fill=(255, 255, 255), font=font_bold_11)

def draw_delivery_runner(draw, rx, ry, frame_idx=0):
    t = (frame_idx % 8) / 8.0
    angle = math.sin(t * 2 * math.pi)
    bob_y = int(abs(math.sin(t * 2 * math.pi)) * 4)

    cy = ry - bob_y

    dash_x1 = rx - 55 - int(angle * 6)
    dash_x2 = rx - 20
    draw.line([(dash_x1, cy + 18), (dash_x2, cy + 18)], fill=(34, 197, 94), width=3)
    draw.line([(dash_x1 + 10, cy + 26), (dash_x2 + 4, cy + 26)], fill=(16, 185, 129), width=2)
    draw.line([(dash_x1 - 5, cy + 34), (dash_x2 - 2, cy + 34)], fill=(52, 211, 153), width=2)

    leg2_hip = (rx + 2, cy + 38)
    leg2_knee = (rx - 12 - int(angle * 12), cy + 54)
    leg2_foot = (rx - 18 - int(angle * 16), cy + 68)
    draw.line([leg2_hip, leg2_knee, leg2_foot], fill=(30, 41, 59), width=5)
    draw.ellipse([(leg2_foot[0] - 5, leg2_foot[1] - 3), (leg2_foot[0] + 7, leg2_foot[1] + 4)], fill=(255, 255, 255))

    bag_x1 = rx - 26
    bag_y1 = cy + 10
    bag_w, bag_h = 24, 28
    draw.rounded_rectangle([(bag_x1, bag_y1), (bag_x1 + bag_w, bag_y1 + bag_h)], radius=5, fill=(16, 185, 129), outline=(5, 150, 105), width=2)
    draw.line([(bag_x1 + 6, bag_y1 - 3), (bag_x1 + 18, bag_y1 - 3)], fill=(255, 255, 255), width=2)
    draw.text((bag_x1 + 3, bag_y1 + 4), "LPU", fill=(255, 255, 255), font=font_bold_9)
    draw.text((bag_x1 + 2, bag_y1 + 14), "Quick", fill=(255, 255, 255), font=font_bold_9)

    draw.polygon([
        (rx - 2, cy + 14),
        (rx + 14, cy + 14),
        (rx + 10, cy + 40),
        (rx - 4, cy + 40)
    ], fill=(22, 163, 74))

    draw.rectangle([(rx - 5, cy + 38), (rx + 11, cy + 48)], fill=(30, 41, 59))

    leg1_hip = (rx + 6, cy + 42)
    leg1_knee = (rx + 14 + int(angle * 14), cy + 56)
    leg1_foot = (rx + 20 + int(angle * 18), cy + 70)
    draw.line([leg1_hip, leg1_knee, leg1_foot], fill=(30, 41, 59), width=6)
    draw.ellipse([(leg1_foot[0] - 4, leg1_foot[1] - 3), (leg1_foot[0] + 8, leg1_foot[1] + 4)], fill=(255, 255, 255))
    draw.line([(leg1_foot[0] - 2, leg1_foot[1] + 3), (leg1_foot[0] + 6, leg1_foot[1] + 3)], fill=(22, 163, 74), width=2)

    draw.rectangle([(rx + 2, cy + 8), (rx + 6, cy + 14)], fill=(251, 191, 134))
    draw.ellipse([(rx - 2, cy - 6), (rx + 12, cy + 10)], fill=(251, 191, 134))
    draw.ellipse([(rx + 8, cy + 2), (rx + 10, cy + 4)], fill=(30, 41, 59))

    draw.pieslice([(rx - 4, cy - 8), (rx + 14, cy + 6)], 170, 360, fill=(22, 163, 74))
    draw.polygon([(rx + 8, cy - 2), (rx + 20, cy + 2), (rx + 12, cy + 4)], fill=(15, 118, 54))

    arm2_start = (rx + 2, cy + 18)
    arm2_elbow = (rx - 8 - int(angle * 8), cy + 26)
    arm2_hand = (rx - 14 - int(angle * 10), cy + 22)
    draw.line([arm2_start, arm2_elbow, arm2_hand], fill=(251, 191, 134), width=4)

    arm1_start = (rx + 10, cy + 18)
    arm1_elbow = (rx + 18 + int(angle * 10), cy + 26)
    arm1_hand = (rx + 24 + int(angle * 12), cy + 20)
    draw.line([arm1_start, arm1_elbow, arm1_hand], fill=(22, 163, 74), width=5)
    draw.ellipse([(arm1_hand[0] - 3, arm1_hand[1] - 3), (arm1_hand[0] + 3, arm1_hand[1] + 3)], fill=(251, 191, 134))

def draw_progress_track(draw, active_step_idx=3, frame_idx=0):
    py = 238
    x_start = STEPS[0]["x"]
    x_end = STEPS[-1]["x"]
    x_active = STEPS[active_step_idx]["x"]

    # Background gray track
    draw.line([(x_start, py), (x_end, py)], fill=COLOR_GRAY_LINE, width=6)
    # Active green track
    draw.line([(x_start, py), (x_active, py)], fill=COLOR_GREEN, width=6)

    pulse = (frame_idx % 8) / 8.0
    halo_r = int(18 + math.sin(pulse * 2 * math.pi) * 5)

    for i, step in enumerate(STEPS):
        sx = step["x"]

        if i < active_step_idx:
            draw.ellipse([(sx - 13, py - 13), (sx + 13, py + 13)], fill=COLOR_GREEN)
            draw.line([(sx - 5, py), (sx - 1, py + 4)], fill=(255, 255, 255), width=2)
            draw.line([(sx - 1, py + 4), (sx + 6, py - 4)], fill=(255, 255, 255), width=2)
            draw.text((sx - 24, py + 18), step["name"], fill=COLOR_DARK_TEXT, font=font_bold_10)

        elif i == active_step_idx:
            # Active step with pulsing neon halo
            draw.ellipse([(sx - halo_r, py - halo_r), (sx + halo_r, py + halo_r)], outline=(74, 222, 128), width=3)
            draw.ellipse([(sx - 14, py - 14), (sx + 14, py + 14)], fill=COLOR_GREEN_BRIGHT, outline=(255, 255, 255), width=2)

            if i == 3: # Arriving
                draw.rectangle([(sx - 6, py - 3), (sx + 4, py + 4)], fill=(255, 255, 255))
                draw.polygon([(sx + 4, py - 1), (sx + 7, py + 1), (sx + 7, py + 4), (sx + 4, py + 4)], fill=(255, 255, 255))
                draw.ellipse([(sx - 5, py + 3), (sx - 2, py + 6)], fill=COLOR_GREEN_DARK)
                draw.ellipse([(sx + 3, py + 3), (sx + 6, py + 6)], fill=COLOR_GREEN_DARK)
            elif i == 0: # Confirmed
                draw.line([(sx - 5, py), (sx - 1, py + 4)], fill=(255, 255, 255), width=2)
                draw.line([(sx - 1, py + 4), (sx + 6, py - 4)], fill=(255, 255, 255), width=2)
            elif i == 1: # Preparing
                draw.rectangle([(sx - 5, py - 4), (sx + 5, py + 4)], fill=(255, 255, 255))
                draw.line([(sx - 5, py - 1), (sx + 5, py - 1)], fill=COLOR_GREEN_DARK, width=1)
            elif i == 2: # Out for Delivery
                draw.ellipse([(sx - 4, py - 2), (sx + 4, py + 2)], fill=(255, 255, 255))
                draw.line([(sx - 5, py + 4), (sx + 5, py + 4)], fill=(255, 255, 255), width=2)
            elif i == 4: # Arrived
                draw.line([(sx - 5, py), (sx - 1, py + 4)], fill=(255, 255, 255), width=2)
                draw.line([(sx - 1, py + 4), (sx + 6, py - 4)], fill=(255, 255, 255), width=2)

            draw.text((sx - 20, py + 16), step["name"], fill=COLOR_GREEN_DARK, font=font_bold_11)
            if "sub" in step:
                draw.text((sx - 22, py + 29), step["sub"], fill=COLOR_GREEN_DARK, font=font_bold_10)

        else:
            draw.ellipse([(sx - 11, py - 11), (sx + 11, py + 11)], fill=COLOR_GRAY_LINE, outline=(203, 213, 225), width=1)
            if i == 4:
                draw.line([(sx - 2, py - 5), (sx - 2, py + 5)], fill=(148, 163, 184), width=2)
                draw.polygon([(sx - 2, py - 5), (sx + 5, py - 2), (sx - 2, py + 1)], fill=(148, 163, 184))
            else:
                draw.ellipse([(sx - 3, py - 3), (sx + 3, py + 3)], fill=(148, 163, 184))

            draw.text((sx - 18, py + 18), step["name"], fill=COLOR_GRAY_TEXT, font=font_reg_10)

# ============================================================
# Stage 1: ORDER CONFIRMED
# ============================================================
def generate_confirmed_gif(filepath, num_frames=8):
    frames = []
    for f in range(num_frames):
        im = Image.new("RGBA", (WIDTH, HEIGHT), (255, 255, 255, 255))
        draw = ImageDraw.Draw(im)

        draw_scenery_background(draw)
        draw_lpu_building(draw)
        draw_hostel_room_door(draw, room_text="BH13")

        # Order Confirmed Card / Dispatch desk
        bob = int(math.sin((f / num_frames) * 2 * math.pi) * 3)
        cx, cy = 380, 110 + bob

        # Floating Confirmed Badge
        draw.rounded_rectangle([(cx - 85, cy - 25), (cx + 85, cy + 30)], radius=16, fill=(240, 253, 244), outline=(34, 197, 94), width=2)
        draw.ellipse([(cx - 70, cy - 12), (cx - 44, cy + 14)], fill=(22, 163, 74))
        draw.line([(cx - 64, cy), (cx - 60, cy + 5)], fill=(255, 255, 255), width=3)
        draw.line([(cx - 60, cy + 5), (cx - 50, cy - 5)], fill=(255, 255, 255), width=3)

        draw.text((cx - 36, cy - 16), "ORDER CONFIRMED", fill=(21, 128, 61), font=font_bold_12)
        draw.text((cx - 36, cy + 2), "Getting items ready...", fill=(71, 85, 105), font=font_bold_10)

        # Runner standing at station smiling
        rx = cx + 110
        draw.ellipse([(rx - 2, cy - 10), (rx + 12, cy + 6)], fill=(251, 191, 134))
        draw.pieslice([(rx - 4, cy - 12), (rx + 14, cy + 2)], 170, 360, fill=(22, 163, 74))
        draw.rectangle([(rx - 2, cy + 6), (rx + 12, cy + 32)], fill=(22, 163, 74))
        draw.rectangle([(rx - 2, cy + 32), (rx + 12, cy + 42)], fill=(30, 41, 59))
        draw.line([(rx, cy + 42), (rx, cy + 62)], fill=(30, 41, 59), width=4)
        draw.line([(rx + 8, cy + 42), (rx + 8, cy + 62)], fill=(30, 41, 59), width=4)

        # Progress bar: Stage 0 (Confirmed) is active
        draw_progress_track(draw, active_step_idx=0, frame_idx=f)
        draw.rounded_rectangle([(1, 1), (WIDTH - 2, HEIGHT - 2)], radius=20, outline=COLOR_GRAY_LINE, width=2)

        paletted = im.convert("RGB").quantize(colors=128)
        frames.append(paletted)

    frames[0].save(filepath, save_all=True, append_images=frames[1:], duration=120, loop=0, optimize=True)
    print(f"Generated {filepath} ({os.path.getsize(filepath)} bytes)")

# ============================================================
# Stage 2: PREPARING
# ============================================================
def generate_preparing_gif(filepath, num_frames=8):
    frames = []
    for f in range(num_frames):
        im = Image.new("RGBA", (WIDTH, HEIGHT), (255, 255, 255, 255))
        draw = ImageDraw.Draw(im)

        draw_scenery_background(draw)
        draw_lpu_building(draw)
        draw_hostel_room_door(draw, room_text="BH13")

        # Packing Station Center
        cx, cy = 370, 115
        bob = int(math.sin((f / num_frames) * 2 * math.pi) * 3)

        # Packing Counter
        draw.rectangle([(cx - 70, cy + 22), (cx + 70, cy + 58)], fill=(226, 232, 240), outline=(203, 213, 225))
        draw.rectangle([(cx - 65, cy + 25), (cx + 65, cy + 30)], fill=(241, 245, 249))

        # Green LPUQuick bag on counter
        bag_x = cx - 25
        bag_y = cy - 2 + bob
        draw.rounded_rectangle([(bag_x, bag_y), (bag_x + 36, bag_y + 30)], radius=5, fill=(16, 185, 129), outline=(5, 150, 105), width=2)
        draw.line([(bag_x + 10, bag_y - 4), (bag_x + 26, bag_y - 4)], fill=(255, 255, 255), width=2)
        draw.text((bag_x + 6, bag_y + 4), "LPU", fill=(255, 255, 255), font=font_bold_9)
        draw.text((bag_x + 4, bag_y + 14), "Quick", fill=(255, 255, 255), font=font_bold_9)

        # Snack box & drink can on counter
        draw.rectangle([(cx + 20, cy + 8), (cx + 42, cy + 24)], fill=(245, 158, 11)) # Chips pack
        draw.rectangle([(cx - 52, cy + 10), (cx - 38, cy + 24)], fill=(239, 68, 68)) # Soda can

        # Sparkles
        sp_angle = (f / num_frames) * 2 * math.pi
        sx = cx + int(math.cos(sp_angle) * 35)
        sy = cy - 10 + int(math.sin(sp_angle) * 15)
        draw.polygon([(sx, sy - 5), (sx + 2, sy), (sx + 7, sy), (sx + 3, sy + 3), (sx + 5, sy + 8), (sx, sy + 5), (sx - 5, sy + 8), (sx - 3, sy + 3), (sx - 7, sy), (sx - 2, sy)], fill=(250, 204, 21))

        # Staff in Chef/Packer Apron
        px = cx + 50
        draw.ellipse([(px - 2, cy - 8), (px + 12, cy + 8)], fill=(251, 191, 134))
        draw.pieslice([(px - 4, cy - 10), (px + 14, cy + 4)], 170, 360, fill=(22, 163, 74))
        draw.rectangle([(px - 2, cy + 8), (px + 12, cy + 34)], fill=(255, 255, 255)) # White apron
        draw.line([(px + 5, cy + 8), (px + 5, cy + 34)], fill=(22, 163, 74), width=3)
        draw.line([(px, cy + 34), (px, cy + 58)], fill=(30, 41, 59), width=4)
        draw.line([(px + 8, cy + 34), (px + 8, cy + 58)], fill=(30, 41, 59), width=4)

        # Progress bar: Stage 1 (Preparing) is active
        draw_progress_track(draw, active_step_idx=1, frame_idx=f)
        draw.rounded_rectangle([(1, 1), (WIDTH - 2, HEIGHT - 2)], radius=20, outline=COLOR_GRAY_LINE, width=2)

        paletted = im.convert("RGB").quantize(colors=128)
        frames.append(paletted)

    frames[0].save(filepath, save_all=True, append_images=frames[1:], duration=120, loop=0, optimize=True)
    print(f"Generated {filepath} ({os.path.getsize(filepath)} bytes)")

# ============================================================
# Stage 3: OUT FOR DELIVERY (Electric Delivery Scooter / Fast Runner)
# ============================================================
def generate_out_for_delivery_gif(filepath, num_frames=8):
    frames = []
    for f in range(num_frames):
        im = Image.new("RGBA", (WIDTH, HEIGHT), (255, 255, 255, 255))
        draw = ImageDraw.Draw(im)

        draw_scenery_background(draw)
        draw_lpu_building(draw)
        draw_hostel_room_door(draw, room_text="BH13")

        # Scooter Delivery at x ≈ 340
        sc_x = 310 + int((f / num_frames) * 70)
        sc_y = 135
        bob = int(math.sin((f / num_frames) * 2 * math.pi) * 2)

        # Motion Trails behind scooter
        draw.line([(sc_x - 60, sc_y + 24), (sc_x - 25, sc_y + 24)], fill=(34, 197, 94), width=3)
        draw.line([(sc_x - 45, sc_y + 32), (sc_x - 15, sc_y + 32)], fill=(16, 185, 129), width=2)

        # Electric Scooter Body (Green & Yellow)
        # Rear wheel
        draw.ellipse([(sc_x - 22, sc_y + 20), (sc_x - 2, sc_y + 40)], fill=(30, 41, 59))
        draw.ellipse([(sc_x - 17, sc_y + 25), (sc_x - 7, sc_y + 35)], fill=(226, 232, 240))
        # Front wheel
        draw.ellipse([(sc_x + 30, sc_y + 20), (sc_x + 50, sc_y + 40)], fill=(30, 41, 59))
        draw.ellipse([(sc_x + 35, sc_y + 25), (sc_x + 45, sc_y + 35)], fill=(226, 232, 240))
        # Scooter deck & chassis
        draw.polygon([
            (sc_x - 15, sc_y + 28),
            (sc_x + 35, sc_y + 28),
            (sc_x + 30, sc_y + 12),
            (sc_x + 22, sc_y + 12),
            (sc_x - 10, sc_y + 18)
        ], fill=(22, 163, 74))
        # Steering handlebar
        draw.line([(sc_x + 28, sc_y + 15), (sc_x + 24, sc_y - 12)], fill=(71, 85, 105), width=3)
        draw.line([(sc_x + 20, sc_y - 12), (sc_x + 28, sc_y - 12)], fill=(30, 41, 59), width=4)
        # Headlight beam
        draw.polygon([(sc_x + 32, sc_y - 6), (sc_x + 65, sc_y - 14), (sc_x + 65, sc_y + 2)], fill=(254, 240, 138, 90))

        # Rider on scooter
        ry = sc_y - 30 + bob
        # Bag on back
        draw.rounded_rectangle([(sc_x - 28, ry + 2), (sc_x - 6, ry + 28)], radius=5, fill=(16, 185, 129), outline=(5, 150, 105), width=2)
        draw.text((sc_x - 24, ry + 5), "LPU", fill=(255, 255, 255), font=font_bold_9)
        draw.text((sc_x - 26, ry + 15), "Quick", fill=(255, 255, 255), font=font_bold_9)

        # Torso & Legs
        draw.polygon([(sc_x - 6, ry + 6), (sc_x + 12, ry + 6), (sc_x + 10, ry + 32), (sc_x - 4, ry + 32)], fill=(22, 163, 74))
        draw.polygon([(sc_x - 4, ry + 32), (sc_x + 12, ry + 32), (sc_x + 14, ry + 44), (sc_x - 2, ry + 44)], fill=(30, 41, 59))
        # Arm reaching handlebar
        draw.line([(sc_x + 8, ry + 12), (sc_x + 24, ry + 18)], fill=(22, 163, 74), width=4)
        draw.ellipse([(sc_x + 22, ry + 16), (sc_x + 26, ry + 20)], fill=(251, 191, 134))

        # Head & Cap
        draw.ellipse([(sc_x + 2, ry - 14), (sc_x + 16, ry)], fill=(251, 191, 134))
        draw.pieslice([(sc_x, ry - 16), (sc_x + 18, ry - 4)], 170, 360, fill=(22, 163, 74))
        draw.polygon([(sc_x + 12, ry - 10), (sc_x + 24, ry - 7), (sc_x + 16, ry - 5)], fill=(15, 118, 54))

        # Progress bar: Stage 2 (Out for Delivery) is active
        draw_progress_track(draw, active_step_idx=2, frame_idx=f)
        draw.rounded_rectangle([(1, 1), (WIDTH - 2, HEIGHT - 2)], radius=20, outline=COLOR_GRAY_LINE, width=2)

        paletted = im.convert("RGB").quantize(colors=128)
        frames.append(paletted)

    frames[0].save(filepath, save_all=True, append_images=frames[1:], duration=120, loop=0, optimize=True)
    print(f"Generated {filepath} ({os.path.getsize(filepath)} bytes)")

# ============================================================
# Stage 4: NEAR YOUR ROOM (Reference Image exact match!)
# ============================================================
def generate_near_room_gif(filepath, num_frames=8):
    frames = []
    for f in range(num_frames):
        im = Image.new("RGBA", (WIDTH, HEIGHT), (255, 255, 255, 255))
        draw = ImageDraw.Draw(im)

        draw_scenery_background(draw)
        draw_lpu_building(draw)
        draw_hostel_room_door(draw, room_text="BH13")

        runner_x = 420 + int(math.sin((f / num_frames) * 2 * math.pi) * 8)
        draw_delivery_runner(draw, runner_x, 105, frame_idx=f)

        # Progress bar: Stage 3 (Arriving 1-2 min) is active
        draw_progress_track(draw, active_step_idx=3, frame_idx=f)
        draw.rounded_rectangle([(1, 1), (WIDTH - 2, HEIGHT - 2)], radius=20, outline=COLOR_GRAY_LINE, width=2)

        paletted = im.convert("RGB").quantize(colors=128)
        frames.append(paletted)

    frames[0].save(filepath, save_all=True, append_images=frames[1:], duration=120, loop=0, optimize=True)
    print(f"Generated {filepath} ({os.path.getsize(filepath)} bytes)")

# ============================================================
# Stage 5: ARRIVED AT YOUR ROOM
# ============================================================
def generate_arrived_gif(filepath, num_frames=8):
    frames = []
    for f in range(num_frames):
        im = Image.new("RGBA", (WIDTH, HEIGHT), (255, 255, 255, 255))
        draw = ImageDraw.Draw(im)

        draw_scenery_background(draw)
        draw_lpu_building(draw)
        draw_hostel_room_door(draw, room_text="BH13")

        # Runner at Room Door delivering package
        rx = 575
        cy = 105
        bob = int(math.sin((f / num_frames) * 2 * math.pi) * 2)

        # Runner body
        draw.ellipse([(rx - 2, cy - 8 + bob), (rx + 12, cy + 8 + bob)], fill=(251, 191, 134))
        draw.pieslice([(rx - 4, cy - 10 + bob), (rx + 14, cy + 4 + bob)], 170, 360, fill=(22, 163, 74))
        draw.polygon([(rx + 8, cy - 6 + bob), (rx + 18, cy - 4 + bob), (rx + 12, cy - 2 + bob)], fill=(15, 118, 54))
        draw.rectangle([(rx - 2, cy + 8 + bob), (rx + 12, cy + 34 + bob)], fill=(22, 163, 74))
        draw.rectangle([(rx - 2, cy + 34 + bob), (rx + 12, cy + 44 + bob)], fill=(30, 41, 59))
        draw.line([(rx, cy + 44), (rx, cy + 68)], fill=(30, 41, 59), width=4)
        draw.line([(rx + 8, cy + 44), (rx + 8, cy + 68)], fill=(30, 41, 59), width=4)

        # Delivering the green bag towards doorway
        bag_x = rx + 16
        bag_y = cy + 12 + bob
        draw.rounded_rectangle([(bag_x, bag_y), (bag_x + 28, bag_y + 26)], radius=4, fill=(16, 185, 129), outline=(5, 150, 105), width=2)
        draw.line([(bag_x + 8, bag_y - 3), (bag_x + 20, bag_y - 3)], fill=(255, 255, 255), width=2)
        draw.text((bag_x + 4, bag_y + 3), "LPU", fill=(255, 255, 255), font=font_bold_9)
        draw.text((bag_x + 2, bag_y + 12), "Quick", fill=(255, 255, 255), font=font_bold_9)

        # Hands holding bag
        draw.line([(rx + 10, cy + 16 + bob), (bag_x + 4, cy + 18 + bob)], fill=(22, 163, 74), width=4)

        # Confetti & Party Poppers in Air
        for ci, (c_x, c_y, col) in enumerate([
            (520, 60, (239, 68, 68)),
            (550, 45, (245, 158, 11)),
            (580, 55, (59, 130, 246)),
            (610, 40, (34, 197, 94)),
            (640, 50, (236, 72, 153)),
            (535, 75, (168, 85, 247)),
            (595, 70, (234, 179, 8)),
        ]):
            confetti_y = c_y + int((f * 4 + ci * 5) % 35)
            draw.ellipse([(c_x - 3, confetti_y - 3), (c_x + 3, confetti_y + 3)], fill=col)

        # Progress bar: Stage 4 (Arrived) is active & fully completed
        draw_progress_track(draw, active_step_idx=4, frame_idx=f)
        draw.rounded_rectangle([(1, 1), (WIDTH - 2, HEIGHT - 2)], radius=20, outline=COLOR_GRAY_LINE, width=2)

        paletted = im.convert("RGB").quantize(colors=128)
        frames.append(paletted)

    frames[0].save(filepath, save_all=True, append_images=frames[1:], duration=120, loop=0, optimize=True)
    print(f"Generated {filepath} ({os.path.getsize(filepath)} bytes)")

# ============================================================
# Stage 6: STORE IS OPEN NOTIFICATION BANNER
# ============================================================
def generate_store_open_gif(filepath, num_frames=8):
    frames = []
    for f in range(num_frames):
        im = Image.new("RGBA", (WIDTH, HEIGHT), (255, 255, 255, 255))
        draw = ImageDraw.Draw(im)

        draw_scenery_background(draw)
        draw_lpu_building(draw)

        pulse = (f % 8) / 8.0
        glow_r = int(10 + math.sin(pulse * 2 * math.pi) * 4)

        # Center Store Open Banner Card
        bx1, bx2 = 250, 680
        by1, by2 = 45, 180

        draw.rounded_rectangle([(bx1 + 2, by1 + 4), (bx2 + 2, by2 + 4)], radius=18, fill=(0, 0, 0, 30))
        draw.rounded_rectangle([(bx1, by1), (bx2, by2)], radius=18, fill=(255, 255, 255), outline=(22, 163, 74), width=3)

        # Glowing Open Badge
        badge_y = by1 + 18
        draw.rounded_rectangle([(bx1 + 20, badge_y), (bx1 + 155, badge_y + 26)], radius=13, fill=(22, 163, 74))
        # Pulsing dot
        draw.ellipse([(bx1 + 30 - glow_r // 3, badge_y + 13 - glow_r // 3), (bx1 + 30 + glow_r // 3, badge_y + 13 + glow_r // 3)], fill=(187, 247, 208))
        draw.ellipse([(bx1 + 28, badge_y + 11), (bx1 + 32, badge_y + 15)], fill=(255, 255, 255))
        draw.text((bx1 + 40, badge_y + 5), "STORE IS OPEN", fill=(255, 255, 255), font=font_bold_11)

        # Speed chip: 10 MINS TO ROOM
        draw.rounded_rectangle([(bx1 + 165, badge_y), (bx1 + 295, badge_y + 26)], radius=13, fill=(240, 253, 244), outline=(34, 197, 94), width=1)
        draw.text((bx1 + 175, badge_y + 6), "⚡ 10 MINS TO ROOM", fill=(21, 128, 61), font=font_bold_10)

        # Main Headline
        draw.text((bx1 + 20, by1 + 54), "LPUQuick is Ready to Deliver!", fill=(30, 41, 59), font=font_hero)
        draw.text((bx1 + 20, by1 + 80), "Order your hostel snacks, drinks & late-night essentials now.", fill=(71, 85, 105), font=font_reg_11)

        # CTA Button
        draw.rounded_rectangle([(bx1 + 20, by1 + 104), (bx1 + 160, by1 + 134)], radius=15, fill=(22, 163, 74))
        draw.text((bx1 + 42, by1 + 110), "ORDER NOW 🛒", fill=(255, 255, 255), font=font_bold_11)

        # Cheerful Runner on Right
        rx = bx2 - 45
        cy = by1 + 55
        draw.ellipse([(rx - 2, cy - 8), (rx + 12, cy + 8)], fill=(251, 191, 134))
        draw.pieslice([(rx - 4, cy - 10), (rx + 14, cy + 4)], 170, 360, fill=(22, 163, 74))
        draw.rectangle([(rx - 2, cy + 8), (rx + 12, cy + 36)], fill=(22, 163, 74))
        draw.line([(rx, cy + 36), (rx, cy + 62)], fill=(30, 41, 59), width=4)
        draw.line([(rx + 8, cy + 36), (rx + 8, cy + 62)], fill=(30, 41, 59), width=4)
        # Thumbs up hand
        draw.ellipse([(rx + 14, cy + 12), (rx + 22, cy + 20)], fill=(251, 191, 134))

        # Bottom Bar: Campus Delivery Info
        draw.line([(40, 238), (700, 238)], fill=COLOR_GREEN, width=4)
        draw.text((50, 252), "🟢 LIVE CAMPUS DISPATCH", fill=COLOR_GREEN_DARK, font=font_bold_12)
        draw.text((260, 254), "All Boys & Girls Hostels Active • 10-Min Fast Delivery", fill=COLOR_DARK_TEXT, font=font_bold_11)

        draw.rounded_rectangle([(1, 1), (WIDTH - 2, HEIGHT - 2)], radius=20, outline=COLOR_GRAY_LINE, width=2)

        paletted = im.convert("RGB").quantize(colors=128)
        frames.append(paletted)

    frames[0].save(filepath, save_all=True, append_images=frames[1:], duration=120, loop=0, optimize=True)
    print(f"Generated {filepath} ({os.path.getsize(filepath)} bytes)")

# Run all generators
os.makedirs("client/img", exist_ok=True)
os.makedirs("public/img", exist_ok=True)

generate_confirmed_gif("client/img/notif_confirmed.gif")
generate_preparing_gif("client/img/notif_preparing.gif")
generate_out_for_delivery_gif("client/img/notif_out_for_delivery.gif")
generate_near_room_gif("client/img/notif_near_room.gif")
generate_arrived_gif("client/img/notif_arrived.gif")
generate_store_open_gif("client/img/notif_store_open.gif")

# Also update legacy aliases for 100% backwards compatibility
shutil.copyfile("client/img/notif_confirmed.gif", "client/img/notif_placed.gif")
shutil.copyfile("client/img/notif_near_room.gif", "client/img/notif_running.gif")
shutil.copyfile("client/img/notif_arrived.gif", "client/img/notif_delivered.gif")

# Sync to public/img/
for fname in [
    "notif_confirmed.gif",
    "notif_preparing.gif",
    "notif_out_for_delivery.gif",
    "notif_near_room.gif",
    "notif_arrived.gif",
    "notif_store_open.gif",
    "notif_placed.gif",
    "notif_running.gif",
    "notif_delivered.gif"
]:
    shutil.copyfile(os.path.join("client/img", fname), os.path.join("public/img", fname))

print("All notification GIFs generated and synchronized to public/img successfully!")
