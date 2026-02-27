// ========================================
// Splash - Water ripple effect
// ========================================

export class Splash {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 5;
        this.maxRadius = 40 + Math.random() * 20;
        this.opacity = 1;
        this.life = 1;
        this.decay = 0.02 + Math.random() * 0.02;
    }

    update() {
        this.radius += (this.maxRadius - this.radius) * 0.1;
        this.life -= this.decay;
        this.opacity = Math.max(0, this.life);
        return this.life > 0;
    }

    draw(ctx) {
        ctx.save();
        ctx.strokeStyle = `rgba(255, 255, 255, ${this.opacity * 0.6})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = `rgba(255, 255, 255, ${this.opacity * 0.3})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 0.7, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
}
