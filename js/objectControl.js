function objectControl(viewer, object, center, type, callback) {
    this.viewer = viewer;
    this.object = object;
    this.modelMatrix = object.modelMatrix.clone();
    this.modelToWorld = Cesium.Transforms.eastNorthUpToFixedFrame(center);//模型坐标系转世界坐标系
    this.worldToModel = Cesium.Matrix4.inverse(this.modelToWorld, new Cesium.Matrix4);//世界坐标系转模型坐标系
    switch (type) {
        case "local": {
            this.control = new Control(this.viewer, center, primitiveInLocalCoordinateCallback.bind(this));
            break;
        }
        case "world": {
            this.control = new Control(this.viewer, center, primitiveInWorldCoordinateCallback.bind(this));
            break;
        }
        case "custom": {
            this.control = new Control(this.viewer, center, callback);
            break;
        }
        default:
            break;
    }
}

function primitiveInLocalCoordinateCallback(transform) {
    this.object.modelMatrix = Cesium.Matrix4.multiply(this.modelMatrix, transform, new Cesium.Matrix4);//变换
}

function primitiveInWorldCoordinateCallback(transform) {
    var newModelMatrix = Cesium.Matrix4.multiply(this.modelToWorld, transform, new Cesium.Matrix4);
    Cesium.Matrix4.multiply(newModelMatrix, this.worldToModel, newModelMatrix);
    this.object.modelMatrix = Cesium.Matrix4.multiply(newModelMatrix, this.modelMatrix, new Cesium.Matrix4);
}

objectControl.prototype.destroy = function () {
    this.control.destroy();
}