define(["exports","./Matrix2-c6c16658","./RuntimeError-5b082e8f","./when-4bbc8319","./Transforms-a9b92e94"],(function(n,e,t,i,a){"use strict";function m(n,t,a){this.minimum=e.Cartesian3.clone(i.defaultValue(n,e.Cartesian3.ZERO)),this.maximum=e.Cartesian3.clone(i.defaultValue(t,e.Cartesian3.ZERO)),a=i.defined(a)?e.Cartesian3.clone(a):e.Cartesian3.midpoint(this.minimum,this.maximum,new e.Cartesian3),this.center=a}m.fromCorners=function(n,t,a){return i.defined(a)||(a=new m),a.minimum=e.Cartesian3.clone(n,a.minimum),a.maximum=e.Cartesian3.clone(t,a.maximum),a.center=e.Cartesian3.midpoint(n,t,a.center),a},m.fromPoints=function(n,t){if(i.defined(t)||(t=new m),!i.defined(n)||0===n.length)return t.minimum=e.Cartesian3.clone(e.Cartesian3.ZERO,t.minimum),t.maximum=e.Cartesian3.clone(e.Cartesian3.ZERO,t.maximum),t.center=e.Cartesian3.clone(e.Cartesian3.ZERO,t.center),t;let a=n[0].x,r=n[0].y,s=n[0].z,u=n[0].x,c=n[0].y,o=n[0].z;const l=n.length;for(let e=1;e<l;e++){const t=n[e],i=t.x,m=t.y,l=t.z;a=Math.min(i,a),u=Math.max(i,u),r=Math.min(m,r),c=Math.max(m,c),s=Math.min(l,s),o=Math.max(l,o)}const C=t.minimum;C.x=a,C.y=r,C.z=s;const f=t.maximum;return f.x=u,f.y=c,f.z=o,t.center=e.Cartesian3.midpoint(C,f,t.center),t},m.clone=function(n,t){if(i.defined(n))return i.defined(t)?(t.minimum=e.Cartesian3.clone(n.minimum,t.minimum),t.maximum=e.Cartesian3.clone(n.maximum,t.maximum),t.center=e.Cartesian3.clone(n.center,t.center),t):new m(n.minimum,n.maximum,n.center)},m.equals=function(n,t){return n===t||i.defined(n)&&i.defined(t)&&e.Cartesian3.equals(n.center,t.center)&&e.Cartesian3.equals(n.minimum,t.minimum)&&e.Cartesian3.equals(n.maximum,t.maximum)};let r=new e.Cartesian3;m.intersectPlane=function(n,t){r=e.Cartesian3.subtract(n.maximum,n.minimum,r);const i=e.Cartesian3.multiplyByScalar(r,.5,r),m=t.normal,s=i.x*Math.abs(m.x)+i.y*Math.abs(m.y)+i.z*Math.abs(m.z),u=e.Cartesian3.dot(n.center,m)+t.distance;return u-s>0?a.Intersect.INSIDE:u+s<0?a.Intersect.OUTSIDE:a.Intersect.INTERSECTING},m.prototype.clone=function(n){return m.clone(this,n)},m.prototype.intersectPlane=function(n){return m.intersectPlane(this,n)},m.prototype.equals=function(n){return m.equals(this,n)},n.AxisAlignedBoundingBox=m}));
