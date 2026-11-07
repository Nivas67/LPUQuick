import os
import math
import shutil
from PIL import Image, ImageDraw, ImageFont, ImageFilter

def create_gifs():
    # Base reference image
    ref = Image.open('exact_banner.png').convert('RGBA')
    W, H = 720, 200
    ref_scaled = ref.resize((W, H), Image.LANCZOS)

    # Scenery background (upper part)
    # y: 0 to 130
    scenery = ref_scaled.crop((0, 0, W, 130))

    # Stepper y: 130 to 200
    # Clean white background for lower stepper
    stepper_bg = Image.new('RGBA', (W, 70), (248, 250, 252, 255))

    # Fonts
    try:
        font_badge = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 13)
        font_tiny = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 11)
        font_status = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 15)
    except:
        font_badge = ImageFont.load_default()
        font_tiny = font_badge
        font_status = font_badge

    GREEN_ACCENT = (16, 185, 129, 255)       # #10b981
    GREEN_DARK = (5, 150, 105, 255)          # #059669
    GREEN_LIGHT = (209, 250, 229, 255)       # #d1fae5
    GREY_INACTIVE = (209, 213, 219, 255)     # #d1d5db
    GREY_TEXT = (107, 114, 128, 255)         # #6b7280
    WHITE = (255, 255, 255, 255)

    CHECKPOINTS_X = [85, 210, 340, 480, 620]
    STEPPER_Y = 152

    LABELS = [
        'Confirmed',
        'Preparing',
        'Out for Delivery',
        'Arriving (1-2 min)',
        'Arrived'
    ]

    stages_config = [
        {
            'name': 'notif_confirmed.gif',
            'alias': 'notif_placed.gif',
            'stage_index': 0,
            'title': 'ORDER CONFIRMED',
            'eta': 'Arriving in 8-10 mins',
            'runner_progress': 0.12,
            'status_pill': 'VERIFIED BY DARK STORE'
        },
        {
            'name': 'notif_preparing.gif',
            'alias': None,
            'stage_index': 1,
            'title': 'PREPARING',
            'eta': 'Arriving in 5-6 mins',
            'runner_progress': 0.32,
            'status_pill': 'PACKING YOUR SNACKS'
        },
        {
            'name': 'notif_out_for_delivery.gif',
            'alias': None,
            'stage_index': 2,
            'title': 'OUT FOR DELIVERY',
            'eta': 'Arriving in 3-4 mins 🛵',
            'runner_progress': 0.55,
            'status_pill': 'ON THE WAY TO HOSTEL'
        },
        {
            'name': 'notif_near_room.gif',
            'alias': 'notif_running.gif',
            'stage_index': 3,
            'title': 'NEAR YOUR ROOM',
            'eta': 'Arriving in 1-2 minutes! 🚀',
            'runner_progress': 0.85,
            'status_pill': 'RUNNING TO YOUR ROOM (BH13)'
        },
        {
            'name': 'notif_arrived.gif',
            'alias': 'notif_delivered.gif',
            'stage_index': 4,
            'title': 'ARRIVED AT YOUR ROOM',
            'eta': 'Arrived at your Room! ✓',
            'runner_progress': 0.98,
            'status_pill': 'ORDER DELIVERED 🎉'
        }
    ]

    for cfg in stages_config:
        frames = []
        active_idx = cfg['stage_index']
        
        # 8 frames per animation cycle
        for f in range(8):
            phase = (f / 8.0) * 2 * math.pi
            
            # Base frame from reference banner
            frame = ref_scaled.copy()
            draw = ImageDraw.Draw(frame, 'RGBA')

            # Dynamic Floating Live Capsule at top right
            pulse_alpha = int(180 + 75 * math.sin(phase))
            draw.rounded_rectangle((W - 190, 8, W - 12, 34), radius=13, fill=(15, 23, 42, 210), outline=(16, 185, 129, 200), width=1)
            # Pulsing Live Dot
            draw.ellipse((W - 176, 17, W - 168, 25), fill=(16, 185, 129, pulse_alpha))
            draw.text((W - 160, 13), 'LIVE TRACKING', fill=(255, 255, 255, 240), font=font_badge)

            # Stage Status Pill on top left
            draw.rounded_rectangle((12, 8, 250, 34), radius=13, fill=(16, 185, 129, 230))
            draw.text((24, 13), f"● {cfg['title']}", fill=(255, 255, 255, 255), font=font_badge)

            # Re-draw stepper area cleanly for each stage
            draw.rectangle((0, 130, W, H), fill=(248, 250, 252, 255))
            
            # Stepper background track line
            draw.line([(CHECKPOINTS_X[0], STEPPER_Y), (CHECKPOINTS_X[-1], STEPPER_Y)], fill=GREY_INACTIVE, width=4)
            
            # Stepper active green track line
            if active_idx > 0:
                end_x = CHECKPOINTS_X[active_idx]
                draw.line([(CHECKPOINTS_X[0], STEPPER_Y), (end_x, STEPPER_Y)], fill=GREEN_ACCENT, width=4)
            
            # Render all 5 checkpoints
            for i, (cx, label) in enumerate(zip(CHECKPOINTS_X, LABELS)):
                if i < active_idx:
                    # Completed: solid green circle with white check
                    draw.ellipse((cx - 11, STEPPER_Y - 11, cx + 11, STEPPER_Y + 11), fill=GREEN_ACCENT)
                    draw.line([(cx - 5, STEPPER_Y), (cx - 1, STEPPER_Y + 4), (cx + 5, STEPPER_Y - 3)], fill=WHITE, width=2)
                    draw.text((cx, STEPPER_Y + 16), label, fill=GREEN_DARK, font=font_tiny, anchor='mt')
                elif i == active_idx:
                    # Active: glowing animated pulsing ring
                    glow_rad = 17 + int(4 * math.sin(phase))
                    ring_rad = 13 + int(2 * math.sin(phase))
                    draw.ellipse((cx - glow_rad, STEPPER_Y - glow_rad, cx + glow_rad, STEPPER_Y + glow_rad), fill=(16, 185, 129, 65))
                    draw.ellipse((cx - ring_rad, STEPPER_Y - ring_rad, cx + ring_rad, STEPPER_Y + ring_rad), fill=GREEN_ACCENT)
                    if active_idx == 4:
                        # Arrived checkmark
                        draw.line([(cx - 5, STEPPER_Y), (cx - 1, STEPPER_Y + 4), (cx + 5, STEPPER_Y - 3)], fill=WHITE, width=2)
                    else:
                        # Inner white pulse dot
                        draw.ellipse((cx - 5, STEPPER_Y - 5, cx + 5, STEPPER_Y + 5), fill=WHITE)
                    draw.text((cx, STEPPER_Y + 18), label, fill=GREEN_DARK, font=font_tiny, anchor='mt')
                else:
                    # Incomplete: grey circle
                    draw.ellipse((cx - 9, STEPPER_Y - 9, cx + 9, STEPPER_Y + 9), fill=GREY_INACTIVE)
                    draw.text((cx, STEPPER_Y + 16), label, fill=GREY_TEXT, font=font_tiny, anchor='mt')

            # Add subtle motion trail for active runner in stage 3 & 4
            if active_idx == 3: # Near room
                trail_shift = int(3 * math.sin(phase * 2))
                for trail in range(3):
                    tx = 350 + trail * 15 + trail_shift
                    draw.line([(tx, 75), (tx + 12, 75)], fill=(16, 185, 129, 120 - trail * 35), width=2)
                    draw.line([(tx - 6, 82), (tx + 8, 82)], fill=(16, 185, 129, 100 - trail * 30), width=2)

            # Convert RGBA to RGB with clean palette for GIF
            frame_rgb = frame.convert('RGB').quantize(colors=128, method=Image.MEDIANCUT)
            frames.append(frame_rgb)

        out_name = cfg['name']
        out_path_client = os.path.join('client', 'img', out_name)
        out_path_public = os.path.join('public', 'img', out_name)

        frames[0].save(
            out_path_client,
            save_all=True,
            append_images=frames[1:],
            duration=120,
            loop=0,
            optimize=True
        )
        shutil.copyfile(out_path_client, out_path_public)
        print(f"Generated {out_name} ({round(os.path.getsize(out_path_client)/1024, 1)} KB)")

        if cfg['alias']:
            alias_client = os.path.join('client', 'img', cfg['alias'])
            alias_public = os.path.join('public', 'img', cfg['alias'])
            shutil.copyfile(out_path_client, alias_client)
            shutil.copyfile(out_path_client, alias_public)
            print(f"  -> Aliased to {cfg['alias']}")

    # Also generate notif_store_open.gif
    store_frames = []
    for f in range(6):
        phase = (f / 6.0) * 2 * math.pi
        frame = Image.new('RGB', (W, H), (15, 23, 42)) # Deep navy campus night
        draw = ImageDraw.Draw(frame)

        # Campus store glow
        glow_rad = int(80 + 15 * math.sin(phase))
        draw.ellipse((W//2 - glow_rad, H//2 - glow_rad, W//2 + glow_rad, H//2 + glow_rad), fill=(5, 150, 105))

        # Store Banner
        draw.rounded_rectangle((30, 25, W - 30, H - 25), radius=16, fill=(16, 185, 129), outline=(52, 211, 153), width=2)
        draw.text((W//2, 50), '✨ LPUQUICK CAMPUS STORE IS NOW OPEN! ✨', fill=(255, 255, 255), font=font_status, anchor='mt')
        draw.text((W//2, 90), '⚡ 3-Minute Lightning Delivery to Your Hostel Room', fill=(255, 255, 255), font=font_badge, anchor='mt')
        draw.text((W//2, 130), 'BH13 • BH12 • GH1 & All Campus Hostels Active', fill=(209, 250, 229), font=font_tiny, anchor='mt')

        store_frames.append(frame.quantize(colors=64))

    store_client = os.path.join('client', 'img', 'notif_store_open.gif')
    store_public = os.path.join('public', 'img', 'notif_store_open.gif')
    store_frames[0].save(store_client, save_all=True, append_images=store_frames[1:], duration=150, loop=0, optimize=True)
    shutil.copyfile(store_client, store_public)
    print(f"Generated notif_store_open.gif ({round(os.path.getsize(store_client)/1024, 1)} KB)")

if __name__ == '__main__':
    create_gifs()

