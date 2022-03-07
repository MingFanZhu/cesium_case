function Control(viewer, center, callback) {
  this.position = center;//坐标轴的中心点
  this.viewer = viewer;

  var primitiveInCamera = new Cesium.Matrix4.multiplyByPoint(this.viewer.camera.viewMatrix, this.position, new Cesium.Cartesian3());
  var width = -primitiveInCamera.z * Math.tan(this.viewer.camera.frustum.fov / 2) * 2;
  var factor = width / this.viewer.canvas.width;
  this.radius = 200 * factor;//坐标轴的半径,计算为像素，当相机位置改变时动态更新

  this.modelToWorld = Cesium.Transforms.eastNorthUpToFixedFrame(this.position);//模型坐标系转世界坐标系
  this.worldToModel = Cesium.Matrix4.inverse(this.modelToWorld, new Cesium.Matrix4);//世界坐标系转模型坐标系

  this.matrix = Cesium.Transforms.eastNorthUpToFixedFrame(this.position);//坐标轴的变换矩阵，将坐标轴所在局部坐标转换为世界坐标
  this.inverseMatrix = Cesium.Matrix4.inverse(this.matrix, new Cesium.Matrix4());//坐标轴变换矩阵的逆矩阵，将世界坐标转换为坐标轴所在局部坐标

  this.normalX = Cesium.Matrix4.multiplyByPointAsVector(this.matrix, Cesium.Cartesian3.UNIT_X, new Cesium.Cartesian3);//坐标轴的X单位向量
  this.normalY = Cesium.Matrix4.multiplyByPointAsVector(this.matrix, Cesium.Cartesian3.UNIT_Y, new Cesium.Cartesian3);//坐标轴的Y单位向量
  this.normalZ = Cesium.Matrix4.multiplyByPointAsVector(this.matrix, Cesium.Cartesian3.UNIT_Z, new Cesium.Cartesian3);//坐标轴的Z单位向量
  this.xAxis;//X轴
  this.yAxis;
  this.zAxis;

  this.xoy;//xoy平面
  this.xoz;
  this.yoz;
  this.choosePlane;//所选的平面（字符串）
  this.chooseAxis = null;//所选的平移轴

  this.translation = new Cesium.Cartesian3(0, 0, 0);//模型平移量（向量表示）
  this.rotateMatrix = new Cesium.Matrix3(1, 0, 0, 0, 1, 0, 0, 0, 1);//模型旋转量(旋转矩阵表示)

  this.callback = callback;

  this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.canvas);

  this.init();
}

