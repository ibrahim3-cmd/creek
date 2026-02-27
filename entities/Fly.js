// ========================================
// Fly - Buzzing insect for frogs to catch
// ========================================

export class Fly {
    constructor(pond) {
        this.pond = pond;
        this.x = Math.random() * this.pond.canvas.width;
        this.y = Math.random() * this.pond.canvas.height;
        this.size = 2 + Math.random() * 2;
        this.speed = 2 + Math.random() * 2;
        this.angle = Math.random() * Math.PI * 2;
        this.vx = Math.cos(this.angle) * this.speed;
        this.vy = Math.sin(this.angle) * this.speed;
        this.buzzPhase = Math.random() * Math.PI * 2;
        this.isEaten = false;
        this.caughtBy = null;

        // Flight states: WANDER, LOOP
        this.state = 'WANDER';
        this.stateTimer = 50 + Math.random() * 100;
        this.loopCenter = { x: 0, y: 0 };
        this.loopRadius = 30 + Math.random() * 40;
        this.loopAngle = 0;
        this.loopDir = Math.random() > 0.5 ? 1 : -1;
    }

    update() {
        if (this.isEaten) return false;

        this.buzzPhase += 0.5;
        this.stateTimer--;

        if (this.state === 'WANDER') {
            this.angle += (Math.random() - 0.5) * 0.3;
            this.vx = Math.cos(this.angle) * this.speed;
            this.vy = Math.sin(this.angle) * this.speed;
            this.x += this.vx;
            this.y += this.vy;

            if (this.stateTimer <= 0) {
                this.state = 'LOOP';
                this.stateTimer = 100 + Math.random() * 200;
                this.loopCenter = {
                    x: this.x + Math.cos(this.angle) * this.loopRadius,
                    y: this.y + Math.sin(this.angle) * this.loopRadius
                };
                this.loopAngle = this.angle + Math.PI;
            }
        } else if (this.state === 'LOOP') {
            this.loopAngle += 0.05 * this.loopDir;
            this.x = this.loopCenter.x + Math.cos(this.loopAngle) * this.loopRadius;
            this.y = this.loopCenter.y + Math.sin(this.loopAngle) * this.loopRadius;

            if (this.stateTimer <= 0) {
                this.state = 'WANDER';
                this.stateTimer = 100 + Math.random() * 200;
                this.angle = this.loopAngle + (Math.PI / 2) * this.loopDir;
            }
        }

        // Wrap around
        const padding = 50;
        if (this.x < -padding) this.x = this.pond.canvas.width + padding;
        if (this.x > this.pond.canvas.width + padding) this.x = -padding;
        if (this.y < -padding) this.y = this.pond.canvas.height + padding;
        if (this.y > this.pond.canvas.height + padding) this.y = -padding;

        return true;
    }

    draw(ctx) {
        if (this.isEaten && !this.caughtBy) return;

        const x = this.caughtBy ? this.caughtBy.tongueEndX : this.x;
        const y = this.caughtBy ? this.caughtBy.tongueEndY : this.y;

        ctx.save();
        ctx.translate(x, y);

        const buzz = Math.sin(this.buzzPhase) * 2;
        ctx.translate(buzz, 0);

        // Body
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.ellipse(0, 0, this.size, this.size * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Wings
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.ellipse(-this.size * 0.5, -this.size * 0.8, this.size * 0.7, this.size * 0.4, -0.5, 0, Math.PI * 2);
        ctx.ellipse(-this.size * 0.5, this.size * 0.8, this.size * 0.7, this.size * 0.4, 0.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}
