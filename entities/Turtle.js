import { Splash } from './Splash.js';

export class Turtle {
    constructor(pond) {
        this.pond = pond;
        this.reset();
    }

    reset() {
        this.x = Math.random() * this.pond.canvas.width;
        this.y = Math.random() * this.pond.canvas.height;
        this.size = 12 + Math.random() * 5;
        this.baseSize = this.size;
        this.angle = Math.random() * Math.PI * 2;
        this.targetAngle = this.angle;
        this.speed = 0.3 + Math.random() * 0.2;
        this.depth = 1;
        this.targetDepth = 1;
        this.depthSpeed = 0.005;
        this.diveTimer = 100 + Math.random() * 300;
        this.state = 'UNDERWATER';
        this.targetSpot = null;
        this.sunbatheTimer = 0;
        this.paddlingPhase = Math.random() * Math.PI * 2;
        this.dropProgress = 0;
    }

    update() {
        if (Math.abs(this.depth - this.targetDepth) > 0.01) {
            this.depth += (this.targetDepth - this.depth) * this.depthSpeed;
            this.size = this.baseSize * (0.6 + (1 - this.depth) * 0.4);
        }
        if (this.state === 'UNDERWATER' || this.state === 'SURFACE' || this.state === 'APPROACHING') {
            this.angle += Math.sin(Date.now() * 0.001) * 0.01;
            let moveSpeed = this.speed;
            this.diveTimer--;
            if (this.diveTimer <= 0) {
                if (this.state === 'UNDERWATER') { this.state = 'SURFACE'; this.targetDepth = 0; this.diveTimer = 200 + Math.random() * 400; }
                else if (this.state === 'SURFACE') { this.state = 'UNDERWATER'; this.targetDepth = 1; this.diveTimer = 400 + Math.random() * 800; }
            }
            if (this.state === 'APPROACHING') {
                if (!this.targetSpot) { this.state = 'SURFACE'; } else {
                    const t = this.targetSpot, tr = t.trunk, sp = t.spot;
                    const spotX = tr.x + Math.cos(tr.angle) * (-tr.length * 0.5 + tr.length * sp.pos);
                    const spotY = tr.y + Math.sin(tr.angle) * (-tr.length * 0.5 + tr.length * sp.pos);
                    const dx = spotX - this.x, dy = spotY - this.y, dist = Math.sqrt(dx*dx+dy*dy);
                    this.targetAngle = Math.atan2(dy, dx);
                    let ad = this.targetAngle - this.angle;
                    while (ad > Math.PI) ad -= Math.PI*2; while (ad < -Math.PI) ad += Math.PI*2;
                    this.angle += ad * 0.05; moveSpeed = 0.8; this.targetDepth = 0;
                    if (dist < 20 && this.depth < 0.2) this.state = 'CLIMBING';
                }
            }
            this.x += Math.cos(this.angle) * moveSpeed; this.y += Math.sin(this.angle) * moveSpeed;
            this.paddlingPhase += 0.05;
            if (this.state === 'SURFACE' && Math.random() < 0.005) this.findTrunk();
        } else if (this.state === 'CLIMBING') {
            if (!this.targetSpot) { this.state = 'SURFACE'; this.targetDepth = 0; return; }
            const t = this.targetSpot, tr = t.trunk, sp = t.spot;
            const spotX = tr.x + Math.cos(tr.angle)*(-tr.length*0.5+tr.length*sp.pos);
            const spotY = tr.y + Math.sin(tr.angle)*(-tr.length*0.5+tr.length*sp.pos);
            const dx = spotX-this.x, dy = spotY-this.y, dist = Math.sqrt(dx*dx+dy*dy);
            this.targetAngle = Math.atan2(dy,dx);
            let ad = this.targetAngle-this.angle;
            while(ad>Math.PI) ad-=Math.PI*2; while(ad<-Math.PI) ad+=Math.PI*2;
            this.angle += ad*0.05;
            const struggle = Math.sin(Date.now()*0.02)>0.3?1:0;
            const jitter = (Math.random()-0.5)*0.6;
            this.x += Math.cos(this.angle)*0.6*struggle+Math.cos(this.angle+Math.PI/2)*jitter;
            this.y += Math.sin(this.angle)*0.6*struggle+Math.sin(this.angle+Math.PI/2)*jitter;
            this.paddlingPhase += 0.2;
            if (dist < 5) {
                this.state = 'SUNBATHING'; this.sunbatheTimer = 300+Math.random()*600;
                this.x = spotX; this.y = spotY;
                this.angle = tr.angle+Math.PI*0.5*(Math.random()>0.5?1:-1);
                this.depth = 0; this.targetDepth = 0;
            }
        } else if (this.state === 'SUNBATHING') {
            this.sunbatheTimer--; if (this.sunbatheTimer <= 0) { this.state = 'DROPPING'; this.dropProgress = 0; }
        } else if (this.state === 'DROPPING') {
            this.dropProgress += 0.05;
            if (this.dropProgress >= 1) {
                this.x += Math.cos(this.angle)*15; this.y += Math.sin(this.angle)*15;
                this.pond.splashes.push(new Splash(this.x, this.y));
                if (this.targetSpot) this.targetSpot.spot.occupied = null;
                this.targetSpot = null; this.state = 'UNDERWATER';
                this.depth = 1; this.targetDepth = 1; this.size = this.baseSize*0.6;
                this.diveTimer = 400+Math.random()*800;
            }
        }
        const pad = 50;
        if (this.x<-pad) this.x=this.pond.canvas.width+pad;
        if (this.x>this.pond.canvas.width+pad) this.x=-pad;
        if (this.y<-pad) this.y=this.pond.canvas.height+pad;
        if (this.y>this.pond.canvas.height+pad) this.y=-pad;
    }