Control.prototype.init = function () {
  //添加平移轴
  this.xAxisPositions = [this.position.clone(), Cesium.Matrix4.multiplyByPoint(this.matrix, new Cesium.Cartesian3(this.radius, 0, 0), new Cesium.Cartesian3())];//绘制X轴的点坐标
  this.yAxisPositions = [this.position.clone(), Cesium.Matrix4.multiplyByPoint(this.matrix, new Cesium.Cartesian3(0, this.radius, 0), new Cesium.Cartesian3())];
  this.zAxisPositions = [this.position.clone(), Cesium.Matrix4.multiplyByPoint(this.matrix, new Cesium.Cartesian3(0, 0, this.radius), new Cesium.Cartesian3())];
  this.xAxis = this.viewer.entities.add({
    id: "move_xAxis",
    name: "xAxis",
    polyline: {
      positions: new Cesium.CallbackProperty(function () {
        return this.xAxisPositions;
      }.bind(this), false),
      width: 15,
      arcType: Cesium.ArcType.NONE,
      material: new Cesium.PolylineArrowMaterialProperty(
        Cesium.Color.RED
      )
    },
  });
  this.yAxis = this.viewer.entities.add({
    id: "move_yAxis",
    name: "yAxis",
    polyline: {
      positions: new Cesium.CallbackProperty(function () {
        return this.yAxisPositions;
      }.bind(this), false),
      width: 15,
      arcType: Cesium.ArcType.NONE,
      material: new Cesium.PolylineArrowMaterialProperty(
        Cesium.Color.GREEN
      )
    },
  });
  this.zAxis = this.viewer.entities.add({
    id: "move_zAxis",
    name: "zAxis",
    polyline: {
      positions: new Cesium.CallbackProperty(function () {
        return this.zAxisPositions;
      }.bind(this), false),
      width: 15,
      arcType: Cesium.ArcType.NONE,
      material: new Cesium.PolylineArrowMaterialProperty(
        Cesium.Color.BLUE
      )
    },
  });

  //添加旋转轴
  this.circlePositionXOY = [];
  this.circlePositionXOZ = [];
  this.circlePositionYOZ = [];
  for (var i = 0; i <= 360; i++) {
    var x = this.radius * Math.cos(i / 180 * Math.PI);
    var y = this.radius * Math.sin(i / 180 * Math.PI);

    var positionxoy = new Cesium.Cartesian3();
    Cesium.Cartesian3.add(this.position, Cesium.Cartesian3.multiplyByScalar(this.normalX, x, new Cesium.Cartesian3), positionxoy);
    Cesium.Cartesian3.add(positionxoy, Cesium.Cartesian3.multiplyByScalar(this.normalY, y, new Cesium.Cartesian3), positionxoy);
    this.circlePositionXOY.push(positionxoy);

    var positionxoz = new Cesium.Cartesian3();
    Cesium.Cartesian3.add(this.position, Cesium.Cartesian3.multiplyByScalar(this.normalX, x, new Cesium.Cartesian3), positionxoz);
    Cesium.Cartesian3.add(positionxoz, Cesium.Cartesian3.multiplyByScalar(this.normalZ, y, new Cesium.Cartesian3), positionxoz);
    this.circlePositionXOZ.push(positionxoz);

    var positionyoz = new Cesium.Cartesian3();
    Cesium.Cartesian3.add(this.position, Cesium.Cartesian3.multiplyByScalar(this.normalY, x, new Cesium.Cartesian3), positionyoz);
    Cesium.Cartesian3.add(positionyoz, Cesium.Cartesian3.multiplyByScalar(this.normalZ, y, new Cesium.Cartesian3), positionyoz);
    this.circlePositionYOZ.push(positionyoz);
  }

  this.xoy = this.viewer.entities.add({
    id: "rotate_xoy",
    name: "xoy",
    polyline: {
      positions: new Cesium.CallbackProperty(function () {
        return this.circlePositionXOY;
      }.bind(this), false),
      width: 10,
      material: Cesium.Color.BLUE
    }
  });
  this.xoz = this.viewer.entities.add({
    id: "rotate_xoz",
    name: "xoz",
    polyline: {
      positions: new Cesium.CallbackProperty(function () {
        return this.circlePositionXOZ;
      }.bind(this), false),
      width: 10,
      material: Cesium.Color.GREEN
    }
  });
  this.yoz = this.viewer.entities.add({
    id: "rotate_yoz",
    name: "yoz",
    polyline: {
      positions: new Cesium.CallbackProperty(function () {
        return this.circlePositionYOZ;
      }.bind(this), false),
      width: 10,
      material: Cesium.Color.RED
    }
  });

  //绑定事件
  this.handler.setInputAction(leftClick.bind(this), Cesium.ScreenSpaceEventType.LEFT_CLICK);
  this.handler.setInputAction(midClick.bind(this), Cesium.ScreenSpaceEventType.MIDDLE_CLICK);
  this.handler.setInputAction(mouseMove.bind(this), Cesium.ScreenSpaceEventType.MOUSE_MOVE);
  this.handler.setInputAction(cameraMove.bind(this), Cesium.ScreenSpaceEventType.WHEEL);
  this.handler.setInputAction(rightClick.bind(this), Cesium.ScreenSpaceEventType.RIGHT_CLICK);
}

