// ========================================
// Groovy Fish - Top-Down Koi Pond
// Modular Architecture
// ========================================

import { Splash } from './entities/Splash.js';
import { Fish }   from './entities/Fish.js';
import { AsianCarp } from './entities/AsianCarp.js';
import { Fly }    from './entities/Fly.js';
import { Frog }   from './entities/Frog.js';
import { Duck }   from './entities/Duck.js';
import { Bird }   from './entities/Bird.js';
import { Trunk }  from './entities/Trunk.js';
import { Turtle } from './entities/Turtle.js';
import { Cormorant } from './entities/Cormorant.js';

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
        this.birds = [];
        this.trunks = [];
        this.turtles = [];
        this.cormorants = [];
        this.splashes = [];
        this.ripples = [];
        this.mousePos = { x: -100, y: -100 };
        this.lastMousePos = { x: -100, y: -100 };
        this.isMouseDown = false;
        this.feedStreak = 0;
        this.feedStreakTimer = 0;

        // Colors
        this.waterColor = '#1E5FD9';
        this.lilyPadColor = '#22C55E';
        this.lilyPadDarkColor = '#16A34A';
        this.flowerColor = '#FFFFFF';
        this.foodColor = '#22C55E';
        
        // Water caustics phase
        this.causticPhase = 0;

        // Performance: time tracking
        this.lastTime = 0;
        this.frameCount = 0;

        // Mobile rotation state
        this.isRotated = false;
        this.hasRequestedFullscreen = false;

        this.init();
    }
    
    init() {
        this.resizeCanvas();
        this.createLilyPads();
        this.createInitialFish();
        this.createFrogs();
        this.createFlies();
        this.createDucks();
        this.createBirds();
        this.createTrunks();
        this.createTurtles();
        this.createCormorants();
        this.setupEventListeners();
        this.animate(0);
    }
    
    resizeCanvas() {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const isMobile = ('ontouchstart' in window || navigator.maxTouchPoints > 0) && Math.min(vw, vh) < 768;
        const isPortrait = vh > vw;

        if (isMobile && isPortrait) {
            // Portrait mobile: rotate canvas to landscape
            this.isRotated = true;
            this.canvas.width = vh;   // landscape width = screen height
            this.canvas.height = vw;  // landscape height = screen width
            this.canvas.style.transformOrigin = 'top left';
            this.canvas.style.transform = `rotate(90deg) translateY(-100%)`;
            this.canvas.style.width = vh + 'px';
            this.canvas.style.height = vw + 'px';
        } else {
            // Landscape or desktop: normal
            this.isRotated = false;
            this.canvas.width = vw;
            this.canvas.height = vh;
            this.canvas.style.transform = 'none';
            this.canvas.style.transformOrigin = '';
            this.canvas.style.width = '';
            this.canvas.style.height = '';
        }
    }

    // Remap screen coordinates to canvas coordinates (accounting for rotation)
    remapCoords(screenX, screenY) {
        if (this.isRotated) {
            // When rotated 90° CW: canvas X = screenY, canvas Y = canvasHeight - screenX
            return {
                x: screenY,
                y: this.canvas.height - screenX
            };
        }
        return { x: screenX, y: screenY };
    }

    // Try to enter fullscreen on mobile for immersive experience
    tryFullscreen() {
        if (this.hasRequestedFullscreen) return;
        this.hasRequestedFullscreen = true;
        const el = document.documentElement;
        const requestFs = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen || el.msRequestFullscreen;
        if (requestFs) {
            requestFs.call(el).catch(() => {});
        }
    }
    
    setupEventListeners() {
        window.addEventListener('resize', () => {
            this.resizeCanvas();
            this.createLilyPads();
        });

        // Also handle orientation changes on mobile
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.resizeCanvas();
                this.createLilyPads();
            }, 200);
        });

        // Handle fullscreen change — resize when entering/leaving
        document.addEventListener('fullscreenchange', () => {
            setTimeout(() => {
                this.resizeCanvas();
                this.createLilyPads();
            }, 200);
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            const pos = this.remapCoords(e.clientX, e.clientY);
            this.lastMousePos.x = this.mousePos.x;
            this.lastMousePos.y = this.mousePos.y;
            this.mousePos.x = pos.x;
            this.mousePos.y = pos.y;

            // Drag-feed when holding mouse
            if (this.isMouseDown) {
                if (Math.random() < 0.3) {
                    this.dropFood(pos.x + (Math.random()-0.5)*20, pos.y + (Math.random()-0.5)*20);
                }
            }
        });
        
        this.canvas.addEventListener('mousedown', (e) => {
            this.isMouseDown = true;
        });

        this.canvas.addEventListener('mouseup', (e) => {
            this.isMouseDown = false;
        });
        
        this.canvas.addEventListener('click', (e) => {
            const pos = this.remapCoords(e.clientX, e.clientY);
            // Drop multiple food pieces
            const count = 3 + Math.floor(this.feedStreak * 0.5);
            for (let i = 0; i < Math.min(count, 8); i++) {
                this.dropFood(
                    pos.x + (Math.random() - 0.5) * 40,
                    pos.y + (Math.random() - 0.5) * 40
                );
            }
            // Water splash on click
            this.splashes.push(new Splash(pos.x, pos.y));
            // Ripple
            this.ripples.push({ x: pos.x, y: pos.y, radius: 5, maxRadius: 60 + Math.random()*20, life: 1 });

            this.feedStreak++;
            this.feedStreakTimer = 120;
        });
        
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            // Try fullscreen on first touch
            this.tryFullscreen();
            const touch = e.touches[0];
            const pos = this.remapCoords(touch.clientX, touch.clientY);
            for (let i = 0; i < 3; i++) {
                this.dropFood(
                    pos.x + (Math.random() - 0.5) * 40,
                    pos.y + (Math.random() - 0.5) * 40
                );
            }
            this.splashes.push(new Splash(pos.x, pos.y));
        });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const pos = this.remapCoords(touch.clientX, touch.clientY);
            this.mousePos.x = pos.x;
            this.mousePos.y = pos.y;
            if (Math.random() < 0.3) {
                this.dropFood(pos.x + (Math.random()-0.5)*20, pos.y + (Math.random()-0.5)*20);
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
                    return dist < (other.size + size) * 0.9;
                });
                if (!overlap) {
                    this.lilyPads.push({
                        x, y, size,
                        rotation: Math.random() * Math.PI * 2,
                        hasFlower: Math.random() > 0.5,
                        bobPhase: Math.random() * Math.PI * 2,
                        flowerPhase: Math.random() * Math.PI * 2,
                    });
                    placed = true;
                }
                attempts++;
            }
        }
    }
    
    createInitialFish() {
        const fishTypes = [
            { body: '#E74C3C', tail: '#C0392B' },
            { body: '#FF6B4A', tail: '#E74C3C' },
            { body: '#1a1a1a', tail: '#333333' },
            { body: '#F5F5F5', tail: '#D0D0D0' },
            { body: '#808080', tail: '#606060' },
            { body: '#E8E84A', tail: '#C9C93D' },
        ];
        for (let i = 0; i < 3; i++) {
            this.fish.push(new Fish(this, fishTypes[i % fishTypes.length]));
        }
        for (let i = 0; i < 2; i++) {
            this.fish.push(new AsianCarp(this, fishTypes[(i + 3) % fishTypes.length]));
        }
    }

    createFrogs() { this.frogs = []; for (let i = 0; i < 3; i++) this.frogs.push(new Frog(this)); }
    createFlies() { this.flies = []; for (let i = 0; i < 4; i++) this.flies.push(new Fly(this)); }
    createBirds() { this.birds = []; for (let i = 0; i < 2; i++) this.birds.push(new Bird(this)); }
    createTrunks() { this.trunks = []; this.trunks.push(new Trunk(this)); }
    createTurtles() { this.turtles = []; for (let i = 0; i < 4; i++) this.turtles.push(new Turtle(this)); }
    createCormorants() { this.cormorants = []; for (let i = 0; i < 3; i++) this.cormorants.push(new Cormorant(this)); }

    createDucks() {
        this.ducks = [];
        const mother = new Duck(this, 'ADULT');
        this.ducks.push(mother);
        for (let i = 0; i < 4; i++) this.ducks.push(new Duck(this, 'DUCKLING', mother));
        this.ducks.push(new Duck(this, 'ADULT'));
        const p1 = new Duck(this, 'ADULT');
        const p2 = new Duck(this, 'ADULT', null, p1);
        p1.partner = p2;
        this.ducks.push(p1, p2);
    }
    
    dropFood(x, y) {
        this.food.push({
            x, y,
            size: 4 + Math.random() * 2,
            eaten: false,
            age: 0,
            sinkPhase: Math.random() * Math.PI * 2,
        });
    }
    
    update() {
        this.causticPhase += 0.008;

        // Feed streak decay
        if (this.feedStreakTimer > 0) this.feedStreakTimer--;
        else this.feedStreak = 0;

        // Update food
        this.food.forEach(f => { f.age++; f.sinkPhase += 0.05; });
        this.food = this.food.filter(food => !food.eaten && food.age < 600);
        
        // Update all entities
        this.fish.forEach(f => f.update());
        this.frogs.forEach(f => f.update());
        this.flies = this.flies.filter(fly => fly.update());
        if (this.flies.length < 4 && Math.random() < 0.005) this.flies.push(new Fly(this));
        this.ducks.forEach(d => d.update());
        this.birds.forEach(b => b.update());
        this.turtles.forEach(t => t.update());
        this.cormorants.forEach(c => c.update());
        this.splashes = this.splashes.filter(s => s.update());
        
        // Update ripples
        this.ripples.forEach(r => {
            r.radius += (r.maxRadius - r.radius) * 0.06;
            r.life -= 0.015;
        });
        this.ripples = this.ripples.filter(r => r.life > 0);

        // Update lily pad bob
        this.lilyPads.forEach(pad => {
            pad.bobPhase += 0.015;
            pad.flowerPhase += 0.01;
        });
    }
    
    draw() {
        const ctx = this.ctx;
        
        // Water background with subtle gradient
        const waterGrad = ctx.createRadialGradient(
            this.canvas.width/2, this.canvas.height/2, 0,
            this.canvas.width/2, this.canvas.height/2, Math.max(this.canvas.width, this.canvas.height) * 0.7
        );
        waterGrad.addColorStop(0, '#2468E0');
        waterGrad.addColorStop(1, '#1A4FBB');
        ctx.fillStyle = waterGrad;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Water caustics overlay
        this.drawCaustics(ctx);

        // Splashes
        this.splashes.forEach(s => s.draw(ctx));

        // Ripples
        this.ripples.forEach(r => {
            ctx.save();
            ctx.strokeStyle = `rgba(255,255,255,${r.life * 0.3})`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        });

        // Fish (under lily pads)
        this.fish.forEach(f => f.draw(ctx));
        
        // Swimming turtles
        this.turtles.forEach(t => {
            if (t.state === 'UNDERWATER' || t.state === 'SURFACE' || t.state === 'APPROACHING') t.draw(ctx);
        });

        // Food
        this.food.forEach(f => this.drawFood(f));
        
        // Lily pads
        this.lilyPads.forEach(pad => this.drawLilyPad(pad));

        // Flies
        this.flies.forEach(f => f.draw(ctx));

        // Frogs
        this.frogs.forEach(f => f.draw(ctx));

        // Ducks
        this.ducks.forEach(d => d.draw(ctx));

        // Cormorants
        this.cormorants.forEach(c => c.draw(ctx));

        // Trunks
        this.trunks.forEach(t => t.draw(ctx));

        // Sunbathing turtles
        this.turtles.forEach(t => {
            if (t.state === 'SUNBATHING' || t.state === 'CLIMBING') t.draw(ctx);
        });

        // Flying birds
        this.birds.forEach(b => b.draw(ctx));

        // Feed streak UI
        if (this.feedStreak > 2) {
            ctx.save();
            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            ctx.font = 'bold 16px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`🐟 Feed Streak: ${this.feedStreak}x`, this.canvas.width/2, 30);
            ctx.restore();
        }
    }

    drawCaustics(ctx) {
        ctx.save();
        ctx.globalAlpha = 0.04;
        const step = 80;
        for (let x = 0; x < this.canvas.width; x += step) {
            for (let y = 0; y < this.canvas.height; y += step) {
                const noise = Math.sin(x * 0.01 + this.causticPhase) * Math.cos(y * 0.01 + this.causticPhase * 1.3);
                const r = 20 + noise * 15;
                ctx.fillStyle = '#FFFFFF';
                ctx.beginPath();
                ctx.arc(x + noise * 10, y + Math.cos(x * 0.02 + this.causticPhase) * 8, r, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.restore();
    }
    
    drawLilyPad(pad) {
        const ctx = this.ctx;
        const bob = Math.sin(pad.bobPhase) * 1;
        
        ctx.save();
        ctx.translate(pad.x, pad.y + bob);
        ctx.rotate(pad.rotation);
        
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.beginPath();
        ctx.arc(2, 2, pad.size, 0.15, Math.PI * 2 - 0.15);
        ctx.lineTo(2, 2);
        ctx.closePath();
        ctx.fill();

        // Lily pad
        ctx.fillStyle = this.lilyPadColor;
        ctx.beginPath();
        ctx.arc(0, 0, pad.size, 0.15, Math.PI * 2 - 0.15);
        ctx.lineTo(0, 0);
        ctx.closePath();
        ctx.fill();
        
        // Edge
        ctx.strokeStyle = this.lilyPadDarkColor;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Veins
        ctx.strokeStyle = this.lilyPadDarkColor;
        ctx.lineWidth = 1;
        for (let i = 0; i < 5; i++) {
            const angle = 0.3 + (i / 5) * (Math.PI * 2 - 0.5);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(angle) * pad.size * 0.8, Math.sin(angle) * pad.size * 0.8);
            ctx.stroke();
        }

        // Water droplet highlight
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.beginPath();
        ctx.ellipse(-pad.size * 0.2, -pad.size * 0.1, pad.size * 0.12, pad.size * 0.08, -0.3, 0, Math.PI * 2);
        ctx.fill();
        
        if (pad.hasFlower) {
            this.drawFlower(ctx, pad.size * 0.25, -pad.size * 0.15, pad.size * 0.25, pad.flowerPhase);
        }
        
        ctx.restore();
    }
    
    drawFlower(ctx, x, y, size, phase) {
        ctx.save();
        ctx.translate(x, y);
        
        // Petals with subtle bloom animation
        const bloom = 1 + Math.sin(phase) * 0.05;
        ctx.fillStyle = this.flowerColor;
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            ctx.beginPath();
            ctx.ellipse(
                Math.cos(angle) * size * 0.35 * bloom,
                Math.sin(angle) * size * 0.35 * bloom,
                size * 0.3 * bloom,
                size * 0.18 * bloom,
                angle, 0, Math.PI * 2
            );
            ctx.fill();
        }
        
        // Petal tips gradient
        ctx.fillStyle = 'rgba(255,200,200,0.3)';
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            ctx.beginPath();
            ctx.arc(
                Math.cos(angle) * size * 0.45 * bloom,
                Math.sin(angle) * size * 0.45 * bloom,
                size * 0.1, 0, Math.PI * 2
            );
            ctx.fill();
        }

        // Yellow center
        const centerGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 0.2);
        centerGrad.addColorStop(0, '#FFE44D');
        centerGrad.addColorStop(1, '#FFD700');
        ctx.fillStyle = centerGrad;
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    drawFood(food) {
        const ctx = this.ctx;
        const bob = Math.sin(food.sinkPhase) * 1;
        const fadeAlpha = food.age > 400 ? 1 - (food.age - 400) / 200 : 1;
        ctx.save();
        ctx.globalAlpha = fadeAlpha;
        // Glow
        ctx.fillStyle = 'rgba(34, 197, 94, 0.3)';
        ctx.beginPath();
        ctx.arc(food.x, food.y + bob, food.size * 2, 0, Math.PI * 2);
        ctx.fill();
        // Food pellet
        ctx.fillStyle = this.foodColor;
        ctx.beginPath();
        ctx.arc(food.x, food.y + bob, food.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
    
    animate(timestamp) {
        this.lastTime = timestamp;
        this.frameCount++;
        this.update();
        this.draw();
        requestAnimationFrame((t) => this.animate(t));
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    new GroovyFish();
});
