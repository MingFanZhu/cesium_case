define(["./when-4bbc8319","./Matrix2-c6c16658","./arrayRemoveDuplicates-80a91d16","./BoundingRectangle-1fe360a1","./Transforms-a9b92e94","./ComponentDatatype-3d0a0aac","./PolylineVolumeGeometryLibrary-1b677951","./RuntimeError-5b082e8f","./GeometryAttribute-d7d1ba9b","./GeometryAttributes-7827a6c2","./GeometryPipeline-92fd782d","./IndexDatatype-ddbc25a7","./PolygonPipeline-2feedb44","./VertexFormat-7b982b01","./combine-e9466e32","./WebGLConstants-508b9636","./EllipsoidTangentPlane-d5f68f6d","./AxisAlignedBoundingBox-83d2d356","./IntersectionTests-cb3f2e88","./Plane-26e67b94","./PolylinePipeline-19d62c78","./EllipsoidGeodesic-2e7ba57d","./EllipsoidRhumbLine-c6741351","./AttributeCompression-f7a901f9","./EncodedCartesian3-b1495e46"],(function(e,t,n,o,i,a,r,l,s,p,c,d,u,m,y,g,h,f,b,P,E,_,k,v,L){"use strict";function V(n){const o=(n=e.defaultValue(n,e.defaultValue.EMPTY_OBJECT)).polylinePositions,i=n.shapePositions;this._positions=o,this._shape=i,this._ellipsoid=t.Ellipsoid.clone(e.defaultValue(n.ellipsoid,t.Ellipsoid.WGS84)),this._cornerType=e.defaultValue(n.cornerType,r.CornerType.ROUNDED),this._vertexFormat=m.VertexFormat.clone(e.defaultValue(n.vertexFormat,m.VertexFormat.DEFAULT)),this._granularity=e.defaultValue(n.granularity,a.CesiumMath.RADIANS_PER_DEGREE),this._workerName="createPolylineVolumeGeometry";let l=1+o.length*t.Cartesian3.packedLength;l+=1+i.length*t.Cartesian2.packedLength,this.packedLength=l+t.Ellipsoid.packedLength+m.VertexFormat.packedLength+2}V.pack=function(n,o,i){let a;i=e.defaultValue(i,0);const r=n._positions;let l=r.length;for(o[i++]=l,a=0;a<l;++a,i+=t.Cartesian3.packedLength)t.Cartesian3.pack(r[a],o,i);const s=n._shape;for(l=s.length,o[i++]=l,a=0;a<l;++a,i+=t.Cartesian2.packedLength)t.Cartesian2.pack(s[a],o,i);return t.Ellipsoid.pack(n._ellipsoid,o,i),i+=t.Ellipsoid.packedLength,m.VertexFormat.pack(n._vertexFormat,o,i),i+=m.VertexFormat.packedLength,o[i++]=n._cornerType,o[i]=n._granularity,o};const x=t.Ellipsoid.clone(t.Ellipsoid.UNIT_SPHERE),C=new m.VertexFormat,F={polylinePositions:void 0,shapePositions:void 0,ellipsoid:x,vertexFormat:C,cornerType:void 0,granularity:void 0};V.unpack=function(n,o,i){let a;o=e.defaultValue(o,0);let r=n[o++];const l=new Array(r);for(a=0;a<r;++a,o+=t.Cartesian3.packedLength)l[a]=t.Cartesian3.unpack(n,o);r=n[o++];const s=new Array(r);for(a=0;a<r;++a,o+=t.Cartesian2.packedLength)s[a]=t.Cartesian2.unpack(n,o);const p=t.Ellipsoid.unpack(n,o,x);o+=t.Ellipsoid.packedLength;const c=m.VertexFormat.unpack(n,o,C);o+=m.VertexFormat.packedLength;const d=n[o++],u=n[o];return e.defined(i)?(i._positions=l,i._shape=s,i._ellipsoid=t.Ellipsoid.clone(p,i._ellipsoid),i._vertexFormat=m.VertexFormat.clone(c,i._vertexFormat),i._cornerType=d,i._granularity=u,i):(F.polylinePositions=l,F.shapePositions=s,F.cornerType=d,F.granularity=u,new V(F))};const A=new o.BoundingRectangle;return V.createGeometry=function(e){const l=e._positions,m=n.arrayRemoveDuplicates(l,t.Cartesian3.equalsEpsilon);let y=e._shape;if(y=r.PolylineVolumeGeometryLibrary.removeDuplicatesFromShape(y),m.length<2||y.length<3)return;u.PolygonPipeline.computeWindingOrder2D(y)===u.WindingOrder.CLOCKWISE&&y.reverse();const g=o.BoundingRectangle.fromPoints(y,A);return function(e,t,n,o){const l=new p.GeometryAttributes;o.position&&(l.position=new s.GeometryAttribute({componentDatatype:a.ComponentDatatype.DOUBLE,componentsPerAttribute:3,values:e}));const m=t.length,y=e.length/3,g=(y-2*m)/(2*m),h=u.PolygonPipeline.triangulate(t),f=(g-1)*m*6+2*h.length,b=d.IndexDatatype.createTypedArray(y,f);let P,E,_,k,v,L;const V=2*m;let x=0;for(P=0;P<g-1;P++){for(E=0;E<m-1;E++)_=2*E+P*m*2,L=_+V,k=_+1,v=k+V,b[x++]=k,b[x++]=_,b[x++]=v,b[x++]=v,b[x++]=_,b[x++]=L;_=2*m-2+P*m*2,k=_+1,v=k+V,L=_+V,b[x++]=k,b[x++]=_,b[x++]=v,b[x++]=v,b[x++]=_,b[x++]=L}if(o.st||o.tangent||o.bitangent){const e=new Float32Array(2*y),o=1/(g-1),i=1/n.height,r=n.height/2;let p,c,d=0;for(P=0;P<g;P++){for(p=P*o,c=i*(t[0].y+r),e[d++]=p,e[d++]=c,E=1;E<m;E++)c=i*(t[E].y+r),e[d++]=p,e[d++]=c,e[d++]=p,e[d++]=c;c=i*(t[0].y+r),e[d++]=p,e[d++]=c}for(E=0;E<m;E++)p=0,c=i*(t[E].y+r),e[d++]=p,e[d++]=c;for(E=0;E<m;E++)p=(g-1)*o,c=i*(t[E].y+r),e[d++]=p,e[d++]=c;l.st=new s.GeometryAttribute({componentDatatype:a.ComponentDatatype.FLOAT,componentsPerAttribute:2,values:new Float32Array(e)})}const C=y-2*m;for(P=0;P<h.length;P+=3){const e=h[P]+C,t=h[P+1]+C,n=h[P+2]+C;b[x++]=e,b[x++]=t,b[x++]=n,b[x++]=n+m,b[x++]=t+m,b[x++]=e+m}let F=new s.Geometry({attributes:l,indices:b,boundingSphere:i.BoundingSphere.fromVertices(e),primitiveType:s.PrimitiveType.TRIANGLES});if(o.normal&&(F=c.GeometryPipeline.computeNormal(F)),o.tangent||o.bitangent){try{F=c.GeometryPipeline.computeTangentAndBitangent(F)}catch(e){r.oneTimeWarning("polyline-volume-tangent-bitangent","Unable to compute tangents and bitangents for polyline volume geometry")}o.tangent||(F.attributes.tangent=void 0),o.bitangent||(F.attributes.bitangent=void 0),o.st||(F.attributes.st=void 0)}return F}(r.PolylineVolumeGeometryLibrary.computePositions(m,y,g,e,!0),y,g,e._vertexFormat)},function(n,o){return e.defined(o)&&(n=V.unpack(n,o)),n._ellipsoid=t.Ellipsoid.clone(n._ellipsoid),V.createGeometry(n)}}));
