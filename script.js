// ========================================
// Groovy Fish - Top-Down Koi Pond
// ========================================

class GroovyFish {
    constructor() {
        this.canvas = document.getElementById('fishCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // State
        this.fish = [];
        this.food = [];
        this.lilyPads = [];
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
        
        for (let i = 0; i < count; i++) {
            this.lilyPads.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: 40 + Math.random() * 50,
                rotation: Math.random() * Math.PI * 2,
                hasFlower: Math.random() > 0.5,
                bobPhase: Math.random() * Math.PI * 2,
            });
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
        
        // Create 5 fish like Groovy Fish
        for (let i = 0; i < 5; i++) {
            const fishType = fishTypes[i % fishTypes.length];
            this.createFish(fishType);
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
        
        // Draw fish FIRST (they swim under lily pads)
        this.fish.forEach(fish => this.drawTopDownFish(fish));
        
        // Draw food (on water surface)
        this.food.forEach(food => this.drawFood(food));
        
        // Draw lily pads ON TOP (they float on surface)
        this.lilyPads.forEach(pad => this.drawLilyPad(pad));
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
