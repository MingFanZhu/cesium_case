function objectControl(viewer, object, center, callback) {
    this.viewer = viewer;
    this.object = object;
    this.modelMatrix = object.modelMatrix.clone();
    this.modelToWorld = Cesium.Transforms.eastNorthUpToFixedFrame(center);//模型坐标系转世界坐标系
    this.worldToModel = Cesium.Matrix4.inverse(this.modelToWorld, new Cesium.Matrix4);//世界坐标系转模型坐标系
    if(callback){
        this.control = new Control(this.viewer, center, callback);
    }else{
        this.control = new Control(this.viewer, center, defaultCallback.bind(this));
    }
}

function defaultCallback(transform) {
    var newModelMatrix = Cesium.Matrix4.multiply(this.modelToWorld, transform, new Cesium.Matrix4);
    Cesium.Matrix4.multiply(newModelMatrix, this.worldToModel, newModelMatrix);
    this.object.modelMatrix = Cesium.Matrix4.multiply(newModelMatrix, this.modelMatrix, new Cesium.Matrix4);
}

objectControl.prototype.destroy = function () {
    this.control.destroy();
}