// ========================================
// Trunk - Fallen tree for turtles to sunbathe on
// ========================================

export class Trunk {
    constructor(pond) {
        this.pond = pond;
        this.reset();
    }

    reset() {
        this.x = this.pond.canvas.width - 100;
        this.y = 100;
        this.angle = Math.PI * 0.75;
        this.length = 180 + Math.random() * 40;
        this.width = 22 + Math.random() * 5;

        // Branches
        this.branches = [];
        const numBranches = 2 + Math.floor(Math.random() * 2);
        for (let i = 0; i < numBranches; i++) {
            this.branches.push({
                pos: 0.2 + (i / numBranches) * 0.6,
                angle: (Math.random() - 0.5) * Math.PI * 0.8,
                length: 40 + Math.random() * 30,
                width: this.width * 0.6,
                moss: Array.from({ length: 4 }, () => ({
                    ox: (Math.random() - 0.5),
                    oy: (Math.random() - 0.5),
                    os: 0.2 + Math.random() * 0.2
                }))
            });
        }

        this.trunkMoss = Array.from({ length: 8 }, () => ({
            ox: (Math.random() - 0.5),
            oy: (Math.random() - 0.5),
            os: 0.2 + Math.random() * 0.2
        }));

        // Sunbathing spots for turtles
        this.spots = [];
        const numSpots = 3;
        for (let i = 0; i < numSpots; i++) {
            this.spots.push({
                pos: 0.2 + (i / numSpots) * 0.6,
                occupied: null
            });
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(0, 8, this.length * 0.5, this.width * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();

        const drawSegment = (len, wid, skin, mossData) => {
            ctx.fillStyle = skin;
            ctx.beginPath();
            ctx.roundRect(-len * 0.5, -wid * 0.5, len, wid, wid * 0.5);
            ctx.fill();

            ctx.fillStyle = 'rgba(20, 50, 20, 0.3)';
            mossData.forEach(m => {
                ctx.beginPath();
                ctx.arc(m.ox * len, m.oy * wid, wid * m.os, 0, Math.PI * 2);
                ctx.fill();
            });
        };

        // Branches
        this.branches.forEach(br => {
            ctx.save();
            ctx.translate(-this.length * 0.5 + this.length * br.pos, 0);
            ctx.rotate(br.angle);
            drawSegment(br.length, br.width, '#5D4037', br.moss);
            ctx.restore();
        });

        // Main wood
        const grad = ctx.createLinearGradient(0, -this.width * 0.5, 0, this.width * 0.5);
        grad.addColorStop(0, '#5D4037');
        grad.addColorStop(0.5, '#795548');
        grad.addColorStop(1, '#4E342E');
        drawSegment(this.length, this.width, grad, this.trunkMoss);

        ctx.restore();
    }
}
