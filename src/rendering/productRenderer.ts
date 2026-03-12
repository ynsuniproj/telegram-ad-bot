import { createCanvas, loadImage } from '@napi-rs/canvas';
import { logger } from '../utils/logger';
import { DesignStyle } from '../vision/designStyleAnalyzer';
import * as fs from 'fs';
import * as path from 'path';

export interface InjectionParams {
    backgroundPath: string;
    productPath: string;
    outputPath: string;
    designStyle: DesignStyle;
}

/**
 * Stage 2: Product Injection (Refined)
 * Composites a real product image into the background with scene integration.
 */
export const injectProductIntoScene = async (params: InjectionParams): Promise<string> => {
    logger.info(`Injecting product with deep integration: ${params.productPath}`);

    const [bgImage, rawProductImg] = await Promise.all([
        loadImage(params.backgroundPath),
        loadImage(params.productPath)
    ]);

    const W = bgImage.width || 1024;
    const H = bgImage.height || 1024;

    // Create a temporary canvas to process the product image (remove background, tint, etc.)
    const pW = rawProductImg.width;
    const pH = rawProductImg.height;
    const pCanvas = createCanvas(pW, pH);
    const pCtx = pCanvas.getContext('2d');
    pCtx.drawImage(rawProductImg, 0, 0);

    // 1. Automatic White Background Removal
    const pData = pCtx.getImageData(0, 0, pW, pH);
    const pixels = pData.data;
    for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        // If color is near white (threshold 240)
        if (r > 240 && g > 240 && b > 240) {
            pixels[i + 3] = 0; // Set alpha to 0
        }
    }
    pCtx.putImageData(pData, 0, 0);

    // 2. Color Matching / Tinting
    // We use 'source-atop' to apply a subtle tint based on the extracted scene color temperature
    let tintColor = 'rgba(255,255,255,0)'; // Default neutral
    const temp = (params.designStyle.scene_color_temp || 'neutral').toLowerCase();

    if (temp.includes('warm') || temp.includes('sunset') || temp.includes('gold')) {
        tintColor = 'rgba(255,180,50,0.08)';
    } else if (temp.includes('cool') || temp.includes('blue')) {
        tintColor = 'rgba(50,150,255,0.08)';
    } else if (temp.includes('neon') || temp.includes('purple')) {
        tintColor = 'rgba(200,50,255,0.12)';
    } else if (temp.includes('dark')) {
        tintColor = 'rgba(0,0,0,0.15)';
    }

    pCtx.save();
    pCtx.globalCompositeOperation = 'source-atop';
    pCtx.fillStyle = tintColor;
    pCtx.fillRect(0, 0, pW, pH);
    pCtx.restore();

    // Main Canvas Construction
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bgImage, 0, 0, W, H);

    // 3. Rule of Thirds Placement
    let productX = W * 0.12;
    if (params.designStyle.subject_orientation === 'facing left') {
        productX = W * 0.65;
    } else if (params.designStyle.subject_orientation === 'facing right') {
        productX = W * 0.08;
    }

    const productY = H * 0.45;
    const targetWidth = W * 0.32;
    const scale = targetWidth / pW;
    const targetHeight = pH * scale;

    ctx.save();

    // 4. Perspective Matching (Slight Rotation)
    const rotation = params.designStyle.subject_orientation === 'facing left' ? -0.05 : 0.05;
    ctx.translate(productX + targetWidth / 2, productY + targetHeight / 2);
    ctx.rotate(rotation);
    ctx.translate(-(productX + targetWidth / 2), -(productY + targetHeight / 2));

    // 5. Realistic Shadows (Directional)
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 30;
    ctx.shadowOffsetX = params.designStyle.lighting_direction.includes('left') ? 25 : -25;
    ctx.shadowOffsetY = 15;

    // 6. Final Composite
    ctx.drawImage(pCanvas, productX, productY, targetWidth, targetHeight);

    // 7. Depth of Field (Edge Softening)
    ctx.globalCompositeOperation = 'destination-over'; // Draw behind to check edges or use a filter if supported
    // Since we want edge softening, we draw the product again with a very slight blur if supported
    // Alternatively, just draw a feathered shadow or glow

    ctx.restore();

    // Save Output
    const dir = path.dirname(params.outputPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(params.outputPath, canvas.toBuffer('image/png'));

    logger.info(`Deep-integrated product saved: ${params.outputPath}`);
    return params.outputPath;
};
