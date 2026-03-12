import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas';
import * as path from 'path';
import * as fs from 'fs';
import { logger } from '../utils/logger';
import { AdLayout } from './layoutEngine';

// Register bundled Arabic fonts from the assets directory
const fontsDir = path.resolve(process.cwd(), 'src', 'rendering', 'fonts');

const tryRegisterFont = (file: string, family: string) => {
    const fontPath = path.join(fontsDir, file);
    if (fs.existsSync(fontPath)) {
        GlobalFonts.registerFromPath(fontPath, family);
        logger.info(`Font registered: ${family}`);
    } else {
        logger.warn(`Font file not found: ${fontPath}`);
    }
};

tryRegisterFont('Cairo-Bold.ttf', 'Cairo');
tryRegisterFont('Cairo-Regular.ttf', 'CairoRegular');
tryRegisterFont('Tajawal-Bold.ttf', 'Tajawal');

export const renderTypography = async (
    backgroundImagePath: string,
    layout: AdLayout,
    outputPath: string
): Promise<string> => {
    logger.info(`Rendering Arabic typography on: ${backgroundImagePath}`);

    // Load the background image
    const bgImage = await loadImage(backgroundImagePath);
    const W = bgImage.width || 1024;
    const H = bgImage.height || 1024;

    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    // 1. Draw background image
    ctx.drawImage(bgImage, 0, 0, W, H);

    // 2. Add subtle dark gradient overlay at bottom for text legibility
    const grad = ctx.createLinearGradient(0, H * 0.55, 0, H);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.72)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Helper: draw text with glow + shadow
    const drawText = (
        text: string,
        x: number,
        y: number,
        fontSize: number,
        fontFamily: string,
        color: string,
        align: CanvasTextAlign = 'center',
        maxWidth: number = W - 80
    ) => {
        ctx.save();
        ctx.font = `${fontSize}px "${fontFamily}"`;
        ctx.textAlign = align;
        ctx.direction = 'rtl';

        // Drop shadow
        ctx.shadowColor = 'rgba(0,0,0,0.9)';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 4;

        // Outer glow pass
        ctx.strokeStyle = 'rgba(0,0,0,0.6)';
        ctx.lineWidth = fontSize * 0.08;
        ctx.lineJoin = 'round';
        ctx.strokeText(text, x, y, maxWidth);

        // Text fill
        ctx.fillStyle = color;
        ctx.shadowBlur = 0;
        ctx.fillText(text, x, y, maxWidth);

        ctx.restore();
    };

    const cx = W / 2;

    // 3. Brand name — top center
    if (layout.brandName) {
        drawText(layout.brandName, cx, H * 0.08, 28, 'CairoRegular', 'rgba(255,255,255,0.85)');
    }

    // 4. Main headline — center or upper-center
    if (layout.headline) {
        const fontSize = Math.min(72, W / Math.max(layout.headline.length * 0.6, 4));
        drawText(layout.headline, cx, H * 0.52, fontSize, 'Cairo', '#FFFFFF');
    }

    // 5. Sub-headline — just below main headline
    if (layout.subheadline) {
        drawText(layout.subheadline, cx, H * 0.63, 34, 'CairoRegular', 'rgba(220,220,220,0.95)');
    }

    // 6. Call to action — bottom with highlight box
    if (layout.cta) {
        const ctaY = H * 0.84;
        const ctaW = 320;
        const ctaH = 56;
        const ctaX = cx - ctaW / 2;

        // CTA background pill
        ctx.save();
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.strokeStyle = 'rgba(255,255,255,0.6)';
        ctx.lineWidth = 1.5;
        const r = 28;
        ctx.beginPath();
        ctx.moveTo(ctaX + r, ctaY - ctaH / 2);
        ctx.lineTo(ctaX + ctaW - r, ctaY - ctaH / 2);
        ctx.arcTo(ctaX + ctaW, ctaY - ctaH / 2, ctaX + ctaW, ctaY + ctaH / 2, r);
        ctx.lineTo(ctaX + ctaW, ctaY + ctaH / 2);
        ctx.arcTo(ctaX + ctaW, ctaY + ctaH / 2, ctaX + r, ctaY + ctaH / 2, r);
        ctx.lineTo(ctaX + r, ctaY + ctaH / 2);
        ctx.arcTo(ctaX, ctaY + ctaH / 2, ctaX, ctaY - ctaH / 2, r);
        ctx.lineTo(ctaX, ctaY - ctaH / 2);
        ctx.arcTo(ctaX, ctaY - ctaH / 2, ctaX + r, ctaY - ctaH / 2, r);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        drawText(layout.cta, cx, ctaY + 11, 26, 'Cairo', '#FFFFFF');
    }

    // 7. Save output PNG
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);

    logger.info(`Final ad composition saved: ${outputPath}`);
    return outputPath;
};
