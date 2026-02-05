// ========================================
// Groovy Fish - Top-Down Koi Pond
// ========================================

class Splash {
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

class AsianCarp {
    constructor(pond, colorScheme) {
        this.pond = pond;
        this.x = Math.random() * this.pond.canvas.width;
        this.y = Math.random() * this.pond.canvas.height;
        this.size = 8 + Math.random() * 6; // Significantly reduced to match old fish scale (multi-segment length)
        this.angle = Math.random() * Math.PI * 2;
        this.speed = 1.2 + Math.random() * 0.8;
        this.colors = colorScheme;
        this.turnSpeed = 0.02 + Math.random() * 0.02;
        this.targetAngle = this.angle;
        this.wanderTimer = 0;
        
        // Multi-segment body logic
        this.segments = [];
        this.numSegments = 8;
        this.segmentSpacing = this.size * 0.35;
        
        this.tailPhase = Math.random() * Math.PI * 2;
        this.finPhase = Math.random() * Math.PI * 2;
        
        for (let i = 0; i < this.numSegments; i++) {
            this.segments.push({ x: this.x, y: this.y, angle: this.angle });
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

        // Animate fins
        this.finPhase += 0.1 * (0.5 + this.speed * 0.5);
        this.tailPhase += 0.15 * (0.5 + this.speed * 0.5);

        // Wrap around
        const padding = 100;
        if (this.x < -padding) this.x = this.pond.canvas.width + padding / 2;
        if (this.x > this.pond.canvas.width + padding) this.x = -padding / 2;
        if (this.y < -padding) this.y = this.pond.canvas.height + padding / 2;
        if (this.y > this.pond.canvas.height + padding) this.y = -padding / 2;

        // Update segments - follow the leader
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
        }
    }