function cameraMove() {
  var primitiveInCamera = new Cesium.Matrix4.multiplyByPoint(this.viewer.camera.viewMatrix, this.position, new Cesium.Cartesian3());
  var width = -primitiveInCamera.z * Math.tan(this.viewer.camera.frustum.fov / 2) * 2;
  var factor = width / this.viewer.canvas.width;
  this.radius = 200 * factor;//坐标轴的半径,计算为像素，当相机位置改变时动态更新

  //更新平移轴
  this.xAxisPositions = [this.position.clone(), Cesium.Matrix4.multiplyByPoint(this.matrix, new Cesium.Cartesian3(this.radius, 0, 0), new Cesium.Cartesian3())];
  this.yAxisPositions = [this.position.clone(), Cesium.Matrix4.multiplyByPoint(this.matrix, new Cesium.Cartesian3(0, this.radius, 0), new Cesium.Cartesian3())];
  this.zAxisPositions = [this.position.clone(), Cesium.Matrix4.multiplyByPoint(this.matrix, new Cesium.Cartesian3(0, 0, this.radius), new Cesium.Cartesian3())];

  //更新旋转轴
  this.circlePositionXOY = [];
  this.circlePositionXOZ = [];
  this.circlePositionYOZ = [];
  for (var i = 0; i <= 360; i++) {
    var x = this.radius * Math.cos(i / 180 * Math.PI);
    var y = this.radius * Math.sin(i / 180 * Math.PI);

    var positionxoy = new Cesium.Cartesian3();
    Cesium.Cartesian3.add(this.position, Cesium.Cartesian3.multiplyByScalar(this.normalX, x, new Cesium.Cartesian3), positionxoy);
    Cesium.Cartesian3.add(positionxoy, Cesium.Cartesian3.multiplyByScalar(this.normalY, y, new Cesium.Cartesian3), positionxoy);
    this.circlePositionXOY.push(positionxoy);

    var positionxoz = new Cesium.Cartesian3();
    Cesium.Cartesian3.add(this.position, Cesium.Cartesian3.multiplyByScalar(this.normalX, x, new Cesium.Cartesian3), positionxoz);
    Cesium.Cartesian3.add(positionxoz, Cesium.Cartesian3.multiplyByScalar(this.normalZ, y, new Cesium.Cartesian3), positionxoz);
    this.circlePositionXOZ.push(positionxoz);

    var positionyoz = new Cesium.Cartesian3();
    Cesium.Cartesian3.add(this.position, Cesium.Cartesian3.multiplyByScalar(this.normalY, x, new Cesium.Cartesian3), positionyoz);
    Cesium.Cartesian3.add(positionyoz, Cesium.Cartesian3.multiplyByScalar(this.normalZ, y, new Cesium.Cartesian3), positionyoz);
    this.circlePositionYOZ.push(positionyoz);
  }
}

function leftClick(e) {
  var pick = this.viewer.scene.pick(e.position);
  if (pick.id.id) {
    if (pick.id.id.indexOf("move") > -1) {
      this.choosePlane = "";
      this.chooseAxis = pick.id.name;
    }
    if (pick.id.id.indexOf("rotate") > -1) {
      this.choosePlane = pick.id.name;
      this.chooseAxis = "";
    }
  }
}

