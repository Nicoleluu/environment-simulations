export const THRESHOLD = 0.8;
export function prediction(gap,sway){return gap-2*sway;}
export function sample(gap,sway,deltaKmh,t){
 const speed=deltaKmh/3.6, z=3.8-speed*t;
 // Peak simultaneous inward drift occurs as handlebars align.
 const overlap=Math.exp(-Math.pow(z/1.15,2));
 const drift=sway*overlap;
 const clearance=gap-2*drift;
 return {z,drift,clearance,contact:Math.abs(z)<0.22&&clearance<=0,progress:Math.min(1,speed*t/7.6)};
}
export function decision(gap,sway,guard){return guard&&prediction(gap,sway)<THRESHOLD?'wait':'pass';}
