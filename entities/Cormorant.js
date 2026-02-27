import { Splash } from './Splash.js';

export class Cormorant {
    constructor(pond) { this.pond = pond; this.reset(); }

    reset(isFlyingIn = false) {
        const margin = 200;
        if (isFlyingIn) {
            const side = Math.floor(Math.random()*4);
            if(side===0){this.x=-margin;this.y=Math.random()*this.pond.canvas.height;this.angle=0;}
            else if(side===1){this.x=this.pond.canvas.width+margin;this.y=Math.random()*this.pond.canvas.height;this.angle=Math.PI;}
            else if(side===2){this.x=Math.random()*this.pond.canvas.width;this.y=-margin;this.angle=Math.PI/2;}
            else{this.x=Math.random()*this.pond.canvas.width;this.y=this.pond.canvas.height+margin;this.angle=-Math.PI/2;}
            this.state='FLYING_IN';this.altitude=150;this.speed=3+Math.random()*2;
        } else {
            this.x=Math.random()*this.pond.canvas.width;this.y=Math.random()*this.pond.canvas.height;
            this.state='SURFACE';this.altitude=0;this.speed=0.5+Math.random()*0.5;
            this.angle=Math.random()*Math.PI*2;
        }
        this.size=20+Math.random()*5;this.paddlingPhase=Math.random()*Math.PI*2;this.wingPhase=0;
        this.diveTimer=200+Math.random()*400;this.flyTimer=400+Math.random()*800;
        this.underwaterTimer=0;this.hasFish=false;this.diveProgress=0;this.reappearProgress=0;this.flyProgress=0;
        this.color='#111827';this.neckColor='#1F2937';this.beakColor='#F59E0B';
    }

    update() {
        if(this.state==='FLYING_IN'){
            this.x+=Math.cos(this.angle)*this.speed;this.y+=Math.sin(this.angle)*this.speed;
            this.wingPhase+=0.2;this.altitude*=0.985;this.speed=Math.max(1,this.speed*0.99);
            if(this.altitude<2){this.altitude=0;this.state='SURFACE';this.pond.splashes.push(new Splash(this.x,this.y));this.diveTimer=200+Math.random()*400;}
        } else if(this.state==='SURFACE'){
            this.angle+=Math.sin(Date.now()*0.001)*0.01;
            this.x+=Math.cos(this.angle)*this.speed;this.y+=Math.sin(this.angle)*this.speed;
            this.paddlingPhase+=0.08;this.diveTimer--;this.flyTimer--;
            if(this.diveTimer<=0){this.state='DIVING';this.diveProgress=0;}
            else if(this.flyTimer<=0){this.state='FLYING_OUT';this.flyProgress=0;}
        } else if(this.state==='FLYING_OUT'){
            this.speed+=0.05;this.altitude+=1.5;
            this.x+=Math.cos(this.angle)*this.speed;this.y+=Math.sin(this.angle)*this.speed;
            this.wingPhase+=0.25;if(this.altitude>300) this.reset(true);
        } else if(this.state==='DIVING'){
            this.diveProgress+=0.04;this.x+=Math.cos(this.angle)*this.speed*1.5;this.y+=Math.sin(this.angle)*this.speed*1.5;
            if(this.diveProgress>=1){this.pond.splashes.push(new Splash(this.x,this.y));this.state='UNDERWATER';this.underwaterTimer=100+Math.random()*200;this.hasFish=false;}
        } else if(this.state==='UNDERWATER'){
            this.underwaterTimer--;this.x+=Math.cos(this.angle)*this.speed*2;this.y+=Math.sin(this.angle)*this.speed*2;
            if(this.underwaterTimer<=0){this.state='REAPPEARING';this.reappearProgress=0;this.hasFish=Math.random()<0.4;}
        } else if(this.state==='REAPPEARING'){
            this.reappearProgress+=0.05;
            if(this.reappearProgress>=1){this.pond.splashes.push(new Splash(this.x,this.y));this.state='SURFACE';this.diveTimer=300+Math.random()*600;this.flyTimer=400+Math.random()*800;}
        }
        if(this.state!=='FLYING_IN'&&this.state!=='FLYING_OUT'){
            const pad=100;
            if(this.x<-pad)this.x=this.pond.canvas.width+pad;if(this.x>this.pond.canvas.width+pad)this.x=-pad;
            if(this.y<-pad)this.y=this.pond.canvas.height+pad;if(this.y>this.pond.canvas.height+pad)this.y=-pad;
        }
    }

