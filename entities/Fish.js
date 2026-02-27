// ========================================
// Fish - Natural multi-segmented koi fish
// ========================================

export class Fish {
    constructor(pond, colorScheme) {
        this.pond = pond;
        this.x = Math.random() * this.pond.canvas.width;
        this.y = Math.random() * this.pond.canvas.height;
        this.size = 18 + Math.random() * 12;
        this.speed = 0.8 + Math.random() * 1.2;
        this.angle = Math.random() * Math.PI * 2;
        this.targetAngle = this.angle;
        this.turnSpeed = 0.025 + Math.random() * 0.015;
        this.colors = colorScheme;
        this.wanderTimer = 0;

        // Multi-segment body for natural movement
        this.numSegments = 10;
        this.segmentSpacing = this.size * 0.22;
        this.segments = [];
        for (let i = 0; i < this.numSegments; i++) {
            this.segments.push({
                x: this.x - Math.cos(this.angle) * i * this.segmentSpacing,
                y: this.y - Math.sin(this.angle) * i * this.segmentSpacing,
                angle: this.angle
            });
        }

        // Animation phases
        this.tailPhase = Math.random() * Math.PI * 2;
        this.finPhase = Math.random() * Math.PI * 2;
        this.dorsalPhase = Math.random() * Math.PI * 2;

        // Subtle color variation for patterns
        this.patternSeed = Math.random();
        this.hasSpots = Math.random() > 0.5;
        this.spotPositions = [];
        if (this.hasSpots) {
            const numSpots = 2 + Math.floor(Math.random() * 4);
            for (let i = 0; i < numSpots; i++) {
                this.spotPositions.push({
                    seg: 1 + Math.floor(Math.random() * (this.numSegments - 3)),
                    ox: (Math.random() - 0.5) * 0.6,
                    oy: (Math.random() - 0.5) * 0.4,
                    size: 0.15 + Math.random() * 0.2,
                    color: Math.random() > 0.5 ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.15)'
                });
            }
        }

        // Breathing (subtle size oscillation)
        this.breathPhase = Math.random() * Math.PI * 2;

        // Scared state
        this.scared = false;
        this.scaredTimer = 0;
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

        // Check if scared by mouse proximity
        const mouseDx = this.pond.mousePos.x - this.x;
        const mouseDy = this.pond.mousePos.y - this.y;
        const mouseDist = Math.sqrt(mouseDx * mouseDx + mouseDy * mouseDy);
        
        if (mouseDist < 80 && !nearestFood) {
            this.scared = true;
            this.scaredTimer = 60;
            // Flee from mouse
            this.targetAngle = Math.atan2(-mouseDy, -mouseDx);
            this.speed = 3.0 + Math.random();
        } else if (this.scaredTimer > 0) {
            this.scaredTimer--;
            if (this.scaredTimer <= 0) this.scared = false;
        }

        if (!this.scared) {
            if (nearestFood && nearestDist < 350) {
                this.targetAngle = Math.atan2(nearestFood.y - this.y, nearestFood.x - this.x);
                this.speed = 2.0;
                if (nearestDist < this.size * 0.8) {
                    nearestFood.eaten = true;
                }
            } else {
                this.wanderTimer--;
                if (this.wanderTimer <= 0) {
                    this.targetAngle += (Math.random() - 0.5) * Math.PI * 0.6;
                    this.wanderTimer = 100 + Math.random() * 200;
                    this.speed = 0.6 + Math.random() * 0.6;
                }
            }
        }

        // Smooth turn
        let angleDiff = this.targetAngle - this.angle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        this.angle += angleDiff * this.turnSpeed;

        // Move head
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;

        // Animate phases
        const speedFactor = 0.5 + this.speed * 0.5;
        this.tailPhase += 0.12 * speedFactor;
        this.finPhase += 0.08 * speedFactor;
        this.dorsalPhase += 0.06;
        this.breathPhase += 0.03;

        // Update segments (follow-the-leader chain)
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