function midClick(e) {
  var pickPosition = this.viewer.scene.pickPosition(e.position);
  if (pickPosition) {
    this.position = pickPosition;//更新坐标轴中心点
    this.matrix = Cesium.Transforms.eastNorthUpToFixedFrame(this.position);//更新坐标轴转换矩阵
    Cesium.Matrix4.inverse(this.matrix, this.inverseMatrix);

    //更新平移轴
    this.xAxisPositions = [this.position.clone(), Cesium.Matrix4.multiplyByPoint(this.matrix, new Cesium.Cartesian3(this.radius, 0, 0), new Cesium.Cartesian3())];
    this.yAxisPositions = [this.position.clone(), Cesium.Matrix4.multiplyByPoint(this.matrix, new Cesium.Cartesian3(0, this.radius, 0), new Cesium.Cartesian3())];
    this.zAxisPositions = [this.position.clone(), Cesium.Matrix4.multiplyByPoint(this.matrix, new Cesium.Cartesian3(0, 0, this.radius), new Cesium.Cartesian3())];

    //更新旋转轴
    this.circlePositionXOY = [];
    this.circlePositionXOZ = [];
    this.circlePositionYOZ = [];
    for (var i = 0; i <= 360; i++) {
      var x = this.radius * Math.cos(i / 180 * Math.PI);
      var y = this.radius * Math.sin(i / 180 * Math.PI);

      var positionxoy = new Cesium.Cartesian3();
      Cesium.Cartesian3.add(this.position, Cesium.Cartesian3.multiplyByScalar(this.normalX, x, new Cesium.Cartesian3), positionxoy);
      Cesium.Cartesian3.add(positionxoy, Cesium.Cartesian3.multiplyByScalar(this.normalY, y, new Cesium.Cartesian3), positionxoy);
      this.circlePositionXOY.push(positionxoy);

      var positionxoz = new Cesium.Cartesian3();
      Cesium.Cartesian3.add(this.position, Cesium.Cartesian3.multiplyByScalar(this.normalX, x, new Cesium.Cartesian3), positionxoz);
      Cesium.Cartesian3.add(positionxoz, Cesium.Cartesian3.multiplyByScalar(this.normalZ, y, new Cesium.Cartesian3), positionxoz);
      this.circlePositionXOZ.push(positionxoz);

      var positionyoz = new Cesium.Cartesian3();
      Cesium.Cartesian3.add(this.position, Cesium.Cartesian3.multiplyByScalar(this.normalY, x, new Cesium.Cartesian3), positionyoz);
      Cesium.Cartesian3.add(positionyoz, Cesium.Cartesian3.multiplyByScalar(this.normalZ, y, new Cesium.Cartesian3), positionyoz);
      this.circlePositionYOZ.push(positionyoz);
    }
  }
}