    draw(ctx) {
        if(this.state==='UNDERWATER') return;
        // Shadow
        if(this.altitude>0){
            ctx.save();const so=this.altitude*0.4;ctx.translate(this.x+so,this.y+so);ctx.rotate(this.angle);
            ctx.fillStyle='rgba(0,0,0,0.1)';ctx.beginPath();ctx.ellipse(0,0,this.size,this.size*0.4,0,0,Math.PI*2);ctx.fill();
            const wH=Math.sin(this.wingPhase)*this.size*1.2;ctx.beginPath();ctx.ellipse(0,0,this.size*0.4,Math.abs(wH),0,0,Math.PI*2);ctx.fill();
            ctx.restore();
        }
        ctx.save();ctx.translate(this.x,this.y);ctx.rotate(this.angle);
        let bodyTilt=0,scale=1+(this.altitude*0.002),alpha=1;
        if(this.state==='DIVING'){bodyTilt=this.diveProgress*0.5;scale=1-this.diveProgress*0.5;alpha=1-this.diveProgress;}
        else if(this.state==='REAPPEARING'){scale=this.reappearProgress;alpha=this.reappearProgress;}
        ctx.globalAlpha=alpha;ctx.scale(scale,scale);
        if(this.altitude>0){ctx.fillStyle=this.color;const wH=Math.sin(this.wingPhase)*this.size*1.5;ctx.beginPath();ctx.ellipse(0,0,this.size*0.5,Math.abs(wH),0,0,Math.PI*2);ctx.fill();}
        if(this.state==='SURFACE'&&this.altitude===0){ctx.strokeStyle='rgba(255,255,255,0.2)';ctx.lineWidth=1;ctx.beginPath();ctx.arc(-this.size,0,this.size*(0.8+Math.sin(this.paddlingPhase)*0.2),-Math.PI/2,Math.PI/2);ctx.stroke();}
        ctx.fillStyle=this.color;ctx.beginPath();ctx.ellipse(0,0,this.size,this.size*0.5,bodyTilt,0,Math.PI*2);ctx.fill();
        // Neck & Head
        ctx.save();const nL=this.size*0.8;const stretch=(this.state==='DIVING'?this.diveProgress*this.size*0.5:0);
        ctx.translate(this.size*0.6+stretch,0);ctx.rotate(bodyTilt);
        ctx.fillStyle=this.neckColor;ctx.beginPath();ctx.ellipse(0,0,nL,this.size*0.25,0,0,Math.PI*2);ctx.fill();
        ctx.beginPath();ctx.arc(nL*0.8,0,this.size*0.2,0,Math.PI*2);ctx.fill();
        ctx.fillStyle=this.beakColor;ctx.beginPath();ctx.moveTo(nL*0.9,-2);ctx.lineTo(nL*1.6,0);ctx.lineTo(nL*0.9,2);ctx.fill();
        if(this.hasFish){ctx.fillStyle='#94A3B8';ctx.beginPath();ctx.ellipse(nL*1.4,0,10,4,0.4,0,Math.PI*2);ctx.fill();
        ctx.fillStyle='#94A3B8';ctx.beginPath();ctx.moveTo(nL*1.4+8,2);ctx.lineTo(nL*1.4+14,-4);ctx.lineTo(nL*1.4+14,4);ctx.fill();}
        ctx.restore();ctx.restore();
    }
}
