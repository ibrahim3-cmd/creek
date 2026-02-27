// ========================================
// Bird - Flying overhead birds
// ========================================

export class Bird {
    constructor(pond) {
        this.pond = pond;
        this.reset();
    }

    reset() {
        const side = Math.floor(Math.random() * 4);
        const margin = 200;
        if (side === 0) {
            this.x = -margin;
            this.y = Math.random() * this.pond.canvas.height;
            this.angle = (Math.random() - 0.5) * Math.PI * 0.4;
        } else if (side === 1) {
            this.x = this.pond.canvas.width + margin;
            this.y = Math.random() * this.pond.canvas.height;
            this.angle = Math.PI + (Math.random() - 0.5) * Math.PI * 0.4;
        } else if (side === 2) {
            this.x = Math.random() * this.pond.canvas.width;
            this.y = -margin;
            this.angle = Math.PI * 0.5 + (Math.random() - 0.5) * Math.PI * 0.4;
        } else {
            this.x = Math.random() * this.pond.canvas.width;
            this.y = this.pond.canvas.height + margin;
            this.angle = -Math.PI * 0.5 + (Math.random() - 0.5) * Math.PI * 0.4;
        }

        this.baseSpeed = 1.0 + Math.random() * 0.5;
        this.speed = this.baseSpeed;
        this.size = 14 + Math.random() * 8;
        this.altitude = 150 + Math.random() * 100;
        this.wingSpan = this.size * 2.8;
        this.wingFlapPhase = Math.random() * Math.PI * 2;
        this.wingFlapSpeed = 0.005;
        this.wingFlapAmplitude = 0.1;

        this.state = 'GLIDING';
        this.stateTimer = 50 + Math.random() * 100;

        this.trails = [];
        this.maxTrails = 80;
    }

    update() {
        this.stateTimer--;
        if (this.stateTimer <= 0) {
            if (this.state === 'GLIDING') {
                this.state = 'FLAPPING';
                this.stateTimer = 20 + Math.random() * 30;
            } else {
                this.state = 'GLIDING';
                this.stateTimer = 100 + Math.random() * 200;
            }
        }

        if (this.state === 'FLAPPING') {
            this.wingFlapSpeed = 0.15 + Math.random() * 0.05;
            this.wingFlapAmplitude = 0.4;
            this.speed = Math.min(this.speed + 0.04, this.baseSpeed * 2.0);
        } else {
            this.wingFlapSpeed = 0.005;
            this.wingFlapAmplitude = 0.1;
            this.speed = Math.max(this.speed - 0.01, this.baseSpeed);
        }

        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;

        const drift = Math.sin(Date.now() * 0.001 + this.wingFlapPhase) * 0.003;
        this.angle += drift;
        this.wingFlapPhase += this.wingFlapSpeed;

        const flapFactor = Math.cos(this.wingFlapPhase);
        const currentWingSpan = this.wingSpan * (0.8 + flapFactor * this.wingFlapAmplitude);

        const leftWingX = this.x + Math.cos(this.angle - Math.PI / 2) * currentWingSpan;
        const leftWingY = this.y + Math.sin(this.angle - Math.PI / 2) * currentWingSpan;
        const rightWingX = this.x + Math.cos(this.angle + Math.PI / 2) * currentWingSpan;
        const rightWingY = this.y + Math.sin(this.angle + Math.PI / 2) * currentWingSpan;

        this.trails.push({ lx: leftWingX, ly: leftWingY, rx: rightWingX, ry: rightWingY, life: 1 });
        if (this.trails.length > this.maxTrails) this.trails.shift();
        this.trails.forEach(t => t.life -= 0.015);
        this.trails = this.trails.filter(t => t.life > 0);

        const margin = 400;
        if (this.x < -margin || this.x > this.pond.canvas.width + margin ||
            this.y < -margin || this.y > this.pond.canvas.height + margin) {
            this.reset();
        }
    }

    draw(ctx) {
        const flapFactor = Math.cos(this.wingFlapPhase);
        const currentWingSpan = this.wingSpan * (0.8 + flapFactor * this.wingFlapAmplitude);

        // Shadow
        ctx.save();
        const shadowOffset = this.altitude * 0.35;
        ctx.translate(this.x + shadowOffset, this.y + shadowOffset);
        ctx.rotate(this.angle);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(-this.size * 0.5, -currentWingSpan, this.size * 1.5, -currentWingSpan * 0.5, 0, 0);
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(-this.size * 0.5, currentWingSpan, this.size * 1.5, currentWingSpan * 0.5, 0, 0);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(0, 0, this.size * 1.2, this.size * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Trails
        if (this.trails.length > 2) {
            ctx.save();
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            for (let i = 1; i < this.trails.length; i++) {
                const t1 = this.trails[i - 1];
                const t2 = this.trails[i];
                const alpha = t2.life * 0.12;
                ctx.lineWidth = t2.life * 1.5;
                ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
                ctx.beginPath();
                ctx.moveTo(t1.lx, t1.ly);
                ctx.lineTo(t2.lx, t2.ly);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(t1.rx, t1.ry);
                ctx.lineTo(t2.rx, t2.ry);
                ctx.stroke();
            }
            ctx.restore();
        }

        // Bird body
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#CBD5E1';
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(-this.size * 0.5, -currentWingSpan, this.size * 1.5, -currentWingSpan * 0.5, 0, 0);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(-this.size * 0.5, currentWingSpan, this.size * 1.5, currentWingSpan * 0.5, 0, 0);
        ctx.fill();
        ctx.stroke();

        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size);
        gradient.addColorStop(0, '#FFFFFF');
        gradient.addColorStop(1, '#F8FAFC');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.size, this.size * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(this.size * 0.8, 0, this.size * 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#F59E0B';
        ctx.beginPath();
        ctx.moveTo(this.size * 0.95, -2);
        ctx.lineTo(this.size * 1.3, 0);
        ctx.lineTo(this.size * 0.95, 2);
        ctx.fill();

        ctx.restore();
    }
}
