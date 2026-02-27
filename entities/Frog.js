// ========================================
// Frog - Sits on lily pads, catches flies
// FIXED: Tongue no longer stretches full screen
// ========================================

import { Splash } from './Splash.js';

export class Frog {
    constructor(pond) {
        this.pond = pond;
        this.reset();
    }

    reset() {
        const pad = this.pond.lilyPads[Math.floor(Math.random() * this.pond.lilyPads.length)];
        const targetX = pad ? pad.x : Math.random() * this.pond.canvas.width;
        const targetY = pad ? pad.y : Math.random() * this.pond.canvas.height;

        const angleFromCenter = Math.random() * Math.PI * 2;
        const distFromCenter = 60 + Math.random() * 20;
        this.startX = targetX + Math.cos(angleFromCenter) * distFromCenter;
        this.startY = targetY + Math.sin(angleFromCenter) * distFromCenter;

        this.x = this.startX;
        this.y = this.startY;
        this.targetX = targetX;
        this.targetY = targetY;

        if (pad) {
            const angle = Math.random() * Math.PI * 2;
            const distOnPad = Math.random() * pad.size * 0.4;
            this.targetX = pad.x + Math.cos(angle) * distOnPad;
            this.targetY = pad.y + Math.sin(angle) * distOnPad;
        }

        this.currentPad = pad;
        this.lastPad = null;

        this.size = 12 + Math.random() * 6;
        this.angle = Math.atan2(this.targetY - this.startY, this.targetX - this.startX);
        this.state = 'EMERGING'; // EMERGING, IDLE, JUMPING, TONGUE_OUT, HIDDEN
        this.emergeProgress = 0;
        this.emergeDuration = 100 + Math.random() * 50;

        this.jumpProgress = 0;
        this.jumpDuration = 40 + Math.random() * 20;
        this.waitTimer = 100 + Math.random() * 200;

        // Tongue properties — CAPPED range
        this.tongueProgress = 0;
        this.tongueTarget = null;
        this.tongueEndX = 0;
        this.tongueEndY = 0;
        this.catchSuccess = false;
        this.huntCooldown = 0;
        this.maxTongueRange = 60; // HARD MAX tongue reach in pixels

        // Breathing animation
        this.breathPhase = Math.random() * Math.PI * 2;
        this.blinkTimer = 60 + Math.random() * 120;
        this.isBlinking = false;
        this.blinkDuration = 0;

        // Colors
        this.color = this._randomGreen();
        this.bellyColor = '#BEF264';
        this.eyeColor = '#000000';
        this.throatColor = '#D4FF70';
    }

    _randomGreen() {
        const greens = ['#4ADE80', '#22C55E', '#86EFAC', '#34D399', '#6EE7B7'];
        return greens[Math.floor(Math.random() * greens.length)];
    }

    update() {
        if (this.huntCooldown > 0) this.huntCooldown--;
        this.breathPhase += 0.04;

        // Blinking
        this.blinkTimer--;
        if (this.blinkTimer <= 0 && !this.isBlinking) {
            this.isBlinking = true;
            this.blinkDuration = 8;
        }
        if (this.isBlinking) {
            this.blinkDuration--;
            if (this.blinkDuration <= 0) {
                this.isBlinking = false;
                this.blinkTimer = 80 + Math.random() * 160;
            }
        }

        if (this.state === 'EMERGING') {
            this.emergeProgress += 1 / this.emergeDuration;
            this.x = this.startX + (this.targetX - this.startX) * this.emergeProgress;
            this.y = this.startY + (this.targetY - this.startY) * this.emergeProgress;

            if (this.emergeProgress >= 1) {
                this.state = 'IDLE';
                this.x = this.targetX;
                this.y = this.targetY;
                this.waitTimer = 100 + Math.random() * 200;
            }
        } else if (this.state === 'IDLE') {
            this.waitTimer--;

            // Check for nearby flies — ONLY within maxTongueRange
            if (this.huntCooldown <= 0) {
                const nearFly = this.pond.flies.find(fly => {
                    if (fly.isEaten) return false;
                    const dist = Math.sqrt(Math.pow(fly.x - this.x, 2) + Math.pow(fly.y - this.y, 2));
                    return dist < this.maxTongueRange;
                });

                if (nearFly && Math.random() < 0.02) {
                    this.startTongue(nearFly);
                }
            }

            if (this.waitTimer <= 0) {
                this.startJump();
            }
        } else if (this.state === 'TONGUE_OUT') {
            this.tongueProgress += 0.15;

            const stage = Math.sin(this.tongueProgress * Math.PI);
            const targetDist = Math.max(10,
                Math.sqrt(Math.pow(this.tongueTargetX - this.x, 2) + Math.pow(this.tongueTargetY - this.y, 2)));
            // HARD CAP on tongue distance
            const cappedDist = Math.min(this.maxTongueRange, targetDist);
            const currentDist = cappedDist * stage;
            const angleToTarget = Math.atan2(this.tongueTargetY - this.y, this.tongueTargetX - this.x);

            this.tongueEndX = this.x + Math.cos(angleToTarget) * currentDist;
            this.tongueEndY = this.y + Math.sin(angleToTarget) * currentDist;

            // Catch at peak
            if (this.tongueProgress >= 0.5 && !this.hasAttemptedCatch) {
                this.hasAttemptedCatch = true;
                const distToFly = Math.sqrt(
                    Math.pow(this.tongueTarget.x - this.tongueEndX, 2) +
                    Math.pow(this.tongueTarget.y - this.tongueEndY, 2)
                );
                if (distToFly < 15 && Math.random() < 0.7) {
                    this.catchSuccess = true;
                    this.tongueTarget.isEaten = true;
                    this.tongueTarget.caughtBy = this;
                }
            }

            if (this.tongueProgress >= 1) {
                this.state = 'IDLE';
                this.tongueProgress = 0;
                this.waitTimer = 50 + Math.random() * 50;
                if (this.catchSuccess) {
                    if (this.tongueTarget) this.tongueTarget.caughtBy = null;
                    this.huntCooldown = 150 + Math.random() * 150;
                }
                this.tongueTarget = null;
            }
        } else if (this.state === 'JUMPING') {
            this.jumpProgress += 1 / this.jumpDuration;

            if (this.jumpProgress >= 1) {
                this.land();
            } else {
                this.x = this.startX + (this.targetX - this.startX) * this.jumpProgress;
                this.y = this.startY + (this.targetY - this.startY) * this.jumpProgress;
                const dx = this.targetX - this.startX;
                const dy = this.targetY - this.startY;
                this.angle = Math.atan2(dy, dx);
            }
        } else if (this.state === 'HIDDEN') {
            this.waitTimer--;
            if (this.waitTimer <= 0) {
                this.reset();
            }
        }
    }

