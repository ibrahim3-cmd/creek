// ========================================
// AsianCarp - Multi-segment carp fish
// ========================================

export class AsianCarp {
    constructor(pond, colorScheme) {
        this.pond = pond;
        this.x = Math.random() * this.pond.canvas.width;
        this.y = Math.random() * this.pond.canvas.height;
        this.size = 8 + Math.random() * 6;
        this.angle = Math.random() * Math.PI * 2;
        this.speed = 1.2 + Math.random() * 0.8;
        this.colors = colorScheme;
        this.turnSpeed = 0.02 + Math.random() * 0.02;
        this.targetAngle = this.angle;
        this.wanderTimer = 0;

        // Multi-segment body
        this.segments = [];
        this.numSegments = 10;
        this.segmentSpacing = this.size * 0.3;

        this.tailPhase = Math.random() * Math.PI * 2;
        this.finPhase = Math.random() * Math.PI * 2;
        this.breathPhase = Math.random() * Math.PI * 2;

        for (let i = 0; i < this.numSegments; i++) {
            this.segments.push({
                x: this.x - Math.cos(this.angle) * i * this.segmentSpacing,
                y: this.y - Math.sin(this.angle) * i * this.segmentSpacing,
                angle: this.angle
            });
        }
    }

    update() {
        // Find nearest food
        let nearestFood = null;
        let nearestDist = Infinity;

        this.pond.food.forEach(food => {
            const dx = food.x - this.x;
            const dy = food.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < nearestDist) {
                nearestDist = dist;
                nearestFood = food;
            }
        });

        if (nearestFood && nearestDist < 300) {
            this.targetAngle = Math.atan2(nearestFood.y - this.y, nearestFood.x - this.x);
            this.speed = 2.2;
            if (nearestDist < this.size * 0.8) {
                nearestFood.eaten = true;
            }
        } else {
            this.wanderTimer--;
            if (this.wanderTimer <= 0) {
                this.targetAngle += (Math.random() - 0.5) * Math.PI * 0.5;
                this.wanderTimer = 100 + Math.random() * 150;
                this.speed = 1.0 + Math.random() * 0.5;
            }
        }

        let angleDiff = this.targetAngle - this.angle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        this.angle += angleDiff * this.turnSpeed;

        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;

        // Animate
        const sf = 0.5 + this.speed * 0.5;
        this.finPhase += 0.1 * sf;
        this.tailPhase += 0.15 * sf;
        this.breathPhase += 0.03;

        // Wrap around
        const padding = 100;
        if (this.x < -padding) this.x = this.pond.canvas.width + padding / 2;
        if (this.x > this.pond.canvas.width + padding) this.x = -padding / 2;
        if (this.y < -padding) this.y = this.pond.canvas.height + padding / 2;
        if (this.y > this.pond.canvas.height + padding) this.y = -padding / 2;

        // Update segments with body wave
        this.segments[0].x = this.x;
        this.segments[0].y = this.y;
        this.segments[0].angle = this.angle;

        for (let i = 1; i < this.numSegments; i++) {
            const seg = this.segments[i];
            const prev = this.segments[i - 1];

            const dx = prev.x - seg.x;
            const dy = prev.y - seg.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const targetDist = this.segmentSpacing;

            if (dist > targetDist) {
                const angle = Math.atan2(dy, dx);
                seg.angle = angle;
                seg.x = prev.x - Math.cos(angle) * targetDist;
                seg.y = prev.y - Math.sin(angle) * targetDist;
            }

            // Body wave
            const wave = Math.sin(this.tailPhase - i * 0.5) * (i / this.numSegments) * 2;
            seg.x += Math.cos(seg.angle + Math.PI / 2) * wave;
            seg.y += Math.sin(seg.angle + Math.PI / 2) * wave;
        }
    }

    _getSegWidth(i) {
        const t = i / (this.numSegments - 1);
        const profile = Math.sin(Math.pow(t, 0.55) * Math.PI);
        return this.size * (0.3 + profile * 0.7);
    }

    draw(ctx) {
        ctx.save();
        const breath = 1 + Math.sin(this.breathPhase) * 0.02;

        // Pectoral fins
        const headSeg = this.segments[0];
        ctx.fillStyle = this.colors.tail;
        ctx.globalAlpha = 0.5;
        const finAngle = Math.sin(this.finPhase) * 0.7;
        ctx.save();
        ctx.translate(headSeg.x, headSeg.y);
        ctx.rotate(headSeg.angle);
        ctx.beginPath();
        ctx.ellipse(-this.size * 0.3, -this.size * 0.35,
            this.size * 0.5, this.size * 0.2, -0.4 + finAngle + Math.PI, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(-this.size * 0.3, this.size * 0.35,
            this.size * 0.5, this.size * 0.2, 0.4 - finAngle + Math.PI, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        ctx.globalAlpha = 1;

        // Draw tail
        const tailSeg = this.segments[this.numSegments - 1];
        ctx.save();
        ctx.translate(tailSeg.x, tailSeg.y);
        ctx.rotate(tailSeg.angle + Math.PI);
        ctx.fillStyle = this.colors.tail;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(this.size * 0.6, -this.size * 0.4, this.size * 0.9, -this.size * 0.6);
        ctx.quadraticCurveTo(this.size * 0.5, 0, this.size * 0.9, this.size * 0.6);
        ctx.quadraticCurveTo(this.size * 0.6, this.size * 0.4, 0, 0);
        ctx.fill();
        ctx.restore();

        // Draw body segments (back to front)
        for (let i = this.numSegments - 1; i >= 0; i--) {
            const seg = this.segments[i];
            const segSize = this._getSegWidth(i) * breath;

            ctx.save();
            ctx.translate(seg.x, seg.y);
            ctx.rotate(seg.angle);

            ctx.fillStyle = this.colors.body;
            ctx.beginPath();
            ctx.ellipse(0, 0, segSize, segSize * 0.55, 0, 0, Math.PI * 2);
            ctx.fill();

            // 3D highlight
            if (i < this.numSegments - 2) {
                const grad = ctx.createRadialGradient(segSize * 0.1, -segSize * 0.1, 0, 0, 0, segSize * 0.7);
                grad.addColorStop(0, 'rgba(255,255,255,0.1)');
                grad.addColorStop(1, 'rgba(0,0,0,0.03)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.ellipse(0, 0, segSize, segSize * 0.55, 0, 0, Math.PI * 2);
                ctx.fill();
            }

            // Head details
            if (i === 0) {
                ctx.fillStyle = 'rgba(255,255,255,0.1)';
                ctx.beginPath();
                ctx.ellipse(segSize * 0.3, 0, segSize * 0.35, segSize * 0.25, 0, 0, Math.PI * 2);
                ctx.fill();

                // Eyes
                ctx.fillStyle = '#FFFFFF';
                ctx.beginPath();
                ctx.arc(segSize * 0.5, -segSize * 0.25, segSize * 0.1, 0, Math.PI * 2);
                ctx.arc(segSize * 0.5, segSize * 0.25, segSize * 0.1, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#000000';
                ctx.beginPath();
                ctx.arc(segSize * 0.53, -segSize * 0.25, segSize * 0.06, 0, Math.PI * 2);
                ctx.arc(segSize * 0.53, segSize * 0.25, segSize * 0.06, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }

        ctx.restore();
    }
}
