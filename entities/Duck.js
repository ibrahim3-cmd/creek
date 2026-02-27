// ========================================
// Duck - Ducks that swim in the pond
// ========================================

export class Duck {
    constructor(pond, type = 'ADULT', leader = null, partner = null) {
        this.pond = pond;
        this.type = type;
        this.leader = leader;
        this.partner = partner;

        // Initial position
        if (this.leader) {
            this.x = this.leader.x - Math.cos(this.leader.angle) * 30;
            this.y = this.leader.y - Math.sin(this.leader.angle) * 30;
        } else if (this.partner && this.partner.x !== undefined) {
            this.x = this.partner.x + (Math.random() - 0.5) * 50;
            this.y = this.partner.y + (Math.random() - 0.5) * 50;
        } else {
            this.x = Math.random() * this.pond.canvas.width;
            this.y = Math.random() * this.pond.canvas.height;
        }

        this.size = this.type === 'ADULT' ? 14 + Math.random() * 4 : 6 + Math.random() * 2;
        this.angle = this.leader ? this.leader.angle : Math.random() * Math.PI * 2;
        this.targetAngle = this.angle;
        this.speed = this.type === 'ADULT' ? 0.6 + Math.random() * 0.4 : 0.8 + Math.random() * 0.4;
        this.turnSpeed = 0.03;
        this.wanderTimer = 0;
        this.paddlingPhase = Math.random() * Math.PI * 2;
        this.headBobPhase = Math.random() * Math.PI * 2;

        // Quack
        this.quackTimer = 200 + Math.random() * 600;
        this.isQuacking = false;
        this.quackDuration = 0;

        // Colors
        if (this.type === 'DUCKLING') {
            this.color = '#FDE047';
            this.beakColor = '#F97316';
        } else {
            const rand = Math.random();
            if (rand > 0.6) {
                this.color = '#F5F5F5';
                this.headColor = '#F5F5F5';
            } else if (rand > 0.3) {
                this.color = '#78350F';
                this.headColor = '#065F46';
            } else {
                this.color = '#525252';
                this.headColor = '#525252';
            }
            this.beakColor = '#F97316';
        }
    }

    update() {
        // Quacking
        this.quackTimer--;
        if (this.quackTimer <= 0 && !this.isQuacking && this.type === 'ADULT') {
            this.isQuacking = true;
            this.quackDuration = 15 + Math.random() * 10;
        }
        if (this.isQuacking) {
            this.quackDuration--;
            if (this.quackDuration <= 0) {
                this.isQuacking = false;
                this.quackTimer = 300 + Math.random() * 800;
            }
        }

        this.headBobPhase += 0.06;

        if (this.leader) {
            const dx = this.leader.x - this.x;
            const dy = this.leader.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const ducklingIndex = this.pond.ducks.filter(d => d.leader === this.leader).indexOf(this) + 1;
            const targetDist = 20 + ducklingIndex * 18;

            if (dist > targetDist) {
                this.targetAngle = Math.atan2(dy, dx);
                this.speed = this.leader.speed * 1.2;
            } else {
                this.targetAngle = this.leader.angle;
                this.speed = this.leader.speed * 0.9;
            }

            // Duckling separation
            this.pond.ducks.forEach(other => {
                if (other === this || other.type !== 'DUCKLING' || other.leader !== this.leader) return;
                const sepDx = this.x - other.x;
                const sepDy = this.y - other.y;
                const sepDist = Math.sqrt(sepDx * sepDx + sepDy * sepDy);
                if (sepDist < 15) {
                    const pushAngle = Math.atan2(sepDy, sepDx);
                    this.x += Math.cos(pushAngle) * 0.5;
                    this.y += Math.sin(pushAngle) * 0.5;
                }
            });
        } else if (this.partner) {
            const dx = this.partner.x - this.x;
            const dy = this.partner.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 80) {
                this.targetAngle = Math.atan2(dy, dx);
                this.speed = 1.2;
            } else if (dist < 40) {
                this.targetAngle = Math.atan2(this.y - this.partner.y, this.x - this.partner.x);
                this.speed = 0.5;
            } else {
                this.wander();
            }
        } else {
            this.wander();
        }