function mouseMove(e) {
  var startPosition = e.startPosition;
  var endPosition = e.endPosition;
  if (this.chooseAxis) {
    var chooseNormal;
    if (this.chooseAxis == "xAxis") {
      chooseNormal = this.normalX;
    }
    if (this.chooseAxis == "yAxis") {
      chooseNormal = this.normalY;
    }
    if (this.chooseAxis == "zAxis") {
      chooseNormal = this.normalZ;
    }
    //平移
    var vector2d = new Cesium.Cartesian3(endPosition.x - startPosition.x, -(endPosition.y - startPosition.y), 0);//平面向量
    var vector3d = new Cesium.Matrix4.multiplyByPointAsVector(this.viewer.camera.inverseViewMatrix, vector2d, new Cesium.Cartesian3());//世界坐标的三维向量

    //计算一个比例因子，通过fov与z值计算该距离下的平行裁截面的面的宽度，与屏幕宽度做个比例
    var primitiveInCamera = new Cesium.Matrix4.multiplyByPoint(this.viewer.camera.viewMatrix, this.position, new Cesium.Cartesian3());
    var width = -primitiveInCamera.z * Math.tan(this.viewer.camera.frustum.fov / 2) * 2;
    var factor = width / this.viewer.canvas.width;
    var distance = Cesium.Cartesian3.dot(vector3d, chooseNormal) * factor;//得到实际世界距离

    //需要计算平移后的点，并且找到相对地表同高度的点
    //平移前的点（经纬度）
    var currentPosition = new Cesium.Cartographic.fromCartesian(this.position);
    //平移后的点
    var newPosition = new Cesium.Cartesian3(
      this.position.x + chooseNormal.x * distance,
      this.position.y + chooseNormal.y * distance,
      this.position.z + chooseNormal.z * distance
    );
    if (this.chooseAxis != "zAxis") {
      newPosition = new Cesium.Cartographic.fromCartesian(newPosition);
      newPosition.height = currentPosition.height;
      if (this.chooseAxis == "xAxis") {
        newPosition.latitude = currentPosition.latitude;
      } else {
        newPosition.longitude = currentPosition.longitude;
      }
      newPosition = new Cesium.Cartesian3.fromRadians(newPosition.longitude, newPosition.latitude, newPosition.height);
    }

    //更新平移量
    var newPositionInModel = Cesium.Matrix4.multiplyByPoint(this.inverseMatrix, newPosition, new Cesium.Cartesian3);//坐标轴坐标系的坐标
    Cesium.Matrix4.multiplyByPointAsVector(this.matrix, newPositionInModel, newPositionInModel);//世界坐标系下的平移量
    Cesium.Matrix4.multiplyByVector(this.worldToModel, new Cesium.Cartesian4(newPositionInModel.x, newPositionInModel.y, newPositionInModel.z, 0), newPositionInModel);
    Cesium.Cartesian3.add(this.translation, newPositionInModel, this.translation);


    this.position = newPosition;//更新坐标轴中心点
    this.matrix = Cesium.Transforms.eastNorthUpToFixedFrame(this.position);//更新坐标轴转换矩阵
    Cesium.Matrix4.inverse(this.matrix, this.inverseMatrix);

    var currentNormalX = this.normalX;
    var currentNormalY = this.normalY;
    var currentNormalZ = this.normalZ;
    this.normalX = Cesium.Matrix4.multiplyByPointAsVector(this.matrix, Cesium.Cartesian3.UNIT_X, new Cesium.Cartesian3);//坐标轴的X单位向量
    this.normalY = Cesium.Matrix4.multiplyByPointAsVector(this.matrix, Cesium.Cartesian3.UNIT_Y, new Cesium.Cartesian3);//坐标轴的Y单位向量
    this.normalZ = Cesium.Matrix4.multiplyByPointAsVector(this.matrix, Cesium.Cartesian3.UNIT_Z, new Cesium.Cartesian3);//坐标轴的Z单位向量


    //更新旋转矩阵
    if (this.chooseAxis == "xAxis") {
      //移动x轴时以y轴夹角确定绕z轴旋转角度，以z轴夹角确定绕y轴旋转角度
      var angleY = Cesium.Cartesian3.angleBetween(currentNormalY, this.normalY);
      var angleZ = Cesium.Cartesian3.angleBetween(currentNormalZ, this.normalZ);
      if (distance < 0) {
        angleZ = -angleZ;
        angleY = -angleY;
      }
      var rotateZ = Cesium.Matrix4.multiplyByPointAsVector(this.worldToModel, currentNormalZ, new Cesium.Cartesian3);
      var inverseMatrix = Cesium.Matrix3.inverse(this.rotateMatrix, new Cesium.Matrix3);//旋转矩阵的逆矩阵，等于反向转
      var inModelAxis = Cesium.Matrix3.multiplyByVector(inverseMatrix, rotateZ, new Cesium.Cartesian3);//将选中的轴转到模型坐标下
      var rotate = axisRotation(inModelAxis, angleY);//计算任意轴的旋转矩阵
      Cesium.Matrix3.multiply(this.rotateMatrix, rotate, this.rotateMatrix);//更新旋转矩阵
      var rotateY = Cesium.Matrix4.multiplyByPointAsVector(this.worldToModel, currentNormalY, new Cesium.Cartesian3);
      var inverseMatrix = Cesium.Matrix3.inverse(this.rotateMatrix, new Cesium.Matrix3);//旋转矩阵的逆矩阵，等于反向转
      var inModelAxis = Cesium.Matrix3.multiplyByVector(inverseMatrix, rotateY, new Cesium.Cartesian3);//将选中的轴转到模型坐标下
      var rotate = axisRotation(inModelAxis, angleZ);//计算任意轴的旋转矩阵
      Cesium.Matrix3.multiply(this.rotateMatrix, rotate, this.rotateMatrix);//更新旋转矩阵
    }
    if (this.chooseAxis == "yAxis") {
      //移动y轴时以z轴夹角确定绕x轴旋转角度(绕z轴不会变)
      var angleZ = Cesium.Cartesian3.angleBetween(currentNormalZ, this.normalZ);
      if (distance > 0) {
        angleZ = -angleZ;
      }
      var rotateX = Cesium.Matrix4.multiplyByPointAsVector(this.worldToModel, currentNormalX, new Cesium.Cartesian3);
      var inverseMatrix = Cesium.Matrix3.inverse(this.rotateMatrix, new Cesium.Matrix3);//旋转矩阵的逆矩阵，等于反向转
      var inModelAxis = Cesium.Matrix3.multiplyByVector(inverseMatrix, rotateX, new Cesium.Cartesian3);//将选中的轴转到模型坐标下
      var rotate = axisRotation(inModelAxis, angleZ);//计算任意轴的旋转矩阵
      Cesium.Matrix3.multiply(this.rotateMatrix, rotate, this.rotateMatrix);//更新旋转矩阵
    }

    var transform = Cesium.Matrix4.fromRotationTranslation(this.rotateMatrix, this.translation, new Cesium.Matrix4);//模型变换矩阵
    this.callback(transform);

    //更新平移轴
    this.xAxisPositions = [this.position.clone(), Cesium.Matrix4.multiplyByPoint(this.matrix, new Cesium.Cartesian3(this.radius, 0, 0), new Cesium.Cartesian3())];
    this.yAxisPositions = [this.position.clone(), Cesium.Matrix4.multiplyByPoint(this.matrix, new Cesium.Cartesian3(0, this.radius, 0), new Cesium.Cartesian3())];
    this.zAxisPositions = [this.position.clone(), Cesium.Matrix4.multiplyByPoint(this.matrix, new Cesium.Cartesian3(0, 0, this.radius), new Cesium.Cartesian3())];

    //更新旋转轴
    this.circlePositionXOY = [];
    this.circlePositionXOZ = [];
    this.circlePositionYOZ = [];
    for (var i = 0; i <= 360; i++) {
      var x = this.radius * Math.cos(i / 180 * Math.PI);
      var y = this.radius * Math.sin(i / 180 * Math.PI);

      var positionxoy = new Cesium.Cartesian3();
      Cesium.Cartesian3.add(this.position, Cesium.Cartesian3.multiplyByScalar(this.normalX, x, new Cesium.Cartesian3), positionxoy);
      Cesium.Cartesian3.add(positionxoy, Cesium.Cartesian3.multiplyByScalar(this.normalY, y, new Cesium.Cartesian3), positionxoy);
      this.circlePositionXOY.push(positionxoy);

      var positionxoz = new Cesium.Cartesian3();
      Cesium.Cartesian3.add(this.position, Cesium.Cartesian3.multiplyByScalar(this.normalX, x, new Cesium.Cartesian3), positionxoz);
      Cesium.Cartesian3.add(positionxoz, Cesium.Cartesian3.multiplyByScalar(this.normalZ, y, new Cesium.Cartesian3), positionxoz);
      this.circlePositionXOZ.push(positionxoz);

      var positionyoz = new Cesium.Cartesian3();
      Cesium.Cartesian3.add(this.position, Cesium.Cartesian3.multiplyByScalar(this.normalY, x, new Cesium.Cartesian3), positionyoz);
      Cesium.Cartesian3.add(positionyoz, Cesium.Cartesian3.multiplyByScalar(this.normalZ, y, new Cesium.Cartesian3), positionyoz);
      this.circlePositionYOZ.push(positionyoz);
    }
  }
  if (this.choosePlane) {
    //计算一个比例因子，通过fov与z值计算该距离下的平行裁截面的面的宽度，与屏幕宽度做个比例
    var primitiveInCamera = new Cesium.Matrix4.multiplyByPoint(this.viewer.camera.viewMatrix, this.position, new Cesium.Cartesian3());
    var width = -primitiveInCamera.z * Math.tan(this.viewer.camera.frustum.fov / 2) * 2;
    var factor = width / this.viewer.canvas.width;

    //判断一下平面是否和相机的夹角
    var toPlane = new Cesium.Cartesian3(1, 1, 1);
    var angle;
    if (this.choosePlane == "xoy") { toPlane.z = 0; angle=Cesium.Cartesian3.angleBetween(Cesium.Matrix4.multiplyByPointAsVector(this.matrix, new Cesium.Cartesian3(0, 0, 1), new Cesium.Cartesian3()), this.viewer.camera.direction);}
    if (this.choosePlane == "xoz") { toPlane.y = 0; angle=Cesium.Cartesian3.angleBetween(Cesium.Matrix4.multiplyByPointAsVector(this.matrix, new Cesium.Cartesian3(0, 1, 0), new Cesium.Cartesian3()), this.viewer.camera.direction);}
    if (this.choosePlane == "yoz") { toPlane.x = 0; angle=Cesium.Cartesian3.angleBetween(Cesium.Matrix4.multiplyByPointAsVector(this.matrix, new Cesium.Cartesian3(1, 0, 0), new Cesium.Cartesian3()), this.viewer.camera.direction);}
    if(Math.abs(angle-Math.PI/2)<0.1){
      factor=1;
      primitiveInCamera.z=0;
    }

    //旋转变换
    var startPoiCartesian3 = new Cesium.Cartesian3((startPosition.x - this.viewer.canvas.width / 2) * factor, (-startPosition.y + this.viewer.canvas.height / 2) * factor, primitiveInCamera.z);
    var endPoiCartesian3 = new Cesium.Cartesian3((endPosition.x - this.viewer.canvas.width / 2) * factor, (-endPosition.y + this.viewer.canvas.height / 2) * factor, primitiveInCamera.z);
    Cesium.Matrix4.multiplyByPoint(this.viewer.camera.inverseViewMatrix, startPoiCartesian3, startPoiCartesian3);//转换到世界坐标
    Cesium.Matrix4.multiplyByPoint(this.viewer.camera.inverseViewMatrix, endPoiCartesian3, endPoiCartesian3);
    Cesium.Matrix4.multiplyByPoint(this.inverseMatrix, startPoiCartesian3, startPoiCartesian3);//转换到坐标系坐标
    Cesium.Matrix4.multiplyByPoint(this.inverseMatrix, endPoiCartesian3, endPoiCartesian3);
    //将坐标投影到所需的平面
    startPoiCartesian3 = new Cesium.Cartesian3(
      startPoiCartesian3.x * toPlane.x,
      startPoiCartesian3.y * toPlane.y,
      startPoiCartesian3.z * toPlane.z
    );
    //Cesium.Cartesian3.normalize(startPoiCartesian3,startPoiCartesian3);
    endPoiCartesian3 = new Cesium.Cartesian3(
      endPoiCartesian3.x * toPlane.x,
      endPoiCartesian3.y * toPlane.y,
      endPoiCartesian3.z * toPlane.z
    );
    //Cesium.Cartesian3.normalize(endPoiCartesian3,endPoiCartesian3);
    var angle = Cesium.Cartesian3.angleBetween(startPoiCartesian3, endPoiCartesian3);
    var currentAxis;//选中平面对应的旋转轴（在世界坐标下）
    if (this.choosePlane == "xoy") {
      var direct = (startPoiCartesian3.x * endPoiCartesian3.y) - (startPoiCartesian3.y * endPoiCartesian3.x);//为了判断旋转方向
      currentAxis = Cesium.Matrix4.multiplyByPointAsVector(this.worldToModel, this.normalZ, new Cesium.Cartesian3);//计算选中的轴在模型坐标系下对应的向量
      if (direct > 0) {
      } else {
        angle = -angle;
      }
    }
    if (this.choosePlane == "xoz") {
      var direct = (startPoiCartesian3.x * endPoiCartesian3.z) - (startPoiCartesian3.z * endPoiCartesian3.x);
      currentAxis = Cesium.Matrix4.multiplyByPointAsVector(this.worldToModel, this.normalY, new Cesium.Cartesian3);
      if (direct < 0) {
      } else {
        angle = -angle;
      }
    }
    if (this.choosePlane == "yoz") {
      var direct = (startPoiCartesian3.y * endPoiCartesian3.z) - (startPoiCartesian3.z * endPoiCartesian3.y);
      currentAxis = Cesium.Matrix4.multiplyByPointAsVector(this.worldToModel, this.normalX, new Cesium.Cartesian3);
      if (direct > 0) {
      } else {
        angle = -angle;
      }
    }
    var inverseMatrix = Cesium.Matrix3.inverse(this.rotateMatrix, new Cesium.Matrix3);//旋转矩阵的逆矩阵，等于反向转
    var inModelAxis = Cesium.Matrix3.multiplyByVector(inverseMatrix, currentAxis, new Cesium.Cartesian3);//计算该轴在经过旋转后的模型中的位置
    var rotate = axisRotation(inModelAxis, angle);//得到任意轴的旋转矩阵
    Cesium.Matrix3.multiply(this.rotateMatrix, rotate, this.rotateMatrix);//更新旋转矩阵
    var transform = Cesium.Matrix4.fromRotationTranslation(this.rotateMatrix, this.translation, new Cesium.Matrix4);//模型变换矩阵
    this.callback(transform);
  }
}

