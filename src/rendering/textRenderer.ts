import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas';
import * as path from 'path';
import * as fs from 'fs';
import { logger } from '../utils/logger';
import { AdLayout } from './layoutEngine';
import { DesignStyle } from '../vision/designStyleAnalyzer';

// Register Arabic fonts from the bundled assets directory
const fontsDir = path.resolve(process.cwd(), 'src', 'rendering', 'fonts');
const tryRegisterFont = (file: string, family: string) => {
    const fontPath = path.join(fontsDir, file);
    if (fs.existsSync(fontPath)) {
        GlobalFonts.registerFromPath(fontPath, family);
    }
};
tryRegisterFont('Cairo-Bold.ttf', 'Cairo');
tryRegisterFont('Cairo-Regular.ttf', 'CairoRegular');

// Resolve Y position from competitor's design style positions
const resolveYPosition = (position: string, H: number): number => {
    const p = position.toLowerCase();
    if (p.includes('top')) return H * 0.12;
    if (p.includes('center')) return H * 0.50;
    if (p.includes('bottom')) return H * 0.82;
    return H * 0.50;
};

export const renderTypography = async (
    backgroundImagePath: string,
    layout: AdLayout,
    outputPath: string,
    designStyle?: DesignStyle | null
): Promise<string> => {
    logger.info(`Rendering typography. Design style: ${designStyle?.text_effects?.join(', ')}`);

    const bgImage = await loadImage(backgroundImagePath);
    const W = bgImage.width || 1024;
    const H = bgImage.height || 1024;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    // Draw background
    ctx.drawImage(bgImage, 0, 0, W, H);

    // Dark gradient overlay — position based on where text will go
    const headlineY = resolveYPosition(designStyle?.headline_position || 'center', H);
    const gradCenter = headlineY > H * 0.5 ? 0.5 : 0.0;
    const grad = ctx.createLinearGradient(0, H * gradCenter, 0, H);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.75)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Text color from competitor style (default white)
    const textColor = designStyle?.text_color?.startsWith('#')
        ? designStyle.text_color
        : '#ffffff';
    const effects = designStyle?.text_effects || ['drop shadow'];
    const hasGlow = effects.some(e => e.toLowerCase().includes('glow'));
    const hasStroke = effects.some(e => e.toLowerCase().includes('stroke'));

    const drawText = (
        text: string,
        x: number,
        y: number,
        fontSize: number,
        fontFamily: string,
        color: string = textColor,
        align: CanvasTextAlign = 'center',
        maxWidth: number = W - 80
    ) => {
        ctx.save();
        ctx.font = `${fontSize}px "${fontFamily}"`;
        ctx.textAlign = align;
        ctx.direction = 'rtl';

        // Drop shadow (always)
        ctx.shadowColor = 'rgba(0,0,0,0.85)';
        ctx.shadowBlur = 18;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 4;

        // Glow pass
        if (hasGlow) {
            ctx.shadowColor = 'rgba(120,180,255,0.6)';
            ctx.shadowBlur = 28;
            ctx.fillStyle = color;
            ctx.fillText(text, x, y, maxWidth);
            ctx.shadowBlur = 0;
        }

        // Stroke outline
        if (hasStroke) {
            ctx.strokeStyle = 'rgba(0,0,0,0.7)';
            ctx.lineWidth = Math.max(fontSize * 0.06, 1.5);
            ctx.lineJoin = 'round';
            ctx.strokeText(text, x, y, maxWidth);
        }

        // Final text fill
        ctx.shadowColor = 'rgba(0,0,0,0.7)';
        ctx.shadowBlur = 12;
        ctx.fillStyle = color;
        ctx.fillText(text, x, y, maxWidth);
        ctx.restore();
    };

    const cx = W / 2;

    // Brand name — always top
    if (layout.brandName) {
        drawText(layout.brandName, cx, H * 0.07, 26, 'CairoRegular', 'rgba(255,255,255,0.80)');
    }

    // Headline — use competitor position
    if (layout.headline) {
        const hY = resolveYPosition(designStyle?.headline_position || 'center', H);
        const fontSize = Math.min(68, W / Math.max(layout.headline.length * 0.55, 4));
        drawText(layout.headline, cx, hY, fontSize, 'Cairo');
    }

    // Subheadline — below headline or competitor subtitile position
    if (layout.subheadline) {
        const subBase = resolveYPosition(designStyle?.subtitle_position || 'below headline', H);
        drawText(layout.subheadline, cx, subBase, 32, 'CairoRegular', 'rgba(230,230,230,0.95)');
    }

    // CTA — use competitor cta position
    if (layout.cta) {
        const ctaY = resolveYPosition(designStyle?.cta_position || 'bottom center', H);
        const ctaW = 300;
        const ctaH = 52;
        const ctaX = cx - ctaW / 2;
        const r = 26;

        // CTA pill background
        ctx.save();
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.strokeStyle = 'rgba(255,255,255,0.65)';
        ctx.lineWidth = 1.5;
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

        drawText(layout.cta, cx, ctaY + 10, 24, 'Cairo');
    }

    // Save
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(outputPath, canvas.toBuffer('image/png'));
    logger.info(`Final ad saved: ${outputPath}`);
    return outputPath;
};