        // Avoid lily pads
        this.pond.lilyPads.forEach(pad => {
            const dx = pad.x - this.x;
            const dy = pad.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const avoidanceRadius = pad.size + this.size + 10;
            if (dist < avoidanceRadius) {
                const angleFromPad = Math.atan2(this.y - pad.y, this.x - pad.x);
                const force = (1 - dist / avoidanceRadius) * 0.5;
                this.targetAngle = this.targetAngle * (1 - force) + angleFromPad * force;
                this.speed = Math.max(0.4, this.speed * 0.8);
            }
        });

        // Smooth turning
        let angleDiff = this.targetAngle - this.angle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        this.angle += angleDiff * this.turnSpeed;

        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
        this.paddlingPhase += 0.1 * (0.5 + this.speed);

        // Wrap around
        const padding = 50;
        if (this.x < -padding) this.x = this.pond.canvas.width + padding;
        if (this.x > this.pond.canvas.width + padding) this.x = -padding;
        if (this.y < -padding) this.y = this.pond.canvas.height + padding;
        if (this.y > this.pond.canvas.height + padding) this.y = -padding;
    }

    wander() {
        this.wanderTimer--;
        if (this.wanderTimer <= 0) {
            this.targetAngle += (Math.random() - 0.5) * Math.PI * 0.5;
            this.wanderTimer = 100 + Math.random() * 200;
            this.speed = 0.6 + Math.random() * 0.4;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Wake ripples
        const wakeAlpha = 0.15 * (0.5 + this.speed);
        ctx.strokeStyle = `rgba(255, 255, 255, ${wakeAlpha})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-this.size, -this.size * 0.5);
        ctx.quadraticCurveTo(-this.size * 2, 0, -this.size, this.size * 0.5);
        ctx.stroke();

        // Body bobbing
        const bob = Math.sin(this.paddlingPhase) * (this.type === 'ADULT' ? 2 : 1);
        ctx.translate(0, bob);

        // Body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.size, this.size * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();

        // Wing fold lines
        if (this.type === 'ADULT') {
            ctx.strokeStyle = 'rgba(0,0,0,0.1)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.ellipse(-this.size * 0.1, -this.size * 0.15, this.size * 0.6, this.size * 0.25, -0.15, 0, Math.PI);
            ctx.stroke();
            ctx.beginPath();
            ctx.ellipse(-this.size * 0.1, this.size * 0.15, this.size * 0.6, this.size * 0.25, 0.15, Math.PI, Math.PI * 2);
            ctx.stroke();
        }

        // Head
        const headBob = Math.sin(this.headBobPhase) * 1;
        ctx.fillStyle = this.headColor || this.color;
        ctx.beginPath();
        ctx.arc(this.size * 0.7, headBob, this.size * 0.5, 0, Math.PI * 2);
        ctx.fill();

        // Beak (with quack animation)
        const quackOpen = this.isQuacking ? Math.sin(this.quackDuration * 0.8) * this.size * 0.12 : 0;
        ctx.fillStyle = this.beakColor;
        // Upper beak
        ctx.beginPath();
        ctx.ellipse(this.size * 1.2, headBob - quackOpen * 0.3, this.size * 0.4, this.size * 0.2, 0, Math.PI, Math.PI * 2);
        ctx.fill();
        // Lower beak
        ctx.beginPath();
        ctx.ellipse(this.size * 1.2, headBob + quackOpen * 0.3, this.size * 0.4, this.size * 0.15, 0, 0, Math.PI);
        ctx.fill();

        // Quack ripple
        if (this.isQuacking) {
            ctx.strokeStyle = 'rgba(255,255,255,0.15)';
            ctx.lineWidth = 1;
            const rippleSize = (25 - this.quackDuration) * 0.5;
            ctx.beginPath();
            ctx.arc(this.size * 1.2, headBob, rippleSize, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Eye
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(this.size * 0.85, -this.size * 0.2 + headBob, this.size * 0.1, 0, Math.PI * 2);
        ctx.arc(this.size * 0.85, this.size * 0.2 + headBob, this.size * 0.1, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}