    findTrunk() {
        for (const trunk of this.pond.trunks) {
            for (const spot of trunk.spots) {
                if (!spot.occupied) { spot.occupied = this; this.targetSpot = {trunk, spot}; this.state = 'APPROACHING'; return; }
            }
        }
    }

    draw(ctx) {
        if (this.state === 'DROPPING') return;
        ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.angle);
        const opac = this.state==='SUNBATHING'||this.state==='CLIMBING'?1:0.4+(1-this.depth)*0.6;
        ctx.globalAlpha = opac;
        if (this.state !== 'SUNBATHING') {
            const p = Math.sin(this.paddlingPhase)*0.3;
            ctx.fillStyle='#2D4B2D';
            ctx.beginPath();ctx.ellipse(this.size*0.4,-this.size*0.4+p*5,this.size*0.2,this.size*0.3,0.5,0,Math.PI*2);ctx.fill();
            ctx.beginPath();ctx.ellipse(this.size*0.4,this.size*0.4-p*5,this.size*0.2,this.size*0.3,-0.5,0,Math.PI*2);ctx.fill();
            ctx.beginPath();ctx.ellipse(-this.size*0.4,-this.size*0.4-p*5,this.size*0.2,this.size*0.3,-0.5,0,Math.PI*2);ctx.fill();
            ctx.beginPath();ctx.ellipse(-this.size*0.4,this.size*0.4+p*5,this.size*0.2,this.size*0.3,0.5,0,Math.PI*2);ctx.fill();
        }
        ctx.fillStyle='#1B3022';ctx.strokeStyle='#2D4B2D';ctx.lineWidth=1;
        ctx.beginPath();ctx.ellipse(0,0,this.size,this.size*0.8,0,0,Math.PI*2);ctx.fill();ctx.stroke();
        ctx.strokeStyle='rgba(255,255,255,0.05)';
        for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(0,0,this.size*(0.3+i*0.2),0,Math.PI*2);ctx.stroke();}
        ctx.fillStyle='#2D4B2D';ctx.beginPath();ctx.ellipse(this.size*0.9,0,this.size*0.3,this.size*0.22,0,0,Math.PI*2);ctx.fill();
        ctx.restore();
    }
}
