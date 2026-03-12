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
 * Stage 2: Product Injection
 * Composites a real product PNG into the generated AI background.
 */
export const injectProductIntoScene = async (params: InjectionParams): Promise<string> => {
    logger.info(`Injecting product into scene: ${params.productPath}`);

    const [bgImage, productImg] = await Promise.all([
        loadImage(params.backgroundPath),
        loadImage(params.productPath)
    ]);

    const W = bgImage.width || 1024;
    const H = bgImage.height || 1024;

    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    // 1. Draw Background
    ctx.drawImage(bgImage, 0, 0, W, H);

    // 2. Calculate Product Placement (Rule of Thirds)
    // Based on subject orientation, place product on the opposite side.
    let productX = W * 0.15; // Default left
    if (params.designStyle.subject_orientation === 'facing left') {
        productX = W * 0.60; // Place on right
    } else if (params.designStyle.subject_orientation === 'facing right') {
        productX = W * 0.10; // Place on left
    } else {
        productX = W * 0.30; // Center-ish
    }

    const productY = H * 0.40;
    const targetWidth = W * 0.35; // Occupy ~35% of frame width
    const scale = targetWidth / productImg.width;
    const targetHeight = productImg.height * scale;

    ctx.save();

    // 3. Add Contact Shadow
    // Simple drop shadow for realism
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 40;
    ctx.shadowOffsetX = 10;
    ctx.shadowOffsetY = 20;

    // 4. Draw Product
    ctx.drawImage(productImg, productX, productY, targetWidth, targetHeight);

    // 5. Apply Scene Lighting Match
    // If lighting is from right, add a subtle highlight on the right side of the product
    if (params.designStyle.lighting_direction.includes('right')) {
        ctx.globalCompositeOperation = 'overlay';
        const grad = ctx.createLinearGradient(productX, productY, productX + targetWidth, productY);
        grad.addColorStop(1, 'rgba(255,255,255,0.3)');
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(productX, productY, targetWidth, targetHeight);
    }

    ctx.restore();

    // Save Output
    const dir = path.dirname(params.outputPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    fs.writeFileSync(params.outputPath, canvas.toBuffer('image/png'));
    logger.info(`Product injection completed: ${params.outputPath}`);

    return params.outputPath;
};