            // Add sinusoidal body wave
            const wave = Math.sin(this.tailPhase - i * 0.6) * (i / this.numSegments) * 3;
            seg.x += Math.cos(seg.angle + Math.PI / 2) * wave;
            seg.y += Math.sin(seg.angle + Math.PI / 2) * wave;
        }

        // Wrap around
        const padding = this.size * 2;
        if (this.x < -padding) this.x = this.pond.canvas.width + padding;
        if (this.x > this.pond.canvas.width + padding) this.x = -padding;
        if (this.y < -padding) this.y = this.pond.canvas.height + padding;
        if (this.y > this.pond.canvas.height + padding) this.y = -padding;
    }

    draw(ctx) {
        ctx.save();

        const breath = 1 + Math.sin(this.breathPhase) * 0.02;

        // --- Draw pectoral fins (below body) ---
        const midSeg = this.segments[Math.floor(this.numSegments * 0.25)];
        const finFlap = Math.sin(this.finPhase) * 0.5;
        ctx.fillStyle = this.colors.tail || this.colors.body;
        ctx.globalAlpha = 0.6;

        ctx.save();
        ctx.translate(midSeg.x, midSeg.y);
        ctx.rotate(midSeg.angle);
        // Right pectoral fin
        ctx.beginPath();
        ctx.ellipse(0, -this.size * 0.25, this.size * 0.35, this.size * 0.12,
            -0.6 + finFlap, 0, Math.PI * 2);
        ctx.fill();
        // Left pectoral fin
        ctx.beginPath();
        ctx.ellipse(0, this.size * 0.25, this.size * 0.35, this.size * 0.12,
            0.6 - finFlap, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        ctx.globalAlpha = 1;

        // --- Draw tail fin ---
        const tailSeg = this.segments[this.numSegments - 1];
        const tailPrev = this.segments[this.numSegments - 2];
        const tailSwing = Math.sin(this.tailPhase) * 0.4;

        ctx.save();
        ctx.translate(tailSeg.x, tailSeg.y);
        ctx.rotate(tailSeg.angle + Math.PI);

        ctx.fillStyle = this.colors.tail || this.colors.body;
        ctx.globalAlpha = 0.85;
        // Forked tail
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(
            this.size * 0.5, -this.size * 0.3 + tailSwing * this.size * 0.2,
            this.size * 0.85, -this.size * 0.5 + tailSwing * this.size * 0.15
        );
        ctx.quadraticCurveTo(this.size * 0.4, tailSwing * this.size * 0.1, 0, 0);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(
            this.size * 0.5, this.size * 0.3 + tailSwing * this.size * 0.2,
            this.size * 0.85, this.size * 0.5 + tailSwing * this.size * 0.15
        );
        ctx.quadraticCurveTo(this.size * 0.4, tailSwing * this.size * 0.1, 0, 0);
        ctx.fill();

        ctx.restore();
        ctx.globalAlpha = 1;

        // --- Draw dorsal fin (on some segments) ---
        const dorsalWave = Math.sin(this.dorsalPhase) * 0.15;
        ctx.fillStyle = this.colors.tail || this.colors.body;
        ctx.globalAlpha = 0.4;
        for (let i = 2; i < this.numSegments - 2; i++) {
            const seg = this.segments[i];
            const segWidth = this._getSegmentWidth(i) * breath;
            ctx.save();
            ctx.translate(seg.x, seg.y);
            ctx.rotate(seg.angle);
            const dorsalH = segWidth * (0.15 + dorsalWave * (i / this.numSegments));
            ctx.beginPath();
            ctx.moveTo(-segWidth * 0.3, 0);
            ctx.quadraticCurveTo(0, -dorsalH - segWidth * 0.1, segWidth * 0.3, 0);
            ctx.fill();
            ctx.restore();
        }
        ctx.globalAlpha = 1;

        // --- Draw body segments (back to front) ---
        for (let i = this.numSegments - 1; i >= 0; i--) {
            const seg = this.segments[i];
            const segWidth = this._getSegmentWidth(i) * breath;

            ctx.save();
            ctx.translate(seg.x, seg.y);
            ctx.rotate(seg.angle);

            // Body segment
            ctx.fillStyle = this.colors.body;
            ctx.beginPath();
            ctx.ellipse(0, 0, segWidth, segWidth * 0.55, 0, 0, Math.PI * 2);
            ctx.fill();

            // Subtle gradient overlay for 3D effect
            if (i < this.numSegments - 2) {
                const grad = ctx.createRadialGradient(
                    segWidth * 0.1, -segWidth * 0.1, 0,
                    0, 0, segWidth * 0.8
                );
                grad.addColorStop(0, 'rgba(255,255,255,0.12)');
                grad.addColorStop(1, 'rgba(0,0,0,0.05)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.ellipse(0, 0, segWidth, segWidth * 0.55, 0, 0, Math.PI * 2);
                ctx.fill();
            }

            // Head details
            if (i === 0) {
                // Highlight on head
                ctx.fillStyle = 'rgba(255,255,255,0.15)';
                ctx.beginPath();
                ctx.ellipse(segWidth * 0.25, -segWidth * 0.08, segWidth * 0.3, segWidth * 0.2, -0.2, 0, Math.PI * 2);
                ctx.fill();

                // Eyes
                const eyeR = segWidth * 0.1;
                ctx.fillStyle = '#FFFFFF';
                ctx.beginPath();
                ctx.arc(segWidth * 0.45, -segWidth * 0.28, eyeR * 1.3, 0, Math.PI * 2);
                ctx.arc(segWidth * 0.45, segWidth * 0.28, eyeR * 1.3, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#111111';
                ctx.beginPath();
                ctx.arc(segWidth * 0.5, -segWidth * 0.28, eyeR * 0.8, 0, Math.PI * 2);
                ctx.arc(segWidth * 0.5, segWidth * 0.28, eyeR * 0.8, 0, Math.PI * 2);
                ctx.fill();

                // Eye highlight
                ctx.fillStyle = 'rgba(255,255,255,0.7)';
                ctx.beginPath();
                ctx.arc(segWidth * 0.52, -segWidth * 0.31, eyeR * 0.3, 0, Math.PI * 2);
                ctx.arc(segWidth * 0.52, segWidth * 0.25, eyeR * 0.3, 0, Math.PI * 2);
                ctx.fill();

                // Mouth line
                ctx.strokeStyle = 'rgba(0,0,0,0.2)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(segWidth * 0.6, 0, segWidth * 0.12, -0.5, 0.5);
                ctx.stroke();
            }

            ctx.restore();
        }

        // --- Draw spots/patterns ---
        if (this.hasSpots) {
            this.spotPositions.forEach(spot => {
                if (spot.seg < this.segments.length) {
                    const seg = this.segments[spot.seg];
                    const segW = this._getSegmentWidth(spot.seg) * breath;
                    ctx.save();
                    ctx.translate(seg.x, seg.y);
                    ctx.rotate(seg.angle);
                    ctx.fillStyle = spot.color;
                    ctx.beginPath();
                    ctx.arc(spot.ox * segW, spot.oy * segW, segW * spot.size, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
            });
        }

        ctx.restore();
    }

    // Tapered body width profile — wide in middle, narrow at head and tail
    _getSegmentWidth(i) {
        const t = i / (this.numSegments - 1); // 0 = head, 1 = tail
        // Bell curve shape: widest around 30% from the head
        const profile = Math.sin(Math.pow(t, 0.6) * Math.PI);
        return this.size * 0.45 * (0.3 + profile * 0.7);
    }
}