    startTongue(fly) {
        this.state = 'TONGUE_OUT';
        this.tongueProgress = 0;
        this.tongueTarget = fly;
        // Clamp the target position to maxTongueRange
        const dx = fly.x - this.x;
        const dy = fly.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const clampedDist = Math.min(dist, this.maxTongueRange);
        const angle = Math.atan2(dy, dx);
        this.tongueTargetX = this.x + Math.cos(angle) * clampedDist;
        this.tongueTargetY = this.y + Math.sin(angle) * clampedDist;
        this.hasAttemptedCatch = false;
        this.catchSuccess = false;
        this.angle = angle;
    }

    startJump() {
        this.startX = this.x;
        this.startY = this.y;
        this.jumpProgress = 0;
        this.state = 'JUMPING';

        const maxJumpDist = 150;

        const otherLilyPads = this.pond.lilyPads.filter(pad => {
            const dist = Math.sqrt(Math.pow(pad.x - this.x, 2) + Math.pow(pad.y - this.y, 2));
            const isSamePad = this.currentPad && pad === this.currentPad;
            return dist > 10 && dist < maxJumpDist && !isSamePad;
        });

        if (Math.random() > 0.3 && otherLilyPads.length > 0) {
            let closestPad = null;
            let minDist = Infinity;
            otherLilyPads.forEach(pad => {
                const dist = Math.sqrt(Math.pow(pad.x - this.x, 2) + Math.pow(pad.y - this.y, 2));
                if (dist < minDist) {
                    minDist = dist;
                    closestPad = pad;
                }
            });

            this.lastPad = this.currentPad;
            this.currentPad = closestPad;
            const angle = Math.random() * Math.PI * 2;
            const distOnPad = Math.random() * closestPad.size * 0.4;
            this.targetX = closestPad.x + Math.cos(angle) * distOnPad;
            this.targetY = closestPad.y + Math.sin(angle) * distOnPad;
            this.isWaterJump = false;
        } else {
            let validJump = false;
            let attempts = 0;
            while (!validJump && attempts < 15) {
                const jumpDist = 60 + Math.random() * 80;
                const jumpAngle = Math.random() * Math.PI * 2;
                const tx = this.x + Math.cos(jumpAngle) * jumpDist;
                const ty = this.y + Math.sin(jumpAngle) * jumpDist;

                if (tx < 0 || tx > this.pond.canvas.width || ty < 0 || ty > this.pond.canvas.height) {
                    attempts++;
                    continue;
                }

                const isOnPad = this.pond.lilyPads.some(pad => {
                    const distToPad = Math.sqrt(Math.pow(pad.x - tx, 2) + Math.pow(pad.y - ty, 2));
                    return distToPad < pad.size + 15;
                });

                if (!isOnPad) {
                    this.targetX = tx;
                    this.targetY = ty;
                    validJump = true;
                }
                attempts++;
            }

            if (!validJump) {
                const targetPad = this.pond.lilyPads[Math.floor(Math.random() * this.pond.lilyPads.length)];
                this.targetX = targetPad.x;
                this.targetY = targetPad.y;
                this.isWaterJump = false;
            } else {
                this.isWaterJump = true;
            }
        }
    }