function axisRotation(axis, angle, target) {
  var x = axis.x;
  var y = axis.y;
  var z = axis.z;
  var l = Math.sqrt(x * x + y * y + z * z);
  x = x / l;
  y = y / l;
  z = z / l;
  var xx = x * x;
  var yy = y * y;
  var zz = z * z;
  var cos = Math.cos(angle);
  var sin = Math.sin(angle);
  var oneMCos = 1 - cos;

  target = target || new Cesium.Matrix3();

  target[Cesium.Matrix3.COLUMN0ROW0] = xx + (1 - xx) * cos;
  target[Cesium.Matrix3.COLUMN0ROW1] = x * y * oneMCos + z * sin;
  target[Cesium.Matrix3.COLUMN0ROW2] = x * z * oneMCos - y * sin;

  target[Cesium.Matrix3.COLUMN1ROW0] = x * y * oneMCos - z * sin;
  target[Cesium.Matrix3.COLUMN1ROW1] = yy + (1 - yy) * cos;
  target[Cesium.Matrix3.COLUMN1ROW2] = y * z * oneMCos + x * sin;

  target[Cesium.Matrix3.COLUMN2ROW0] = x * z * oneMCos + y * sin;
  target[Cesium.Matrix3.COLUMN2ROW1] = y * z * oneMCos - x * sin;
  target[Cesium.Matrix3.COLUMN2ROW2] = zz + (1 - zz) * cos;

  return target;
}