    draw(ctx) {
        ctx.save();
        
        // Draw Fins (visible from top)
        ctx.fillStyle = this.colors.tail;
        const headSeg = this.segments[0];
        ctx.save();
        ctx.translate(headSeg.x, headSeg.y);
        ctx.rotate(headSeg.angle);
        
        // Pectoral fins (moving on both sides)
        const finAngle = Math.sin(this.finPhase) * 0.7; // More pronounced flap
        ctx.beginPath();
        // Right fin
        ctx.ellipse(-this.size * 0.4, -this.size * 0.4, this.size * 0.6, this.size * 0.25, -0.4 + finAngle + Math.PI, 0, Math.PI * 2);
        // Left fin
        ctx.ellipse(-this.size * 0.4, this.size * 0.4, this.size * 0.6, this.size * 0.25, 0.4 - finAngle + Math.PI, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Draw body segments (back to front)
        for (let i = this.numSegments - 1; i >= 0; i--) {
            const seg = this.segments[i];
            const segSize = this.size * (1 - (i / (this.numSegments * 1.5)));
            
            ctx.save();
            ctx.translate(seg.x, seg.y);
            ctx.rotate(seg.angle);

            // Tail at the last segment
            if (i === this.numSegments - 1) {
                ctx.fillStyle = this.colors.tail;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                // Big Carp fork tail
                ctx.quadraticCurveTo(-this.size * 0.8, -this.size * 0.6, -this.size * 1.2, -this.size * 0.8);
                ctx.quadraticCurveTo(-this.size * 0.7, 0, -this.size * 1.2, this.size * 0.8);
                ctx.quadraticCurveTo(-this.size * 0.8, this.size * 0.6, 0, 0);
                ctx.fill();
            }

            // Body segment (teardrop/oval)
            ctx.fillStyle = i === 0 ? this.colors.body : this.colors.body;
            ctx.beginPath();
            ctx.ellipse(0, 0, segSize, segSize * 0.6, 0, 0, Math.PI * 2);
            ctx.fill();

            // Head details on first segment
            if (i === 0) {
                // Shiny head
                ctx.fillStyle = 'rgba(255,255,255,0.1)';
                ctx.beginPath();
                ctx.ellipse(segSize * 0.3, 0, segSize * 0.4, segSize * 0.3, 0, 0, Math.PI * 2);
                ctx.fill();
                
                // Eyes
                ctx.fillStyle = '#000000';
                ctx.beginPath();
                ctx.arc(segSize * 0.6, -segSize * 0.3, segSize * 0.1, 0, Math.PI * 2);
                ctx.arc(segSize * 0.6, segSize * 0.3, segSize * 0.1, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }

        ctx.restore();
    }
}

class Fly {
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
                this.loopCenter = { x: this.x + Math.cos(this.angle) * this.loopRadius, y: this.y + Math.sin(this.angle) * this.loopRadius };
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
        
        // Buzzing vibration
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

class Frog {
    constructor(pond) {
        this.pond = pond;
        this.reset();
    }

    reset() {
        // Find a target lilypad to emerge onto
        const pad = this.pond.lilyPads[Math.floor(Math.random() * this.pond.lilyPads.length)];
        const targetX = pad ? pad.x : Math.random() * this.pond.canvas.width;
        const targetY = pad ? pad.y : Math.random() * this.pond.canvas.height;
        
        // Start in water near the pad
        const angleFromCenter = Math.random() * Math.PI * 2;
        const distFromCenter = 60 + Math.random() * 20;
        this.startX = targetX + Math.cos(angleFromCenter) * distFromCenter;
        this.startY = targetY + Math.sin(angleFromCenter) * distFromCenter;
        
        this.x = this.startX;
        this.y = this.startY;
        this.targetX = targetX;
        this.targetY = targetY;
        
        // Offset final target on pad to avoid overlap
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
        
        // Tongue properties
        this.tongueProgress = 0;
        this.tongueTarget = null;
        this.tongueEndX = 0;
        this.tongueEndY = 0;
        this.catchSuccess = false;
        this.huntCooldown = 0;

        this.color = '#4ADE80'; 
        this.bellyColor = '#BEF264';
        this.eyeColor = '#000000';
    }

    update() {
        if (this.huntCooldown > 0) this.huntCooldown--;

        if (this.state === 'EMERGING') {
            this.emergeProgress += 1 / this.emergeDuration;
            
            // Move slowly towards the pad
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
            
            // Check for nearby flies (shorter, more natural reach)
            if (this.huntCooldown <= 0) {
                const nearFly = this.pond.flies.find(fly => {
                    if (fly.isEaten) return false;
                    const dist = Math.sqrt(Math.pow(fly.x - this.x, 2) + Math.pow(fly.y - this.y, 2));
                    return dist < 70; // Stricter natural tongue range
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
            
            // Tongue end position (out and back)
            const stage = Math.sin(this.tongueProgress * Math.PI);
            const targetDist = Math.max(10, Math.sqrt(Math.pow(this.tongueTargetX - this.x, 2) + Math.pow(this.tongueTargetY - this.y, 2)));
            // Hard cap on tongue stretch
            const cappedDist = Math.min(75, targetDist);
            const currentDist = cappedDist * stage;
            const angleToTarget = Math.atan2(this.tongueTargetY - this.y, this.tongueTargetX - this.x);
            
            this.tongueEndX = this.x + Math.cos(angleToTarget) * currentDist;
            this.tongueEndY = this.y + Math.sin(angleToTarget) * currentDist;

            // Catch attempt at peak of extension
            if (this.tongueProgress >= 0.5 && !this.hasAttemptedCatch) {
                this.hasAttemptedCatch = true;
                const distToFly = Math.sqrt(Math.pow(this.tongueTarget.x - this.tongueEndX, 2) + Math.pow(this.tongueTarget.y - this.tongueEndY, 2));
                
                // 70% chance to catch if close enough
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
                    this.huntCooldown = 150 + Math.random() * 150; // Pause after eating
                }
                this.tongueTarget = null;
            }
        }
 else if (this.state === 'JUMPING') {
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
        this.tongueTargetX = fly.x;
        this.tongueTargetY = fly.y;
        this.hasAttemptedCatch = false;
        this.catchSuccess = false;
        
        // Face the fly
        this.angle = Math.atan2(fly.y - this.y, fly.x - this.x);
    }

    startJump() {
        this.startX = this.x;
        this.startY = this.y;
        this.jumpProgress = 0;
        this.state = 'JUMPING';
        
        const maxJumpDist = 150;
        
        const otherLilyPads = this.pond.lilyPads.filter(pad => {
            const dist = Math.sqrt(Math.pow(pad.x - this.x, 2) + Math.pow(pad.y - this.y, 2));
            // Ensure we aren't jumping to the same physical pad (using a dist check as proxy for pad object)
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
            
            // Offset landing position on the lilypad to avoid overlap with other frogs
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

        // Draw ripples for emerging frogs
        if (this.state === 'EMERGING') {
            ctx.save();
            ctx.strokeStyle = `rgba(255, 255, 255, ${Math.sin(this.emergeProgress * Math.PI) * 0.4})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * (0.8 + this.emergeProgress * 0.5), 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        // Draw tongue first if out
        if (this.state === 'TONGUE_OUT') {
            ctx.save();
            ctx.strokeStyle = '#FF6B6B'; // Reddish pink tongue
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.tongueEndX, this.tongueEndY);
            ctx.stroke();
            
            // Tongue tip
            ctx.fillStyle = '#FF6B6B';
            ctx.beginPath();
            ctx.arc(this.tongueEndX, this.tongueEndY, 4, 0, Math.PI * 2);
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

        // Emerging "Rising" effect: reveal parts slowly
        if (this.state === 'EMERGING') {
            const revealAlpha = Math.min(1, this.emergeProgress * 2);
            ctx.globalAlpha = revealAlpha;
            
            // Apply a local clipping region to show "rising" from water
            // Everything behind a certain line is hidden
            const climbLine = this.size * (1 - this.emergeProgress * 2); // Moves from front to back
            
            ctx.beginPath();
            ctx.rect(climbLine, -this.size, this.size * 2, this.size * 2);
            ctx.clip();
        }

        ctx.scale(scale, scale);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(0, shadowOffset / scale, this.size * 0.6, this.size * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = this.color;
        
        ctx.beginPath();
        ctx.ellipse(-this.size * 0.2, -this.size * 0.4, this.size * 0.4, this.size * 0.2, -0.5, 0, Math.PI * 2);
        ctx.ellipse(-this.size * 0.2, this.size * 0.4, this.size * 0.4, this.size * 0.2, 0.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.ellipse(0, 0, this.size * 0.8, this.size * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.size * 0.5, -this.size * 0.3, this.size * 0.25, 0, Math.PI * 2);
        ctx.arc(this.size * 0.5, this.size * 0.3, this.size * 0.25, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = this.eyeColor;
        ctx.beginPath();
        ctx.arc(this.size * 0.6, -this.size * 0.3, this.size * 0.1, 0, Math.PI * 2);
        ctx.arc(this.size * 0.6, this.size * 0.3, this.size * 0.1, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

class Duck {
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
        
        // Colors
        if (this.type === 'DUCKLING') {
            this.color = '#FDE047'; // Yellow
            this.beakColor = '#F97316'; // Orange
        } else {
            // Randomly pick between Mallard (green head) or standard white/brown
            const rand = Math.random();
            if (rand > 0.6) {
                this.color = '#F5F5F5'; // White duck
                this.headColor = '#F5F5F5';
            } else if (rand > 0.3) {
                this.color = '#78350F'; // Brown duck
                this.headColor = '#065F46'; // Mallard green
            } else {
                this.color = '#525252'; // Gray duck
                this.headColor = '#525252';
            }
            this.beakColor = '#F97316';
        }
    }

    update() {
        if (this.leader) {
            // Ducklings follow the leader
            const dx = this.leader.x - this.x;
            const dy = this.leader.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            // Increased spacing: 35 for first plus 15 for each subsequent duckling
            const ducklingIndex = this.pond.ducks.filter(d => d.leader === this.leader).indexOf(this) + 1;
            const targetDist = 20 + ducklingIndex * 18; 

            if (dist > targetDist) {
                this.targetAngle = Math.atan2(dy, dx);
                this.speed = this.leader.speed * 1.2;
            } else {
                this.targetAngle = this.leader.angle;
                this.speed = this.leader.speed * 0.9;
            }

            // Simple separation between ducklings
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
            // Paired ducks stay near each other
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

        // Steering behavior to avoid lily pads
        this.pond.lilyPads.forEach(pad => {
            const dx = pad.x - this.x;
            const dy = pad.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const avoidanceRadius = pad.size + this.size + 10;

            if (dist < avoidanceRadius) {
                // Steer away from the center of the lily pad
                const angleFromPad = Math.atan2(this.y - pad.y, this.x - pad.x);
                // Blend avoidance into targetAngle
                const force = (1 - dist / avoidanceRadius) * 0.5;
                this.targetAngle = this.targetAngle * (1 - force) + angleFromPad * force;
                this.speed = Math.max(0.4, this.speed * 0.8); // Slow down slightly when steering away
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

        // Head
        ctx.fillStyle = this.headColor || this.color;
        ctx.beginPath();
        ctx.arc(this.size * 0.7, 0, this.size * 0.5, 0, Math.PI * 2);
        ctx.fill();

        // Beak (Rounded)
        ctx.fillStyle = this.beakColor;
        ctx.beginPath();
        ctx.ellipse(this.size * 1.2, 0, this.size * 0.4, this.size * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eye
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(this.size * 0.85, -this.size * 0.2, this.size * 0.1, 0, Math.PI * 2);
        ctx.arc(this.size * 0.85, this.size * 0.2, this.size * 0.1, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

class GroovyFish {
    constructor() {
        this.canvas = document.getElementById('fishCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // State
        this.fish = [];
        this.food = [];
        this.lilyPads = [];
        this.frogs = [];
        this.flies = [];
        this.ducks = [];
        this.splashes = [];
        this.mousePos = { x: 0, y: 0 };
        
        // Colors matching Groovy Fish
        this.waterColor = '#1E5FD9';
        this.lilyPadColor = '#22C55E';
        this.lilyPadDarkColor = '#16A34A';
        this.flowerColor = '#FFFFFF';
        this.foodColor = '#22C55E';
        
        this.init();
    }
    
    init() {
        this.resizeCanvas();
        this.createLilyPads();
        this.createInitialFish();
        this.createFrogs();
        this.createFlies();
        this.createDucks();
        this.setupEventListeners();
        this.animate();
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    setupEventListeners() {
        window.addEventListener('resize', () => {
            this.resizeCanvas();
            this.createLilyPads();
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            this.mousePos.x = e.clientX;
            this.mousePos.y = e.clientY;
        });
        
        this.canvas.addEventListener('click', (e) => {
            // Drop multiple food pieces like Groovy Fish
            for (let i = 0; i < 3; i++) {
                this.dropFood(
                    e.clientX + (Math.random() - 0.5) * 40,
                    e.clientY + (Math.random() - 0.5) * 40
                );
            }
        });
        
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            for (let i = 0; i < 3; i++) {
                this.dropFood(
                    touch.clientX + (Math.random() - 0.5) * 40,
                    touch.clientY + (Math.random() - 0.5) * 40
                );
            }
        });
    }
    
    createLilyPads() {
        this.lilyPads = [];
        const count = Math.floor((this.canvas.width * this.canvas.height) / 80000) + 4;
        const maxAttempts = 100;
        
        for (let i = 0; i < count; i++) {
            let placed = false;
            let attempts = 0;
            
            while (!placed && attempts < maxAttempts) {
                const size = 40 + Math.random() * 50;
                const x = Math.random() * (this.canvas.width - size * 2) + size;
                const y = Math.random() * (this.canvas.height - size * 2) + size;
                
                const overlap = this.lilyPads.some(other => {
                    const dist = Math.sqrt(Math.pow(other.x - x, 2) + Math.pow(other.y - y, 2));
                    return dist < (other.size + size) * 0.9; // Allow very slight overlap for natural look, but mostly scattered
                });
                
                if (!overlap) {
                    this.lilyPads.push({
                        x: x,
                        y: y,
                        size: size,
                        rotation: Math.random() * Math.PI * 2,
                        hasFlower: Math.random() > 0.5,
                        bobPhase: Math.random() * Math.PI * 2,
                    });
                    placed = true;
                }
                attempts++;
            }
        }
    }
    
    createInitialFish() {
        // Fish colors matching Groovy Fish - viewed from top
        const fishTypes = [
            { body: '#E74C3C', tail: '#C0392B' },      // Red koi
            { body: '#FF6B4A', tail: '#E74C3C' },      // Orange koi
            { body: '#1a1a1a', tail: '#333333' },      // Black koi
            { body: '#F5F5F5', tail: '#D0D0D0' },      // White koi
            { body: '#808080', tail: '#606060' },      // Gray koi
            { body: '#E8E84A', tail: '#C9C93D' },      // Yellow koi
        ];
        
        // Create 3 standard fish
        for (let i = 0; i < 3; i++) {
            const fishType = fishTypes[i % fishTypes.length];
            this.createFish(fishType);
        }

        // Create 2 Asian Carps
        for (let i = 0; i < 2; i++) {
            const fishType = fishTypes[(i + 3) % fishTypes.length];
            this.fish.push(new AsianCarp(this, fishType));
        }
    }
    
    createFish(colorScheme) {
        const fish = {
            x: Math.random() * this.canvas.width,
            y: Math.random() * this.canvas.height,
            size: 18 + Math.random() * 12, // SMALLER fish
            speed: 0.8 + Math.random() * 1.2,
            angle: Math.random() * Math.PI * 2,
            targetAngle: Math.random() * Math.PI * 2,
            turnSpeed: 0.025 + Math.random() * 0.015,
            colors: colorScheme,
            tailPhase: Math.random() * Math.PI * 2,
            tailSpeed: 0.12,
            wanderTimer: 0,
        };
        this.fish.push(fish);
    }

    createFrogs() {
        this.frogs = [];
        for (let i = 0; i < 3; i++) {
            this.frogs.push(new Frog(this));
        }
    }

    createFlies() {
        this.flies = [];
        for (let i = 0; i < 4; i++) {
            this.flies.push(new Fly(this));
        }
    }

    createDucks() {
        this.ducks = [];
        
        // 1. Mother Duck with 4 ducklings
        const mother = new Duck(this, 'ADULT');
        this.ducks.push(mother);
        for (let i = 0; i < 4; i++) {
            this.ducks.push(new Duck(this, 'DUCKLING', mother));
        }

        // 2. A Single Adult Duck
        this.ducks.push(new Duck(this, 'ADULT'));

        // 3. A Pair of Adult Ducks
        const partner1 = new Duck(this, 'ADULT');
        const partner2 = new Duck(this, 'ADULT', null, partner1);
        partner1.partner = partner2;
        this.ducks.push(partner1, partner2);
    }
    
    dropFood(x, y) {
        this.food.push({
            x: x,
            y: y,
            size: 4 + Math.random() * 2,
            eaten: false,
        });
    }
    
    update() {
        // Update food - remove eaten ones
        this.food = this.food.filter(food => !food.eaten);
        
        // Update fish
        this.fish.forEach(fish => {
            if (fish.update && typeof fish.update === 'function') {
                fish.update();
                return;
            }
            // Fallback for simple fish object
            // Find nearest food
            let nearestFood = null;
            let nearestDist = Infinity;
            
            this.food.forEach(food => {
                const dx = food.x - fish.x;
                const dy = food.y - fish.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < nearestDist) {
                    nearestDist = dist;
                    nearestFood = food;
                }
            });
            
            // Move toward food or wander
            if (nearestFood && nearestDist < 350) {
                fish.targetAngle = Math.atan2(nearestFood.y - fish.y, nearestFood.x - fish.x);
                fish.speed = 2;
                
                // Eat food if close
                if (nearestDist < fish.size * 0.8) {
                    nearestFood.eaten = true;
                }
            } else {
                // Random wandering
                fish.wanderTimer--;
                if (fish.wanderTimer <= 0) {
                    fish.targetAngle += (Math.random() - 0.5) * Math.PI * 0.6;
                    fish.wanderTimer = 100 + Math.random() * 200;
                    fish.speed = 0.6 + Math.random() * 0.6;
                }
            }
            
            // Smooth turn toward target
            let angleDiff = fish.targetAngle - fish.angle;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            fish.angle += angleDiff * fish.turnSpeed;
            
            // Move fish
            fish.x += Math.cos(fish.angle) * fish.speed;
            fish.y += Math.sin(fish.angle) * fish.speed;
            
            // Tail animation
            fish.tailPhase += fish.tailSpeed * (0.5 + fish.speed * 0.4);
            
            // Wrap around screen edges
            const padding = fish.size * 2;
            if (fish.x < -padding) fish.x = this.canvas.width + padding;
            if (fish.x > this.canvas.width + padding) fish.x = -padding;
            if (fish.y < -padding) fish.y = this.canvas.height + padding;
            if (fish.y > this.canvas.height + padding) fish.y = -padding;
        });

        // Update frogs
        this.frogs.forEach(frog => frog.update());

        // Update flies
        this.flies = this.flies.filter(fly => fly.update());
        if (this.flies.length < 4 && Math.random() < 0.005) {
            this.flies.push(new Fly(this));
        }

        // Update ducks
        this.ducks.forEach(duck => duck.update());

        // Update splashes
        this.splashes = this.splashes.filter(splash => splash.update());
        
        // Update lily pad bob
        this.lilyPads.forEach(pad => {
            pad.bobPhase += 0.015;
        });
    }
    
    draw() {
        const ctx = this.ctx;
        
        // Clear with water color
        ctx.fillStyle = this.waterColor;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw splases (on bottom level of water)
        this.splashes.forEach(splash => splash.draw(ctx));

        // Draw fish FIRST (they swim under lily pads)
        this.fish.forEach(fish => {
            if (fish.draw && typeof fish.draw === 'function') {
                fish.draw(ctx);
            } else {
                this.drawTopDownFish(fish);
            }
        });
        
        // Draw food (on water surface)
        this.food.forEach(food => this.drawFood(food));
        
        // Draw lily pads (they float on surface)
        this.lilyPads.forEach(pad => this.drawLilyPad(pad));

        // Draw flies
        this.flies.forEach(fly => fly.draw(ctx));

        // Draw frogs LAST (they jump on top of everything)
        this.frogs.forEach(frog => frog.draw(ctx));

        // Draw ducks
        this.ducks.forEach(duck => duck.draw(ctx));
    }
    
    drawLilyPad(pad) {
        const ctx = this.ctx;
        const bob = Math.sin(pad.bobPhase) * 1;
        
        ctx.save();
        ctx.translate(pad.x, pad.y + bob);
        ctx.rotate(pad.rotation);
        
        // Lily pad (green circle with notch)
        ctx.fillStyle = this.lilyPadColor;
        ctx.beginPath();
        ctx.arc(0, 0, pad.size, 0.15, Math.PI * 2 - 0.15);
        ctx.lineTo(0, 0);
        ctx.closePath();
        ctx.fill();
        
        // Darker edge
        ctx.strokeStyle = this.lilyPadDarkColor;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Vein lines
        ctx.strokeStyle = this.lilyPadDarkColor;
        ctx.lineWidth = 1;
        for (let i = 0; i < 5; i++) {
            const angle = 0.3 + (i / 5) * (Math.PI * 2 - 0.5);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(
                Math.cos(angle) * pad.size * 0.8,
                Math.sin(angle) * pad.size * 0.8
            );
            ctx.stroke();
        }
        
        // Flower if present
        if (pad.hasFlower) {
            this.drawFlower(ctx, pad.size * 0.25, -pad.size * 0.15, pad.size * 0.25);
        }
        
        ctx.restore();
    }
    
    drawFlower(ctx, x, y, size) {
        ctx.save();
        ctx.translate(x, y);
        
        // White petals
        ctx.fillStyle = this.flowerColor;
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            ctx.beginPath();
            ctx.ellipse(
                Math.cos(angle) * size * 0.35,
                Math.sin(angle) * size * 0.35,
                size * 0.3,
                size * 0.18,
                angle,
                0, Math.PI * 2
            );
            ctx.fill();
        }
        
        // Yellow center
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    drawFood(food) {
        const ctx = this.ctx;
        
        // Green food dots like Groovy Fish
        ctx.fillStyle = this.foodColor;
        ctx.beginPath();
        ctx.arc(food.x, food.y, food.size, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // TOP-DOWN fish view - simple oval body with forked tail
    drawTopDownFish(fish) {
        const ctx = this.ctx;
        ctx.save();
        ctx.translate(fish.x, fish.y);
        ctx.rotate(fish.angle);
        
        const size = fish.size;
        const tailSwing = Math.sin(fish.tailPhase) * 0.3;
        
        // Draw simple top-down fish shape
        ctx.fillStyle = fish.colors.body;
        
        // Tail (forked, viewed from above)
        ctx.beginPath();
        ctx.moveTo(-size * 0.6, 0);
        // Left tail fork
        ctx.quadraticCurveTo(
            -size * 0.9, -size * 0.15 + tailSwing * size * 0.2,
            -size * 1.3 + tailSwing * size * 0.4, -size * 0.35 + tailSwing * size * 0.15
        );
        ctx.quadraticCurveTo(
            -size * 0.85, tailSwing * size * 0.1,
            -size * 0.6, 0
        );
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(-size * 0.6, 0);
        // Right tail fork
        ctx.quadraticCurveTo(
            -size * 0.9, size * 0.15 + tailSwing * size * 0.2,
            -size * 1.3 + tailSwing * size * 0.4, size * 0.35 + tailSwing * size * 0.15
        );
        ctx.quadraticCurveTo(
            -size * 0.85, tailSwing * size * 0.1,
            -size * 0.6, 0
        );
        ctx.fill();
        
        // Body (rounded oval from top view)
        ctx.beginPath();
        ctx.ellipse(0, 0, size * 0.65, size * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Head (slightly pointy at front)
        ctx.beginPath();
        ctx.ellipse(size * 0.4, 0, size * 0.35, size * 0.28, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    animate() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.animate());
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    new GroovyFish();
});