    land() {
        this.x = this.targetX;
        this.y = this.targetY;
        if (this.isWaterJump) {
            this.pond.splashes.push(new Splash(this.x, this.y));
            this.state = 'HIDDEN';
            this.waitTimer = 100 + Math.random() * 100;
        } else {
            this.state = 'IDLE';
            this.waitTimer = 100 + Math.random() * 200;
        }
    }

    draw(ctx) {
        if (this.state === 'HIDDEN') return;

        // Ripples for emerging frogs
        if (this.state === 'EMERGING') {
            ctx.save();
            ctx.strokeStyle = `rgba(255, 255, 255, ${Math.sin(this.emergeProgress * Math.PI) * 0.4})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * (0.8 + this.emergeProgress * 0.5), 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        // TONGUE (capped, short)
        if (this.state === 'TONGUE_OUT') {
            ctx.save();
            // Tongue gradient from mouth to tip
            const grad = ctx.createLinearGradient(this.x, this.y, this.tongueEndX, this.tongueEndY);
            grad.addColorStop(0, '#FF8888');
            grad.addColorStop(1, '#FF4444');
            ctx.strokeStyle = grad;
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.tongueEndX, this.tongueEndY);
            ctx.stroke();

            // Sticky tongue tip
            ctx.fillStyle = '#FF4444';
            ctx.beginPath();
            ctx.arc(this.tongueEndX, this.tongueEndY, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        let scale = 1;
        let shadowOffset = 2;
        if (this.state === 'JUMPING') {
            const arc = Math.sin(this.jumpProgress * Math.PI);
            scale = 1 + arc * 0.5;
            shadowOffset = 2 + arc * 10;
        }

        // Emerging clip
        if (this.state === 'EMERGING') {
            const revealAlpha = Math.min(1, this.emergeProgress * 2);
            ctx.globalAlpha = revealAlpha;
            const climbLine = this.size * (1 - this.emergeProgress * 2);
            ctx.beginPath();
            ctx.rect(climbLine, -this.size, this.size * 2, this.size * 2);
            ctx.clip();
        }

        ctx.scale(scale, scale);

        // Breathing
        const breath = 1 + Math.sin(this.breathPhase) * 0.03;

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(0, shadowOffset / scale, this.size * 0.6, this.size * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Back legs
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(-this.size * 0.2, -this.size * 0.4, this.size * 0.4, this.size * 0.2, -0.5, 0, Math.PI * 2);
        ctx.ellipse(-this.size * 0.2, this.size * 0.4, this.size * 0.4, this.size * 0.2, 0.5, 0, Math.PI * 2);
        ctx.fill();

        // Body with breathing
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.size * 0.8 * breath, this.size * 0.6 * breath, 0, 0, Math.PI * 2);
        ctx.fill();

        // Belly highlight
        ctx.fillStyle = this.throatColor;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.ellipse(this.size * 0.1, 0, this.size * 0.4 * breath, this.size * 0.3 * breath, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        // Eye bulges
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.size * 0.5, -this.size * 0.3, this.size * 0.25, 0, Math.PI * 2);
        ctx.arc(this.size * 0.5, this.size * 0.3, this.size * 0.25, 0, Math.PI * 2);
        ctx.fill();

        // Eyes (with blink)
        if (!this.isBlinking) {
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(this.size * 0.55, -this.size * 0.3, this.size * 0.15, 0, Math.PI * 2);
            ctx.arc(this.size * 0.55, this.size * 0.3, this.size * 0.15, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = this.eyeColor;
            ctx.beginPath();
            ctx.arc(this.size * 0.6, -this.size * 0.3, this.size * 0.08, 0, Math.PI * 2);
            ctx.arc(this.size * 0.6, this.size * 0.3, this.size * 0.08, 0, Math.PI * 2);
            ctx.fill();

            // Eye shine
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            ctx.beginPath();
            ctx.arc(this.size * 0.57, -this.size * 0.33, this.size * 0.04, 0, Math.PI * 2);
            ctx.arc(this.size * 0.57, this.size * 0.27, this.size * 0.04, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Closed eyes (line)
            ctx.strokeStyle = this.eyeColor;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(this.size * 0.5, -this.size * 0.3);
            ctx.lineTo(this.size * 0.65, -this.size * 0.3);
            ctx.moveTo(this.size * 0.5, this.size * 0.3);
            ctx.lineTo(this.size * 0.65, this.size * 0.3);
            ctx.stroke();
        }

        ctx.restore();
    }
}