function rightClick(e) {
  this.chooseAxis = "";
  this.choosePlane = "";

  // var position=e.position;
  // var positionCartesian3 = new Cesium.Cartesian3(position.x - this.viewer.canvas.width / 2, -position.y + this.viewer.canvas.height / 2, 0);
  // console.log(positionCartesian3);
  // Cesium.Matrix4.multiplyByPoint(this.viewer.camera.inverseViewMatrix, positionCartesian3, positionCartesian3);//转换到世界坐标
  // Cesium.Matrix4.multiplyByPoint(this.inverseMatrix, positionCartesian3, positionCartesian3);//转换到坐标系坐标
  // console.log(positionCartesian3);

  // console.log(Cesium.SceneTransforms.wgs84ToWindowCoordinates(this.viewer.scene,this.position,new Cesium.Cartesian2));
}

Control.prototype.destroy = function () {
  this.viewer.entities.remove(this.xAxis);
  this.viewer.entities.remove(this.yAxis);
  this.viewer.entities.remove(this.zAxis);
  this.viewer.entities.remove(this.xoy);
  this.viewer.entities.remove(this.xoz);
  this.viewer.entities.remove(this.yoz);

  this.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
  this.handler.removeInputAction(Cesium.ScreenSpaceEventType.MIDDLE_CLICK);
  this.handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
  this.handler.removeInputAction(Cesium.ScreenSpaceEventType.WHEEL);
  this.handler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK);
}